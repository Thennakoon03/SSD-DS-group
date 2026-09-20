import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const STORAGE_KEY = 'hcp_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();

  // Called after successful login/register — data is the response's `data` object
  const saveUser = useCallback((data) => {
    const payload = {
      id:        data._id,
      name:      data.name || `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
      email:     data.email,
      role:      data.role,
      token:     data.token,
      profileImage: data.profileImage || null,
      authProvider: data.authProvider || 'local',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setUser(payload);
  }, []);

  // Merge partial fields into the stored user (e.g. after profile save)
  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    navigate('/');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, saveUser, updateUser, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
