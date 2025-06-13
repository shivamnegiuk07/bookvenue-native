import React, { useState , useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, MapPin, Upload, Clock, Tag, AlertCircle, CheckCircle2 , IndianRupee } from 'lucide-react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { venueApi } from '@/api/venueApi';
import { useRouter } from 'expo-router';
import axios from 'axios';


const VenueSchema = Yup.object().shape({
  name: Yup.string().required('Venue name is required'),
  description: Yup.string().required('Description is required'),
  location: Yup.string().required('Location is required'),
  type: Yup.string().required('Sport type is required'),
  pricePerHour: Yup.number()
    .required('Price per hour is required')
    .min(1, 'Price must be greater than 0'),
  openingTime: Yup.string().required('Opening time is required'),
  closingTime: Yup.string().required('Closing time is required'),
  amenities: Yup.array().of(Yup.string()),
  category: Yup.string().required('Category is required'),

});

export default function AddVenueScreen() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amenitiesOptions, setAmenitiesOptions] = useState([]);
const [categories, setCategories] = useState([]);

  const sportTypes = ['Football', 'Cricket', 'Tennis', 'Basketball', 'Swimming', 'Badminton'];
  // const amenitiesOptions = [
  //   'Parking', 'Changing Rooms', 'Showers', 'Lighting', 
  //   'Equipment Rental', 'Refreshments', 'Seating'
  // ];
