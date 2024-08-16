const express = require("express");
const logger = require("morgan");
const cors = require("cors");

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

// Middleware
app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

// Importă router-ul pentru contacte
const contactsRouter = require("./routes/api/contacts");
const { default: mongoose } = require("mongoose");
app.use("/api/contacts", contactsRouter);

// Middleware pentru rute neidentificate (404 Not Found)
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Middleware pentru gestionarea erorilor
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

module.exports = app;
