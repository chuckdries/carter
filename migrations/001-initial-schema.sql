-- Up
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email STRING,
  name STRING,
  password STRING
);
CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  author INTEGER,
  message STRING,
  FOREIGN KEY(author) REFERENCES users(id)
);
CREATE TABLE tokens (
  token STRING PRIMARY KEY,
  user INTEGER,
  FOREIGN KEY(user) REFERENCES users(id)
)

-- Down
DROP TABLE users;
DROP TABLE messages;
DROP TABLE tokens;
