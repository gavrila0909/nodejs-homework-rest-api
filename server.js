const app = require("./app");
const mongoose = require("mongoose");
require("dotenv").config();


const url = process.env.MONGO_URI;
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connection successful");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });

app.listen(3000, () => {
  console.log("Server is running. Use our API on port: 3000");
});
