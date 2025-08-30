import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        user: action.payload.user, 
        token: action.payload.token, 
        loading: false 
      };
    case 'LOGOUT':
      return { ...state, user: null, token: null, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: localStorage.getItem('token'),
    loading: true
  });

   useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token }
        });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.login(email, password);
      const userData = response.data;

      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify({
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { 
          user: {
            _id: userData._id,
            name: userData.name,
            email: userData.email,
            role: userData.role
          }, 
          token: userData.token 
        }
      });
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.register(name, email, password, role);
      
      //Checks if registration is pending approval
      if (response.status === 202) {
        const data = response.data;
        toast.success(data.message);
        return { status: 'pending', role: data.role };
      }
      
      //Normal registration flow for members
      const userData = response.data;
      
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify({
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status
      }));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { 
          user: {
            _id: userData._id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            status: userData.status
          }, 
          token: userData.token 
        }
      });
      toast.success('Registration successful!');
      return { status: 'approved' };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  }, []);

  const contextValue = useMemo(() => ({
    user: state.user,
    token: state.token,
    loading: state.loading,
    login,
    register,
    logout
  }), [state.user, state.token, state.loading, login, register, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};