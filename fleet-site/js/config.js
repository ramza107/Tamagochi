/** Site & admin configuration — change company details and admin password here. */
window.FLEET_CONFIG = {
  company: {
    name: "American Box & Conestoga Co.",
    shortName: "AB&C Freight",
    tagline: "Specialized 26′ box trucks & 16′ Conestoga trailers nationwide",
    phone: "(888) 555-0142",
    email: "dispatch@abcfreight.com",
    mcNumber: "MC-482917",
    dotNumber: "DOT 3891042",
    headquarters: "Kansas City, MO",
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
  /** Change this password before going live. */
  adminPassword: "fleetadmin",
  map: {
    center: [39.8283, -98.5795],
    zoom: 4,
    minZoom: 3,
    maxZoom: 12,
  },
  dataUrl: "./data/fleet.json",
};
