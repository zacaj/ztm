import React, {useCallback, useEffect, useMemo, useState} from "react";
import { Routes, Route, useParams } from "react-router-dom";
import styled from "styled-components";
import { baseUrl, Button, FormGrid, Input, jsonParse, jsonStringify, Label } from "./common";
import { Form } from "./Form";
import { Modal } from "./Modal";
import { Cell, Table } from "./Table";
import { Column, Page, Player, Tournament } from "./Tournament";

export function StandingsApp() {
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

  const standings = useMemo(() => players.map(p => ({
      ...p,
      matches: finishedMatches.filter(m => m.players.includes(p)).length,
      wins: finishedMatches.filter(m => m.result![0] === p).length,
    }))
    .map(p => ({...p, 
      winPercent: Math.round(p.wins/p.matches*100)/100, 
      diff: p.wins - (p.matches - p.wins),
    }))
    .sort((a, b) => b.wins - a.wins)
    .map((p, i, a) => ({...p, winRank: i+1 - a.slice(0, i).count(x => x.wins===p.wins)/2 + a.slice(i+1).count(x => x.wins===p.wins)/2}))
    // .sort((a, b) => b.winPercent - a.winPercent)
    // .map((p, i) => ({...p, winPercentRank: i+1}))
    .sort((a, b) => b.diff - a.diff)
    .map((p, i, a) => ({...p, diffRank: i+1 - a.slice(0, i).count(x => x.diff===p.diff)/2 + a.slice(i+1).count(x => x.diff===p.diff)/2}))
    .map(p => ({...p, avg: Math.round((p.winRank+p.diffRank)/3*10)/10}))
    .sort((a, b) => a.avg - b.avg)
    .map((p, i, a) => ({...p, avgRank: i+1 - a.slice(0, i).count(x => x.avg===p.avg)/2 + a.slice(i+1).count(x => x.avg===p.avg)/2}))
    .sort((a, b) => {
      if (a.avg === b.avg)
        return b.winPercent - a.winPercent;
      else
        return a.avg - b.avg;
    })
    .map((p, i, a) => ({...p, avgPercentRank: i+1 - a.slice(0, i).count(x => x.avg===p.avg && x.winPercent===p.winPercent)/2 + a.slice(i+1).count(x => x.avg===p.avg && x.winPercent===p.winPercent)/2}))
  , [finishedMatches, players]);

  if (message)
    return <h1>{message}</h1>;

  return <>
    {/* <h1>{tour.name}</h1> */}
    <Page>
      <Column>
        <Table data={standings}
          cols={['Place', 'Name', ' ', 'Matches', 'Wins',  'W-L', 'Win Rank',  'W-L Rank', 'Avg', 'Avg Rank', 'Win %']}
          expand="Name"
          title={"Standings (average of W-L and Win ranks, broken by win %)"}
          render={(row: any) => [
            <Cell>{row.avgPercentRank+(standings.find(x => x.avgPercentRank===row.avgPercentRank&&x!==row)? '*' : '')}</Cell>,
            'name',
            <Cell>    </Cell>,
            'matches',
            'wins',
            'diff',
            'winRank',
            // 'winPercentRank',
            'diffRank',
            'avg',
            'avgRank',
            <Cell>{Math.round(row.winPercent*100)+'%'}</Cell>,
          ]}
        />
      </Column>
    </Page>
  </>;
}