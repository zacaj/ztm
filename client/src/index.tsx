import * as React from "react";
import App from "./App";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { TournamentApp } from "./Tournament";
import './styles.scss';
import { ViewingApp } from "./Viewing";
import { StandingsApp } from "./Standings";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<BrowserRouter>
  <Routes>
    <Route path="/">
      <Route index element={<App />} />
      <Route path=":id/admin"  element={<TournamentApp />} />
      <Route path=":id/standings"  element={<StandingsApp />} />
      <Route path=":id"  element={<ViewingApp />} />
    </Route>
  </Routes>
</BrowserRouter>);