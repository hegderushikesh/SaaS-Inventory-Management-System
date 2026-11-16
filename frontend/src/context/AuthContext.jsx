import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../api/authApi';

/**
 * =========================================================================
 * AUTHENTICATION & TOKEN STORAGE TRADEOFF ANALYSIS
 * =========================================================================
 * Chosen Approach: In-Memory React State + localStorage with Axios Interceptor
 * 
 * 1. Why this approach:
 *    - In a Single Page Application (SPA), storing the JWT in localStorage allows
 *      the authentication session to persist across browser reloads and tabs.
 *    - Axios request interceptor attaches 'Authorization: Bearer <token>' automatically.
 *    - Immune to Cross-Site Request Forgery (CSRF) attacks because browsers do NOT
 *      automatically attach Authorization headers to cross-origin requests.
 * 
 * 2. Tradeoffs & Mitigations:
 *    - Tradeoff: localStorage is accessible to JavaScript running on the same origin,
 *      meaning it is vulnerable if an XSS (Cross-Site Scripting) flaw exists.
 *    - Mitigation: 
 *      a) Strict input validation via Zod (client) and express-validator (server).
 *      b) React's built-in JSX escaping prevents injection vulnerabilities.
 *      c) Secure HTTP headers configured via Helmet on the backend.
 *      d) Server-side token expiration (7d default, customizable).
 * =========================================================================
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('stockflow_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [organization, setOrganization] = useState(() => {
    try {
      const savedOrg = localStorage.getItem('stockflow_org');
      return savedOrg ? JSON.parse(savedOrg) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('stockflow_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Validate session against backend /api/auth/me on initial load
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('stockflow_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response.success && response.data) {
          setUser(response.data.user);
          setOrganization(response.data.organization);
          localStorage.setItem('stockflow_user', JSON.stringify(response.data.user));
          if (response.data.organization) {
            localStorage.setItem('stockflow_org', JSON.stringify(response.data.organization));
          }
        }
      } catch (error) {
        console.warn('Session verification failed, clearing credentials:', error.message);
        localStorage.removeItem('stockflow_token');
        localStorage.removeItem('stockflow_user');
        localStorage.removeItem('stockflow_org');
        setToken(null);
        setUser(null);
        setOrganization(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();

    // Listen for unauthorized events emitted by Axios interceptor
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setOrganization(null);
      toast.error('Session expired. Please log in again.');
    };

    window.addEventListener('stockflow:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('stockflow:unauthorized', handleUnauthorized);
    };
  }, []);

  /**
   * User login handler
   */
  const login = async (credentials) => {
    try {
      const response = await authApi.login(credentials);
      if (response.success && response.data) {
        const { token: receivedToken, user: receivedUser, organization: receivedOrg } = response.data;

        localStorage.setItem('stockflow_token', receivedToken);
        localStorage.setItem('stockflow_user', JSON.stringify(receivedUser));
        if (receivedOrg) {
          localStorage.setItem('stockflow_org', JSON.stringify(receivedOrg));
        }

        setToken(receivedToken);
        setUser(receivedUser);
        setOrganization(receivedOrg);

        toast.success(`Welcome back, ${receivedUser.name || 'User'}!`);
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid email or password';
      toast.error(message);
      return { success: false, message };
    }
  };

  /**
   * User registration handler
   */
  const register = async (userData) => {
    try {
      const response = await authApi.register(userData);
      if (response.success && response.data) {
        const { token: receivedToken, user: receivedUser, organization: receivedOrg } = response.data;

        localStorage.setItem('stockflow_token', receivedToken);
        localStorage.setItem('stockflow_user', JSON.stringify(receivedUser));
        if (receivedOrg) {
          localStorage.setItem('stockflow_org', JSON.stringify(receivedOrg));
        }

        setToken(receivedToken);
        setUser(receivedUser);
        setOrganization(receivedOrg);

        toast.success(`Welcome to StockFlow, ${receivedUser.name || 'User'}!`);
        return { success: true };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please check your details.';
      toast.error(message);
      return { success: false, message };
    }
  };

  /**
   * User logout handler
   */
  const logout = () => {
    localStorage.removeItem('stockflow_token');
    localStorage.removeItem('stockflow_user');
    localStorage.removeItem('stockflow_org');
    setToken(null);
    setUser(null);
    setOrganization(null);
    toast.success('Signed out successfully');
  };

  const value = {
    user,
    organization,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
