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
  ChangePasswordDto,
  ResetPasswordDto,
} from "../types/auth";
import authService from "../services/authService";
import { ApiResponse, User } from "../types/shared";

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
  const [isMounted, setIsMounted] = React.useState(false);

  // Check if we're on the client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run auth initialization on client side
    if (!isMounted) return;

    const initAuth = async () => {
      try {
        const token = authService.getStoredToken();

        if (token) {
          if (!authService.isTokenExpired()) {
            // Token is valid, set it and get user data
            dispatch({ type: "SET_TOKEN", payload: token });
            const userResponse = await authService.getCurrentUser();
            if (userResponse.success && userResponse.data) {
              dispatch({ type: "SET_USER", payload: userResponse.data });
            } else {
              await authService.logout();
              dispatch({ type: "LOGOUT" });
            }
          } else {
            // Token expired, try to refresh
            const refreshResponse = await authService.refreshToken();
            if (refreshResponse.success) {
              // Refresh successful, get user data
              dispatch({
                type: "SET_TOKEN",
                payload: authService.getStoredToken(),
              });
              const userResponse = await authService.getCurrentUser();
              if (userResponse.success && userResponse.data) {
                dispatch({ type: "SET_USER", payload: userResponse.data });
              } else {
                await authService.logout();
                dispatch({ type: "LOGOUT" });
              }
            } else {
              // Refresh failed, clean everything
              await authService.logout();
              dispatch({ type: "LOGOUT" });
            }
          }
        } else {
          // No token at all, make sure everything is clean
          await authService.logout();
          dispatch({ type: "LOGOUT" });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        dispatch({ type: "LOGOUT" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    initAuth();
  }, [isMounted]);

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
          console.log("Decoded user:", userResponse.data);
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

  const changePassword = async (data: ChangePasswordDto) => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      return await authService.changePassword(data);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const changeUsername = async (
    newUsername: string
  ): Promise<ApiResponse<{ message: string }>> => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await authService.changeUsername(newUsername);

      if (response.success) {
        // Refresh user data to get updated username
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          dispatch({ type: "SET_USER", payload: userResponse.data });
        }
      }

      return response;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
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
    changePassword,
    changeUsername,
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