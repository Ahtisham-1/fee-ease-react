import { ApiError, requestJson, type ApiClient } from "./apiClient.ts";
import { isValidAuthTokenFormat } from "./tokenStorage.ts";

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface AuthMessageResponse {
  message: string;
  Parent_id?: number;
}

type AuthClient = Pick<ApiClient, "requestJson">;

const defaultAuthClient: AuthClient = {
  requestJson,
};

function normalizeEmailInput(email: string): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function createAuthApi(client: AuthClient = defaultAuthClient) {
  async function loginApi(
    email: string,
    password: string,
  ): Promise<LoginResponse> {
    const normalizedEmail = normalizeEmailInput(email);
    if (!normalizedEmail || typeof password !== "string" || !password) {
      throw new ApiError("Email and password are required.", 400, "http");
    }

    const formData = new URLSearchParams();
    formData.append("username", normalizedEmail);
    formData.append("password", password);

    const result = await client.requestJson<unknown>("/api/auth/login", {
      method: "POST",
      body: formData,
      skipAuth: true,
    });

    if (
      !result ||
      typeof result !== "object" ||
      typeof (result as { access_token?: unknown }).access_token !== "string"
    ) {
      throw new ApiError(
        "Invalid login response from server.",
        0,
        "invalid_response",
      );
    }

    const token = (result as { access_token: string }).access_token.trim();
    if (!token || !isValidAuthTokenFormat(token)) {
      throw new ApiError(
        "Invalid login response from server.",
        0,
        "invalid_response",
      );
    }

    const tokenType =
      typeof (result as { token_type?: unknown }).token_type === "string"
        ? (result as { token_type: string }).token_type
        : "bearer";

    return { access_token: token, token_type: tokenType };
  }

  async function registerApi(
    email: string,
    password: string,
  ): Promise<AuthMessageResponse> {
    const normalizedEmail = normalizeEmailInput(email);
    if (!normalizedEmail || typeof password !== "string" || !password) {
      throw new ApiError("Email and password are required.", 400, "http");
    }

    // Mobile registration always forces role="parent" so admin accounts cannot be created here.
    return client.requestJson<AuthMessageResponse>("/api/auth/register", {
      method: "POST",
      body: { email: normalizedEmail, password, role: "parent" },
      skipAuth: true,
    });
  }

  async function verifyOtpApi(
    email: string,
    otp_code: string,
  ): Promise<AuthMessageResponse> {
    const normalizedEmail = normalizeEmailInput(email);
    const trimmedCode = typeof otp_code === "string" ? otp_code.trim() : "";
    if (!normalizedEmail || !trimmedCode) {
      throw new ApiError(
        "Email and verification code are required.",
        400,
        "http",
      );
    }

    return client.requestJson<AuthMessageResponse>("/api/auth/verify_otp", {
      method: "POST",
      body: { email: normalizedEmail, otp_code: trimmedCode },
      skipAuth: true,
    });
  }

  async function sendPhoneOtpApi(phone: string): Promise<AuthMessageResponse> {
    const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
    if (!trimmedPhone) {
      throw new ApiError("Phone number is required.", 400, "http");
    }

    return client.requestJson<AuthMessageResponse>("/api/auth/phone/send-otp", {
      method: "POST",
      body: { phone: trimmedPhone },
    });
  }

  async function verifyPhoneOtpApi(
    phone: string,
    otp_code: string,
  ): Promise<AuthMessageResponse> {
    const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
    const trimmedCode = typeof otp_code === "string" ? otp_code.trim() : "";
    if (!trimmedPhone || !trimmedCode) {
      throw new ApiError(
        "Phone number and verification code are required.",
        400,
        "http",
      );
    }

    return client.requestJson<AuthMessageResponse>(
      "/api/auth/phone/verify-otp",
      {
        method: "POST",
        body: { phone: trimmedPhone, otp_code: trimmedCode },
      },
    );
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
