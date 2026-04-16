import { db } from '../firebase-server.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Webhook payload from Borzo
  const payload = req.body;
  if (!payload || !payload.order || !payload.order.order_id) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const deliveryId = String(payload.order.order_id);
  
  try {
    const updateData = {};
    const statusMap = {
      'available': 'pending',
      'active': 'courier_assigned',
      'completed': 'completed',
      'canceled': 'canceled'
    };

    if (payload.order.status && statusMap[payload.order.status]) {
      updateData.status = statusMap[payload.order.status];
    }

    if (payload.courier) {
      updateData.courier = {
        name: payload.courier.name || 'Sandbox Courier',
        phone: payload.courier.phone || '9999999999'
      };
      
      // Update tracking if courier shares coordinates
      if (payload.courier.latitude && payload.courier.longitude) {
        updateData.tracking = {
          lat: parseFloat(payload.courier.latitude),
          lng: parseFloat(payload.courier.longitude),
          lastUpdated: new Date().toISOString()
        };
      }
    }

    if (Object.keys(updateData).length > 0) {
      await db.collection('deliveries').doc(deliveryId).update(updateData);
    }

    // Acknowledge webhook success
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ success: false, error: 'Internal error processing webhook' });
  }
}
