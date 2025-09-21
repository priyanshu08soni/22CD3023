// backend/logger.js
require("dotenv").config();
const fetch = global.fetch || require("node-fetch");

const AUTH_URL = process.env.AUTH_URL;
const LOG_API_URL = process.env.LOG_API_URL;

// Credentials
const AUTH_BODY = {
  email: "22cd3023@rgipt.ac.in",
  name: "Priyanshu Soni",
  rollNo: "22CD3023",
  accessCode: "arzUcG",
  clientID: "7a729dae-70df-4e78-8a27-b8ab33ff9a03",
  clientSecret: "RwdJQMgrZDJAWDcd",
};

// Package rules
const backendPackages = ["cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service"];
const frontendPackages = ["api", "component", "hook", "page", "state", "style"];
const sharedPackages = ["auth", "config", "middleware", "utils"];

function validatePackage(stack, logPackage) {
  if (stack === "backend" && !backendPackages.includes(logPackage) && !sharedPackages.includes(logPackage)) {
    throw new Error(`Invalid backend package: ${logPackage}`);
  }
  if (stack === "frontend" && !frontendPackages.includes(logPackage) && !sharedPackages.includes(logPackage)) {
    throw new Error(`Invalid frontend package: ${logPackage}`);
  }
}

// Get fresh token
async function getAuthToken() {
  try {
    const response = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(AUTH_BODY),
    });

    if (!response.ok) throw new Error(`Auth failed: ${response.statusText}`);
    const data = await response.json();
    return data.token;
  } catch (err) {
    console.error("Failed to fetch auth token:", err.message);
    return null;
  }
}

// Main logging function
async function Log(stack, level, logPackage, message) {
  try {
    validatePackage(stack, logPackage);

    const token = await getAuthToken();
    if (!token) return;

    const logData = {
      stack,
      level: level.toLowerCase(),
      package: logPackage,
      message,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(LOG_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(logData),
    });

    if (!response.ok) console.error("Failed to send log:", response.statusText);
  } catch (err) {
    console.error("Logger error:", err.message);
  }
}

module.exports = { Log };
