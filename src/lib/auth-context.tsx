"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import Bmob, { initBmob } from "./bmob";

interface BmobUser {
  objectId: string;
  username: string;
  nickname?: string;
  sessionToken?: string;
}

interface AuthState {
  user: BmobUser | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BmobUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initBmob();
    const current = Bmob.User.current();
    if (current) {
      setUser(current as unknown as BmobUser);
    }
    setLoading(false);
  }, []);

  const signOut = useCallback(() => {
    // Bmob.User.logout() clears ALL localStorage, which would break migration flags.
    // Instead, just clear the Bmob session key.
    if (typeof window !== "undefined") {
      localStorage.removeItem("bmob_session_token");
    }
    Bmob.User.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
