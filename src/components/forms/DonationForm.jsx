import React, { useState } from 'react';
import { db } from '../../lib/firebase';

const FOOD_TYPES = [
  { label: 'Cooked Meals', emoji: '🍛' },
  { label: 'Fresh Produce', emoji: '🥬' },
  { label: 'Packaged Goods', emoji: '📦' },
  { label: 'Baked Goods', emoji: '🍞' },
  { label: 'Dairy', emoji: '🥛' },
  { label: 'Beverages', emoji: '🧃' },
  { label: 'Canned Food', emoji: '🥫' },
  { label: 'Grains & Pulses', emoji: '🌾' },
  { label: 'Frozen Food', emoji: '🧊' },
  { label: 'Snacks', emoji: '🍪' },
  { label: 'Baby Food', emoji: '🍼' },
  { label: 'Buffet Surplus', emoji: '🍱' },
];

const DonationForm = ({ user }) => {
  const [foodType, setFoodType] = useState('Cooked Meals');
  const [quantity, setQuantity] = useState(10);
  const defaultTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const [expiry, setExpiry] = useState(defaultTime.toISOString().slice(0, 16));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitWithLocation = async (lat, lng) => {
      const doc = {
        foodType,
        quantity: Number(quantity),
        expiryTime: new Date(expiry).toISOString(),
        matched: false,
        userId: user?.id || null,
        userName: user?.name || 'Anonymous',
        location: { latitude: lat, longitude: lng }
      };
      await db.addDoc('donations', doc);
      setIsSubmitting(false);
      setSubmitted(true);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Success case with jitter
          const lat = position.coords.latitude + (Math.random() * 0.01 - 0.005);
          const lng = position.coords.longitude + (Math.random() * 0.01 - 0.005);
          await submitWithLocation(lat, lng);
        },
        async (error) => {
          console.warn("Geolocation failed, using fallback:", error.message);
          // Fallback to Delhi with jitter
          const lat = 28.6139 + (Math.random() * 0.01 - 0.005);
          const lng = 77.2090 + (Math.random() * 0.01 - 0.005);
          await submitWithLocation(lat, lng);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      // Geolocation not supported, use fallback
      const lat = 28.6139 + (Math.random() * 0.01 - 0.005);
      const lng = 77.2090 + (Math.random() * 0.01 - 0.005);
      await submitWithLocation(lat, lng);
    }
  };

  if (submitted) {
    return (
      <div className="form-success">
        <div className="form-success-icon">✓</div>
        <p className="form-success-text">Donation listed!</p>
        <p className="form-success-sub">Select a receiver below to start delivery</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-stack">
      <div className="form-group">
        <label className="form-label">Food Type</label>
        <div className="food-type-grid">
          {FOOD_TYPES.map((item) => (
            <button
              type="button"
              key={item.label}
              className={`food-type-option ${foodType === item.label ? 'selected' : ''}`}
              onClick={() => setFoodType(item.label)}
            >
              <span className="food-type-emoji">{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-separator" />

      <div className="form-group">
        <div className="range-wrapper">
          <div className="range-header">
            <label className="form-label" style={{ marginBottom: 0 }}>Servings</label>
            <span className="range-value">{quantity}</span>
          </div>
          <input
            type="range"
            min="1"
            max="200"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Expires At</label>
        <input
          type="datetime-local"
          className="input-base"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
        />
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-base btn-submit-green">
        {isSubmitting ? '📡 Locating...' : '✓ List Donation'}
      </button>
    </form>
  );
};

export default DonationForm;
