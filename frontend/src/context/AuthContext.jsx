import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
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
