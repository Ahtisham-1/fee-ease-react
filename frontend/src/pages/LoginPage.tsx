import React, { useEffect, useState } from 'react';
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
  const [otpCode, setOtpCode] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setCooldownSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      if (isRegistering) {
        if (!isVerifyingOtp) {
          if (
            cooldownSeconds > 0 &&
            email.trim().toLowerCase() === otpEmail
          ) {
            setErrorMsg(
              `Please wait ${cooldownSeconds} seconds before requesting another OTP for this email.`,
            );
            return;
          }

          // STEP 1: Registration already creates the pending record and sends the OTP.
          await registerApi(email, password);
          setIsVerifyingOtp(true);
          setOtpEmail(email.trim().toLowerCase());
          setCooldownSeconds(60);
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
    if (cooldownSeconds > 0) return;

    setErrorMsg("");
    setIsLoading(true);
    try {
      await registerApi(email, password);
      setOtpEmail(email.trim().toLowerCase());
      setCooldownSeconds(60);
      setSuccessMsg("A new verification code was sent to your email.");
    } catch (error) {
      setErrorMsg(error instanceof ApiError ? error.message : "Could not resend the verification code");
    } finally {
      setIsLoading(false);
    }
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
              <p className="otp-cooldown-message" role="status" aria-live="polite">
                {cooldownSeconds > 0
                  ? `You can request another OTP after ${cooldownSeconds} seconds.`
                  : "You can request another OTP now."}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button 
                type="button" 
                className="mini-btn" 
                onClick={handleResendOtp}
                disabled={isLoading || cooldownSeconds > 0}
              >
                {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : "Resend Code"}
              </button>
              <button 
                type="button" 
                className="mini-btn" 
                onClick={() => { setIsVerifyingOtp(false); setOtpCode(""); }}
              >
                Edit Email
              </button>
              </div>
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

      </div>
    </div>
  );
}
