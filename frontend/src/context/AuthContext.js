import { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const BASE = process.env.REACT_APP_BACKEND_URL;

// ─── Check if JWT token is expired ───────────────────────────────────────────
// JWT tokens have an expiry (7 days in this app). If the token is expired,
// treat the user as logged out even if employee data is still in localStorage.
function isTokenValid(token) {
  if (!token) return false;
  try {
    // JWT is 3 base64 parts separated by dots — decode the middle (payload) part
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now     = Math.floor(Date.now() / 1000); // current time in seconds
    return payload.exp > now; // true if token has not expired yet
  } catch {
    return false; // malformed token — treat as invalid
  }
}

export function AuthProvider({ children }) {

  // ─── Initialize from localStorage ──────────────────────────────────────────
  // Check both: is there saved employee data AND is the token still valid?
  // If token expired (>7 days since login), clear everything and start fresh.
  const [employee, setEmployee] = useState(() => {
    const token    = localStorage.getItem('token');
    const saved    = localStorage.getItem('employee');

    if (isTokenValid(token) && saved) {
      return JSON.parse(saved); // ✅ Valid session — stay logged in
    }

    // Token expired or missing — clear stale data
    localStorage.removeItem('token');
    localStorage.removeItem('employee');
    return null;
  });

  // ─── Login ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await axios.post(`${BASE}/api/auth/login`, { email, password });
    localStorage.setItem('token',    res.data.token);
    localStorage.setItem('employee', JSON.stringify(res.data.employee));
    setEmployee(res.data.employee);
    return res.data;
  };

  // ─── Register ───────────────────────────────────────────────────────────────
  const register = async (data) => {
    const res = await axios.post(`${BASE}/api/auth/register`, data);
    return res.data;
  };

  // ─── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employee');
    setEmployee(null);
  };

  const token = () => localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{ employee, login, register, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
