const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const passport = require("passport");
require("dotenv").config();

const app = express();

const contactsRouter = require("./routes/api/contacts");
const authRouter = require("./routes/api/auth");

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

// Middleware
app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
require("./config/passport")(passport);

app.use(
  "/contacts",
  passport.authenticate("jwt", { session: false }),
  contactsRouter
);

app.use("/contacts", contactsRouter);
app.use("/", authRouter);



app.use((req, res) => {
  res.status(404).json({ message: "Not found this page" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});



module.exports = app;
