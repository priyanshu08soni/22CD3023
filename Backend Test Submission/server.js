// backend/server.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Log } = require("../Logging Middleware/logger");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN }));
app.use(bodyParser.json());

const urlDatabase = new Map();

// Dynamic UUID import
let uuidv4;
(async () => { uuidv4 = (await import("uuid")).v4; })();

// Health check
app.get("/health", async (req, res) => {
  await Log("backend", "info", "route", "Health check OK");
  res.json({ status: "OK" });
});

// Create short URL
app.post("/shorturls", async (req, res) => {
  try {
    const { originalUrl, customCode, validityPeriod } = req.body;
    if (!uuidv4) uuidv4 = (await import("uuid")).v4;
    const shortCode = customCode || uuidv4().slice(0, 8);

    urlDatabase.set(shortCode, {
      originalUrl,
      createdAt: Date.now(),
      validityPeriod: validityPeriod || 3600,
      clicks: 0,
      uniqueIps: new Set(),
      clickHistory: [],
    });

    await Log("backend", "info", "route", `Short URL created: ${shortCode}`);
    res.status(201).json({ shortUrl: `http://localhost:${PORT}/${shortCode}` });
  } catch (err) {
    await Log("backend", "error", "controller", `Error creating short URL: ${err.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Redirect
app.get("/:shortCode", async (req, res) => {
  const { shortCode } = req.params;
  const entry = urlDatabase.get(shortCode);
  if (!entry) return res.status(404).json({ error: "Short URL not found" });

  if (Date.now() > entry.createdAt + entry.validityPeriod * 1000) {
    urlDatabase.delete(shortCode);
    return res.status(410).json({ error: "Short URL expired" });
  }

  entry.clicks += 1;
  const ip = req.ip;
  entry.uniqueIps.add(ip);
  entry.clickHistory.push({ ip, timestamp: Date.now() });

  res.redirect(entry.originalUrl);
});

// Analytics
app.get("/shorturls/:shortCode", (req, res) => {
  const { shortCode } = req.params;
  const entry = urlDatabase.get(shortCode);
  if (!entry) return res.status(404).json({ error: "Short URL not found" });

  res.json({
    originalUrl: entry.originalUrl,
    clicks: entry.clicks,
    uniqueUsers: entry.uniqueIps.size,
    clickHistory: entry.clickHistory,
  });
});

// Accept frontend logs
app.post("/log", async (req, res) => {
  try {
    const { level, package: logPackage, message } = req.body;
    await Log("frontend", level, logPackage, message);
    res.status(200).json({ status: "logged" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
