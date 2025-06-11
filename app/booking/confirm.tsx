import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { venueApi } from '@/api/venueApi';
import { bookingApi } from '@/api/bookingApi';
import { Venue } from '@/types/venue';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MapPin, Calendar, Clock, DollarSign, CreditCard, CircleCheck as CheckCircle2 } from 'lucide-react-native';

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BookingConfirmScreen() {
  const { 
    venueId, 
    serviceId, 
    courtId, 
    date, 
    bookingSlots,
    price, 
    courtName, 
    serviceName,
    totalSlots
  } = useLocalSearchParams<{
    venueId: string;
    serviceId: string;
    courtId: string;
    date: string;
    bookingSlots: string;
    price: string;
    courtName: string;
    serviceName: string;
    totalSlots: string;
  }>();
  
  const router = useRouter();
  const { user } = useAuth();
  
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const slots = bookingSlots ? JSON.parse(bookingSlots) : [];
  const numberOfSlots = parseInt(totalSlots || '1');

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        if (!venueId) return;
        const response = await venueApi.getVenueBySlug(venueId);
        setVenue(response);
      } catch (error) {
        console.error('Error fetching venue:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
  }, [venueId]);

  // Load Razorpay script for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const calculateTotalAmount = () => {
    if (!price) return 0;
    return parseFloat(price) * numberOfSlots;
  };
  
  const totalAmount = calculateTotalAmount();
  
  const handleRazorpayPayment = () => {
    if (Platform.OS !== 'web') {
      // For mobile platforms, simulate payment success
      handlePaymentSuccess('mobile_payment_' + Date.now());
      return;
    }

    if (!window.Razorpay) {
      setError('Razorpay is not loaded. Please try again.');
      setPaymentLoading(false);
      return;
    }

    const options = {
      key: 'rzp_live_qyWsOEPEllNahd',
      amount: totalAmount * 100, // Amount in paise
      currency: 'INR',
      name: 'BookVenue',
      description: `Booking for ${venue?.name} - ${courtName}`,
      image: 'https://images.pexels.com/photos/3775042/pexels-photo-3775042.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      handler: function (response: any) {
        handlePaymentSuccess(response.razorpay_payment_id);
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      notes: {
        venue_id: venueId,
        service_id: serviceId,
        court_id: courtId,
        date: date,
        total_slots: numberOfSlots
      },
      theme: {
        color: '#2563EB'
      },
      modal: {
        ondismiss: function() {
          setPaymentLoading(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      setPaymentLoading(true);
      setError(null);
      
      // Create bookings for each slot
      if (slots.length > 1) {
        // Multiple bookings
        const bookingsData = slots.map((slot: any, index: number) => ({
          facility_id: venueId,
          service_id: serviceId,
          court_id: courtId,
          date: date,
          start_time: slot.startTime,
          end_time: slot.endTime,
          price: price,
          payment_id: `${paymentId}_${index}`,
          payment_method: 'razorpay'
        }));
        
        await bookingApi.createMultipleBookings(bookingsData);
      } else {
        // Single booking
        const bookingData = {
          facility_id: venueId,
          service_id: serviceId,
          court_id: courtId,
          date: date,
          start_time: slots[0]?.startTime,
          end_time: slots[0]?.endTime,
          price: totalAmount.toString(),
          payment_id: paymentId,
          payment_method: 'razorpay'
        };
        
        await bookingApi.createBooking(bookingData);
      }
      
      setBookingConfirmed(true);
      
      // Navigate to bookings screen after 2 seconds
      setTimeout(() => {
        router.replace('/bookings');
      }, 2000);
      
    } catch (error: any) {
      setError(error.message || 'Booking failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      setError(null);
      
      // Initialize Razorpay payment
      handleRazorpayPayment();
      
    } catch (error: any) {
      setError(error.message || 'Payment failed. Please try again.');
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!venue) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Venue not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (bookingConfirmed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <CheckCircle2 size={64} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successText}>
            Your {numberOfSlots > 1 ? `${numberOfSlots} bookings have` : 'booking has'} been successfully confirmed. You can view your booking details in the Bookings tab.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButtonContainer}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.bookingDetailsContainer}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          
          <View style={styles.venueInfoContainer}>
            <Image 
              source={{ uri: venue.images[0] }} 
              style={styles.venueImage}
            />
            <View style={styles.venueInfo}>
              <Text style={styles.venueName}>{venue.name}</Text>
              <View style={styles.locationContainer}>
                <MapPin size={14} color="#6B7280" />
                <Text style={styles.locationText} numberOfLines={1}>{venue.location}</Text>
              </View>
              <Text style={styles.serviceInfo}>{serviceName} - {courtName}</Text>
            </View>
          </View>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Calendar size={20} color="#2563EB" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(date || '')}</Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <Clock size={20} color="#2563EB" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Time Slots</Text>
                <Text style={styles.detailValue}>
                  {numberOfSlots > 1 
                    ? `${numberOfSlots} slots selected`
                    : `${slots[0]?.startTime} - ${slots[0]?.endTime}`
                  }
                </Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <DollarSign size={20} color="#2563EB" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Price per slot</Text>
                <Text style={styles.detailValue}>₹{price}</Text>
              </View>
            </View>
          </View>

          {numberOfSlots > 1 && (
            <View style={styles.slotsContainer}>
              <Text style={styles.slotsTitle}>Selected Time Slots:</Text>
              {slots.map((slot: any, index: number) => (
                <View key={index} style={styles.slotItem}>
                  <Text style={styles.slotText}>
                    {slot.startTime} - {slot.endTime}
                  </Text>
                  <Text style={styles.slotPrice}>₹{price}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.paymentSummaryContainer}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>
              {numberOfSlots > 1 ? `Venue charges (${numberOfSlots} slots)` : 'Venue charges'}
            </Text>
            <Text style={styles.summaryItemValue}>₹{totalAmount.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Service fee</Text>
            <Text style={styles.summaryItemValue}>₹0.00</Text>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.paymentMethodContainer}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity style={styles.paymentMethodItem}>
            <CreditCard size={20} color="#2563EB" />
            <Text style={styles.paymentMethodText}>Razorpay (UPI, Cards, Wallets)</Text>
          </TouchableOpacity>
        </View>
        
        {error && (
          <View style={styles.errorMessageContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.payButton}
          onPress={handlePayment}
          disabled={paymentLoading}
        >
          {paymentLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>Pay ₹{totalAmount.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  backButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 16,
  },
  successText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButtonContainer: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1F2937',
  },
  placeholder: {
    width: 24,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  bookingDetailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 16,
  },
  venueInfoContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  venueImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  venueInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  venueName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  serviceInfo: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2563EB',
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTextContainer: {
    marginLeft: 12,
  },
  detailLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#1F2937',
  },
  slotsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  slotsTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  slotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    marginBottom: 8,
  },
  slotText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#1F2937',
  },
  slotPrice: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#2563EB',
  },
  paymentSummaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItemLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#4B5563',
  },
  summaryItemValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#1F2937',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
  },
  totalValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1F2937',
  },
  paymentMethodContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  paymentMethodText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  errorMessageContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorMessage: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#EF4444',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});