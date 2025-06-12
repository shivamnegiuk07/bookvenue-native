import { Platform } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes?: Record<string, any>;
  theme: {
    color: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export class RazorpayService {
  private static apiKey = 'rzp_live_qyWsOEPEllNahd';

  static async openCheckout(options: RazorpayOptions): Promise<RazorpayResponse> {
    if (Platform.OS === 'web') {
      return this.openWebCheckout(options);
    } else {
      return this.openNativeCheckout(options);
    }
  }

  private static async openWebCheckout(options: RazorpayOptions): Promise<RazorpayResponse> {
    return new Promise((resolve, reject) => {
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => this.initializeWebPayment(options, resolve, reject);
        script.onerror = () => reject(new Error('Failed to load Razorpay script'));
        document.body.appendChild(script);
      } else {
        this.initializeWebPayment(options, resolve, reject);
      }
    });
  }

  private static initializeWebPayment(
    options: RazorpayOptions,
    resolve: (value: RazorpayResponse) => void,
    reject: (reason: any) => void
  ) {
    const rzp = new window.Razorpay({
      ...options,
      handler: function (response: RazorpayResponse) {
        resolve(response);
      },
      modal: {
        ondismiss: function () {
          reject(new Error('Payment cancelled by user'));
        }
      }
    });
    rzp.open();
  }

  private static async openNativeCheckout(options: RazorpayOptions): Promise<RazorpayResponse> {
    try {
      const data = await RazorpayCheckout.open({
        ...options,
        key: this.apiKey,
      });
      return data;
    } catch (error: any) {
      if (error.code === 'Cancelled') {
        throw new Error('Payment cancelled by user');
      }
      throw error;
    }
  }

  static createPaymentOptions(
    amount: number,
    orderId: string,
    userDetails: {
      name: string;
      email: string;
      contact: string;
    },
    bookingDetails: {
      venueName: string;
      courtName: string;
      date: string;
      slots: number;
    }
  ): RazorpayOptions {
    return {
      key: this.apiKey,
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      name: 'BookVenue',
      description: `Booking for ${bookingDetails.venueName} - ${bookingDetails.courtName}`,
      image: 'https://images.pexels.com/photos/3775042/pexels-photo-3775042.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      prefill: {
        name: userDetails.name,
        email: userDetails.email,
        contact: userDetails.contact
      },
      notes: {
        venue_name: bookingDetails.venueName,
        court_name: bookingDetails.courtName,
        booking_date: bookingDetails.date,
        total_slots: bookingDetails.slots,
        order_id: orderId
      },
      theme: {
        color: '#2563EB'
      }
    };
  }
}

// Declare global Razorpay for web
declare global {
  interface Window {
    Razorpay: any;
  }
}