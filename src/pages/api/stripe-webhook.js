// Stripe webhook handler for subscription events
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Disable body parsing, need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to get raw body from request
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutComplete(session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await handleSubscriptionCanceled(deletedSubscription);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        await handlePaymentSucceeded(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        await handlePaymentFailed(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleCheckoutComplete(session) {
  const { profileId, userEmail } = session.metadata;

  // Activate subscription in database
  const { error } = await supabase
    .from('contributorapplications')
    .update({
      subscription_active: true,
      subscription_start_date: new Date().toISOString(),
      role: 'contributor',
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
    })
    .eq('id', profileId);

  if (error) {
    console.error('Failed to activate subscription:', error);
    throw error;
  }

  console.log(`Subscription activated for user ${userEmail}`);
}

async function handleSubscriptionUpdate(subscription) {
  const { data: profile } = await supabase
    .from('contributorapplications')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!profile) {
    console.log('No profile found for subscription:', subscription.id);
    return;
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  await supabase
    .from('contributorapplications')
    .update({
      subscription_active: isActive,
    })
    .eq('id', profile.id);

  console.log(`Subscription updated for profile ${profile.id}, active: ${isActive}`);
}

async function handleSubscriptionCanceled(subscription) {
  const { data: profile } = await supabase
    .from('contributorapplications')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!profile) return;

  await supabase
    .from('contributorapplications')
    .update({
      subscription_active: false,
    })
    .eq('id', profile.id);

  console.log(`Subscription canceled for profile ${profile.id}`);
}

async function handlePaymentSucceeded(invoice) {
  console.log('Payment succeeded for invoice:', invoice.id);
  // Additional logic if needed (e.g., send confirmation email)
}

async function handlePaymentFailed(invoice) {
  const { data: profile } = await supabase
    .from('contributorapplications')
    .select('*')
    .eq('stripe_customer_id', invoice.customer)
    .single();

  if (profile) {
    console.log(`Payment failed for profile ${profile.id}`);
    // Could send notification email or deactivate after multiple failures
  }
}
