
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const stripeClient = {
  // Create a payment intent
  createPaymentIntent: async (amount, currency = 'usd', metadata = {}) => {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
      };
    } catch (error) {
      console.error('Stripe payment intent error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment intent'
      };
    }
  },
  
  // Retrieve payment intent status
  retrievePaymentIntent: async (paymentIntentId) => {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return { success: true, paymentIntent };
    } catch (error) {
      console.error('Stripe retrieve payment intent error:', error);
      return {
        success: false,
        error: error.message || 'Failed to retrieve payment intent'
      };
    }
  }
};

module.exports = stripeClient;
