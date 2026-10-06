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
