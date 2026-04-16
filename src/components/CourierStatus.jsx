import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Package, Truck, User, Phone, MapPin } from 'lucide-react';

const CourierStatus = ({ orderId, inline = false }) => {
  const [delivery, setDelivery] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    const unsub = onSnapshot(doc(db.db, 'deliveries', orderId), (docSnap) => {
      if (docSnap.exists()) {
        setDelivery({ id: docSnap.id, ...docSnap.data() });
      } else {
        setDelivery(null);
      }
    });

    // Active Polling: Sync with Borzo every 30 seconds
    const syncStatus = async () => {
      try {
        console.log(`[Sync] Triggering Borzo sync for ${orderId}...`);
        await fetch('/api/syncDelivery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        });
      } catch (e) {
        console.warn('[Sync] Poll failed', e);
      }
    };

    // Initial sync
    syncStatus();
    
    // Interval sync (only if not delivered)
    const interval = setInterval(() => {
      if (delivery?.status !== 'delivered') {
        syncStatus();
      }
    }, 30000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [orderId, delivery?.status]);

  if (!delivery) return null;

  return (
    <div className={`courier-status-card ${!inline ? 'courier-floating' : ''}`}>
      <div className="courier-header">
        <div className="courier-header-left">
          <Truck size={20} className="color-neon-blue" />
          <h3>Borzo Delivery</h3>
        </div>
        <div className="courier-badge">
          {delivery.status.replace('_', ' ')}
        </div>
      </div>

      <div className="courier-body">
        {delivery.courier && (
          <div className="courier-agent">
            <div className="courier-agent-info">
              <div className="courier-agent-avatar">
                <User size={18} />
              </div>
              <div className="courier-agent-meta">
                <span className="courier-agent-name">{delivery.courier.name}</span>
                <span className="courier-agent-phone">
                  <Phone size={10} /> {delivery.courier.phone}
                </span>
              </div>
            </div>
            <a href="tel:9999999999" className="courier-call-btn">
              <Phone size={16} />
            </a>
          </div>
        )}

        <div className="courier-gps">
          <MapPin size={16} className="color-neon-yellow" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p>Live tracking active. Driver is in route. GPS pinged recently.</p>
        </div>
      </div>
    </div>
  );
};

export default CourierStatus;
