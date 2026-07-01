import { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const BASE = process.env.REACT_APP_BACKEND_URL;

export function AuthProvider({ children }) {
  const [employee, setEmployee] = useState(
    JSON.parse(localStorage.getItem('employee')) || null
  );

  const login = async (email, password) => {
    const res = await axios.post(`${BASE}/api/auth/login`, { email, password });
    localStorage.setItem('token',    res.data.token);
    localStorage.setItem('employee', JSON.stringify(res.data.employee));
    setEmployee(res.data.employee);
    return res.data;
  };

  const register = async (data) => {
    const res = await axios.post(`${BASE}/api/auth/register`, data);
    return res.data;
  };

  const logout = () => {
    localStorage.clear();
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
