import React, { useState } from "react";
import "./App.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [url, setUrl] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [validity, setValidity] = useState(30);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!url.trim()) return setError("Please enter a URL");
    if (!isValidUrl(url))
      return setError("Please enter a valid URL (include http:// or https://)");

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/shorturls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl: url.trim(),
          customCode: shortCode.trim() || undefined,
          validityPeriod: parseInt(validity),
        }),
      });

      const data = await response.json();

      if (!response.ok) return setError(data.error || "Failed to shorten URL");

      setResult(data);
      setUrl("");
      setShortCode("");
    } catch (err) {
      setError(
        "Error: Please check if the backend server is running on port 5000"
      );
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => alert("Copied!"));
  };

  const getAnalytics = async (shortUrl) => {
    const code = shortUrl.split("/").pop();
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/shorturls/${code}`);
      const data = await response.json();

      if (!response.ok)
        return setError(data.error || "Failed to fetch analytics");

      setAnalytics({
        originalUrl: data.originalUrl,
        totalClicks: data.clicks,
        uniqueClicks: data.uniqueUsers,
        clickData: data.clickHistory,
        creationDate: new Date(),
        expiryDate: new Date(Date.now() + (data.validityPeriod || 0) * 1000),
      });
    } catch (err) {
      setError("Error fetching analytics");
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header>
          <h1>🔗 URL Shortener</h1>
          <p>Create short links quickly and easily</p>
        </header>

        <main className="main-content">
          <section className="form-section card">
            <h2>Shorten Your URL</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Long URL *</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/very/long/url"
                  required
                />
              </div>

              <div className="form-group">
                <label>Custom Short Code (optional)</label>
                <input
                  type="text"
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value)}
                  placeholder="my-code"
                />
                <small>Leave empty for auto-generated code</small>
              </div>

              <div className="form-group">
                <label>Validity (minutes)</label>
                <input
                  type="number"
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                  min={1}
                  max={43200}
                />
                <small>Default: 30 minutes, Max: 30 days</small>
              </div>

              {error && <div className="error">{error}</div>}

              <button type="submit" disabled={loading} className="btn primary">
                {loading ? "Shortening..." : "Shorten URL"}
              </button>
            </form>

            {result && (
              <div className="result card">
                <h3>✅ URL Shortened Successfully!</h3>
                <div className="result-item">
                  <label>Short URL:</label>
                  <div className="url-result">
                    <input
                      type="text"
                      value={result.shortUrl}
                      readOnly
                      className="short-url-input"
                    />
                    <button
                      onClick={() => copyToClipboard(result.shortUrl)}
                      className="btn small primary"
                    >
                      Copy
                    </button>
                    <a
                      href={result.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn small secondary"
                    >
                      Test
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => getAnalytics(result.shortUrl)}
                  className="btn analytics-btn"
                >
                  📊 View Analytics
                </button>
              </div>
            )}
          </section>

          {analytics && (
            <section className="analytics-section card">
              <h2>📊 Analytics</h2>
              <div className="analytics-grid">
                <div className="stat-card">
                  <h3>Total Clicks</h3>
                  <p className="stat-number">{analytics.totalClicks}</p>
                </div>
                <div className="stat-card">
                  <h3>Unique Visitors</h3>
                  <p className="stat-number">{analytics.uniqueClicks}</p>
                </div>
              </div>

              <div className="analytics-details">
                <p>
                  <strong>Original URL:</strong> {analytics.originalUrl}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {analytics.creationDate.toLocaleString()}
                </p>
                <p>
                  <strong>Expires:</strong>{" "}
                  {analytics.expiryDate.toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong>
                  <span
                    className={
                      new Date() > analytics.expiryDate ? "expired" : "active"
                    }
                  >
                    {new Date() > analytics.expiryDate ? " Expired" : " Active"}
                  </span>
                </p>
              </div>

              {analytics.clickData.length > 0 && (
                <div className="click-history">
                  <h4>Recent Clicks</h4>
                  {analytics.clickData.slice(0, 5).map((click, index) => (
                    <div key={index} className="click-item">
                      <div className="click-time">
                        {new Date(click.timestamp).toLocaleString()}
                      </div>
                      <div className="click-source">
                        Source: {click.source || "Direct"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        <footer>
          <p>URL Shortener Microservice - Built with Express.js & React</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
