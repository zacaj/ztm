import React, {useCallback, useEffect, useMemo, useState} from "react";
import { Routes, Route, useParams } from "react-router-dom";
import styled from "styled-components";
import { baseUrl, Button, FormGrid, Input, jsonParse, jsonStringify, Label } from "./common";
import { Form } from "./Form";
import { Modal } from "./Modal";
import { Cell, Table } from "./Table";
import { Column, Page, Player, Tournament } from "./Tournament";

export function ViewingApp() {
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
  
  useEffect(() => {
    if (id === tour.id) return;
    const ref = setInterval(() => fetch(`${baseUrl}/tournaments/${id}`)
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
      })
    , 10000);
    // return () => clearInterval(ref);
  }, [id, tour.id]);

  const activeMatches = useMemo(() => tour.matches.filter(m => !m.endTime), [tour]);
  const finishedMatches = useMemo(() => tour.matches.filter(m => !!m.endTime).sort((a, b) => a.endTime!.getTime() - b.endTime!.getTime()), [tour]);
  const players = useMemo(() => tour.players.filter(p => !p.disabled), [tour]);
  const machines = useMemo(() => tour.machines.filter(m => !m.disabled), [tour]);
  const queue = useMemo(() => 
    players.filter(p => !p.currentMatch)
           .sort((a, b) => (a.lastMatch?.endTime?.getTime() ?? 0) - (b.lastMatch?.endTime?.getTime() ?? 0))
  , [players]);

  if (message)
    return <h1>{message}</h1>;

  return <>
    {/* <h1>{tour.name}</h1> */}
    <Page>
      <Column>
        <Table data={players}
          cols={['#', 'Name', 'Matches']}
          expand="Name"
          title={"Players: "+players.length}
          render={(row: Player) => [
            'num',
            <Cell style={{textDecoration: row.disabled? 'line-through' : undefined}}>{row.name}</Cell>,
            'matches',
          ]}
        />
      </Column>
      <Column>
        <Table data={queue}
          cols={['#', 'Name']}
          expand="Name"
          title={"Waiting: "+queue.length}
          render={p => [
            'num', 'name',
            // <Cell>{p.timeInQueue ?? 'N/A'}</Cell>,
          ]}
        />
      </Column>
      <Column>
        <Table data={activeMatches}
          cols={['#', 'Machine', 'Player 1', 'Player 2', 'Time']}
          title="Active Matches"
          render={m => [
            'num',
            <Cell>{m.machine.name}</Cell>,
            <Cell>{m.players[0].name}</Cell>,
            <Cell>{m.players[1].name}</Cell>,
            <Cell>{Math.round((new Date()!.getTime() - m.startTime.getTime())/1000/60*10)/10}</Cell>,
          ]}
        />
      </Column>
    </Page>
  </>;
}