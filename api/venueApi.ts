import axios from 'axios';
import { Venue } from '@/types/venue';

const API_URL = 'http://admin.bookvenue.app/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export const venueApi = {
  getVenues: async () => {
    try {
      const response = await api.get('/get-all-facility');
      const data = response.data.facility;

      const venues: Venue[] = data.map((facility: any) => {
        const service = facility.services?.[0];
        const court = service?.courts?.[0];

        const images = service?.images
          ? JSON.parse(service.images).map((img: string) => `http://admin.bookvenue.app/${img.replace(/\\/g, '/')}`)
          : [];

        return {
          id: facility.id.toString(),
          slug: facility.slug || facility.id.toString(),
          name: facility.official_name,
          description: facility.description || '',
          location: facility.address,
          type: service?.name || 'Other',
          pricePerHour: parseFloat(court?.slot_price || '0'),
          openingTime: court?.start_time || '08:00',
          closingTime: court?.end_time || '20:00',
          rating: 4.5,
          amenities: [],
          images: images.length > 0 ? images : [
            'https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
          ],
          coordinates: {
            latitude: parseFloat(facility.lat || '0'),
            longitude: parseFloat(facility.lng || '0')
          },
          services: facility.services || []
        };
      });
      
      return venues;
    } catch (error) {
      console.error('Failed to fetch venues:', error);
      return [];
    }
  },
  
  getVenueBySlug: async (slug: string) => {
    try {
      const response = await api.get(`/get-facility-by-slug/${slug}`);
      const facility = response.data.facility;
      const service = facility.services?.[0];
      const court = service?.courts?.[0];

      const images = service?.images
        ? JSON.parse(service.images).map((img: string) => `http://admin.bookvenue.app/${img.replace(/\\/g, '/')}`)
        : [];

      return {
        id: facility.id.toString(),
        slug: facility.slug,
        name: facility.official_name,
        description: facility.description || 'No description available',
        location: facility.address,
        type: service?.name || 'Other',
        pricePerHour: parseFloat(court?.slot_price || '0'),
        openingTime: court?.start_time || '08:00',
        closingTime: court?.end_time || '20:00',
        rating: 4.5,
        amenities: ['Parking', 'Changing Rooms', 'Lighting'],
        images: images.length > 0 ? images : [
          'https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        ],
        coordinates: {
          latitude: parseFloat(facility.lat || '0'),
          longitude: parseFloat(facility.lng || '0')
        },
        services: facility.services || []
      };
    } catch (error) {
      console.error('Error fetching venue by slug:', error);
      throw new Error('Venue not found');
    }
  }
};