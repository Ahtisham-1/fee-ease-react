import { useState } from "react";
import { getToken, setAuthToken, clearAuthToken } from "../services/apiClient";
import { loginApi } from "../services/authApi";


function getRoleFromToken(token: string | null): string {
  if (!token) return "parent";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || "parent";
  } catch {
    return "parent";
  }
}


export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!getToken());


  const [userRole, setUserRole] = useState<string>(
    getRoleFromToken(getToken()),
  );

  const login = async (email: string, password: string) => {
    const response = await loginApi(email, password);
    setAuthToken(response.access_token);
    setIsLoggedIn(true);
 
    setUserRole(getRoleFromToken(response.access_token));
  };

  const logout = () => {
    clearAuthToken();
    setIsLoggedIn(false);
    setUserRole("parent");
  };

  return {
    isLoggedIn,
    userRole,
    login,
    logout,
  };
}
