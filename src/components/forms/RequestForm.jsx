import React, { useState } from 'react';
import { db } from '../../lib/firebase';

const URGENCY_LEVELS = [
  { label: 'Critical', desc: 'Immediate', className: 'urgency-critical' },
  { label: 'High', desc: '1–2 hours', className: 'urgency-high' },
  { label: 'Medium', desc: 'Within today', className: 'urgency-medium' },
  { label: 'Low', desc: 'Planning ahead', className: 'urgency-low' },
];

const RequestForm = ({ user }) => {
  const [peopleCount, setPeopleCount] = useState(15);
  const [urgencyLevel, setUrgencyLevel] = useState('High');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitWithLocation = async (lat, lng) => {
      const doc = {
        peopleCount: Number(peopleCount),
        urgencyLevel,
        notes,
        matched: false,
        userId: user?.id || null,
        userName: user?.name || 'Anonymous',
        location: { latitude: lat, longitude: lng }
      };
      await db.addDoc('requests', doc);
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
        <div className="form-success-icon form-success-red">✓</div>
        <p className="form-success-text">Request submitted!</p>
        <p className="form-success-sub">Select a donor below to start delivery</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-stack">
      <div className="form-group">
        <div className="range-wrapper">
          <div className="range-header">
            <label className="form-label" style={{ marginBottom: 0 }}>People to Feed</label>
            <span className="range-value">{peopleCount}</span>
          </div>
          <input
            type="range"
            min="1"
            max="500"
            value={peopleCount}
            onChange={(e) => setPeopleCount(Number(e.target.value))}
            className="red-range"
          />
        </div>
      </div>

      <div className="form-separator" />

      <div className="form-group">
        <label className="form-label">Urgency Level</label>
        <div className="urgency-grid">
          {URGENCY_LEVELS.map((level) => (
            <button
              type="button"
              key={level.label}
              className={`urgency-option ${level.className} ${urgencyLevel === level.label ? 'selected' : ''}`}
              onClick={() => setUrgencyLevel(level.label)}
            >
              <span className="urgency-dot" />
              <span>
                <strong>{level.label}</strong>
                <br />
                <span style={{ opacity: 0.7, fontSize: '0.625rem' }}>{level.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Additional Notes</label>
        <input
          type="text"
          className="input-base"
          placeholder="e.g. Vegetarian only, kids, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-base btn-submit-red">
        {isSubmitting ? '📡 Locating...' : '✓ Submit Request'}
      </button>
    </form>
  );
};

export default RequestForm;
