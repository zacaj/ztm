import React, {ReactNode, useEffect, useState} from "react";
import styled from "styled-components";

export const Button = styled.button.attrs(props => ({
  type: props.type ?? 'button',
}))`
  outline: none;
  background: #EEE;
  border: 1px solid grey;
  border-radius: 3px;
  padding: 2px 4px;
  cursor: pointer;
`;