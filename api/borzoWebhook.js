import { db } from './firebase-server.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const signature = req.headers['x-dv-signature'];
  const secret = process.env.BORZO_CALLBACK_SECRET;

  // 1. Verify Signature (Security)
  if (secret && signature) {
    const hmac = crypto.createHmac('sha256', secret);
    const body = JSON.stringify(req.body);
    hmac.update(body);
    const expected = hmac.digest('hex');
    
    if (signature !== expected) {
      console.warn('[Webhook] Invalid signature received');
      return res.status(401).send('Invalid Signature');
    }
  }

  const { event_type, order, delivery } = req.body;
  console.log(`[Webhook] Received Borzo Event: ${event_type}`, JSON.stringify(order));

  // 2. Identify our internal Order ID
  // Borzo sends order_id and client_order_id (if we provided it)
  // In FoodGuard, we use our own Firestore ID as the document key.
  
  const borzoOrderId = order?.order_id;
  if (!borzoOrderId) return res.status(200).send('No Order ID');

  try {
    // Search for the order in Firestore by its deliveryId field
    const ordersSnapshot = await db.collection('orders')
      .where('deliveryId', '==', String(borzoOrderId))
      .limit(1)
      .get();

    if (ordersSnapshot.empty) {
      console.warn(`[Webhook] No matching FoodGuard order found for Borzo ID: ${borzoOrderId}`);
      return res.status(200).send('Order not found');
    }

    const orderDoc = ordersSnapshot.docs[0];
    const orderId = orderDoc.id;
    const orderData = orderDoc.data();

    // 3. Map status
    let fgStatus = orderData.status;
    const bStatus = order.status; // available, active, completed, canceled, delayed
    
    const pickupPoint = order.points?.[0];
    if (bStatus === 'completed') fgStatus = 'delivered';
    else if (bStatus === 'canceled') fgStatus = 'canceled';
    else if (pickupPoint?.courier_visit_datetime) fgStatus = 'in_transit';
    else if (bStatus === 'active' || bStatus === 'delayed') fgStatus = 'vehicle_assigned';

    // 4. Updates
    const updates = { status: fgStatus };
    const trackingUpdate = {};

    if (order.courier) {
      updates.agent = {
        name: `${order.courier.name} ${order.courier.surname}`.trim(),
        phone: order.courier.phone,
        rating: orderData.agent?.rating || '4.8',
        vehicleNumber: orderData.agent?.vehicleNumber || 'ASSIGNED'
      };
      
      if (order.courier.latitude) {
        trackingUpdate.tracking = {
          lat: parseFloat(order.courier.latitude),
          lng: parseFloat(order.courier.longitude),
          lastUpdated: new Date().toISOString()
        };
      }
    }

    // 5. Update Firestore
    await db.collection('orders').doc(orderId).update({ ...updates, ...trackingUpdate });
    
    // Also update deliveries collection (keyed by orderId)
    await db.collection('deliveries').doc(orderId).set({
      orderId,
      borzoDeliveryId: borzoOrderId,
      status: fgStatus,
      ...trackingUpdate,
      courier: updates.agent || orderData.agent,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return res.status(200).json({ success: true, processed: true });

  } catch (error) {
    console.error('[Webhook] Error processing Borzo callback:', error);
    return res.status(500).send('Internal Server Error');
  }
}
