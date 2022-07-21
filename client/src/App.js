import React from "react";
import logo from "./logo.svg";
import "./App.css";

const App = () => {
  const [apiResponse, setApiResonse] = React.useState("");

  const callAPI = () => {
    return fetch("http://localhost:9000/testAPI")
      .then((res) => res.text())
      .then((res) => setApiResonse(res))
      .catch((err) => err);
  };

  React.useEffect(() => {
    callAPI();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1 className="App-title">Welcome to React</h1>
      </header>
      <p className="App-intro">{apiResponse}</p>
    </div>
  );
};

export default App;

// dash guide => we won't support Component-based react
// extended documentation => explain how to do it

// Can we use our existing hooks for class-based component? No
// update nylas-react => export code for Component-based react
