import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";
import { NylasProvider } from "@nylas/nylas-react";

ReactDOM.render(
  <NylasProvider serverBaseUrl="http://localhost:9000">
    <App />
  </NylasProvider>,
  document.getElementById("root")
);
registerServiceWorker();
