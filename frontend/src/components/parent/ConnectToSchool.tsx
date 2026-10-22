import { useState } from "react";
import { sendPhoneOtpApi, verifyPhoneOtpApi } from "../../services/authApi";
import { SchoolIcon } from "../common/Icons";

export default function ConnectToSchool() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSendOtp() {
    if (!phone.trim()) {
      setMessage("Please enter your phone number.");
      return;
    }
    setMessage("");
    try {
      const response = await sendPhoneOtpApi(phone.trim());
      setOtpSent(true);
      setMessage(response.message);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not send the verification code",
      );
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) {
      setMessage("Please enter the OTP.");
      return;
    }
    setMessage("");

    try {
      const response = await verifyPhoneOtpApi(phone.trim(), otp.trim());
      setMessage(response.message);
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not verify the phone number",
      );
    }
  }

  return (
    <section className="card connect-school-card" aria-label="Connect to school">
      <div className="card-title connect-school-title">
        <SchoolIcon className="title-icon" />
        <span>CONNECT TO YOUR SCHOOL</span>
      </div>

      <h2 className="connect-school-heading">Verify your phone number</h2>

      <p className="connect-school-description">
        Verify your registered phone number to find your school records.
      </p>

      <form
        className="connect-school-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSendOtp();
        }}
      >
        <div>
          <label
            htmlFor="parent-phone"
            className="input-label"
          >
            Phone number
          </label>

          <input
            id="parent-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Enter your registered phone number"
            className="text-input"
            required
          />
        </div>

        {!otpSent ? (
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Send OTP
          </button>
        ) : (
          <>
            <div>
              <label
                htmlFor="parent-otp"
                className="input-label"
              >
                Verification code
              </label>

              <input
                id="parent-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="text-input otp-input"
                required
              />
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              className="connect-action-button"
            >
              Verify OTP
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setMessage("");
              }}
              className="secondary-action-button"
            >
              Change phone number
            </button>
          </>
        )}

        {message && (
          <p className="connect-status" role="status" aria-live="polite">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
