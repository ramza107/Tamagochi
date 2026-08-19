let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let fleetUnsubscribe = null;
let authReady = false;
let authUser = null;

function isFirebaseEnabled() {
  const cfg = window.FLEET_CONFIG.firebase;
  return Boolean(cfg?.enabled && cfg?.apiKey && cfg?.projectId);
}

function initFirebase() {
  if (!isFirebaseEnabled() || firebaseApp) return false;

  firebaseApp = firebase.initializeApp(window.FLEET_CONFIG.firebase);
  firebaseAuth = firebase.auth();
  firebaseDb = firebase.firestore();

  firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

  firebaseAuth.onAuthStateChanged((user) => {
    authUser = user;
    authReady = true;
    document.dispatchEvent(new CustomEvent("fleet-auth-changed", { detail: { user } }));
  });

  return true;
}

function waitForAuthReady() {
  if (authReady) return Promise.resolve(authUser);
  return new Promise((resolve) => {
    document.addEventListener(
      "fleet-auth-changed",
      () => resolve(authUser),
      { once: true }
    );
  });
}

async function loginAdmin(email, password) {
  if (!isFirebaseEnabled()) return false;
  initFirebase();
  await firebaseAuth.signInWithEmailAndPassword(email.trim(), password);
  return true;
}

async function logoutAdmin() {
  if (firebaseAuth) {
    await firebaseAuth.signOut();
  }
  setAdminLoggedIn(false);
}

function isAdminLoggedIn() {
  if (isFirebaseEnabled()) {
    return Boolean(authUser);
  }
  return sessionStorage.getItem("transcargo-fleet-admin") === "1";
}

function setAdminLoggedIn(value) {
  if (isFirebaseEnabled()) return;
  if (value) {
    sessionStorage.setItem("transcargo-fleet-admin", "1");
  } else {
    sessionStorage.removeItem("transcargo-fleet-admin");
  }
}

async function loadFleetFromFirestore() {
  const snapshot = await firebaseDb.collection("trucks").get();
  const trucks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  trucks.sort((a, b) => `${a.city}${a.state}`.localeCompare(`${b.city}${b.state}`));

  let updatedAt = new Date().toISOString();
  try {
    const meta = await firebaseDb.collection("meta").doc("fleet").get();
    if (meta.exists && meta.data()?.updatedAt?.toDate) {
      updatedAt = meta.data().updatedAt.toDate().toISOString();
    }
  } catch {
    /* meta doc optional */
  }

  return { updatedAt, trucks };
}

async function touchFleetMeta() {
  await firebaseDb.collection("meta").doc("fleet").set(
    { updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
}

async function saveTruckToCloud(truck) {
  initFirebase();
  await firebaseDb.collection("trucks").doc(truck.id).set({
    city: truck.city,
    state: truck.state,
    lat: truck.lat,
    lng: truck.lng,
    equipment: truck.equipment,
    readyDate: truck.readyDate,
    status: truck.status,
    notes: truck.notes,
  });
  await touchFleetMeta();
}

async function deleteTruckFromCloud(id) {
  initFirebase();
  await firebaseDb.collection("trucks").doc(id).delete();
  await touchFleetMeta();
}

async function clearAllTrucksFromCloud() {
  initFirebase();
  const snapshot = await firebaseDb.collection("trucks").get();
  const batch = firebaseDb.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  await touchFleetMeta();
}

async function importTrucksToCloud(trucks) {
  initFirebase();
  const batch = firebaseDb.batch();
  trucks.forEach((truck) => {
    batch.set(firebaseDb.collection("trucks").doc(truck.id), {
      city: truck.city,
      state: truck.state,
      lat: truck.lat,
      lng: truck.lng,
      equipment: truck.equipment,
      readyDate: truck.readyDate,
      status: truck.status,
      notes: truck.notes,
    });
  });
  await batch.commit();
  await touchFleetMeta();
}

function subscribeFleetUpdates(onData) {
  if (!isFirebaseEnabled()) return null;
  initFirebase();

  if (fleetUnsubscribe) fleetUnsubscribe();

  fleetUnsubscribe = firebaseDb.collection("trucks").onSnapshot(
    async () => {
      const data = await loadFleetFromFirestore();
      onData(data);
    },
    (error) => {
      console.error("Fleet sync error", error);
      alert("Could not sync fleet map. Check internet connection.");
    }
  );

  return fleetUnsubscribe;
}

window.FleetFirebase = {
  isFirebaseEnabled,
  initFirebase,
  waitForAuthReady,
  loginAdmin,
  logoutAdmin,
  isAdminLoggedIn,
  setAdminLoggedIn,
  loadFleetFromFirestore,
  saveTruckToCloud,
  deleteTruckFromCloud,
  clearAllTrucksFromCloud,
  importTrucksToCloud,
  subscribeFleetUpdates,
};
