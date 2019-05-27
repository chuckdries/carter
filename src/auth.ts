import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import * as yup from "yup";
import uuid from "uuid/v4";
import knex from "knex";

import { DBUser } from "./User";
import { db } from "./index";

const router = express.Router();
const saltRounds = 10;

// authorize - looks up user
export const authorize = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { accessToken } = req.cookies;
  if (!accessToken) {
    next();
    return;
  }

  // const user: User = await db.get(
  //   "SELECT users.email, users.name, users.id as id FROM tokens LEFT JOIN users ON tokens.user = users.id WHERE token=?",
  //   accessToken
  // );
  const user: DBUser[] = await db("tokens")
    .leftJoin("users", "tokens.user", "users.id")
    .where({
      token: accessToken
    })
    .select("users.email", "users.name", "users.id");
  console.log(user[0]);
  if (!user.length) {
    next();
    return;
  }

  req.user = user[0];
  next();
};
// require auth - ensures user is logged in
// register
router.get("/register", async (req, res) => {
  if (req.user) {
    res.redirect("/");
    return;
  }

  res.render("register");
});

const registerSchema = yup
  .object()
  .shape({
    password: yup.string().required(),
    name: yup.string().required(),
    email: yup
      .string()
      .email()
      .required()
  })
  .noUnknown();

router.post("/register", async (req, res) => {
  const { password, name, email } = req.body;

  try {
    registerSchema.validateSync(req.body, { abortEarly: false });
  } catch (e) {
    res.render("register", { errors: e.errors });
    return;
  }

  const hash = await bcrypt.hash(password, saltRounds);
  // const existingUser = await db.get(
  //   "SELECT * FROM users WHERE email=?;",
  //   email
  // );
  const existingUser: DBUser[] = await db("users")
    .where("email", email)
    .select();
  if (existingUser.length) {
    res.render("register", { errors: ["user already exists"] });
    return;
  }
  // const { lastID } = await db.run(
  //   "INSERT INTO users (name, email, password) VALUES (?, ?, ?);",
  //   name,
  //   email,
  //   hash
  // );
  const insertResult = await db("users").insert({
    name,
    email,
    password: hash
  });
  console.log("insertResult", insertResult);
  const token = uuid();
  // await db.run(
  //   "INSERT INTO tokens (token, user) values (?, ?);",
  //   token,
  //   lastID
  // );
  await db("tokens").insert({
    token,
    user: insertResult[0]
  });
  res.cookie("accessToken", token);
  res.redirect("/");
});

// login
router.get("/login", async (req, res) => {
  if (req.user) {
    res.redirect("/");
    return;
  }

  res.render("login");
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.render("login", { errors: ["missing required parameter"] });
    return;
  }

  // const db = await dbPromise;
  // const user = await db.get("SELECT * FROM users WHERE email=?;", email);
  const user: DBUser[] = await db("users")
    .where({ email })
    .select();
  if (!user.length) {
    res.render("login", { errors: ["user not found"] });
    return;
  }
  const match = await bcrypt.compare(password, user[0].password);
  if (!match) {
    res.render("login", { errors: ["user not found"] });
    return;
  }
  const token = uuid();
  // await db.run(
  //   "INSERT INTO tokens (token, user) values (?, ?);",
  //   token,
  //   user.id
  // );
  await db("tokens").insert({
    token,
    user: user[0].id
  });
  res.cookie("accessToken", token);
  res.redirect("/");
});

// log out
router.get("/logout", async (req, res) => {
  if (!req.user) {
    res.redirect("/");
    return;
  }
  // const db = await dbPromise;
  // await db.run("DELETE FROM tokens WHERE user=?;", req.user.id);
  await db("tokens")
    .where({
      user: req.user.id
    })
    .delete();
  res.clearCookie("accessToken");
  res.redirect("/");
});

export default router;
