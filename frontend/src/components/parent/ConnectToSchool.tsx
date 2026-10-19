import { useState } from "react";
import { sendPhoneOtpApi, verifyPhoneOtpApi } from "../../services/authApi";

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
    // TODO: Call the backend to send the OTP.
    // setOtpSent(true);
    // setMessage("OTP sending will be connected to the backend next.");
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
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not verify the phone number",
      );
    }
    // TODO: Verify the OTP with the backend.
    // setMessage("OTP verification will be connected to the backend next.");
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">
        Connect to Your School
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Verify your registered phone number to find your school records.
      </p>

      <form
        className="mt-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSendOtp();
        }}
      >
        <div>
          <label
            htmlFor="parent-phone"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Phone number
          </label>

          <input
            id="parent-phone"
            type="number"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Enter your registered phone number"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="mb-1 block text-sm font-medium text-gray-700"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
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
              className="w-full text-sm text-blue-600 hover:underline"
            >
              Change phone number
            </button>
          </>
        )}

        {message && (
          <p className="text-sm text-gray-600" role="status" aria-live="polite">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
