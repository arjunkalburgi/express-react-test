import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { useNylas } from "@nylas/nylas-react";

const options = {
  serverBaseUrl: "http://localhost:9000",
  successRedirectUrl: "",
};

const App = () => {
  const { authWithRedirect, exchangeCodeFromUrlForToken } = useNylas();
  const [userId, setUserId] = React.useState("");
  const [email, setEmail] = React.useState("");
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

  const handleTokenExchange = (r) => {
    try {
      const user = JSON.parse(r);
      setUserId(user.id);
      window.history.replaceState({}, "", `/?userId=${user.id}`);
    } catch (e) {
      console.error("An error occurred parsing the response.");
      window.history.replaceState({}, "", "/");
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("code")) {
      exchangeCodeFromUrlForToken().then(handleTokenExchange);
    }

    if (params.has("userId")) {
      setUserId(params.get("userId"));
    }
  }, [exchangeCodeFromUrlForToken]);

  const [sending, setSending] = React.useState(false);

  const [to, setTo] = React.useState("");
  const [body, setBody] = React.useState("");

  const reset = () => {
    setTo("");
    setBody("");
  };

  const send = async () => {
    if (!userId) {
      return;
    }

    setSending(true);
    const message = await sendEmail({ userId, to, body });
    console.log(message);
    setSending(false);
    alert("Sent. Check console log...");
    reset();
  };

  const sendEmail = React.useCallback(
    async ({ userId, to, body }) => {
      try {
        const url = options.serverBaseUrl + "/nylas/send-email";
        const rawResp = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: userId,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ to, body }),
        });
        const r = await rawResp.json();

        console.log(r);
        return r;
      } catch (e) {
        console.warn(`Error sending emails:`, e);
        if (e instanceof Error) {
          console.error(e);
        }
        return false;
      }
    },
    [options.serverBaseUrl]
  );

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1 className="App-title">Welcome to React</h1>
      </header>
      <p className="App-intro">{apiResponse}</p>

      <div
        style={{
          padding: "6em 1em",
        }}
        className="App"
      >
        {userId ? (
          <div>
            <section
              style={{
                width: "80vw",
                margin: "0 auto",
                height: "60px",
                border: "2px solid #4169e1",
                background: "rgba(0,42,245,0.8)",
                borderRadius: "8px",
                display: "flex",
                alignContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  padding: "1em",
                }}
              >
                <p
                  style={{
                    padding: 0,
                    marginBlock: 0,
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  ✨ Connected to Nylas!
                </p>
              </div>
            </section>
            <section
              style={{
                width: "80vw",
                margin: "10vh auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  width: "100%",
                  padding: "0.5em",
                  background: "#4169e1",
                  color: "white",
                }}
              >
                New Message
              </div>
              <input
                style={{
                  border: "1px solid #8d94a5",
                  color: "#000",
                  padding: "0.5em 1.4em",
                }}
                placeholder="To"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
              <textarea
                style={{
                  border: "1px solid #8d94a5",
                  color: "#000",
                  padding: "0.5em 1.4em",
                }}
                rows={30}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <div
                style={{
                  marginTop: "1em",
                  alignSelf: "end",
                  justifySelf: "end",
                }}
              >
                <button
                  style={{
                    background: "#4169e1",
                    color: "#fff",
                    padding: "0.5em 1.4em",
                  }}
                  disabled={!to || !body || sending}
                  onClick={send}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </section>
          </div>
        ) : (
          <section style={{ width: "80vw", margin: "0 auto" }}>
            <h1>Send emails sample app</h1>
            <p>Authenticate your email to send</p>
            <div style={{ marginTop: "30px" }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  authWithRedirect({
                    emailAddress: email,
                    successRedirectUrl: "",
                  });
                }}
              >
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit">Connect</button>
              </form>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default App;

// dash guide => we won't support Component-based react
// extended documentation => explain how to do it

// Can we use our existing hooks for class-based component? No
// update nylas-react => export code for Component-based react
