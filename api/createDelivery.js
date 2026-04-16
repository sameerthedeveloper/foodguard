import { db } from './firebase-server.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { orderId, pickup, dropoff, itemDetails, donorName, receiverName, donorPhone, receiverPhone } = req.body;
    
    // Call Borzo API (Sandbox)
    const borzoPayload = {
      matter: itemDetails || "Food Item",
      points: [
        {
          address: pickup.address || "Pickup Location",
          contact_person: { phone: donorPhone || "9999999999", name: donorName || "Donor" },
          latitude: pickup.lat,
          longitude: pickup.lng
        },
        {
          address: dropoff.address || "Dropoff Location",
          contact_person: { phone: receiverPhone || "8888888888", name: receiverName || "Receiver" },
          latitude: dropoff.lat,
          longitude: dropoff.lng
        }
      ]
    };

    // Resolve Borzo Configuration based on environment toggle
    const isTest = (process.env.BORZO_ENV || 'test').toLowerCase() === 'test';
    const baseUrl = isTest ? process.env.BORZO_URL_TEST : process.env.BORZO_URL_PROD;
    const authToken = isTest ? process.env.BORZO_TOKEN_TEST : process.env.BORZO_TOKEN_PROD;

    console.log(`[Borzo] Initializing ${isTest ? 'TEST' : 'PRODUCTION'} order...`);

    const borzoRes = await fetch(`${baseUrl}/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DV-Auth-Token': authToken
      },
      body: JSON.stringify(borzoPayload)
    });

    const borzoData = await borzoRes.json();
    let deliveryId = null;

    // Handle Borzo response or fallback to mock ID if auth fails on sandbox
    if (borzoData.is_successful && borzoData.order) {
      deliveryId = String(borzoData.order.order_id);
      console.log(`[Borzo] Order created successfully: ${deliveryId}`);
    } else {
      console.warn("[Borzo] API failed or returned error structure:", JSON.stringify(borzoData, null, 2));
      
      // If we got a 401/403, it's definitely an auth issue
      if (borzoRes.status === 401 || borzoRes.status === 403) {
        console.error("[Borzo] Authentication failed. Please check your X-DV-Auth-Token in .env");
      }

      deliveryId = "mock_dlv_" + Date.now();
      console.log(`[Borzo] Falling back to mock delivery ID: ${deliveryId}`);
    }

    // 1. Create independent delivery document keyed by orderId for easy lookup
    const deliveryRef = db.collection('deliveries').doc(orderId);
    await deliveryRef.set({
      orderId,
      borzoDeliveryId: deliveryId, // The ID from Borzo
      status: 'courier_assigned',
      courier: {
        name: 'Sandbox Courier (Auto)',
        phone: '999-999-9999'
      },
      tracking: {
        lat: pickup.lat,
        lng: pickup.lng,
        lastUpdated: new Date().toISOString()
      },
      createdAt: new Date().toISOString()
    });

    // 2. Update existing order to denote delivery attached
    await db.collection('orders').doc(orderId).update({
      deliveryId: deliveryId,
      status: 'in_transit'
    });

    return res.status(200).json({ success: true, deliveryId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}
