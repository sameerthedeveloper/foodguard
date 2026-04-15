# FoodGuard 2.0

FoodGuard 2.0 is a real-time web application designed to combat food waste by seamlessly connecting excess food donors with people and organizations in need. 

With a dynamic, live-updating map interface and real-time database support, FoodGuard efficiently routes resources straight to those who need them most.

## 🚀 Key Features

- **Live Dynamic Map:** Powered by `react-leaflet` and Leaflet, displaying live donor locations, requesters, and trackable active deliveries.
- **Real-Time Database:** Integrated natively with Firebase **Firestore Database** for instantaneous syncing of orders, donations, and requests across all active client browsers via WebSockets.
- **Smart Routing & Estimation:** Utilizes the Open Source Routing Machine (OSRM) to calculate immediate driver routes, dynamically estimating distances (`distanceKm`), ETAs, and generating coordinate waypoints.
- **Beautiful UI/Animations:** Leveraging `framer-motion` for fluid component layouts and page transitions.

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite, React Router DOM v7
- **Styling:** CSS3 & Lucide React Icons
- **Database / Auth:** Firebase (Firestore / Authentication)
- **Mapping & Routing:** Leaflet, React-Leaflet, OSRM (Open Source Routing Machine) API
- **Animations:** Framer Motion

## 📦 Local Setup & Installation

Follow these instructions to run the FoodGuard 2.0 application locally.

### 1. Clone the repository
```bash
git clone https://github.com/sameerthedeveloper/foodguard2.0.git
cd foodguard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Firebase Configuration
Ensure that your Firebase project has Firestore Database activated. Update your API parameters inside `src/lib/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 4. Run the Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

## 💻 Available Scripts

- `npm run dev`: Starts the local development server utilizing Vite.
- `npm run build`: Compiles the application into the `dist/` directory for production targeting.
- `npm run lint`: Analyzes code syntax and formatting using ESLint.
- `npm run preview`: Previews the production build locally.

## 🌱 Demo Seeding

If the database is entirely empty, the application will automatically populate some demo data points on coordinates scattered around the default central location so you can test features gracefully without needing to generate multiple simulated accounts.
