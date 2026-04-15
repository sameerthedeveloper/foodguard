// ─── Firebase Configuration ────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDGm3VvhsFDf3PGKFqKZ1kdmrgMyuqHHLk",
  authDomain: "foodguard-93907.firebaseapp.com",
  projectId: "foodguard-93907",
  storageBucket: "foodguard-93907.firebasestorage.app",
  messagingSenderId: "65787933809",
  appId: "1:65787933809:web:667c84acc8ee7910a697d0",
  measurementId: "G-6GDH8EXVM4",
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const firestore = getFirestore(app);

// Current user ID — auto-attached to new documents
let _currentUserId = null;

// ─── Public API ──────────────────────────────────────────────────────────────
export const db = {
  setUserId(uid) { _currentUserId = uid; },

  async addDoc(collectionName, data) {
    const docData = {
      ...data,
      userId: data.userId || _currentUserId || null,
      createdAt: new Date().toISOString(),
    };
    const colRef = collection(firestore, collectionName);
    const docRef = await addDoc(colRef, docData);
    return { id: docRef.id };
  },

  async updateDoc(collectionName, docId, updates) {
    const docRef = doc(firestore, collectionName, docId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return true;
  },

  async removeDoc(collectionName, docId) {
    const docRef = doc(firestore, collectionName, docId);
    await deleteDoc(docRef);
  },

  async getDoc(collectionName, docId) {
    const docRef = doc(firestore, collectionName, docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  },

  /**
   * Subscribe to real-time updates for a collection.
   * Returns an unsubscribe function.
   */
  onSnapshot(collectionName, callback) {
    const colRef = collection(firestore, collectionName);
    return onSnapshot(colRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    });
  },

  async clearAll() {
    // In demo environments, you can manually delete collections by looping docs.
    // Generally shouldn't do this from client apps in production.
    for (const collectionName of ['donations', 'requests', 'orders']) {
      const snap = await getDocs(collection(firestore, collectionName));
      snap.forEach(d => deleteDoc(d.ref));
    }
  },

  async getCount(collectionName) {
    const snap = await getDocs(collection(firestore, collectionName));
    return snap.size;
  },

  GeoPoint: class GeoPoint {
    constructor(lat, lng) {
      this.latitude = lat;
      this.longitude = lng;
    }
  },
};
