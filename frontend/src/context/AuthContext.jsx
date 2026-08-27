import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const defaultUser = {
  _id: 'user_active_default',
  name: 'SplitGo Rider',
  phone: '8989776132',
  email: 'rider@splitgo.in',
  role: 'rider',
  isPhoneVerified: true,
  isEmailVerified: true,
  token: 'token_default_active',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      if (!saved || saved === 'undefined' || saved === 'null') return defaultUser;
      const parsed = JSON.parse(saved);
      return { ...defaultUser, ...parsed, isPhoneVerified: true };
    } catch (e) {
      console.warn('Error parsing user from localStorage:', e);
      return defaultUser;
    }
  });

  const login = (userData) => {
    const existingToken = localStorage.getItem('token');
    const token = userData.token || (user && user.token) || (existingToken !== 'undefined' ? existingToken : null);

    if (token) {
      localStorage.setItem('token', token);
      const fullUserData = { ...userData, token };
      localStorage.setItem('user', JSON.stringify(fullUserData));
      setUser(fullUserData);
    } else {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
