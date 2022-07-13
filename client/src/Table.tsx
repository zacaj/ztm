import React, {useEffect, useState, ReactNode} from "react";
import styled from "styled-components";

const Wrapper = styled.div<{cols: string}>`
  display: grid;
  grid-template-columns: ${props => props.cols};
  border: 1px solid lightgrey;
  border-radius: 5px;
  overflow-y: auto;
`;

export const Cell = styled.div`
  padding: 4px 8px;
`;

const HeaderCell = styled(Cell)`
  border-bottom: 1px solid lightgrey;
  
  &:not(:last-child) {
    border-right: 1px solid lightgrey;
  }
`;

const Title = styled.div`
  grid-column: 1/-1;
  background: grey;
  color: white;
`;

export function Table({data, cols, render, expand, title}: {data: {[key: string]: any}[]; cols: string[]; render?: (row: any) => (ReactNode|string)[]; expand?: string; title: string}) {
  if (!data) return <>No data</>;
  return <Wrapper cols={cols.map(c => c===expand? '1fr' : 'auto').join(' ')}>
    <Title>{title}</Title>
    {cols.map(c => <HeaderCell>{c}</HeaderCell>)}
    {data.flatMap(row => {
      if (render)
        return render(row).map(cell => typeof cell === 'string'? <Cell>{row[cell]}</Cell> : cell);
      else
        return cols.map(c => <Cell>{row[c]}</Cell>);
    })}
  </Wrapper>;
}