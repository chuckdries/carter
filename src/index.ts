import express from "express";
import bodyParser from "body-parser";
import exphbs from "express-handlebars";
import cookieParser from "cookie-parser";

import authRouter, { authorize } from "./auth";
import db from "./db";

const app = express();

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
  const messages = await db("messages")
    .leftJoin("users", "messages.author", "users.id")
    .orderBy("messages.id", "desc")
    .select("messages.message", "users.name as author");

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

const init = async () => {
  await db.migrate.latest();
  await db.migrate.status().then(s => console.log("db version", s));
  app.listen(8080, () => console.log("listening on http://localhost:8080/"));
};
init();
