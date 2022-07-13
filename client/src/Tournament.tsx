import React, {useCallback, useEffect, useState} from "react";
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
};
export type Machine = {
  name: string;
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
`;
const Page = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

export function TournamentApp() {
  const {id} = useParams();
  const [message, setMessage] = useState<string|undefined>('Loading...');
  const [tour, setTour] = useState<Tournament>({} as Tournament);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddMachine, setShowAddMachine] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3000/tournaments/${id}`)
    .then(async resp => {
      if (resp.ok) {
        const body = await resp.json();
        setTour(jsonParse((body).json));
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
  }, [id]);

  const update = useCallback((t: Tournament) => 
    fetch(`http://localhost:3000/tournaments`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: jsonStringify({...t, version: t.version+1})})
    .then(async res => {
      if (res.ok) {
        const body = await res.json();
        setTour(jsonParse((body).json));
      }
      else {
        console.error('error: ', res);
      }
    })
    .catch(err => {
      console.error('err: ', err);
    })
  , []);

  const startTournament = useCallback(() => {
    const players = [...tour.players];
    for (const machine of tour.machines) {
      const match: Match = {
        num: tour.matches.length+1,
        machine,
        players: players.take(2),
        startTime: new Date(),
      };
      tour.matches.push(match);
    }
    update(tour);
    // setTour(jsonParse(jsonStringify(tour)));
    // console.log(jsonParse(jsonStringify(tour)))
  }, [tour, update]);

  const toggleState = useCallback((player: Player) => {
    if (player.disabled)
      delete player.disabled;
    else
      player.disabled = true;
    // setPlayers(p => p.map(p => p===player? {...player} : {...p}));
    update(tour);
  }, [update, tour]);

  const addPlayer = useCallback(async (player: Player) => {
    tour.players.push({...player, num: tour.players.length+1});
    await update(tour);
    setShowAddPlayer(false);
  }, [update, tour]);

  const renderPlayer = useCallback((row: Player) => ([
    'num',
    'name',
    <Cell><Button onClick={() => toggleState(row)}>
      {row.disabled? 'ENABLE' : 'disable'}
    </Button></Cell>,
  ]), [toggleState]);

  const renderMachine = useCallback((row: Machine) => ([
    'name',
    <Cell><Button onClick={() => update({...tour, machines: tour.machines.filter(m => m!==row)})}>Remove</Button></Cell>,
  ]), [tour, update]);

  if (message)
    return <h1>{message}</h1>;

  const activeMatches = tour.matches.filter(m => !m.endTime);
  const finishedMatches = tour.matches.filter(m => !!m.endTime);
  const queue = tour.players.filter(p => !activeMatches.find(m => m.players.includes(p)));

  return <>
    <h1>{tour.name}</h1>
    <Page>
      <Column>
        <FormGrid>
          <Label>Target Queue Size: {tour.players.length - tour.machines.length*2}</Label>
          {/* <Input onChange={e => {
            const size = parseInt(e.target.value, 10);
            update({...tour, queueSize: e.});
          }} /> */}

          <Button onClick={() => setShowAddPlayer(true)}>Add Player</Button>
        </FormGrid>
        <Table data={tour.players}
          cols={['#', 'Name', 'Status']}
          expand="Name"
          title={"Players: "+tour.players.length}
          render={renderPlayer}
        />
        <Table data={queue}
          cols={['#', 'Name']}
          expand="Name"
          title={"Queue: "+queue.length}
          render={p => [
            'num', 'name',
            // <Cell>{finishedMatches.find(m => m.players.includes(p))?.endTime}
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
          title={"Machines: "+tour.machines.length}
          render={renderMachine}
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
            <Cell>{m.players[0].name} <Button>Win</Button></Cell>,
            <Cell>{m.players[1].name} <Button>Win</Button></Cell>,
          ]}
        />
        {showAddMachine && <Modal onClose={() => setShowAddMachine(false)}>
          <h3>Add Machine</h3>
          <Form fields={['name']} onSubmit={data => { update({...tour, machines: [...tour.machines, data]}); setShowAddMachine(false); }} />
        </Modal>}
      </Column>
    </Page>
  </>;
}