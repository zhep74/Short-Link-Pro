'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleAuthProvider } from './firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';

interface AuthContextType {
  user: FirebaseUser | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  dbUser: any | null;
  refreshDbUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDbUser = async (authToken: string) => {
    try {
      // We can create a quick self api check to retrieve synchronized user details (like role)
      const res = await fetch('/api/links', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.status === 401) {
        setDbUser(null);
        return;
      }
      
      // Since verifyAuth also inserts/syncs user and we can also fetch user profile via another small route
      // Let's create a specific user profile endpoint or derive profile from another API call.
      // Let's fetch /api/admin/stats as a check, or let's create /api/users/profile for direct profile retrieval!
      const profileRes = await fetch('/api/users/profile', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setDbUser(profile);
      }
    } catch (err) {
      console.error('Failed to sync db user:', err);
    }
  };

  const refreshDbUser = async () => {
    if (token) {
      await fetchDbUser(token);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken(true);
          setToken(idToken);
          await fetchDbUser(idToken);
        } catch (err) {
          console.error('Error getting token:', err);
          setToken(null);
          setDbUser(null);
        }
      } else {
        setToken(null);
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setToken(null);
      setDbUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithGoogle,
        logout,
        dbUser,
        refreshDbUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
