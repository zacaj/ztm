import React, {useCallback, useEffect, useMemo, useState} from "react";
import { Routes, Route, useParams } from "react-router-dom";
import styled from "styled-components";
import { Button, FormGrid, Input, jsonParse, jsonStringify, Label } from "./common";
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
  timeInQueue?: number;
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

const Column = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 20px;
  flex-wrap: wrap;
  gap: 5px;
`;
const Page = styled.div`
  display: flex;
  flex-wrap: wrap;
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
  const [winner, setWinner] = useState<[Match, Player]>();

  const setTournament = useCallback((t: Tournament) => {
    for (const p of t.players) {
      p.currentMatch = t.matches.find(m => !m.endTime && m.players.includes(p));
      p.lastMatch = t.matches.findLast(m => !!m.endTime && m.players.includes(p));
      p.timeInQueue = p.lastMatch? Math.round((new Date().getTime() - p.lastMatch!.endTime!.getTime())/1000/60) : undefined;
    }
    setTour(t);
  }, []);

  useEffect(() => {
    fetch(`http://localhost:3000/tournaments/${id}`)
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
  }, [id, setTournament]);

  const update = useCallback((t: Tournament, fake = false) => {
    if (fake) {
      setTournament(jsonParse(jsonStringify(t)));
      console.log('fake update: ', jsonParse(jsonStringify(t)));
      return;
    }
    return fetch(`http://localhost:3000/tournaments`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: jsonStringify({...t, version: t.version+1})})
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
  }, [setTournament]);

  const activeMatches = useMemo(() => tour.matches.filter(m => !m.endTime), [tour]);
  const finishedMatches = useMemo(() => tour.matches.filter(m => !!m.endTime), [tour]);
  const players = useMemo(() => tour.players.filter(p => !p.disabled), [tour]);
  const machines = useMemo(() => tour.machines.filter(m => !m.disabled), [tour]);
  const queue = useMemo(() => 
    players.filter(p => !p.currentMatch)
           .sort((a, b) => (a.lastMatch?.endTime?.getTime() ?? 0) - (b.lastMatch?.endTime?.getTime() ?? 0))
  , [players]);
  const startTournament = useCallback(() => {
    const avail = [...players];
    for (const machine of machines) {
      const match: Match = {
        num: tour.matches.length+1,
        machine,
        players: avail.take(2),
        startTime: new Date(),
      };
      tour.matches.push(match);
    }
    update(tour);
  }, [tour, update, players, machines]);

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
    return [...queue];
  }, [winner, queue]);

  const newMatch = useCallback(async (opponent: Player) => {
    if (!winner) throw new Error('no');
    winner[0].endTime = new Date();
    const loser = winner[0].players.find(p => p !== winner[1])!;
    winner[0].result = [winner[1], loser];

    const match: Match = {
      startTime: new Date(),
      players: [winner[0].players[1], opponent],
      machine: winner[0].machine,
      num: tour.matches.length + 1,
    };
    tour.matches.push(match);
    await update(tour);
    setWinner(undefined);
  }, [winner, tour, update]);

  if (message)
    return <h1>{message}</h1>;


  return <>
    <h1>{tour.name}</h1>
    <Page>
      <Column>
        <FormGrid>
          <Label>Target Queue Size: {players.length - machines.length*2}</Label>
          {/* <Input onChange={e => {
            const size = parseInt(e.target.value, 10);
            update({...tour, queueSize: e.});
          }} /> */}

          <Button onClick={() => setShowAddPlayer(true)}>Add Player</Button>
        </FormGrid>
        <Table data={tour.players}
          cols={['#', 'Name', 'Status']}
          expand="Name"
          title={"Players: "+players.length}
          render={(row: Player) => [
            'num',
            <Cell style={{textDecoration: row.disabled? 'line-through' : undefined}}>{row.name}</Cell>,
            <Cell><Button onClick={() => toggleState(row)}>
              {row.disabled? 'ENABLE' : 'disable'}
            </Button></Cell>,
          ]}
        />
        <Table data={queue}
          cols={['#', 'Name', 'Time in Queue']}
          expand="Name"
          title={"Queue: "+queue.length}
          render={p => [
            'num', 'name',
            <Cell>{p.timeInQueue ?? 'N/A'}</Cell>,
          ]}
        />
        {showAddPlayer && <Modal onClose={() => setShowAddPlayer(false)}>
        <h3>Add Player</h3>
          <Form fields={['name', 'ifpaNum']} onSubmit={addPlayer} />
        </Modal>}
        <FormGrid>
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
        {!activeMatches.length && <Button onClick={startTournament}>Start Tournament</Button>}
        {!!activeMatches.length && <Button onClick={() => update({...tour, matches: []})}>Reset Tournament</Button>}
        <Table data={activeMatches}
          cols={['#', 'Machine', 'Player 1', 'Player 2']}
          title="Active Matches"
          render={m => [
            'num',
            <Cell>{m.machine.name}</Cell>,
            <Cell>{m.players[0].name} <Button onClick={() => setWinner([m, m.players[0]])}>Win</Button></Cell>,
            <Cell>{m.players[1].name} <Button onClick={() => setWinner([m, m.players[1]])}>Win</Button></Cell>,
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
          <Table data={nextPlayers}
            cols={['', 'Name', 'Time in Queue']}
            expand="Name"
            title={"Select Opponent"}
            render={(row: Player) => [
              <Cell><Button onClick={() => newMatch(row)}>Select</Button></Cell>,
              'name',
              <Cell>{row.timeInQueue ?? 'N/A'}</Cell>,
            ]}
          />
        </Modal>}
      </Column>
    </Page>
  </>;
}