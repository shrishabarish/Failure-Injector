const { Pool } = require("pg");

let pool = null;

function getPostgresPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432", 10),
      database: process.env.DB_NAME || "codereview",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgrespassword",
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client:", err.message);
    });
  }
  return pool;
}

module.exports = { getPostgresPool };
