import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, TextInput,
  Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Phone, CircleAlert as AlertCircle, ArrowRight, User } from 'lucide-react-native';
import { authApi } from '@/api/authApi';

export default function RegisterScreen() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [otp, setOTP] = useState('');
  const [showInput, setShowInput] = useState<'email' | 'phone' | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Timer logic for resend OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1 && interval) clearInterval(interval);
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleMethodSelect = (method: 'email' | 'phone') => {
    setShowInput(method);
    setIdentifier('');
    setName('');
    setShowOTP(false);
    setOTP('');
    setError(null);
  };

  const validateInput = () => {
    if (showInput === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    } else {
      return /^[0-9]{10}$/.test(identifier);
    }
  };

  const validateName = () => {
    return name.trim().length >= 2;
  };

  const handleSendOTP = async () => {
    if (!validateInput()) {
      setError(`Invalid ${showInput === 'email' ? 'email address' : 'phone number'}`);
      return;
    }

    if (!validateName()) {
      setError('Please enter a valid name (at least 2 characters)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.register(identifier);
      setShowOTP(true);
      setResendTimer(60);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const isEmail = showInput === 'email';
    const isMobile = showInput === 'phone';

    const isMobileValid = isMobile && /^[0-9]{10}$/.test(identifier);
    const isEmailValid = isEmail && /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(identifier);
    const isOtpValid = otp !== '' && /^[0-9]{6}$/.test(otp);

    if (isMobileValid || isEmailValid) {
      if (isOtpValid) {
        setLoading(true);
        setError(null);

        try {
          await authApi.verifyRegisterOTP(identifier, otp, name);
          router.replace('/(tabs)');
        } catch (err: any) {
          setError(err?.response?.data?.message || err.message || 'Registration failed');
        } finally {
          setLoading(false);
        }
      } else {
        setError('Invalid OTP.');
      }
    } else {
      setError('Invalid Mobile No. or Email.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/BookVenue_Logo.png')}
              style={styles.logo}
            />
            <Text style={styles.appName}>BookVenue</Text>
            <Text style={styles.tagline}>Create your account to get started</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!showInput && (
            <View style={styles.methodContainer}>
              <TouchableOpacity
                style={styles.methodButton}
                onPress={() => handleMethodSelect('email')}
              >
                <Mail size={24} color="#2563EB" />
                <Text style={styles.methodButtonText}>Register with Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.methodButton}
                onPress={() => handleMethodSelect('phone')}
              >
                <Phone size={24} color="#2563EB" />
                <Text style={styles.methodButtonText}>Register with Phone</Text>
              </TouchableOpacity>
            </View>
          )}

          {showInput && !showOTP && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Enter your name</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <Text style={styles.inputLabel}>
                Enter your {showInput === 'email' ? 'email address' : 'phone number'}
              </Text>
              <View style={styles.inputWrapper}>
                {showInput === 'phone' && <Text style={styles.countryCode}>+91</Text>}
                <TextInput
                  style={[styles.input, showInput === 'phone' && styles.phoneInput]}
                  placeholder={showInput === 'email' ? 'Email address' : 'Phone number'}
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType={showInput === 'email' ? 'email-address' : 'phone-pad'}
                  autoCapitalize="none"
                  maxLength={showInput === 'phone' ? 10 : undefined}
                />
              </View>
              <TouchableOpacity
                style={[styles.actionButton, (!validateInput() || !validateName()) && styles.actionButtonDisabled]}
                onPress={handleSendOTP}
                disabled={!validateInput() || !validateName() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.actionButtonText}>Send OTP</Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {showOTP && (
            <View style={styles.otpContainer}>
              <Text style={styles.otpTitle}>Enter Verification Code</Text>
              <Text style={styles.otpSubtitle}>
                We've sent a 6-digit code to your {showInput === 'email' ? 'email' : 'phone'}
              </Text>
              <TextInput
                style={styles.otpInput}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChangeText={setOTP}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity
                style={[styles.actionButton, otp.length !== 6 && styles.actionButtonDisabled]}
                onPress={handleVerifyOTP}
                disabled={otp.length !== 6 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {resendTimer > 0 ? (
                <Text style={styles.resendTimer}>
                  Resend OTP in {resendTimer} seconds
                </Text>
              ) : (
                <TouchableOpacity onPress={handleSendOTP} disabled={loading}>
                  <Text style={styles.resendButtonText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  logoContainer: { alignItems: 'center', marginTop: 40, marginBottom: 32 },
  logo: { width: 100, height: 100, borderRadius: 20, marginBottom: 16 },
  appName: { fontFamily: 'Inter-Bold', fontSize: 28, color: '#1F2937', marginBottom: 8 },
  tagline: { fontFamily: 'Inter-Regular', fontSize: 16, color: '#6B7280' },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#EF4444', marginLeft: 8 },
  methodContainer: { gap: 16 },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  methodButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#1F2937' },
  inputContainer: { gap: 16 },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  countryCode: { fontFamily: 'Inter-Medium', fontSize: 16, color: '#1F2937', marginRight: 8 },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  phoneInput: { paddingLeft: 8 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  actionButtonDisabled: { backgroundColor: '#93C5FD' },
  actionButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#FFFFFF' },
  otpContainer: { gap: 16 },
  otpTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#1F2937',
    textAlign: 'center',
  },
  otpSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  otpInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 8,
  },
  resendTimer: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  resendButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2563EB',
    textAlign: 'center',
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#6B7280' },
  loginLink: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#2563EB', marginLeft: 4 },
});