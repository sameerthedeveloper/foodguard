import React, { useState } from 'react';
import { calculateDistance, assignVehicle, calculateDeliveryFee, estimateDeliveryTime } from '../lib/delivery';
import { MapPin, Clock, Users, Utensils, ChevronRight, Zap } from 'lucide-react';

const NearbyList = ({ items, userLocation, type, onSelect, targetQuantity, loading }) => {
  const [autoMatchedId, setAutoMatchedId] = useState(null);
  const location = userLocation || { latitude: 28.6139, longitude: 77.2090 };

  // Calculate distances and sort by nearest
  const itemsWithDistance = items
    .map(item => {
      const dist = calculateDistance(
        location.latitude, location.longitude,
        item.location.latitude, item.location.longitude
      );
      const qty = type === 'donors' ? (item.quantity || 10) : (item.peopleCount || 10);
      const vehicle = assignVehicle(qty);
      const billing = calculateDeliveryFee(vehicle, dist);
      const eta = estimateDeliveryTime(vehicle, dist);
      return { ...item, distance: dist, vehicle, billing, eta };
    })
    .filter(item => item.distance < 25) // 25km radius
    .sort((a, b) => a.distance - b.distance);

  const handleAutoMatch = () => {
    const urgencyWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    
    const sorted = [...itemsWithDistance].sort((a, b) => {
        const uA = a.urgencyLevel ? urgencyWeight[a.urgencyLevel] || 0 : 0;
        const uB = b.urgencyLevel ? urgencyWeight[b.urgencyLevel] || 0 : 0;
        
        // Priority 1: Urgency (mostly for receivers)
        if (uA !== uB) return uB - uA;

        // Priority 2: Distance (if difference is significant, > 2km)
        if (Math.abs(a.distance - b.distance) > 2) {
            return a.distance - b.distance;
        }

        // Priority 3: Closest quantity match
        if (targetQuantity) {
            const qA = type === 'donors' ? (a.quantity || 0) : (a.peopleCount || 0);
            const qB = type === 'donors' ? (b.quantity || 0) : (b.peopleCount || 0);
            const diffA = Math.abs(qA - targetQuantity);
            const diffB = Math.abs(qB - targetQuantity);
            if (diffA !== diffB) return diffA - diffB;
        }

        // Default to pure distance
        return a.distance - b.distance;
    });

    const bestMatch = sorted[0];
    if (bestMatch) {
        setAutoMatchedId(bestMatch.id);
        setTimeout(() => {
            onSelect(bestMatch);
            setAutoMatchedId(null);
        }, 1200); 
    }
  };

  if (loading) {
    return (
      <div className="nearby-list">
        <div className="nearby-header">
          <h3 className="nearby-title">
            <span className={`panel-title-dot ${type === 'donors' ? 'dot-green' : 'dot-red'}`} />
            Nearby {type === 'donors' ? 'Donors' : 'Receivers'}
          </h3>
        </div>
        <div className="nearby-items">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  if (itemsWithDistance.length === 0) {
    return (
      <div className="nearby-empty">
        <MapPin size={24} strokeWidth={1.5} />
        <p>No {type} found nearby</p>
        <span>New {type} will appear here automatically</span>
      </div>
    );
  }

  return (
    <div className="nearby-list">
      <div className="nearby-header">
        <h3 className="nearby-title">
          <span className={`panel-title-dot ${type === 'donors' ? 'dot-green' : 'dot-red'}`} />
          Nearby {type === 'donors' ? 'Donors' : 'Receivers'}
        </h3>
        <span className="nearby-count">{itemsWithDistance.length} found</span>
      </div>

      <button
        type="button"
        onClick={handleAutoMatch}
        disabled={autoMatchedId !== null}
        className={`btn-base ${type === 'donors' ? 'btn-submit-green' : 'btn-submit-red'}`}
        style={{ width: '100%', marginTop: '0', marginBottom: '0.25rem', padding: '0.5rem', fontSize: '0.8125rem', gap: '0.375rem' }}
      >
        <Zap size={14} fill="currentColor" stroke="none" />
        {autoMatchedId !== null ? 'Matching...' : 'Auto Match'}
      </button>

      <div className="nearby-items">
        {itemsWithDistance.map(item => (
          <button
            key={item.id}
            className={`nearby-card ${type === 'donors' ? 'nearby-card-green' : 'nearby-card-red'}`}
            onClick={() => onSelect(item)}
            style={autoMatchedId === item.id ? { 
              boxShadow: type === 'donors' ? 'var(--glow-green)' : 'var(--glow-red)',
              borderColor: type === 'donors' ? 'var(--neon-green)' : 'var(--neon-red)',
              transform: 'translateX(4px)'
            } : {}}
          >
            <div className="nearby-card-top">
              <div className="nearby-card-info">
                {autoMatchedId === item.id && (
                  <div style={{ fontSize: '0.625rem', color: type === 'donors' ? 'var(--neon-green)' : 'var(--neon-red)', fontWeight: '800', marginBottom: '0.375rem', letterSpacing: '0.05em' }}>
                    BEST MATCH SELECTED ✨
                  </div>
                )}
                {type === 'donors' ? (
                  <>
                    <div className="nearby-card-name">
                      <Utensils size={13} />
                      <span>{item.foodType}</span>
                    </div>
                    <div className="nearby-card-meta">
                      {item.quantity} servings • Expires {new Date(item.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="nearby-card-name">
                      <Users size={13} />
                      <span>{item.peopleCount} people</span>
                    </div>
                    <div className="nearby-card-meta">
                      Urgency: {item.urgencyLevel}
                      {item.notes && ` • ${item.notes}`}
                    </div>
                  </>
                )}
              </div>
              <ChevronRight size={16} className="nearby-card-arrow" />
            </div>

            <div className="nearby-card-bottom">
              <div className="nearby-tag">
                <MapPin size={11} />
                {item.distance.toFixed(1)} km
              </div>
              <div className="nearby-tag">
                <Clock size={11} />
                ~{item.eta} min
              </div>
              <div className="nearby-tag nearby-tag-vehicle" style={{ borderColor: item.vehicle.color + '40', color: item.vehicle.color }}>
                {item.vehicle.emoji} {item.vehicle.label}
              </div>
              <div className="nearby-tag nearby-tag-price">
                ₹{item.billing.total}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NearbyList;
