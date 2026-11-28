import { expectRecord, hasSafeOwnKey, normalizeIndianPhone } from "../utils/validation";
import { ApiError, requestJson, type ApiClient } from "./apiClient";
import { isValidAuthTokenFormat } from "./tokenStorage";

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface AuthMessageResponse {
  message: string;
  Parent_id?: number;
}

export interface AuthApi {
  loginApi(email: string, password: string): Promise<LoginResponse>;
  registerApi(email: string, password: string): Promise<AuthMessageResponse>;
  verifyOtpApi(email: string, otp_code: string): Promise<AuthMessageResponse>;
  sendPhoneOtpApi(phone: string): Promise<AuthMessageResponse>;
  verifyPhoneOtpApi(phone: string, otp_code: string): Promise<AuthMessageResponse>;
}

type AuthClient = Pick<ApiClient, "requestJson">;

const defaultAuthClient: AuthClient = {
  requestJson,
};

function normalizeEmailInput(email: string): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function parseAuthMessageResponse(raw: unknown): AuthMessageResponse {
  const record = expectRecord(raw, "auth");
  if (!hasSafeOwnKey(record, "message") || typeof record.message !== "string") {
    throw new ApiError(
      "Invalid auth response from server.",
      0,
      "invalid_response",
    );
  }

  const parsed: AuthMessageResponse = { message: record.message };
  if (hasSafeOwnKey(record, "Parent_id") && record.Parent_id !== undefined) {
    if (
      typeof record.Parent_id !== "number" ||
      !Number.isSafeInteger(record.Parent_id) ||
      record.Parent_id <= 0
    ) {
      throw new ApiError(
        "Invalid auth response from server.",
        0,
        "invalid_response",
      );
    }
    parsed.Parent_id = record.Parent_id;
  }
  return parsed;
}

export function createAuthApi(client: AuthClient = defaultAuthClient): AuthApi {
  async function loginApi(
    email: string,
    password: string,
  ): Promise<LoginResponse> {
    const normalizedEmail = normalizeEmailInput(email);
    if (!normalizedEmail || typeof password !== "string" || !password.trim()) {
      throw new ApiError(
        "Email and password are required.",
        400,
        "validation",
      );
    }

    const formData = new URLSearchParams();
    formData.append("username", normalizedEmail);
    formData.append("password", password);

    const result = await client.requestJson<unknown>("/api/auth/login", {
      method: "POST",
      body: formData,
      skipAuth: true,
    });

    const record = expectRecord(result, "login");
    if (
      !hasSafeOwnKey(record, "access_token") ||
      typeof record.access_token !== "string"
    ) {
      throw new ApiError(
        "Invalid login response from server.",
        0,
        "invalid_response",
      );
    }

    const token = record.access_token.trim();
    if (!token || !isValidAuthTokenFormat(token)) {
      throw new ApiError(
        "Invalid login response from server.",
        0,
        "invalid_response",
      );
    }

    if (hasSafeOwnKey(record, "token_type") && record.token_type !== undefined) {
      if (
        typeof record.token_type !== "string" ||
        record.token_type.trim().toLowerCase() !== "bearer"
      ) {
        throw new ApiError(
          "Invalid login response from server.",
          0,
          "invalid_response",
        );
      }
    }

    return { access_token: token, token_type: "bearer" };
  }

  async function registerApi(
    email: string,
    password: string,
  ): Promise<AuthMessageResponse> {
    const normalizedEmail = normalizeEmailInput(email);
    if (!normalizedEmail || typeof password !== "string" || !password.trim()) {
      throw new ApiError(
        "Email and password are required.",
        400,
        "validation",
      );
    }

    // Mobile registration always forces role="parent" so admin accounts cannot be created here.
    const raw = await client.requestJson<unknown>("/api/auth/register", {
      method: "POST",
      body: { email: normalizedEmail, password, role: "parent" },
      skipAuth: true,
    });
    return parseAuthMessageResponse(raw);
  }

  async function verifyOtpApi(
    email: string,
    otp_code: string,
  ): Promise<AuthMessageResponse> {
    const normalizedEmail = normalizeEmailInput(email);
    const trimmedCode = typeof otp_code === "string" ? otp_code.trim() : "";
    if (!normalizedEmail || !/^\d{6}$/.test(trimmedCode)) {
      throw new ApiError(
        "Email and 6-digit verification code are required.",
        400,
        "validation",
      );
    }

    const raw = await client.requestJson<unknown>("/api/auth/verify_otp", {
      method: "POST",
      body: { email: normalizedEmail, otp_code: trimmedCode },
      skipAuth: true,
    });
    return parseAuthMessageResponse(raw);
  }

  async function sendPhoneOtpApi(phone: string): Promise<AuthMessageResponse> {
    const normalizedPhone = normalizeIndianPhone(phone);
    const raw = await client.requestJson<unknown>("/api/auth/phone/send-otp", {
      method: "POST",
      body: { phone: normalizedPhone },
    });
    return parseAuthMessageResponse(raw);
  }

  async function verifyPhoneOtpApi(
    phone: string,
    otp_code: string,
  ): Promise<AuthMessageResponse> {
    const normalizedPhone = normalizeIndianPhone(phone);
    const trimmedCode = typeof otp_code === "string" ? otp_code.trim() : "";
    if (!/^\d{6}$/.test(trimmedCode)) {
      throw new ApiError(
        "Valid 6-digit verification code is required.",
        400,
        "validation",
      );
    }

    const raw = await client.requestJson<unknown>(
      "/api/auth/phone/verify-otp",
      {
        method: "POST",
        body: { phone: normalizedPhone, otp_code: trimmedCode },
      },
    );
    return parseAuthMessageResponse(raw);
  }

  return {
    loginApi,
    registerApi,
    verifyOtpApi,
    sendPhoneOtpApi,
    verifyPhoneOtpApi,
  };
}

const defaultAuthApi = createAuthApi();

export const loginApi = defaultAuthApi.loginApi;
export const registerApi = defaultAuthApi.registerApi;
export const verifyOtpApi = defaultAuthApi.verifyOtpApi;
export const sendPhoneOtpApi = defaultAuthApi.sendPhoneOtpApi;
export const verifyPhoneOtpApi = defaultAuthApi.verifyPhoneOtpApi;
