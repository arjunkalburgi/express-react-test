import { useCallback } from "react";

const DefaultEndpoints = {
  GenerateAuthUrl: "/nylas/generate-auth-url",
  ExchangeMailboxToken: "/nylas/exchange-mailbox-token",
  ReadEmails: "/nylas/read-emails",
  SendEmail: "/nylas/send-email",
};

const useNylasReact = (props) => {
  const startAuthProcess = useCallback(
    async (email_address) => {
      try {
        const url =
          props.serverBaseUrl +
          (props.endpointOverrideGenerateAuthUrl ||
            DefaultEndpoints.GenerateAuthUrl);
        const rawResp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_address,
            success_url: props.successRedirectUrl,
          }),
        });
        const r = await rawResp.text();

        console.log(r);
        window.location.href = r;
      } catch (e) {
        console.warn(`Error fetching auth URL:`, e);
        props.onConnectionError && props.onConnectionError(e);
      }
    },
    [
      props.endpointOverrideGenerateAuthUrl,
      props.onConnectionError,
      props.serverBaseUrl,
      props.successRedirectUrl,
    ]
  );

  const exchangeMailboxToken = useCallback(async () => {
    try {
      const access_token = new URLSearchParams(window.location.search).get(
        "code"
      );
      if (!access_token) {
        return false;
      }

      const url =
        props.serverBaseUrl +
        (props.endpointOverrideExchangeMailboxToken ||
          DefaultEndpoints.ExchangeMailboxToken);
      const rawResp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: access_token,
        }),
      });
      const r = await rawResp.text();

      console.log(r);
      return r;
    } catch (e) {
      console.warn(`Error exchanging mailbox token:`, e);
      props.onConnectionError && props.onConnectionError(e);
      return false;
    }
  }, [
    props.onConnectionError,
    props.endpointOverrideExchangeMailboxToken,
    props.serverBaseUrl,
  ]);

  const getEmails = useCallback(
    async (userId) => {
      try {
        const url = props.serverBaseUrl + DefaultEndpoints.ReadEmails;
        const rawResp = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: userId,
            "Content-Type": "application/json",
          },
        });
        const r = await rawResp.json();

        console.log(r);
        return r;
      } catch (e) {
        console.warn(`Error retrieving emails:`, e);
        if (
          typeof props.onConnectionError !== "undefined" &&
          e instanceof Error
        ) {
          props.onConnectionError(e);
        }
        return false;
      }
    },
    [props.onConnectionError, props.serverBaseUrl]
  );

  const sendEmail = useCallback(
    async ({ userId, to, body }) => {
      try {
        const url = props.serverBaseUrl + DefaultEndpoints.SendEmail;
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
        if (
          typeof props.onConnectionError !== "undefined" &&
          e instanceof Error
        ) {
          props.onConnectionError(e);
        }
        return false;
      }
    },
    [props.onConnectionError, props.serverBaseUrl]
  );

  return {
    startAuthProcess,
    exchangeMailboxToken,
    getEmails,
    sendEmail,
  };
};

export default useNylasReact;
