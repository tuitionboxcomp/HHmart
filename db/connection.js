import pkg from "pg";
const { Client } = pkg;

const db = new Client({
  connectionString:
    "postgresql://neondb_owner:npg_EBoI1QCU3OPj@ep-misty-flower-ah9wwq8f-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect()
  .then(() => console.log("🌐 Connected to Neon PostgreSQL"))
  .catch((err) => console.error("❌ Neon Connection Error:", err.message));

export default db;
