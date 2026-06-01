import React, { useState } from 'react';
import './Login.css';

const BASE_URL = (import.meta.env.VITE_API_URL || "https://agentic-ai-1-f6cz.onrender.com/").replace(/\/$/, "");

const Login = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      // ✅ Updated endpoint
      const endpoint = isSignUp
        ? `${BASE_URL}/api/signup`
        : `${BASE_URL}/api/login`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error("Raw response (not JSON):", text);
        throw new Error(`Invalid response format from server (Status ${response.status})`);
      }

      if (response.ok) {
        if (isSignUp) {
          setSuccessMsg('Account created successfully! Logging you in...');
          setTimeout(() => onLogin(data.user), 1500);
        } else {
          onLogin(data.user);
        }
      } else {
        setError(data.detail || (isSignUp ? 'Signup failed.' : 'Login failed.'));
      }
    } catch (err) {
      console.error("Backend not reachable:", err);
      setError("Could not connect to authentication server.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="login-container">
      <div className="login-box glass-panel animate-fade-in">
        <div className="login-header">
          <div className="logo-icon">🤖</div>
          <h2>Agentic AI System</h2>
          <p>{isSignUp ? 'Create an account to get started' : 'Login to access the orchestrator'}</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMsg && (
          <div
            className="error-message"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--success-color)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            type="button"
            onClick={toggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-color)',
              fontWeight: '600',
              marginLeft: '0.5rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </div>

      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
    </div>
  );
};

export default Login;