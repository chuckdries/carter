import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import * as yup from "yup";
import uuid from "uuid/v4";

import { DBUser } from "./User";
import db from "./db";

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

  const users: DBUser[] = await db("tokens")
    .leftJoin("users", "tokens.user", "users.id")
    .where({
      token: accessToken
    })
    .select("users.email", "users.name", "users.id");

  if (!users.length) {
    next();
    return;
  }

  req.user = users[0];
  next();
};

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

  const existingUsers: DBUser[] = await db("users")
    .where("email", email)
    .select();
  if (existingUsers.length) {
    res.render("register", { errors: ["user already exists"] });
    return;
  }

  const insertResult: number[] = await db("users").insert(
    {
      name,
      email,
      password: hash
    },
    ["id"]
  );

  const token = uuid();
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

  const users: DBUser[] = await db("users")
    .where({ email })
    .select();
  if (!users.length) {
    res.render("login", { errors: ["user not found"] });
    return;
  }

  const match = await bcrypt.compare(password, users[0].password);
  if (!match) {
    res.render("login", { errors: ["user not found"] });
    return;
  }

  const token = uuid();
  await db("tokens").insert({
    token,
    user: users[0].id
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
  await db("tokens")
    .where({
      user: req.user.id
    })
    .delete();
  res.clearCookie("accessToken");
  res.redirect("/");
});

export default router;
