import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const UserContext = createContext();

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,

    id: user.id || user.user_id,
    name: user.name || user.user_name,
    email: user.email || user.user_email,

    isAdmin: Number(user.isAdmin ?? user.user_isAdmin ?? 0),
    isValid: Number(user.isValid ?? user.user_isValid ?? 0),
    consent: Number(user.consent ?? user.user_consent ?? 0),
  };
};

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiBase = useMemo(() => {
    return window.location.hostname === 'localhost'
      ? 'http://localhost:1234'
      : '/api';
  }, []);

  const setUser = (value) => {
    setUserState(normalizeUser(value));
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${apiBase}/auth`, {
          withCredentials: true,
        });

        if (response.data?.user) {
          setUserState(normalizeUser(response.data.user));
        } else {
          setUserState(null);
        }
      } catch (error) {
        console.log('Error loading user:', error);
        setUserState(null);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 300);
      }
    };

    fetchUser();
  }, [apiBase]);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};