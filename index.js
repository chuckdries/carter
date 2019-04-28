import express from "express";
import bodyParser from "body-parser";
import exphbs from "express-handlebars";
import sqlite from "sqlite";

const app = express();
const dbPromise = sqlite.open("./database.sqlite");

dbPromise.then(async db => {
  db.run(
    "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, author STRING, message STRING);"
  );
});

app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log(`${req.method}: ${req.path}`);
  next();
});

app.get("/", async (req, res) => {
  const db = await dbPromise;
  const messages = await db.all("SELECT * FROM messages;");
  res.render("home", { messages });
});

app.post("/message", async (req, res) => {
  const db = await dbPromise;
  await db.run(
    "INSERT INTO messages (author, message) VALUES (?, ?)",
    req.body.author,
    req.body.message
  );
  res.redirect("/");
});

app.listen(8080, () => console.log("listening on http://localhost:8080/"));
