import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the shape of the user object
// role: 'admin' | 'officer' | null
// name: string (optional)
// other fields can be added as needed
const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({ token: null, role: null, name: null });

  // Load token and role from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    if (token && role) {
      setUser({ token, role, name });
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    setUser({ token: null, role: null, name: null });
  };

  const value = {
    user,
    setUser,
    logout,
    isAdmin: user.role === 'admin',
    isOfficer: user.role === 'officer',
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
