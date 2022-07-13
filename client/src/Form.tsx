import React, {ReactNode, useEffect, useState} from "react";
import styled from "styled-components";
import { Button, FormGrid, Input, Label } from "./common";


export function Form({children, fields, data: orig, onSubmit}: {children?: ReactNode[]; fields: string[]; onSubmit: (obj: any) => void; data?: any}) {
  const [data, setData] = useState<any>({...orig});
  return <>
    <FormGrid onSubmit={(e) => {e.preventDefault(); onSubmit(data); }}>
      {fields.flatMap((field, i) => ([
        <Label>{field}</Label>,
        <Input onChange={e => setData((d: any) => ({...d, [field]: e.target.value}))} autoFocus={i===0} />,
      ]))}
      <Button type="submit">Submit</Button>
    </FormGrid>
  </>;
}