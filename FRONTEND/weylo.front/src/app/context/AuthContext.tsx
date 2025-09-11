"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import {
  AuthState,
  AuthContextType,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  User,
} from "../types/auth";
import authService from "../services/authService";

// Auth reducer
type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_TOKEN"; payload: string | null }
  | { type: "LOGOUT" };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    case "SET_TOKEN":
      return {
        ...state,
        token: action.payload,
        isAuthenticated: !!action.payload,
      };
    case "LOGOUT":
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getStoredToken();

      if (token && !authService.isTokenExpired()) {
        dispatch({ type: "SET_TOKEN", payload: token });
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          dispatch({ type: "SET_USER", payload: userResponse.data });
        } else {
          await authService.logout();
          dispatch({ type: "LOGOUT" });
        }
      }

      dispatch({ type: "SET_LOADING", payload: false });
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginDto) => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await authService.login(credentials);

      if (response.success) {
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          dispatch({ type: "SET_USER", payload: userResponse.data });
          dispatch({
            type: "SET_TOKEN",
            payload: authService.getStoredToken(),
          });
        }
      }

      return response;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const register = async (userData: RegisterDto) => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await authService.register(userData);

      if (response.success) {
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          dispatch({ type: "SET_USER", payload: userResponse.data });
          dispatch({
            type: "SET_TOKEN",
            payload: authService.getStoredToken(),
          });
        }
      }

      return response;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: "LOGOUT" });
  };

  const forgotPassword = async (email: string) => {
    return authService.forgotPassword(email);
  };

  const resetPassword = async (data: ResetPasswordDto) => {
    return authService.resetPassword(data);
  };

  const verifyEmail = async (token: string) => {
    const response = await authService.verifyEmail(token);

    if (response.success && state.user) {
      // Refresh user data
      const userResponse = await authService.getCurrentUser();
      if (userResponse.success && userResponse.data) {
        dispatch({ type: "SET_USER", payload: userResponse.data });
      }
    }

    return response;
  };

  const resendVerificationEmail = async (email: string) => {
    return authService.resendVerificationEmail(email);
  };

  const refreshToken = async (): Promise<boolean> => {
    const response = await authService.refreshToken();

    if (response.success) {
      dispatch({ type: "SET_TOKEN", payload: authService.getStoredToken() });
      return true;
    } else {
      dispatch({ type: "LOGOUT" });
      return false;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
