import { db } from './firebase-server.js';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'OrderId required' });

  try {
    // 1. Get order and mapping from Firestore
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) return res.status(404).json({ error: 'Order not found' });
    
    const orderData = orderDoc.data();
    const borzoId = orderData.deliveryId;

    if (!borzoId || borzoId.startsWith('mock-')) {
      return res.status(200).json({ status: 'simulation', message: 'Using simulation mode' });
    }

    // 2. Fetch from Borzo
    const env = process.env.BORZO_ENV || 'test';
    const baseUrl = env === 'prod' ? process.env.BORZO_URL_PROD : process.env.BORZO_URL_TEST;
    const token = env === 'prod' ? process.env.BORZO_TOKEN_PROD : process.env.BORZO_TOKEN_TEST;

    // Search for the specific order
    const response = await axios.get(`${baseUrl}/api/business/1.6/orders?order_id=${borzoId}`, {
      headers: { 'X-DV-Auth-Token': token }
    });

    if (!response.data.is_successful) {
      return res.status(500).json({ error: 'Borzo API failed', details: response.data.errors });
    }

    const borzoOrder = response.data.orders?.[0];
    if (!borzoOrder) return res.status(404).json({ error: 'Borzo order not found' });

    // 3. Map status
    let fgStatus = orderData.status;
    const bStatus = borzoOrder.status; // available, active, completed, canceled, delayed
    
    // Detailed analysis of points
    const pickupPoint = borzoOrder.points?.[0];
    const dropoffPoint = borzoOrder.points?.[borzoOrder.points.length - 1];

    if (bStatus === 'completed') {
      fgStatus = 'delivered';
    } else if (bStatus === 'canceled') {
      fgStatus = 'canceled';
    } else if (pickupPoint?.courier_visit_datetime) {
      fgStatus = 'in_transit'; // Already visited pickup
    } else if (bStatus === 'active' || bStatus === 'delayed') {
      fgStatus = 'vehicle_assigned';
    }

    // 4. Calculate progress
    let progress = 0;
    if (fgStatus === 'delivered') progress = 1;
    else if (fgStatus === 'in_transit') progress = 0.5; // Basic progress, could be better if we had live courier coords
    else if (fgStatus === 'vehicle_assigned') progress = 0.1;

    // Use live courier coords if available
    const courierData = borzoOrder.courier;
    const trackingUpdate = {};
    if (courierData?.latitude) {
      trackingUpdate.tracking = {
        lat: parseFloat(courierData.latitude),
        lng: parseFloat(courierData.longitude),
        lastUpdated: new Date().toISOString()
      };
    }

    // 5. Bulk Update Firestore
    const updates = {
      status: fgStatus,
      deliveryProgress: progress,
      ...trackingUpdate
    };

    // Add agent info if missing or updated
    if (courierData) {
      updates.agent = {
        name: `${courierData.name} ${courierData.surname}`.trim(),
        phone: courierData.phone,
        rating: orderData.agent?.rating || '4.8',
        vehicleNumber: orderData.agent?.vehicleNumber || 'ASSIGNED'
      };
    }

    await db.collection('orders').doc(orderId).update(updates);
    
    // Also update deliveries collection
    await db.collection('deliveries').doc(orderId).update({
      status: fgStatus,
      ...trackingUpdate,
      courier: updates.agent || orderData.agent
    });

    return res.status(200).json({ 
      success: true, 
      status: fgStatus, 
      borzoStatus: bStatus,
      progress 
    });

  } catch (error) {
    console.error('[Sync] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
