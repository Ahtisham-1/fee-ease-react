import { API_BASE, ApiError } from "./apiClient";

// We define the shape of the data the backend gives us when we log in successfully.
export interface LoginResponse {
  access_token: string;
  token_type: string;
}
 
export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    body: formData,
  }); 

  if (!response.ok) {
    throw new ApiError("Invalid email or password", response.status);
  }

  return response.json();
}

/**
 * WHAT: Sends the user's details to the backend to create a brand new account.
 * WHY: Users cannot log in if they don't exist in the database!
 * HOW: It hits the /register route using standard JSON.
 */
export async function registerApi(email: string, password: string, role: string = "parent"): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, role }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(errorData.detail || "Registration failed. Email might already exist.", response.status);
  }
}
