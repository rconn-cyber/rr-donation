const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const {
      paymentMethodId, amount, currency,
      donorName, donorEmail, fund,
      phone, address, company, contact, comment
    } = JSON.parse(event.body);

    if (!amount || amount < 100) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Minimum donation is $1.00' }) };
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency || 'usd',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      receipt_email: donorEmail || undefined,
      description: `Rough Riders Donation — ${fund}`,
      metadata: {
        donor_name:   donorName  || '',
        donor_email:  donorEmail || '',
        fund:         fund       || '',
        phone:        phone      || '',
        address:      address    || '',
        company:      company    || '',
        rr_contact:   contact    || '',
        comment:      comment    || '',
      },
    });

    if (intent.status === 'requires_action' && intent.next_action.type === 'use_stripe_sdk') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requiresAction: true, clientSecret: intent.client_secret }),
      };
    }

    if (intent.status === 'succeeded') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Payment failed. Please try again.' }),
    };

  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
