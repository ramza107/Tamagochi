/** Cloud sync via Firebase — set enabled: true after one-time setup (see SETUP-RU.md). */
window.FLEET_CONFIG = {
  company: {
    name: "Transcargo",
    shortName: "Transcargo Logistics",
    tagline: "26′ box trucks & 16′ Conestoga trailers — HQ in Las Vegas, serving all 50 states",
    phone: "(888) 555-0142",
    email: "dispatch@transcargo.com",
    mcNumber: "MC-482917",
    dotNumber: "DOT 3891042",
    headquarters: "Las Vegas, NV",
  },
  equipment: {
    "box-26": {
      label: "26′ Box Truck",
      description: "Dry van box, dock-high, liftgate available. Ideal for LTL and regional runs.",
      color: "#e85d04",
    },
    "conestoga-16": {
      label: "16′ Conestoga",
      description: "Rolling tarp Conestoga for secure flatbed-style loads with weather protection.",
      color: "#1d4ed8",
    },
  },
  /** Used only when firebase.enabled is false (offline demo mode). */
  adminPassword: "fleetadmin",
  /** Login email hint for admin (must match Firebase user you create). */
  adminEmail: "dispatch@transcargo.com",
  firebase: {
    enabled: false,
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  },
  map: {
    center: [39.8283, -98.5795],
    zoom: 4,
    minZoom: 3,
    maxZoom: 12,
  },
  dataUrl: "./data/fleet.json",
};
