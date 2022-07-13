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
  players: Player[]; // player
  result: Player[]; // player
  startTime: Date;
  endTime?: Date;
  machine: Machine;
};

const Column = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 20px;
`;
const Page = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

export function TournamentApp() {
  const {id} = useParams();
  const [message, setMessage] = useState<string>('Loading...');
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
    fetch(`http://localhost:3000/tournaments`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: jsonStringify({...t, version: t.version+1}, null, 2)})
    .then(async res => {
      if (res.ok) {
        const body = await res.json();
        setTour(JSON.parse((body).json));
      }
      else {
        console.error('error: ', res);
      }
    })
    .catch(err => {
      console.error('err: ', err);
    })
  , []);

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

  return <>
    <h1>{tour.name}</h1>
    <Page>
      <Column>
        <FormGrid>
          <Label>Queue Size: {tour.players.length - tour.machines.length*2}</Label>
          {/* <Input onChange={e => {
            const size = parseInt(e.target.value, 10);
            update({...tour, queueSize: e.});
          }} /> */}

          <Button onClick={() => setShowAddPlayer(true)}>Add Player</Button>
        </FormGrid>
        <Table data={tour.players}
          cols={['#', 'Name', 'Status']}
          expand="Name"
          title="Players"
          render={renderPlayer}
        />
        {showAddPlayer && <Modal onClose={() => setShowAddPlayer(false)}>
        <h3>Add Player</h3>
          <Form fields={['name', 'ifpaNum']} onSubmit={addPlayer} />
        </Modal>}
      </Column>
      <Column>
        <FormGrid>
          <Button onClick={() => setShowAddMachine(true)}>Add Machine</Button>
        </FormGrid>
        <Table data={tour.machines}
          cols={['Name', 'Actions']}
          expand="Name"
          title="Machines"
          render={renderMachine}
        />
        {showAddMachine && <Modal onClose={() => setShowAddMachine(false)}>
          <h3>Add Machine</h3>
          <Form fields={['name']} onSubmit={data => { update({...tour, machines: [...tour.machines, data]}); setShowAddMachine(false); }} />
        </Modal>}
      </Column>
    </Page>
  </>;
}