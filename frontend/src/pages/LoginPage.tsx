import React, { useState } from 'react';
import { ApiError } from '../services/apiClient';
import { registerApi, verifyOtpApi } from '../services/authApi';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginPage({ onLogin }: LoginPageProps) {

  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("parent"); // For registration only
  const [otpCode, setOtpCode] = useState("");
  
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
        if (!isVerifyingOtp) {
          // STEP 1: Registration already creates the pending record and sends the OTP.
          await registerApi(email, password, role);
          setIsVerifyingOtp(true);
          setSuccessMsg(`Account created! A 6-digit verification code was sent to ${email}`);
        } else {
          // STEP 2: Verify OTP code + Auto-login
          await verifyOtpApi(email, otpCode);
          setSuccessMsg("Email verified! Logging you in...");
          await onLogin(email, password);
        }
      } else {
        // Standard Login Mode
        await onLogin(email, password);
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

  const handleResendOtp = async () => {
    setErrorMsg("Resending an OTP is not available yet. Please wait for the current code to expire or edit the email address.");
  };

  return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          {!isRegistering ? "FeeEase Login" : (!isVerifyingOtp ? "Create Account" : "Verify Your Email")}
        </h2>
        
        {/* Status banners for errors and successes */}
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
          
          {/* Email input (locked when verifying OTP) */}
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-input"
              required
              disabled={isVerifyingOtp}
            />
          </div>
          
          {/* Password input (hidden when verifying OTP) */}
          {!isVerifyingOtp && (
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
          )}

          {/* Account Role (only during initial registration) */}
          {isRegistering && !isVerifyingOtp && (
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

          {/* 6-Digit OTP Code Input */}
          {isRegistering && isVerifyingOtp && (
            <div className="input-group">
              <label className="input-label">6-Digit Verification Code</label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="e.g. 123456"
                className="text-input"
                style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '4px' }}
                required
                autoFocus
              />
            </div>
          )}

          {/* Action Button */}
          <button type="submit" disabled={isLoading} style={{ marginTop: '1rem' }}>
            {isLoading ? "Please wait..." : (
              !isRegistering ? "Login" :
              !isVerifyingOtp ? "Register & Send Verification Code" : "Verify & Enter FeeEase"
            )}
          </button>

          {/* Resend and Back controls during OTP verification */}
          {isRegistering && isVerifyingOtp && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="mini-btn" 
                onClick={handleResendOtp}
                disabled={isLoading}
              >
                Resend Code
              </button>
              <button 
                type="button" 
                className="mini-btn" 
                onClick={() => { setIsVerifyingOtp(false); setOtpCode(""); }}
              >
                Edit Email
              </button>
            </div>
          )}
        </form>

        {/* Toggle between Login and Register */}
        {!isVerifyingOtp && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              className="mini-btn"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg("");
                setSuccessMsg("");
              }}
            >
              {isRegistering ? "Already have an account? Log in" : "Need an account? Register"}
            </button>
          </div>
        )}

        {/* DEV ONLY: Quick Fill (Login Mode) */}
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
