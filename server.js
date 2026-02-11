require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./src/routes/authRoutes");
const groupRoutes = require("./src/routes/groupRoutes");
const rbacRoutes = require("./src/routes/rbacRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const profileRoutes = require("./src/routes/profileRoutes");

const app = express();

/* -------------------- MongoDB -------------------- */
const mongoUri =
  process.env.MONGO_DB_CONNECTION_URL ||
  process.env.MONGO_DB_CONNECTION_URI;

if (!mongoUri) {
  console.error(
    "❌ Missing MongoDB connection string. Set MONGO_DB_CONNECTION_URL or MONGO_DB_CONNECTION_URI in .env"
  );
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((error) => {
    console.error("❌ Could not connect to MongoDB:", error);
    process.exit(1);
  });

/* -------------------- CORS -------------------- */
const normalizeOrigin = (value) => {
  const trimmed = (value || "").trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(",") : []),
]
  .map(normalizeOrigin)
  .filter(Boolean);

const isProd = process.env.NODE_ENV === "production";

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow localhost in development
    if (!isProd && /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

/* -------------------- Middleware -------------------- */
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

/* -------------------- Routes -------------------- */
app.use("/auth", authRoutes);

app.use("/group", groupRoutes);
app.use("/groups", groupRoutes);

app.use("/users", rbacRoutes);

/* 💳 Razorpay Payments */
app.use("/api/payments", paymentRoutes);

/* 👤 Profile */
app.use("/profile", profileRoutes);

/* -------------------- Health Check -------------------- */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is healthy",
  });
});

/* -------------------- Server -------------------- */
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
});
