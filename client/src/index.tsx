import * as React from "react";
import App from "./App";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { TournamentApp } from "./Tournament";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<BrowserRouter>
  <Routes>
    <Route path="/" >
      <Route index element={<App />} />
      <Route path=":id"  element={<TournamentApp />} />
    </Route>
  </Routes>
</BrowserRouter>);