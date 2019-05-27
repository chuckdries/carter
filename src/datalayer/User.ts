import db from "./db";

export interface User {
  name: string;
  email: string;
  id: number;
}

export interface DBUser extends User {
  password: string;
}

export const getByAccessToken = async (
  accessToken: string
): Promise<User | null> => {
  const foundUsers: User[] = await db("tokens")
    .leftJoin("users", "tokens.user", "users.id")
    .where({
      token: accessToken
    })
    .limit(1)
    .select("users.email", "users.name", "users.id");
  return foundUsers[0] || null;
};
