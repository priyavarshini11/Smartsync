import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sc_token'));
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(localStorage.getItem('sc_branch') || null);

  const isAuthenticated = !!user;
  const isStudentType = user?.role === 'student' || user?.role === 'cr';
  const isOnboarded = user?.onboardingComplete || !isStudentType;
  const needsUsername = user && !user.username;

  // Persist selected branch
  useEffect(() => {
    if (selectedBranch) {
      localStorage.setItem('sc_branch', selectedBranch);
    } else {
      localStorage.removeItem('sc_branch');
    }
  }, [selectedBranch]);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const data = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        localStorage.removeItem('sc_token');
        localStorage.removeItem('sc_user');
        setToken(null);
      }
      setLoading(false);
    };
    validateToken();
  }, [token]);

  const signup = useCallback(async (email, password, role) => {
    const data = await api.post('/auth/signup', { email, password, role });
    localStorage.setItem('sc_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (username, password, expectedRole) => {
    const data = await api.post('/auth/login', { username, password, expectedRole });
    localStorage.setItem('sc_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const adminLogin = useCallback(async (adminId, pin) => {
    const data = await api.post('/admin/auth/login', { adminId, pin });
    localStorage.setItem('sc_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const setUsername = useCallback(async (username) => {
    const data = await api.post('/auth/set-username', { username });
    setUser(data.user);
    return data.user;
  }, []);

  const completeOnboarding = useCallback(async (profile) => {
    const data = await api.post('/auth/onboarding', profile);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading, isAuthenticated, isOnboarded, needsUsername,
      selectedBranch, setSelectedBranch,
      signup, login, adminLogin, setUsername, completeOnboarding, logout, refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
