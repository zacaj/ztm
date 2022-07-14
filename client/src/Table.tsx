import React, {useEffect, useState, ReactNode} from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  border: 1px solid lightgrey;
  border-radius: 5px;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const Table2 = styled.div<{cols: string}>`
  display: grid;
  grid-template-columns: ${props => props.cols};
  overflow-y: auto;
`;

export const Cell = styled.div`
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  gap: 4px;
`;

const HeaderCell = styled(Cell)`
  border-bottom: 1px solid lightgrey;
  position: sticky;
  top: 0;
  z-index: .5;
  background: white;

  &:not(:last-child) {
    border-right: 1px solid lightgrey;
  }
`;

const Title = styled.div`
  grid-column: 1/-1;
  background: grey;
  color: white;
  padding: 1px 5px;
`;

export function Table({data, cols, render, expand, title}: {data: {[key: string]: any}[]; cols: string[]; render?: (row: any) => (ReactNode|string)[]; expand?: string; title: string}) {
  if (!data) return <>No data</>;
  return <Wrapper>
    <Title>{title}</Title>
    <Table2 cols={cols.map(c => c===expand? '1fr' : 'auto').join(' ')}>
      {cols.map(c => <HeaderCell>{c}</HeaderCell>)}
      {data.flatMap(row => {
        if (render)
          return render(row).map(cell => typeof cell === 'string'? <Cell>{row[cell]}</Cell> : cell);
        else
          return cols.map(c => <Cell>{row[c]}</Cell>);
      })}
    </Table2>
  </Wrapper>;
};