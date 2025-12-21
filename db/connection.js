import pkg from "pg";
const { Pool } = pkg;

// ✔ Neon-safe connection pool
const db = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_EBoI1QCU3OPj@ep-misty-flower-ah9wwq8f-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require",

  ssl: {
    rejectUnauthorized: false,
  },

  max: 20,                 // ✔ up to 20 connections
  idleTimeoutMillis: 30000, // ✔ close idle clients but keep pool alive
  connectionTimeoutMillis: 5000,
});

// ✔ Prevent crashes when Neon disconnects
db.on("error", (err) => {
  console.error("❌ PG Pool Error (Recovered):", err.message);
});

export default db;