useEffect(() => {
  const fetchAmenities = async () => {
    try {
      const response = await axios.get('http://admin.bookvenue.app/api/get-all-amenities');
      setAmenitiesOptions(response.data?.amenities || []);

      const categoryResponse = await axios.get('http://admin.bookvenue.app/api/get-all-service-category');
      setCategories(categoryResponse.data?.service_category || []);
    } catch (error) {
      console.error('Failed to fetch amenities or categories:', error);
    }
  };

  fetchAmenities();
}, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError(null);
    
    try {
      if (images.length === 0) {
        throw new Error('Please add at least one image of your venue');
      }
      
      // In a real app, we would upload the images to a server here
      const venueData = {
        ...values,
        images,
        coordinates: {
          // In a real app, we would get these from a location picker
          latitude: 37.78825,
          longitude: -122.4324,
        },

      };
      
      await venueApi.createVenue(venueData);
      setSuccess(true);
      
      // Reset the form after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setImages([]);
        router.push('/');
      }, 2000);
      
    } catch (error: any) {
      setError(error.message || 'Failed to create venue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add New Venue</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {success && (
          <View style={styles.successContainer}>
            <CheckCircle2 size={20} color="#10B981" />
            <Text style={styles.successText}>Venue created successfully!</Text>
          </View>
        )}

        <Formik
          initialValues={{
            name: '',
            description: '',
            location: '',
            type: '',
            pricePerHour: '',
            openingTime: '09:00',
            closingTime: '22:00',
            amenities: [],
            category: '',
          }}
          validationSchema={VenueSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
            <View>
              <View style={styles.imageSection}>
                <Text style={styles.sectionTitle}>Venue Images</Text>
                <Text style={styles.sectionSubtitle}>Upload at least one image of your venue</Text>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
                  {images.map((uri, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image source={{ uri }} style={styles.venueImage} />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => setImages(images.filter((_, i) => i !== index))}
                      >
                        <Text style={styles.removeImageButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                    <Camera size={24} color="#6B7280" />
                    <Text style={styles.addImageButtonText}>Add Image</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Venue Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter venue name"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={handleChange('name')}
                    onBlur={handleBlur('name')}
                    value={values.name}
                  />
                  {touched.name && errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe your venue"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    onChangeText={handleChange('description')}
                    onBlur={handleBlur('description')}
                    value={values.description}
                  />
                  {touched.description && errors.description && (
                    <Text style={styles.errorText}>{errors.description}</Text>
                  )}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <View style={styles.inputWithIcon}>
                    <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputText}
                      placeholder="Address of your venue"
                      placeholderTextColor="#9CA3AF"
                      onChangeText={handleChange('location')}
                      onBlur={handleBlur('location')}
                      value={values.location}
                    />
                  </View>
                  {touched.location && errors.location && (
                    <Text style={styles.errorText}>{errors.location}</Text>
                  )}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Sport Type</Text>
                <View style={styles.sportTypeContainer}>
                  {sportTypes.map((sport) => (
                    <TouchableOpacity 
                      key={sport}
                      style={[
                        styles.sportTypeButton,
                        values.type === sport ? styles.sportTypeButtonActive : null
                      ]}
                      onPress={() => setFieldValue('type', sport)}
                    >
                      <Text 
                        style={[
                          styles.sportTypeText,
                          values.type === sport ? styles.sportTypeTextActive : null
                        ]}
                      >
                        {sport}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {touched.type && errors.type && (
                  <Text style={styles.errorText}>{errors.type}</Text>
                )}
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Pricing & Availability</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Price per Hour</Text>
                  <View style={styles.inputWithIcon}>
                    <IndianRupee size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputText}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      onChangeText={handleChange('pricePerHour')}
                      onBlur={handleBlur('pricePerHour')}
                      value={values.pricePerHour}
                    />
                  </View>
                  {touched.pricePerHour && errors.pricePerHour && (
                    <Text style={styles.errorText}>{errors.pricePerHour}</Text>
                  )}
                </View>
                
                <View style={styles.timeContainer}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Opening Time</Text>
                    <View style={styles.inputWithIcon}>
                      <Clock size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputText}
                        placeholder="09:00"
                        placeholderTextColor="#9CA3AF"
                        onChangeText={handleChange('openingTime')}
                        onBlur={handleBlur('openingTime')}
                        value={values.openingTime}
                      />
                    </View>
                    {touched.openingTime && errors.openingTime && (
                      <Text style={styles.errorText}>{errors.openingTime}</Text>
                    )}
                  </View>
                  
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Closing Time</Text>
                    <View style={styles.inputWithIcon}>
                      <Clock size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputText}
                        placeholder="22:00"
                        placeholderTextColor="#9CA3AF"
                        onChangeText={handleChange('closingTime')}
                        onBlur={handleBlur('closingTime')}
                        value={values.closingTime}
                      />
                    </View>
                    {touched.closingTime && errors.closingTime && (
                      <Text style={styles.errorText}>{errors.closingTime}</Text>
                    )}
                  </View>
                </View>
              </View>
<View style={styles.formSection}>
  <Text style={styles.sectionTitle}>Category</Text>
  <View style={styles.amenitiesContainer}>
    {categories.map((cat) => {
      const isSelected = values.category === cat.name;
      return (
        <TouchableOpacity
          key={cat.id}
          onPress={() => setFieldValue('category', cat.name)} // or cat.id if preferred
          style={[
            styles.amenityButton,
            isSelected && styles.amenityButtonActive,
          ]}
        >
          <Text
            style={[
              styles.amenityText,
              isSelected && styles.amenityTextActive,
            ]}
          >
            {cat.name}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
</View>



              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Amenities</Text>
                <Text style={styles.sectionSubtitle}>Select all that apply</Text>

                <View style={styles.amenitiesContainer}>
                  {amenitiesOptions.map((amenity) => {
                    const isSelected = values.amenities.includes(amenity.name);
                    return (
                      <TouchableOpacity
                        key={amenity.id}
                        style={[
                          styles.amenityButton,
                          isSelected ? styles.amenityButtonActive : null
                        ]}
                        onPress={() => {
                          const newAmenities = isSelected
                            ? values.amenities.filter((a: string) => a !== amenity.name)
                            : [...values.amenities, amenity.name];
                          setFieldValue('amenities', newAmenities);
                        }}
                      >
                        <Text
                          style={[
                            styles.amenityText,
                            isSelected ? styles.amenityTextActive : null
                          ]}
                        >
                          {amenity.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => handleSubmit()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Venue</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#10B981',
    marginLeft: 8,
  },
  imageSection: {
    marginBottom: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  imagesScrollView: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  imageContainer: {
    width: 150,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  venueImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 150,
    height: 100,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  addImageButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
  },
  timeContainer: {
    flexDirection: 'row',
  },
  sportTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sportTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
    marginBottom: 12,
  },
  sportTypeButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  sportTypeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  sportTypeTextActive: {
    color: '#2563EB',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
    marginBottom: 12,
  },
  amenityButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  amenityText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  amenityTextActive: {
    color: '#2563EB',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});