import express from "express";
import bodyParser from "body-parser";
import exphbs from "express-handlebars";
import knex from "knex";
import cookieParser from "cookie-parser";

import authRouter, { authorize } from "./auth";

const app = express();
// export const dbPromise = sqlite
//   .open("./database.sqlite")
//   .then(async db => db.migrate({}));

export const db = knex({
  client: "sqlite3",
  connection: {
    filename: "./database.sqlite"
  },
  useNullAsDefault: true
});

const init = async () => {
  db.migrate.latest();
  db.migrate.status().then(s => console.log("db version", s));
};
init();

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`${req.method}: ${req.path}`);
  next();
});

app.use(authorize);

app.get("/", async (req, res) => {
  // const db = await dbPromise;
  // const messages = await db.all(
  //   "SELECT messages.message, users.name as author FROM messages LEFT JOIN users WHERE messages.author=users.id;"
  // );
  const messages = await db("messages")
    .leftJoin("users", "messages.author", "users.id")
    .select("messages.message", "users.name as author");

  console.log(messages);
  res.render("home", { messages: messages, user: req.user });
});

app.post("/message", async (req, res) => {
  await db("messages").insert({
    author: req.user.id,
    message: req.body.message
  });
  const knexoutput = await db("messages").select();
  console.log(knexoutput);
  res.redirect("/");
});

app.use(authRouter);

app.listen(8080, () => console.log("listening on http://localhost:8080/"));
