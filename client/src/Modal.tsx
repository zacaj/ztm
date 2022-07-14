import React, {ReactNode, useEffect, useState} from "react";
import styled from "styled-components";

const Container = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
  background: rgba(0,0,0,.5);
`;

const Root = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  background: white;
  padding: 8px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  max-width: 90vh;
  overflow: auto;
`;


export function Modal({children, onClose}: {children: ReactNode[]; onClose: () => void}) {
  return <Container onClick={onClose}>
    <Root onClick={e => e.stopPropagation()}>{children}</Root>
  </Container>;
}