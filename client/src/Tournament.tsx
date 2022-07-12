import React, {useCallback, useEffect, useState} from "react";
import { Routes, Route, useParams } from "react-router-dom";
import styled from "styled-components";
import { Button } from "./common";
import { Form } from "./Form";
import { Modal } from "./Modal";
import { Cell, Table } from "./Table";

export type Tournament = {
  id: string;
  name: string;
  version: number;
  players: Player[];
};
export type Player = {
  num: number;
  name: string;
  disabled?: true;
};

export function TournamentApp() {
  const {id} = useParams();
  const [message, setMessage] = useState<string>();
  const [tour, setTour] = useState<Tournament>({} as Tournament);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  // const [players, setPlayers] = useState<Player[]>([]);

  // useEffect(() => {
  //   if (typeof tour === 'string') {
  //     setPlayers([]);
  //   }
  //   else {
  //     setPlayers(tour.players);
  //   }
  // }, [tour]);

  useEffect(() => {
    fetch(`http://localhost:3000/tournaments/${id}`)
    .then(async resp => {
      if (resp.ok) {
        const body = await resp.json();
        setTour(JSON.parse((body).json));
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
    fetch(`http://localhost:3000/tournaments`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...t, version: t.version+1}, null, 2)})
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

  if (message)
    return <h1>{message}</h1>;

  return <>
    <h1>{tour.name}</h1>
    <Button  onClick={() => setShowAddPlayer(true)}>Add Player</Button>
    <Table data={tour.players}
      cols={['#', 'Name', 'Status']}
      expand="Name"
      title="Players"
      render={renderPlayer}
    />
    {showAddPlayer && <Modal onClose={() => setShowAddPlayer(false)}>
      <Form fields={['name', 'ifpaNum']} onSubmit={addPlayer} />
    </Modal>}
  </>;
}