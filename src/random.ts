// // scratchpad
// import knex from "knex";
// const db = knex({
//   client: "sqlite3",
//   connection: {
//     filename: "./database.sqlite"
//   }
// });
// const initDb = () => {
//   db.schema
//     .createTable("users", function(table) {
//       table.increments("id").primary();
//       table.string("email").notNullable();
//       table.string("name").notNullable();
//       table.string("password").notNullable();
//     })
//     .createTable("messages", function(table) {
//       table.increments("id").primary();
//       table.integer("author").notNullable();
//       table.foreign("author").references("users.id");
//       table.string("message").notNullable();
//     })
//     .createTable("tokens", function(table) {
//       table.string("token").primary();
//       table.integer("user").notNullable();
//       table.foreign("user").references("users.id");
//     });
// };
