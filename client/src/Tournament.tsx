import React, {useCallback, useEffect, useMemo, useState} from "react";
import { Routes, Route, useParams, Link } from "react-router-dom";
import styled from "styled-components";
import { baseUrl, Button, FormGrid, Input, jsonParse, jsonStringify, Label } from "./common";
import { Form } from "./Form";
import { Modal } from "./Modal";
import { Cell, Table } from "./Table";    

export type Tournament = {
  id: string;
  name: string;
  version: number;
  players: Player[];
  matches: Match[];
  machines: Machine[];
};
export type Player = {
  num: number;
  name: string;
  disabled?: true;
  lastMatch?: Match;
  currentMatch?: Match;
  timeInQueue?: number; // minutes
  matches: number;
};
export type Machine = {
  name: string;
  disabled?: true;
};
export type Match = {
  num: number;
  players: Player[]; // player
  result?: Player[]; // player
  startTime: Date;
  endTime?: Date;
  machine: Machine;
};

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 20px;
  // flex-wrap: wrap;
  gap: 5px;
`;
export const Page = styled.div`
  display: flex;
  // flex-wrap: wrap;
  min-height: 0;
`;

export function TournamentApp() {
  const {id} = useParams();
  const [message, setMessage] = useState<string|undefined>('Loading...');
  const [tour, setTour] = useState<Tournament>({
    players: [],
    matches: [],
    machines: [],
    id: '',
    name: '',
    version: 0,
  });
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [debugJson, setDebugJson] = useState<string>();
  const [fake, setFake] = useState(false);
  const [devMode, setDevMode] = useState(true);
  const [winner, setWinner] = useState<[Match, Player, Machine]>();

  const setTournament = useCallback((t: Tournament) => {
    if (winner) debugger;
    for (const p of t.players) {
      p.currentMatch = t.matches.find(m => !m.endTime && m.players.includes(p));
      p.lastMatch = t.matches.findLast(m => !!m.endTime && m.players.includes(p));
      p.timeInQueue = p.lastMatch? Math.round((new Date().getTime() - p.lastMatch!.endTime!.getTime())/1000/60*10)/10 : undefined;
      p.matches = t.matches.filter(m => m.players.includes(p) && !!m.endTime).length;
    }
    setTour(t);
  }, [winner]);

  useEffect(() => {
    if (id === tour.id) return;
    fetch(`${baseUrl}/tournaments/${id}`)
    .then(async resp => {
      if (resp.ok) {
        const body = await resp.json();
        setTournament(jsonParse((body).json));
        console.log('Tournament: %s', ((body).json));
        setMessage(undefined);
      }
      else {
        console.error('error getting tournament ', id, resp);
        if (resp.status === 404)
        setMessage(`Tournament '${id}' not found'`);
        else
        setMessage('Server error');
      }
    })
    .catch(err => {
      console.error('error getting tournament', id, err);
      setMessage('Could not connect to server');
    });
  }, [id, setTournament, tour.id]);

  const update = useCallback((t: Tournament, fakeUpdate = fake) => {
    if (fakeUpdate) {
      setTournament(jsonParse(jsonStringify(t)));
      console.log('fake update: ', jsonParse(jsonStringify(t)));
      return;
    }
    return fetch(`${baseUrl}/tournaments`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: jsonStringify({...t, version: t.version+1})})
    .then(async res => {
      if (res.ok) {
        const body = await res.json();
        setTournament(jsonParse((body).json));
      }
      else {
        console.error('error: ', res);
        if (res.status === 400) {
          alert('ERROR, someone else has this window open!  please refresh for latest changes (and stop doing that!)');
        }
        else {
          alert('update failed, welp');
        }
      }
    })
    .catch(err => {
      console.error('err: ', err);
    });
  }, [setTournament, fake]);

  const activeMatches = useMemo(() => tour.matches.filter(m => !m.endTime), [tour]);
  const finishedMatches = useMemo(() => tour.matches.filter(m => !!m.endTime).sort((a, b) => a.endTime!.getTime() - b.endTime!.getTime()), [tour]);
  const players = useMemo(() => tour.players.filter(p => !p.disabled), [tour]);
  const machines = useMemo(() => tour.machines.filter(m => !m.disabled), [tour]);
  const queue = useMemo(() => 
    players.filter(p => !p.currentMatch)
           .sort((a, b) => (a.lastMatch?.endTime?.getTime() ?? 0) - (b.lastMatch?.endTime?.getTime() ?? 0))
  , [players]);
  const addMatches = useCallback(() => {
    const avail = [...queue];
    for (const machine of machines.filter(m => !activeMatches.find(x => x.machine===m))) {
      const match: Match = {
        num: tour.matches.length+1,
        machine,
        players: avail.take(2),
        startTime: new Date(),
      };
      tour.matches.push(match);
    }
    update(tour);
  }, [tour, update, queue, machines, activeMatches]);

  const toggleState = useCallback((row: {disabled?: true}) => {
    if (row.disabled)
      delete row.disabled;
    else
      row.disabled = true;
    // setPlayers(p => p.map(p => p===player? {...player} : {...p}));
    update(tour);
  }, [update, tour]);

  const addPlayer = useCallback(async (player: Player) => {
    tour.players.push({...player, num: tour.players.length+1});
    await update(tour);
    setShowAddPlayer(false);
  }, [update, tour]);

  const nextPlayers = useMemo(() => {
    if (!winner) return [];
    
    const opponent = winner[0].players[1];
    const machine = winner[0].machine;
    const stats = queue.map(p => ({
      player: p,
      Heuristic: 0,
      'Time': p.timeInQueue ?? 9999,
      'Wins': finishedMatches.filter(m => m.result![0] === p).length,
      'Matches': finishedMatches.filter(m => m.players.includes(p)).length,
      'Times Played Player': finishedMatches.filter(m => m.players.includes(opponent) && m.players.includes(p)).length,
      'Times Played Machine': finishedMatches.filter(m => m.machine === machine && m.players.includes(p)).length,
      'H_Time': 0,
      'H_Wins': 0,
      'H_Matches': 0,
      'H_Times Played Player': 0,
      'H_Times Played Machine': 0,
    }));
    const weights: any = {
      'Time': .5,
      'Wins': -.45,
      'Matches': -1,
      'Times Played Player': -1.5,
      'Times Played Machine': -1.1,
    };    
    const adj: any = {
      'Time': stats.map(s => s['Time']).sum()/stats.length,
      'Wins': finishedMatches.filter(m => m.result![0] === opponent).length,
      'Matches': stats.map(s => s['Matches']).sum()/stats.length,
      'Times Played Player': stats.map(s => s['Times Played Player']).sum()/stats.length,
      'Times Played Machine': stats.map(s => s['Times Played Machine']).sum()/stats.length,
    };
    for (const stat of stats as any[]) {
      stat.Heuristic = 0;
      for (const key of Object.keys(weights)) {
        stat['H_'+key] = Math.round(((stat[key] - adj[key]) * weights[key])*100)/100;
        if (key === 'Wins')
          stat['H_'+key] = Math.abs(stat['H_'+key]) * Math.sign(weights[key]);
        stat.Heuristic += stat['H_'+key];
      }
      stat.Heuristic = Math.round(stat.Heuristic*100)/100;
    }
    stats.sort((a: any, b: any) => b.Heuristic - a.Heuristic);
    return stats.filter(s => queue.includes(s.player));
  }, [winner, queue, finishedMatches]);

  const newMatch = useCallback(async (opponent: Player) => {
    if (!winner) throw new Error('no');
    winner[0].endTime = new Date();
    const loser = winner[0].players.find(p => p !== winner[1])!;
    winner[0].result = [winner[1], loser];

    const match: Match = {
      startTime: new Date(),
      players: [winner[0].players[1], opponent],
      machine: winner[2],
      num: tour.matches.length + 1,
    };
    tour.matches.push(match);
    setWinner(undefined);
    await update(tour);
  }, [winner, tour, update]);

  const debugError = useMemo(() => {
    if (!debugJson) return;
    try {
      jsonParse(debugJson);
    }
    catch (err) {
      return ''+err;
    }
    return;
  }, [debugJson]);

  if (message)
    return <h1>{message}</h1>;


  return <>
    <h1>{tour.name}</h1>
    <Page>
      <Column>
        <Table data={queue}
          cols={['#', 'Name', 'Time in Queue']}
          expand="Name"
          title={"Queue: "+queue.length}
          render={p => [
            'num', 'name',
            <Cell>{p.timeInQueue ?? 'N/A'}</Cell>,
          ]}
        />
        <FormGrid>
          <Label>Target Queue Size: {players.length - machines.length*2}</Label>
          <Button onClick={() => setShowAddMachine(true)}>Add Machine</Button>
        </FormGrid>
        <Table data={tour.machines}
          cols={['Name', 'Actions']}
          expand="Name"
          title={"Machines: "+machines.length}
          render={(row: Machine) => [
            <Cell style={{textDecoration: row.disabled? 'line-through' : undefined}}>{row.name}</Cell>,
            <Cell><Button onClick={() => toggleState(row)}>
              {row.disabled? 'ENABLE' : 'disable'}
            </Button></Cell>,
          ]}
        />
        {showAddMachine && <Modal onClose={() => setShowAddMachine(false)}>
          <h3>Add Machine</h3>
          <Form fields={['name']} onSubmit={data => { update({...tour, machines: [...tour.machines, data]}); setShowAddMachine(false); }} />
        </Modal>}
      </Column>
      <Column>
        {/* <h3>Matches</h3> */}
        {activeMatches.length!==machines.length && <Button onClick={addMatches}>Add Matches</Button>}
        <Table data={activeMatches}
          cols={['#', 'Machine', 'Player 1', 'Player 2', 'Time']}
          title="Active Matches"
          render={m => [
            'num',
            <Cell>{m.machine.name}</Cell>,
            <Cell>{m.players[0].name} <Button onClick={() => setWinner([m, m.players[0], m.machine])}>Win</Button></Cell>,
            <Cell>{m.players[1].name} <Button onClick={() => setWinner([m, m.players[1], m.machine])}>Win</Button></Cell>,
            <Cell>{Math.round((new Date()!.getTime() - m.startTime.getTime())/1000/60*10)/10}</Cell>,
          ]}
        />
        <Table data={finishedMatches}
          cols={['#', 'Machine', 'Player 1', 'Player 2', 'Length']}
          title="Completed Matches"
          render={m => [
            'num',
            <Cell>{m.machine.name}</Cell>,
            <Cell style={{border: m.players[0]===m.result[0]? '2px solid green': undefined}}>{m.players[0].name}</Cell>,
            <Cell style={{border: m.players[1]===m.result[0]? '2px solid green': undefined}}>{m.players[1].name}</Cell>,
            <Cell>{Math.round((m.endTime!.getTime() - m.startTime.getTime())/1000/60*10)/10}</Cell>,
          ]}
        />
        {!!winner && <Modal onClose={() => setWinner(undefined)}>
          <h3>Complete Match</h3>
          <p>Winner: {winner[1].name}</p>
          <p>
            At machine: {winner[0].players[1].name} (
            Wins: {finishedMatches.filter(m => m.result![0] === winner[0].players[1]).length}, 
            Matches: {finishedMatches.filter(m => m.players.includes(winner[0].players[1])).length})
          </p>
          {!!winner[2].disabled && <div style={{border: "2x solid yellow"}}>
            <Label>Machine {winner[2].name} is disabled, please choose a replacement:</Label>
            {machines.filter(m => !activeMatches.find(x => x.machine === m)).map(m =>
              <Button onClick={() => setWinner([winner[0], winner[1], m])}>{m.name}</Button>,
            )}
          </div>}
          {/* {Object.keys(nextPlayers[0]).minus('player').join(',')} */}
          <Table data={nextPlayers}
            cols={['Choose Top V Avail V', 'Name', ...Object.keys(nextPlayers[0]).minus('player').filter(k => devMode || !k.startsWith('H_'))]}
            expand="Name"
            title={`Select ${winner[0].players[1].name}'s Opponent`}
            render={(row: (typeof nextPlayers[number])) => [
              <Cell><Button onClick={() => newMatch(row.player)} disabled={winner[2].disabled}>Select</Button></Cell>,
              <Cell>{row.player.name}</Cell>,
              ...Object.keys(nextPlayers[0]).minus('player').filter(k => devMode || !k.startsWith('H_')),
            ]}
          />
        </Modal>}
      </Column>
      <Column>
        <FormGrid>
          <Button onClick={() => setShowAddPlayer(true)}>Add Player</Button>
        </FormGrid>
        <Table data={tour.players}
          cols={['#', 'Name', 'Matches', 'Status']}
          expand="Name"
          title={"Players: "+players.length}
          render={(row: Player) => [
            'num',
            <Cell style={{textDecoration: row.disabled? 'line-through' : undefined}}>{row.name}</Cell>,
            'matches',
            <Cell><Button onClick={() => toggleState(row)}>
              {row.disabled? 'ENABLE' : 'disable'}
            </Button></Cell>,
          ]}
        />
        {showAddPlayer && <Modal onClose={() => setShowAddPlayer(false)}>
        <h3>Add Player</h3>
          <Form fields={['name', 'ifpaNum']} onSubmit={addPlayer} />
        </Modal>}
        <h3>Danger Zone</h3>        
        {!!activeMatches.length && <Button onClick={() => update({...tour, matches: []})}>Reset Tournament</Button>}
        <Button onClick={() => setFake(f => !f)}>Fake Mode: {fake? 'ON' : 'off'}</Button>
        <Button onClick={() => setDevMode(f => !f)}>Dev Mode: {devMode? 'ON' : 'off'}</Button>
        <Button onClick={() => setDebugJson(jsonStringify(tour))}>Debug</Button>
        <Link to={`/${id}`} target="_blank">Viewer</Link>
        <Link to={`/${id}/standings`} target="_blank">Standings</Link>
        {!!debugJson && <Modal onClose={() => setDebugJson(undefined)}>
          <h3>Debug</h3>
          <textarea onChange={e => setDebugJson(e.target.value)} value={debugJson} style={{width: '60vw', height: '80vh'}} onKeyDown={event => {if (event.keyCode===9) {const v=event.target.value; const s=event.target.selectionStart; const e=event.target.selectionEnd;event.target.value=v.substring(0, s)+'  '+v.substring(e);event.target.selectionStart=event.target.selectionEnd=s+2;event.preventDefault();return false;}}} />
          {!!debugError && <>
            <Label>Error:</Label>
            <p style={{whiteSpace: 'pre-wrap'}}>{debugError}</p>
          </>}
          <Button disabled={!!debugError} onClick={async () => {
            await update(jsonParse(debugJson));
            setDebugJson(undefined);
          }}>Save</Button>
        </Modal>}
      </Column>
    </Page>
  </>;
}