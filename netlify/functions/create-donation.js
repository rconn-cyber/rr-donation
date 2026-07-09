const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { amount, donationTarget, dedication, donorName, donorEmail, company, roughRiderContact } = JSON.parse(event.body);

    if (!amount || amount < 100) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Minimum donation is $1.00' }) };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // already in cents
      currency: 'usd',
      receipt_email: donorEmail || undefined,
      description: `Rough Riders Donation — ${donationTarget}`,
      metadata: {
        donation_target: donationTarget || '',
        dedication: dedication || '',
        donor_name: donorName || '',
        donor_email: donorEmail || '',
        company: company || '',
        rough_rider_contact: roughRiderContact || '',
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    };
  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
