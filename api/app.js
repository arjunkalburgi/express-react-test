var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
const { mockDb } = require("./utils/mock-db");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var testAPIRouter = require("./routes/testAPI");

const Nylas = require("nylas");
const { WebhookTriggers } = require("nylas/lib/models/webhook");
const { Scope } = require("nylas/lib/models/connect");
const { ServerBindings } = require("nylas/lib/config");
const { default: Draft } = require("nylas/lib/models/draft");

// Nylas application credentials
const clientId = "";
const clientSecret = "";

// Initialize an instance of the Nylas SDK using the client credentials
const nylasClient = new Nylas({
  clientId: clientId,
  clientSecret: clientSecret,
});

// Before we start our backend, we should whitelist our frontend as a redirect URI to ensure the auth completes
const clientUri = "http://localhost:3000";
nylasClient
  .application({
    redirectUris: [clientUri],
  })
  .then((applicationDetails) => {
    console.log(
      "Application whitelisted. Application Details: ",
      JSON.stringify(applicationDetails, undefined, 2)
    );
  });

const exchangeMailboxTokenCallback = async (accessTokenObj, res) => {
  // Normally store the access token in the DB
  const accessToken = accessTokenObj.accessToken;
  const emailAddress = accessTokenObj.emailAddress;
  console.log("Access Token was generated for: " + accessTokenObj.emailAddress);
  let user = await mockDb.findUser();
  if (user) {
    user = await mockDb.updateUser(user.id, { accessToken });
  } else {
    user = await mockDb.createUser({
      accessToken,
      emailAddress,
    });
  }

  res.json({
    id: user.id,
    emailAddress: user.emailAddress,
  });
};

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/testAPI", testAPIRouter);

// Use the express bindings provided by the SDK and pass in additional configuration such as auth scopes
const expressBinding = new ServerBindings.express(nylasClient, {
  defaultScopes: [Scope.EmailModify, Scope.EmailSend],
  exchangeMailboxTokenCallback,
  clientUri,
});

// Handle when an account gets connected
expressBinding.on(WebhookTriggers.AccountConnected, (payload) => {
  console.log(
    "Webhook trigger received, account connected. Details: ",
    JSON.stringify(payload.objectData, undefined, 2)
  );
});

// Mount the express middleware to your express app
const nylasMiddleware = expressBinding.buildMiddleware();
app.use("/nylas", nylasMiddleware);

// Start the Nylas webhook
expressBinding
  .startDevelopmentWebsocket()
  .then((webhookDetails) =>
    console.log("Webhook tunnel registered. Webhook ID: " + webhookDetails.id)
  );

app.post("/nylas/send-email", async (req, res) => {
  const requestBody = req.body;

  if (!req.headers.authorization) {
    console.log("no headers");
    return res.json("Unauthorized");
  }

  const user = await mockDb.findUser(req.headers.authorization);
  if (!user) {
    return res.json("Unauthorized");
  }

  const { to, body } = requestBody;

  const draft = new Draft(nylasClient.with(user.accessToken));

  draft.to = [{ email: to }];
  draft.body = body;

  draft.from = [{ email: user.emailAddress }];

  const message = await draft.send();
  return res.json({ message });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
