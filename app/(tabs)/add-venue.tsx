import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, MapPin, Clock, Tag, AlertCircle, CheckCircle2, IndianRupee, Plus, Trash2 } from 'lucide-react-native';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VenueSchema = Yup.object().shape({
  officialName: Yup.string().required('Venue name is required'),
  description: Yup.string().required('Description is required'),
  address: Yup.string().required('Address is required'),
  latitude: Yup.string().required('Latitude is required'),
  longitude: Yup.string().required('Longitude is required'),
  service_category_id: Yup.array().min(1, 'At least one category is required'),
  amenities: Yup.array().min(1, 'At least one amenity is required'),
  services: Yup.array().min(1, 'At least one service is required'),
});

export default function AddVenueScreen() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amenitiesOptions, setAmenitiesOptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [amenitiesResponse, categoriesResponse, servicesResponse] = await Promise.all([
          axios.get('http://admin.bookvenue.app/api/get-all-amenities'),
          axios.get('http://admin.bookvenue.app/api/get-all-service-category'),
          axios.get('http://admin.bookvenue.app/api/get-all-services')
        ]);

        setAmenitiesOptions(amenitiesResponse.data?.amenities || []);
        setCategories(categoriesResponse.data?.service_category || []);
        setServices(servicesResponse.data?.services || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load form data. Please try again.');
      }
    };

    fetchData();
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

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Prepare form data
      const formData = new FormData();
      
      // Add basic venue data
      formData.append('officialName', values.officialName);
      formData.append('description', values.description);
      formData.append('address', values.address);
      formData.append('latitude', values.latitude);
      formData.append('longitude', values.longitude);
      
      // Add arrays as JSON strings
      formData.append('service_category_id', JSON.stringify(values.service_category_id));
      formData.append('amenities', JSON.stringify(values.amenities));
      formData.append('services', JSON.stringify(values.services));

      // Add featured image (first image)
      if (images[0]) {
        const imageUri = images[0];
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('featured_image', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      }

      // Create venue
      const response = await axios.post(
        'http://admin.bookvenue.app/api/create-facility',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSuccess(true);
      
      // Reset the form after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setImages([]);
        router.push('/');
      }, 2000);
      
    } catch (error: any) {
      console.error('Venue creation error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create venue. Please try again.');
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
            officialName: '',
            description: '',
            address: '',
            latitude: '',
            longitude: '',
            service_category_id: [],
            amenities: [],
            services: [{
              service_id: '',
              description: '',
              holiday: [],
              courts: [{
                courtName: '',
                startTime: '09:00',
                endTime: '22:00',
                price: '',
                duration: '60',
                breakTimes: [{ start: null, end: null }]
              }]
            }]
          }}
          validationSchema={VenueSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
            <View>
              {/* Images Section */}
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

              {/* Basic Information */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Venue Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter venue name"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={handleChange('officialName')}
                    onBlur={handleBlur('officialName')}
                    value={values.officialName}
                  />
                  {touched.officialName && errors.officialName && (
                    <Text style={styles.errorText}>{errors.officialName}</Text>
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
                  <Text style={styles.inputLabel}>Address</Text>
                  <View style={styles.inputWithIcon}>
                    <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputText}
                      placeholder="Address of your venue"
                      placeholderTextColor="#9CA3AF"
                      onChangeText={handleChange('address')}
                      onBlur={handleBlur('address')}
                      value={values.address}
                    />
                  </View>
                  {touched.address && errors.address && (
                    <Text style={styles.errorText}>{errors.address}</Text>
                  )}
                </View>

                <View style={styles.coordinatesContainer}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Latitude</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="30.4095"
                      placeholderTextColor="#9CA3AF"
                      onChangeText={handleChange('latitude')}
                      onBlur={handleBlur('latitude')}
                      value={values.latitude}
                      keyboardType="numeric"
                    />
                    {touched.latitude && errors.latitude && (
                      <Text style={styles.errorText}>{errors.latitude}</Text>
                    )}
                  </View>
                  
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Longitude</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="77.9585"
                      placeholderTextColor="#9CA3AF"
                      onChangeText={handleChange('longitude')}
                      onBlur={handleBlur('longitude')}
                      value={values.longitude}
                      keyboardType="numeric"
                    />
                    {touched.longitude && errors.longitude && (
                      <Text style={styles.errorText}>{errors.longitude}</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Categories */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <Text style={styles.sectionSubtitle}>Select applicable categories</Text>
                <View style={styles.optionsContainer}>
                  {categories.map((category) => {
                    const isSelected = values.service_category_id.includes(category.id.toString());
                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.optionButton,
                          isSelected ? styles.optionButtonActive : null
                        ]}
                        onPress={() => {
                          const newCategories = isSelected
                            ? values.service_category_id.filter((id: string) => id !== category.id.toString())
                            : [...values.service_category_id, category.id.toString()];
                          setFieldValue('service_category_id', newCategories);
                        }}
                      >
                        <Text 
                          style={[
                            styles.optionText,
                            isSelected ? styles.optionTextActive : null
                          ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {touched.service_category_id && errors.service_category_id && (
                  <Text style={styles.errorText}>{errors.service_category_id}</Text>
                )}
              </View>

              {/* Amenities */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Amenities</Text>
                <Text style={styles.sectionSubtitle}>Select all that apply</Text>
                
                <View style={styles.optionsContainer}>
                  {amenitiesOptions.map((amenity) => {
                    const isSelected = values.amenities.includes(amenity.id.toString());
                    return (
                      <TouchableOpacity 
                        key={amenity.id}
                        style={[
                          styles.optionButton,
                          isSelected ? styles.optionButtonActive : null
                        ]}
                        onPress={() => {
                          const newAmenities = isSelected
                            ? values.amenities.filter((id: string) => id !== amenity.id.toString())
                            : [...values.amenities, amenity.id.toString()];
                          setFieldValue('amenities', newAmenities);
                        }}
                      >
                        <Text 
                          style={[
                            styles.optionText,
                            isSelected ? styles.optionTextActive : null
                          ]}
                        >
                          {amenity.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {touched.amenities && errors.amenities && (
                  <Text style={styles.errorText}>{errors.amenities}</Text>
                )}
              </View>

              {/* Services */}
              <FieldArray name="services">
                {({ push, remove }) => (
                  <View style={styles.formSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Services & Courts</Text>
                      <TouchableOpacity
                        style={styles.addServiceButton}
                        onPress={() => push({
                          service_id: '',
                          description: '',
                          holiday: [],
                          courts: [{
                            courtName: '',
                            startTime: '09:00',
                            endTime: '22:00',
                            price: '',
                            duration: '60',
                            breakTimes: [{ start: null, end: null }]
                          }]
                        })}
                      >
                        <Plus size={16} color="#2563EB" />
                        <Text style={styles.addServiceButtonText}>Add Service</Text>
                      </TouchableOpacity>
                    </View>

                    {values.services.map((service, serviceIndex) => (
                      <View key={serviceIndex} style={styles.serviceContainer}>
                        <View style={styles.serviceHeader}>
                          <Text style={styles.serviceTitle}>Service {serviceIndex + 1}</Text>
                          {values.services.length > 1 && (
                            <TouchableOpacity
                              style={styles.removeServiceButton}
                              onPress={() => remove(serviceIndex)}
                            >
                              <Trash2 size={16} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Service Type</Text>
                          <View style={styles.serviceTypeContainer}>
                            {services.map((serviceType) => (
                              <TouchableOpacity
                                key={serviceType.id}
                                style={[
                                  styles.serviceTypeButton,
                                  service.service_id === serviceType.id.toString() ? styles.serviceTypeButtonActive : null
                                ]}
                                onPress={() => setFieldValue(`services.${serviceIndex}.service_id`, serviceType.id.toString())}
                              >
                                <Text
                                  style={[
                                    styles.serviceTypeText,
                                    service.service_id === serviceType.id.toString() ? styles.serviceTypeTextActive : null
                                  ]}
                                >
                                  {serviceType.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Service Description</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Describe this service"
                            placeholderTextColor="#9CA3AF"
                            onChangeText={handleChange(`services.${serviceIndex}.description`)}
                            value={service.description}
                          />
                        </View>

                        {/* Courts for this service */}
                        <FieldArray name={`services.${serviceIndex}.courts`}>
                          {({ push: pushCourt, remove: removeCourt }) => (
                            <View>
                              <View style={styles.courtsHeader}>
                                <Text style={styles.courtsTitle}>Courts</Text>
                                <TouchableOpacity
                                  style={styles.addCourtButton}
                                  onPress={() => pushCourt({
                                    courtName: '',
                                    startTime: '09:00',
                                    endTime: '22:00',
                                    price: '',
                                    duration: '60',
                                    breakTimes: [{ start: null, end: null }]
                                  })}
                                >
                                  <Plus size={14} color="#2563EB" />
                                  <Text style={styles.addCourtButtonText}>Add Court</Text>
                                </TouchableOpacity>
                              </View>

                              {service.courts.map((court, courtIndex) => (
                                <View key={courtIndex} style={styles.courtContainer}>
                                  <View style={styles.courtHeader}>
                                    <Text style={styles.courtTitle}>Court {courtIndex + 1}</Text>
                                    {service.courts.length > 1 && (
                                      <TouchableOpacity
                                        style={styles.removeCourtButton}
                                        onPress={() => removeCourt(courtIndex)}
                                      >
                                        <Trash2 size={14} color="#EF4444" />
                                      </TouchableOpacity>
                                    )}
                                  </View>

                                  <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Court Name</Text>
                                    <TextInput
                                      style={styles.input}
                                      placeholder="e.g., Cricket Turf"
                                      placeholderTextColor="#9CA3AF"
                                      onChangeText={handleChange(`services.${serviceIndex}.courts.${courtIndex}.courtName`)}
                                      value={court.courtName}
                                    />
                                  </View>

                                  <View style={styles.timeContainer}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                      <Text style={styles.inputLabel}>Start Time</Text>
                                      <View style={styles.inputWithIcon}>
                                        <Clock size={20} color="#6B7280" style={styles.inputIcon} />
                                        <TextInput
                                          style={styles.inputText}
                                          placeholder="09:00"
                                          placeholderTextColor="#9CA3AF"
                                          onChangeText={handleChange(`services.${serviceIndex}.courts.${courtIndex}.startTime`)}
                                          value={court.startTime}
                                        />
                                      </View>
                                    </View>
                                    
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                      <Text style={styles.inputLabel}>End Time</Text>
                                      <View style={styles.inputWithIcon}>
                                        <Clock size={20} color="#6B7280" style={styles.inputIcon} />
                                        <TextInput
                                          style={styles.inputText}
                                          placeholder="22:00"
                                          placeholderTextColor="#9CA3AF"
                                          onChangeText={handleChange(`services.${serviceIndex}.courts.${courtIndex}.endTime`)}
                                          value={court.endTime}
                                        />
                                      </View>
                                    </View>
                                  </View>

                                  <View style={styles.priceContainer}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                      <Text style={styles.inputLabel}>Price per Hour</Text>
                                      <View style={styles.inputWithIcon}>
                                        <IndianRupee size={20} color="#6B7280" style={styles.inputIcon} />
                                        <TextInput
                                          style={styles.inputText}
                                          placeholder="1500"
                                          placeholderTextColor="#9CA3AF"
                                          keyboardType="numeric"
                                          onChangeText={handleChange(`services.${serviceIndex}.courts.${courtIndex}.price`)}
                                          value={court.price}
                                        />
                                      </View>
                                    </View>
                                    
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                      <Text style={styles.inputLabel}>Duration (mins)</Text>
                                      <TextInput
                                        style={styles.input}
                                        placeholder="60"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        onChangeText={handleChange(`services.${serviceIndex}.courts.${courtIndex}.duration`)}
                                        value={court.duration}
                                      />
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                        </FieldArray>
                      </View>
                    ))}
                  </View>
                )}
              </FieldArray>

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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  coordinatesContainer: {
    flexDirection: 'row',
  },
  timeContainer: {
    flexDirection: 'row',
  },
  priceContainer: {
    flexDirection: 'row',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
    marginBottom: 12,
  },
  optionButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  optionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  optionTextActive: {
    color: '#2563EB',
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
    marginBottom: 12,
  },
  serviceTypeButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  serviceTypeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  serviceTypeTextActive: {
    color: '#2563EB',
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  addServiceButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2563EB',
    marginLeft: 4,
  },
  serviceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1F2937',
  },
  removeServiceButton: {
    padding: 4,
  },
  courtsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  courtsTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#1F2937',
  },
  addCourtButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
  },
  addCourtButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#2563EB',
    marginLeft: 4,
  },
  courtContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  courtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courtTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#1F2937',
  },
  removeCourtButton: {
    padding: 2,
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