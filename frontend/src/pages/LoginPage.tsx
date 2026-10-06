import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";

export function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      await login(email, password);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Something went wrong");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          FeeEase Login
        </h2>

        {/* Error Message Box */}
        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        {/* The Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded p-2 text-black"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded p-2 text-black"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 cursor-pointer"
          >
            Login
          </button>
        </form>

        {/* DEV ONLY: Quick Fill Buttons to save us time during testing */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2 text-center">
            Dev Quick Fill (Testing Only)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEmail("admin@feeease.com");
                setPassword("admin123");
              }}
              className="flex-1 bg-gray-200 text-gray-700 text-xs p-1 rounded hover:bg-gray-300 cursor-pointer"
            >
              Fill Admin
            </button>
            <button
              onClick={() => {
                setEmail("parent@feeease.com");
                setPassword("parent123");
              }}
              className="flex-1 bg-gray-200 text-gray-700 text-xs p-1 rounded hover:bg-gray-300 cursor-pointer"
            >
              Fill Parent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
