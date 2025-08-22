import React, { createContext, useContext, useReducer, useEffect } from 'react';
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
      // Restore user from localStorage
      try {
        const user = JSON.parse(userData);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token }
        });
      } catch (error) {
        // If user data is corrupted, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (email, password) => {
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
  };

  const register = async (name, email, password, role) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.register(name, email, password, role);
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
      toast.success('Registration successful!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  return (
//     <AuthContext.Provider value={{
//   user: state.user,
//   token: state.token,
//   loading: state.loading,
//   login,
//   register,
//   logout
// }}>
//   {children}
// </AuthContext.Provider>
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
