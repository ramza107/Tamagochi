const STORAGE_KEY = "transcargo-fleet-data-v1";

function generateId() {
  return `truck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatDate(isoDate) {
  if (!isoDate) return "—";
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function equipmentLabel(type) {
  return window.FLEET_CONFIG.equipment[type]?.label ?? type;
}

function equipmentColor(type) {
  return window.FLEET_CONFIG.equipment[type]?.color ?? "#64748b";
}

async function loadFleetData() {
  if (isFirebaseEnabled()) {
    initFirebase();
    return loadFleetFromFirestore();
  }

  const cached = readCachedFleet();
  if (cached?.trucks?.length) {
    return cached;
  }

  try {
    const response = await fetch(`${window.FLEET_CONFIG.dataUrl}?t=${Date.now()}`);
    if (!response.ok) throw new Error("Failed to load fleet.json");
    return await response.json();
  } catch (error) {
    console.warn("Using empty fleet fallback", error);
    return { updatedAt: new Date().toISOString(), trucks: [] };
  }
}

function readCachedFleet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveFleetDataLocal(data) {
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

async function saveFleetData(data) {
  if (isFirebaseEnabled()) {
    return data;
  }
  return saveFleetDataLocal(data);
}

async function persistTruck(truck) {
  if (isFirebaseEnabled()) {
    await saveTruckToCloud(truck);
    return null;
  }

  const index = window.fleetData.trucks.findIndex((item) => item.id === truck.id);
  if (index >= 0) {
    window.fleetData.trucks[index] = truck;
  } else {
    window.fleetData.trucks.push(truck);
  }
  return saveFleetDataLocal(window.fleetData);
}

async function removeTruck(id) {
  if (isFirebaseEnabled()) {
    await deleteTruckFromCloud(id);
    return null;
  }

  window.fleetData.trucks = window.fleetData.trucks.filter((item) => item.id !== id);
  return saveFleetDataLocal(window.fleetData);
}

async function replaceAllTrucks(trucks) {
  if (isFirebaseEnabled()) {
    await clearAllTrucksFromCloud();
    await importTrucksToCloud(trucks);
    return null;
  }

  return saveFleetDataLocal({ trucks, updatedAt: new Date().toISOString() });
}

function exportFleetJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "fleet.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.hamlet ||
      "";
    const state = data.address?.state || "";
    return { city, state };
  } catch {
    return null;
  }
}

function updateSyncStatus() {
  const el = document.querySelector("#sync-status");
  if (!el) return;

  if (isFirebaseEnabled()) {
    el.textContent = isAdminLoggedIn()
      ? "Live cloud sync · you are signed in"
      : "Live cloud sync · map updates automatically";
    el.classList.add("sync-live");
  } else {
    el.textContent = "Demo mode · changes stay in this browser only";
    el.classList.remove("sync-live");
  }
}

window.FleetStore = {
  STORAGE_KEY,
  generateId,
  formatDate,
  equipmentLabel,
  equipmentColor,
  loadFleetData,
  saveFleetData,
  persistTruck,
  removeTruck,
  replaceAllTrucks,
  exportFleetJson,
  reverseGeocode,
  updateSyncStatus,
};

Object.assign(window, window.FleetStore);
Object.assign(window, window.FleetFirebase);
