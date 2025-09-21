import React, { useState } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [url, setUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [validity, setValidity] = useState(30);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);

  // Helper to log frontend actions
  const logFrontendAction = async (level, logPackage, message) => {
    try {
      await fetch(`${API_BASE_URL}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, package: logPackage, message }),
      });
    } catch (err) {
      console.error('Logging failed:', err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (include http:// or https://)');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/shorturls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: url.trim(),
          customCode: shortCode.trim() || undefined,
          validityPeriod: parseInt(validity),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to shorten URL');
        return;
      }

      setResult(data);
      setUrl('');
      setShortCode('');
      logFrontendAction('info', 'api', `Shortened URL: ${data.shortUrl}`);
    } catch (err) {
      setError('Error: Please check if the backend server is running on port 5000');
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
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Copied to clipboard!');
        logFrontendAction('info', 'component', `Copied short URL: ${text}`);
      })
      .catch(() => alert('Failed to copy'));
  };

  const getAnalytics = async (shortLink) => {
    const shortCode = shortLink.split('/').pop();
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/shorturls/${shortCode}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch analytics');
        return;
      }

      setAnalytics(data);
      logFrontendAction('info', 'api', `Fetched analytics for short URL: ${shortLink}`);
    } catch (err) {
      setError('Error fetching analytics');
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header>
          <h1>🔗 URL Shortener</h1>
          <p>Create short links quickly and easily</p>
        </header>

        <div className="main-content">
          <div className="form-section">
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
                  minLength={3}
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
                <small>Default: 30 minutes, Max: 30 days (43200 minutes)</small>
              </div>

              {error && <div className="error">{error}</div>}

              <button type="submit" disabled={loading} className="shorten-btn">
                {loading ? 'Shortening...' : 'Shorten URL'}
              </button>
            </form>

            {result && (
              <div className="result">
                <h3>✅ URL Shortened Successfully!</h3>
                <div className="result-item">
                  <label>Short URL:</label>
                  <div className="url-result">
                    <input
                      type="text"
                      value={result.shortUrl || result.shortUrl}
                      readOnly
                      className="short-url-input"
                    />
                    <button
                      onClick={() => copyToClipboard(result.shortUrl)}
                      className="copy-btn"
                    >
                      Copy
                    </button>
                    <a
                      href={result.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="test-btn"
                      onClick={() => logFrontendAction('info', 'component', `Tested short URL: ${result.shortUrl}`)}
                    >
                      Test
                    </a>
                  </div>
                </div>
                <div className="result-item">
                  <label>Expires:</label>
                  <span>{new Date(result.expiry).toLocaleString()}</span>
                </div>
                <button
                  onClick={() => getAnalytics(result.shortUrl)}
                  className="analytics-btn"
                >
                  📊 View Analytics
                </button>
              </div>
            )}
          </div>

          {analytics && (
            <div className="analytics-section">
              <h2>📊 Analytics</h2>
              <div className="analytics-grid">
                <div className="stat-card">
                  <h3>Total Clicks</h3>
                  <div className="stat-number">{analytics.clicks}</div>
                </div>
                <div className="stat-card">
                  <h3>Unique Visitors</h3>
                  <div className="stat-number">{analytics.uniqueUsers}</div>
                </div>
              </div>

              <div className="analytics-details">
                <h4>URL Details</h4>
                <p><strong>Original URL:</strong> {analytics.originalUrl}</p>
                <p><strong>Created:</strong> {new Date(analytics.createdAt).toLocaleString()}</p>
                <p><strong>Expires:</strong> {new Date(analytics.createdAt + analytics.validityPeriod * 1000).toLocaleString()}</p>
                <p><strong>Status:</strong> 
                  <span className={Date.now() > analytics.createdAt + analytics.validityPeriod * 1000 ? 'expired' : 'active'}>
                    {Date.now() > analytics.createdAt + analytics.validityPeriod * 1000 ? ' Expired' : ' Active'}
                  </span>
                </p>
              </div>

              {analytics.clickHistory && analytics.clickHistory.length > 0 && (
                <div className="click-history">
                  <h4>Recent Clicks</h4>
                  <div className="click-list">
                    {analytics.clickHistory.slice(0, 5).map((click, index) => (
                      <div key={index} className="click-item">
                        <div className="click-time">
                          {new Date(click.timestamp).toLocaleString()}
                        </div>
                        <div className="click-source">
                          Source: {click.ip || 'Direct'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <footer>
          <p>URL Shortener Microservice - Built with Express.js & React</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
