// src/Auth/Auth.js
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Create a context for authentication
const AuthContext = createContext();

// Provider component that wraps the application and provides authentication context
export const AuthProvider = ({ children }) => {
  // State to track if the user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check local storage for saved authentication status and expiration time
    const savedAuth = JSON.parse(localStorage.getItem("isAuthenticated"));
    const expirationTime = localStorage.getItem("expirationTime");
    // Determine if the current date is less than the saved expiration time
    if (savedAuth && expirationTime) {
      return new Date() < new Date(expirationTime);
    }
    return false;
  });
  // Hook to programmatically navigate
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  // Function to log the user in
  const login = () => {
    // Set the expiration time for authentication (30 minutes from now)
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 30);
    // Save authentication status and expiration time in local storage
    localStorage.setItem("isAuthenticated", true);
    localStorage.setItem("expirationTime", expirationTime);
    setIsAuthenticated(true);
  };

  // Function to log the user out
  const logout = useCallback(() => {
    // Remove authentication status and expiration time from local storage
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("expirationTime");
    setIsAuthenticated(false);
    navigateRef.current("/admin/login");
  }, []);

  // Effect to check for expiration of authentication every second
  useEffect(() => {
    const interval = setInterval(() => {
      const expirationTime = localStorage.getItem("expirationTime");
      if (expirationTime && new Date() > new Date(expirationTime)) {
        logout();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [logout]);

  // Provide the authentication state and functions to the context
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext in other components
export const useAuth = () => useContext(AuthContext);
