import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://admin.bookvenue.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  // Send OTP
  login: async (identifier: string) => {
    try {
      const endpoint = identifier.includes('@') ? '/login-via-email' : '/login';
      const payload = identifier.includes('@')
        ? { email: identifier }
        : { mobile: identifier };
      await api.post(endpoint, payload);
      return;
    } catch (error: any) {
      console.error('Login Error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  },

  // Verify OTP
  verifyOTP: async (identifier: string, otp: string) => {
    try {
      const isEmail = identifier.includes('@');
      const endpoint = isEmail ? '/verify-otp-via-email' : '/verify-otp';
      const payload = {
        [isEmail ? 'email' : 'mobile']: identifier,
        otp
      };
      const response = await api.post(endpoint, payload);
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        if (response.data.user) {
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        }
      }     
    } catch (error: any) {
      console.error('OTP Verification Error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to verify OTP');
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/get-user-details');
      const userData = response.data.user;
      return {
        id: userData.id.toString(),
        name: userData.name,
        email: userData.email,
        phone: userData.contact || userData.phone,
        address: userData.address,
        isVenueOwner: false, // Set based on your logic
        createdAt: userData.created_at,
        updatedAt: userData.updated_at
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  },

  register: async (name: string, email: string, password: string, isVenueOwner: boolean) => {
    try {
      const response = await api.post('/register', {
        name,
        email,
        password,
        role: isVenueOwner ? 'provider' : 'user'
      });

      const { user, token } = response.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  updateProfile: async (userData: any) => {
    try {
      const response = await api.post('/profileUpdate', userData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.statusText === 'OK' || response.status === 200) {
        return response.data.user || userData;
      }
      
      throw new Error('Failed to update profile');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (error: any) {
      throw new Error('Logout failed');
    }
  }
};