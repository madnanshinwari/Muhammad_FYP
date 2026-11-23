import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('as_dairy_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem('as_dairy_user');
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('as_dairy_token') || null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('as_dairy_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('as_dairy_user');
    }
    if (token) {
      localStorage.setItem('as_dairy_token', token);
    } else {
      localStorage.removeItem('as_dairy_token');
    }
  }, [user, token]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      setToken(data.access_token);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.register(userData);
      setUser(data.user);
      setToken(data.access_token);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const quickLogin = async (roleType) => {
    if (roleType === 'admin') {
      return login('admin@abdulsalamdairy.com', 'admin123');
    } else {
      return login('customer@abdulsalamdairy.com', 'customer123');
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'farm_owner';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      isAdmin,
      login,
      register,
      logout,
      updateUser,
      quickLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
