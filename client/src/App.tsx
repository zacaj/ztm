import * as React from "react";
import styled from "styled-components";

const Header = styled.h1`
`;

const App = () => (
  <div className="app">
    <Header>Zacaj's Tournament Manager</Header>
    <p>If you're here, you probably need to find a tournament link!</p>
    <p>(sorry, no search yet)</p>
  </div>
);

export default App;