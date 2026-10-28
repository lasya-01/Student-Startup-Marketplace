require("dotenv").config();

const express = require("express");
const cors = require("cors");

const listingsRouter = require("./routes/listings");
const inquiriesRouter = require("./routes/inquiries");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

if (
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error("Missing Supabase settings in .env");
  process.exit(1);
}

const allowedOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(",").map(x => x.trim())
  : true;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "20kb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "UNI SPARK API",
    status: "running"
  });
});

app.use("/api/listings", listingsRouter);
app.use("/api/inquiries", inquiriesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.status && err.status < 500
      ? err.message
      : "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`UNI SPARK API running on http://localhost:${PORT}`);
});