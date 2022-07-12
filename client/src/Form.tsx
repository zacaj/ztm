import React, {ReactNode, useEffect, useState} from "react";
import styled from "styled-components";
import { Button } from "./common";

const FormGrid = styled.form`
  display: grid;
  grid-column-template: auto auto;
  row-gap: 8px;
  column-gap: 10px;
`;

const Label = styled.label`
`;

const Input = styled.input.attrs({
  type: 'text',
})`
  border: 1px solid lightgrey;
  border-radius: 3px;
`;

export function Form({children, fields, onSubmit}: {children?: ReactNode[], fields: string[], onSubmit: (obj: any) => void}) {
  const [data, setData] = useState<any>({});
  return <>
    <h3>Add Player</h3>
    <FormGrid onSubmit={(e) => {e.preventDefault(); onSubmit(data); }}>
      {fields.flatMap(field => ([
        <Label>{field}</Label>,
        <Input onChange={e => setData((d: any) => ({...d, [field]: e.target.value}))} />,
      ]))}
      <Button type="submit">Submit</Button>
    </FormGrid>
  </>;
}