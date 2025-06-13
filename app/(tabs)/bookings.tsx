import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { bookingApi } from '@/api/bookingApi';
import { Booking } from '@/types/booking';
import { CalendarX } from 'lucide-react-native';
import BookingCard from '@/components/BookingCard';

export default function BookingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await bookingApi.getBookings();
        console.log('Fetched bookings:', response);
        setBookings(response);
      } catch (error: any) {
        console.error('Error fetching bookings:', error);
        setError(error.message || 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const upcomingBookings = bookings.filter(booking => {
    const bookingDateTime = new Date(booking.date + 'T' + booking.startTime);
    return bookingDateTime > new Date();
  });
  
  const pastBookings = bookings.filter(booking => {
    const bookingDateTime = new Date(booking.date + 'T' + booking.startTime);
    return bookingDateTime <= new Date();
  });

  const handleRebook = (booking: Booking) => {
    // Navigate to venue detail page for rebooking
    router.push({
      pathname: '/venue/[id]',
      params: { id: booking.venue.slug || booking.venue.id }
    });
  };

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <BookingCard booking={item} onRebook={handleRebook} />
  );

  const renderEmptyComponent = () => {
    return (
      <View style={styles.emptyContainer}>
        <CalendarX size={48} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No bookings found</Text>
        <Text style={styles.emptyDescription}>
          {activeTab === 'upcoming' 
            ? "You don't have any upcoming bookings. Start exploring venues to book your next activity!"
            : "You don't have any past bookings."}
        </Text>
        {activeTab === 'upcoming' && (
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => router.push('/explore')}
          >
            <Text style={styles.exploreButtonText}>Explore Venues</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderErrorComponent = () => {
    return (
      <View style={styles.emptyContainer}>
        <CalendarX size={48} color="#EF4444" />
        <Text style={styles.emptyTitle}>Error loading bookings</Text>
        <Text style={styles.emptyDescription}>{error}</Text>
        <TouchableOpacity 
          style={styles.exploreButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            // Retry fetching bookings
            bookingApi.getBookings()
              .then(setBookings)
              .catch((err) => setError(err.message))
              .finally(() => setLoading(false));
          }}
        >
          <Text style={styles.exploreButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Bookings</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Past</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : error ? (
        renderErrorComponent()
      ) : (
        <FlatList
          data={activeTab === 'upcoming' ? upcomingBookings : pastBookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyComponent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1F2937',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#2563EB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  exploreButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});