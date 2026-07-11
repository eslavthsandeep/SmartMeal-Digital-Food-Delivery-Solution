import Stripe from 'stripe';

const isMock = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_mock');

let stripe = null;
if (!isMock) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  } catch (error) {
    console.error('Failed to initialize Stripe client:', error.message);
  }
}

export const createPaymentIntent = async (amount) => {
  // amount is in smallest currency unit (e.g. paise for INR, cents for USD)
  // Let's assume Rupees, so amount in cents/paise (multiply by 100)
  const amountInCents = Math.round(amount * 100);

  if (isMock || !stripe) {
    console.log(`[PaymentGateway] Creating Mock Payment Intent for ${amount} INR`);
    return {
      id: `pi_mock_${Math.random().toString(36).substring(2, 15)}`,
      client_secret: `pi_mock_secret_${Math.random().toString(36).substring(2, 15)}`,
      amount: amountInCents,
      currency: 'inr',
      status: 'requires_payment_method',
      isMock: true
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'inr',
      metadata: { integration_check: 'accept_a_payment' },
      payment_method_types: ['card']
    });
    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent creation failed:', error.message);
    throw new Error(`Payment processing error: ${error.message}`);
  }
};

export const confirmPaymentIntent = async (paymentIntentId) => {
  if (isMock || paymentIntentId.startsWith('pi_mock_')) {
    console.log(`[PaymentGateway] Confirming Mock Payment Intent: ${paymentIntentId}`);
    return {
      id: paymentIntentId,
      status: 'succeeded',
      isMock: true
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status === 'succeeded') {
      return paymentIntent;
    }
    // For test mode integrations, we can also manually confirm
    const confirmed = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: 'pm_card_visa' // Test card
    });
    return confirmed;
  } catch (error) {
    console.error('Stripe payment confirmation failed:', error.message);
    throw new Error(`Payment confirmation error: ${error.message}`);
  }
};
