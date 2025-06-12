import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking } from '@/types/booking';

const API_URL = 'https://admin.bookvenue.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const bookingApi = {
  getBookings: async () => {
    try {
      const response = await api.get('/my-bookings');
      return response.data.bookings.map((booking: any, index: number) => ({
        id: `booking-${index}`,
        venue: {
          id: `venue-${index}`,
          name: booking.facility,
          type: booking.court,
          location: 'Location not available',
          slug: `venue-${index}`,
          images: [
            'https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            'https://images.pexels.com/photos/3582038/pexels-photo-3582038.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            'https://images.pexels.com/photos/2277981/pexels-photo-2277981.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            'https://images.pexels.com/photos/358042/pexels-photo-358042.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
          ][index % 5],
          coordinates: {
            latitude: 37.78825 + (Math.random() - 0.5) * 0.01,
            longitude: -122.4324 + (Math.random() - 0.5) * 0.01
          }
        },
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        totalAmount: parseFloat(booking.price),
        status: booking.status.toLowerCase()
      }));
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch bookings');
    }
  },
  
  getBookingById: async (id: string) => {
    try {
      const response = await api.get('/my-bookings');
      const bookingIndex = parseInt(id.replace('booking-', ''));
      const booking = response.data.bookings[bookingIndex];
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      return {
        id: id,
        venue: {
          id: `venue-${bookingIndex}`,
          name: booking.facility,
          type: booking.court,
          location: 'Location not available',
          slug: `venue-${bookingIndex}`,
          images: [
            'https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            'https://images.pexels.com/photos/3582038/pexels-photo-3582038.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            'https://images.pexels.com/photos/2277981/pexels-photo-2277981.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            'https://images.pexels.com/photos/358042/pexels-photo-358042.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
          ][bookingIndex % 5],
          coordinates: {
            latitude: 37.78825 + (Math.random() - 0.5) * 0.01,
            longitude: -122.4324 + (Math.random() - 0.5) * 0.01
          }
        },
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        totalAmount: parseFloat(booking.price),
        status: booking.status.toLowerCase()
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch booking');
    }
  },
  
  createBooking: async (bookingData: any) => {
        console.log('Creating booking with data:', bookingData);
    try {
      const response = await api.post('/booking', bookingData);
      return response.data;
    } catch (error: any) {
      console.error('Booking creation error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to create booking');
    }
  },

  createMultipleBookings: async (bookingsData: any[]) => {
    try {
      const bookingPromises = bookingsData.map(bookingData => 
        api.post('/booking', bookingData)
      );
      const responses = await Promise.all(bookingPromises);
      return responses.map(response => response.data);
    } catch (error: any) {
      console.error('Multiple bookings creation error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to create bookings');
    }
  },

  cancelBooking: async (bookingId: string) => {
    try {
      const response = await api.post(`/cancel-booking/${bookingId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel booking');
    }
  }
};