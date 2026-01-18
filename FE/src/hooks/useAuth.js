import { useState, useEffect } from "react";
import { authService } from "../api/services";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.getProfile();
      if (response?.user) {
        setUser({ ...response.user });
        return response.user;
      }
      return null;
    } catch (err) {
      if (err.status === 401 || err.response?.status === 401) {
        setUser(null);
        setError(null);
      } else {
        setError(err.message);
        setUser(null);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      if (response?.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);
        await fetchProfile();
        return response;
      }
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    refetch: fetchProfile,
    login,
    logout,
  };
};

