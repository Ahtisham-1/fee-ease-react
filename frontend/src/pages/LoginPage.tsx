import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/apiClient';
import { registerApi } from '../services/authApi';


export function LoginPage() {
  const { login } = useAuth();


  const [isRegistering, setIsRegistering] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("parent"); // For registration only
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Register Mode
        await registerApi(email, password, role);
        setSuccessMsg("Account created! Logging you in...");
        // Auto-login right after registering
        await login(email, password);
      } else {
        // Login Mode
        await login(email, password);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          {isRegistering ? "Create Account" : "FeeEase Login"}
        </h2>
        
        {/* Using your custom status banners for errors! */}
        {errorMsg && (
          <div className="status-banner warning">
            {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div className="status-banner success">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-input"
              required
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-input"
              required
            />
          </div>

          {isRegistering && (
            <div className="input-group">
              <label className="input-label">Account Type</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="custom-select"
              >
                <option value="parent">Parent</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          )}

          <button type="submit" disabled={isLoading} style={{ marginTop: '1rem' }}>
            {isLoading ? "Please wait..." : (isRegistering ? "Register & Login" : "Login")}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            type="button" 
            className="mini-btn"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg("");
            }}
          >
            {isRegistering ? "Already have an account? Log in" : "Need an account? Register"}
          </button>
        </div>

        {/* DEV ONLY: Quick Fill */}
        {!isRegistering && (
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
            <p className="empty-message" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Dev Quick Fill (Testing Only)</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => { setEmail("admin@feeease.com"); setPassword("admin123"); }}
                className="mini-btn"
                style={{ flex: 1 }}
              >
                Fill Admin
              </button>
              <button
                type="button"
                onClick={() => { setEmail("parent@feeease.com"); setPassword("parent123"); }}
                className="mini-btn"
                style={{ flex: 1 }}
              >
                Fill Parent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
