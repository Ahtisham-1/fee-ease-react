import { useState } from "react";
import { getToken, setAuthToken, clearAuthToken } from "../services/apiClient";
import { loginApi } from "../services/authApi";

/**
 * WHAT: A custom React Hook that manages the user's login state for the UI.
 * WHY: The `apiClient` knows how to save a token, but visual React components (like a Navbar or a Login Screen) 
 * don't automatically re-draw themselves when a token is just saved to localStorage. This hook acts as a bridge, 
 * giving React a state variable (`isLoggedIn`) that automatically triggers visual UI updates when the user logs in or out.
 * HOW: It uses React's `useState` to track the login status. When `login()` is called, it hits the backend, 
 * gets the token, saves it, and flips `isLoggedIn` to true. When `logout()` is called, it clears the token 
 * and flips `isLoggedIn` to false.
 */
export function useAuth() {
  // 1. State: Tracks if the user is currently logged in. 
  // We initialize it by checking if a token already exists in localStorage (e.g., they just refreshed the page).
  // The '!!' is a JavaScript trick that turns a string into 'true' and a null into 'false'.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!getToken());

  // 2. Login Function: Takes credentials, talks to the backend, and updates the state.
  const login = async (email: string, password: string) => {
    // Calls our authApi to get the VIP pass from FastAPI
    const response = await loginApi(email, password);
    
    // Saves the token to localStorage so it survives page refreshes
    setAuthToken(response.access_token);
    
    // Tells React the user is logged in, which forces the UI to update and show the private dashboard
    setIsLoggedIn(true);
  };

  // 3. Logout Function: Throws away the VIP pass and updates the state.
  const logout = () => {
    // Deletes the token from localStorage
    clearAuthToken();
    
    // Tells React the user is logged out, forcing the UI to kick them back to the login screen
    setIsLoggedIn(false);
  };

  // 4. Return the state and functions so any React component can use them
  return {
    isLoggedIn,
    login,
    logout,
  };
}
