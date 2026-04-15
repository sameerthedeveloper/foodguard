import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Heart, HandHeart, ArrowRight, Truck, CreditCard, Radio, Shield, MapPin, Sun, Moon, User, LogOut } from 'lucide-react';
import LoginModal from '../components/LoginModal';
import { auth } from '../lib/auth';

const LandingPage = ({ theme, toggleTheme, user }) => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);

  const handleLogin = (loggedInUser) => {
    setShowLogin(false);
    // Navigate to the appropriate page based on role
    if (loggedInUser.role === 'donor') navigate('/donate');
    else navigate('/request');
  };

  const handleLogout = () => {
    auth.logout();
  };

  return (
    <motion.div
      className="landing-wrapper"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Top-right controls */}
      <div className="landing-top-controls">
        <button className="landing-theme-toggle" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {user ? (
          <div className="landing-user-group">
            <button className="landing-user-btn" onClick={() => navigate('/profile')} title="Profile">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <span className="landing-user-avatar">{user.avatar || '👤'}</span>
              )}
              <span className="landing-user-name">{user.name?.split(' ')[0]}</span>
            </button>
            <button className="landing-logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button className="landing-signin-btn" onClick={() => setShowLogin(true)}>
            <User size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>

      <div className="landing-hero">
        <div className="landing-bg">
          <div className="grid-overlay" />
          <div className="glow-orb glow-orb-green" />
          <div className="glow-orb glow-orb-red" />
        </div>

        <div className="landing-content">
        <div className="landing-brand">
          <div className="landing-logo-wrap">
            <Leaf className="color-neon-green" size={36} />
          </div>
          <span className="landing-brand-text">
            FOOD<span className="brand-highlight">GUARD</span>
          </span>
        </div>

        <h1 className="landing-headline">
          Surplus food, delivered to those who need it most
        </h1>

        <p className="landing-tagline">
          Connect with donors and receivers nearby. Choose who to deliver to,
          assign vehicles automatically, and split billing — all in real-time.
        </p>

        <div className="feature-row">
          <div className="feature-item"><MapPin size={16} className="color-neon-green" /><span>Proximity Matching</span></div>
          <div className="feature-item"><Truck size={16} className="color-neon-blue" /><span>Smart Vehicles</span></div>
          <div className="feature-item"><CreditCard size={16} className="color-neon-purple" /><span>Split Billing</span></div>
          <div className="feature-item"><Radio size={16} className="color-neon-yellow" /><span>Live Tracking</span></div>
          <div className="feature-item"><Shield size={16} className="color-neon-red" /><span>Secure Payments</span></div>
        </div>

        <div className="role-cards">
          <button className="role-card role-card-donor" onClick={() => {
            if (user) {
              auth.updateProfile({ role: 'donor' });
              navigate('/donate');
            } else {
              setShowLogin(true);
            }
          }}>
            <div className="role-icon-wrap role-icon-green"><HandHeart size={28} /></div>
            <h2 className="role-title">I have food to donate</h2>
            <p className="role-desc">List your surplus food and choose a nearby receiver. We'll assign a vehicle and handle delivery.</p>
            <div className="role-cta role-cta-green">Start Donating <ArrowRight size={16} /></div>
          </button>

          <button className="role-card role-card-receiver" onClick={() => {
            if (user) {
              auth.updateProfile({ role: 'receiver' });
              navigate('/request');
            } else {
              setShowLogin(true);
            }
          }}>
            <div className="role-icon-wrap role-icon-red"><Heart size={28} /></div>
            <h2 className="role-title">I need food</h2>
            <p className="role-desc">Submit a request and browse available donors nearby. Select one and get food delivered to you.</p>
            <div className="role-cta role-cta-red">Request Food <ArrowRight size={16} /></div>
          </button>
        </div>

        <div className="how-it-works">
          <div className="how-step"><span className="how-step-num">1</span><span>List food or request</span></div>
          <div className="how-arrow">→</div>
          <div className="how-step"><span className="how-step-num">2</span><span>Choose match</span></div>
          <div className="how-arrow">→</div>
          <div className="how-step"><span className="how-step-num">3</span><span>Decide who pays</span></div>
          <div className="how-arrow">→</div>
          <div className="how-step"><span className="how-step-num">4</span><span>Track & pay</span></div>
        </div>

        <p className="landing-footer-text">Zero food wasted. Zero hunger ignored.</p>
        </div>
      </div>

      <div className="landing-stats-section">
        <div className="stats-header">
          <h2>The Paradox of Plenty</h2>
          <p>India produces enough food to feed everyone, yet millions go hungry while millions of tonnes are wasted every year.</p>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number red">111<span style={{fontSize: '2rem'}}>/125</span></div>
            <div className="stat-label">Global Hunger Index</div>
            <div className="stat-desc">India ranked 111th in the 2023 GHI, indicating a serious state of undernourishment and hunger.</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number yellow">74<span style={{fontSize: '2rem'}}>M+</span></div>
            <div className="stat-label">Tonnes of Food Wasted</div>
            <div className="stat-desc">An estimated 74 million tonnes of food is lost or wasted across India annually.</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number green">16<span style={{fontSize: '2rem'}}>%</span></div>
            <div className="stat-label">Population Undernourished</div>
            <div className="stat-desc">Due to supply chain inefficiencies, 16.6% of the population faces chronic lack of food access.</div>
          </div>
        </div>
      </div>

      <div className="landing-solution-section">
        <div className="solution-header">
          <h2>How FoodGuard Steps In</h2>
          <p>We bridge the gap between surplus and scarcity using real-time technology and community-driven logistics.</p>
        </div>
        
        <div className="solution-grid">
          <div className="solution-card">
            <div className="solution-icon color-neon-green"><MapPin size={32} /></div>
            <h3>Smart Proximity Matching</h3>
            <p>Our algorithm instantly connects food donors with the nearest available verified NGOs, minimizing transit time and preserving food quality.</p>
          </div>
          
          <div className="solution-card">
            <div className="solution-icon color-neon-blue"><Truck size={32} /></div>
            <h3>Automated Fleet Logistics</h3>
            <p>No transport? No problem. We automatically dispatch the right-sized vehicle from our partner network to pick up and deliver the food.</p>
          </div>
          
          <div className="solution-card">
            <div className="solution-icon color-neon-purple"><CreditCard size={32} /></div>
            <h3>Flexible Split Billing</h3>
            <p>Delivery costs shouldn't be a barrier. Donors and receivers can choose to split the delivery fee, or cover it entirely, making the process frictionless.</p>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />}
    </motion.div>
  );
};

export default LandingPage;
