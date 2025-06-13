import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Booking } from '@/types/booking';
import { MapPin, Clock, CalendarCheck, RotateCcw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native';

type BookingCardProps = {
  booking: Booking;
  onRebook?: (booking: Booking) => void;
};

export default function BookingCard({ booking, onRebook }: BookingCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date';
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleRebook = () => {
    if (onRebook) {
      onRebook(booking);
    } else {
      // Navigate to venue detail page for rebooking
      router.push({
        pathname: '/venue/[id]',
        params: { id: booking.venue.slug || booking.venue.id }
      });
    }
  };

  const getStatusIcon = () => {
    switch (booking.status) {
      case 'confirmed':
        return <CheckCircle2 size={16} color="#10B981" />;
      case 'pending':
        return <AlertCircle size={16} color="#F59E0B" />;
      case 'cancelled':
        return <XCircle size={16} color="#EF4444" />;
      default:
        return <AlertCircle size={16} color="#6B7280" />;
    }
  };

  const getStatusStyle = () => {
    switch (booking.status) {
      case 'confirmed':
        return styles.statusConfirmed;
      case 'pending':
        return styles.statusPending;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusTextStyle = () => {
    switch (booking.status) {
      case 'confirmed':
        return styles.statusTextConfirmed;
      case 'pending':
        return styles.statusTextPending;
      case 'cancelled':
        return styles.statusTextCancelled;
      default:
        return styles.statusTextDefault;
    }
  };

  return (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => router.push(`/booking/${booking.id}`)}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.venueImageContainer}>
          <Image 
            source={{ uri: booking.venue.images[0] }} 
            style={styles.venueImage}
            onError={(e) => {
              console.log('Image load error:', e.nativeEvent.error);
            }}
          />
        </View>
        <View style={styles.bookingInfo}>
          <Text style={styles.venueName} numberOfLines={1}>{booking.venue.name}</Text>
          <View style={styles.locationContainer}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.locationText} numberOfLines={1}>{booking.venue.location}</Text>
          </View>
          {booking.venue.type && (
            <Text style={styles.venueType}>{booking.venue.type}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.bookingDetails}>
        <View style={styles.detailItem}>
          <CalendarCheck size={16} color="#2563EB" />
          <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Clock size={16} color="#2563EB" />
          <Text style={styles.detailText}>{booking.startTime} - {booking.endTime}</Text>
        </View>
      </View>
      
      <View style={styles.bookingFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>₹{booking.totalAmount}</Text>
        </View>
        
        <View style={styles.rightSection}>
          <View style={[styles.statusContainer, getStatusStyle()]}>
            {getStatusIcon()}
            <Text style={[styles.statusText, getStatusTextStyle()]}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.rebookButton}
            onPress={(e) => {
              e.stopPropagation();
              handleRebook();
            }}
          >
            <RotateCcw size={16} color="#2563EB" />
            <Text style={styles.rebookButtonText}>Rebook</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  venueImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  venueImage: {
    width: '100%',
    height: '100%',
  },
  bookingInfo: {
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
    marginLeft: 4,
    flex: 1,
  },
  venueType: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  priceValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#1F2937',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusConfirmed: {
    backgroundColor: '#ECFDF5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusDefault: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginLeft: 6,
  },
  statusTextConfirmed: {
    color: '#10B981',
  },
  statusTextPending: {
    color: '#F59E0B',
  },
  statusTextCancelled: {
    color: '#EF4444',
  },
  statusTextDefault: {
    color: '#6B7280',
  },
  rebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  rebookButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#2563EB',
    marginLeft: 4,
  },
});