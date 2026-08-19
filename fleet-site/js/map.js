let map;
let markerLayer;
window.fleetData = { trucks: [] };
let selectedTruckId = null;
let pendingLatLng = null;

function createMarkerIcon(color) {
  return L.divIcon({
    className: "fleet-marker",
    html: `<span style="
      display:block;
      width:18px;
      height:18px;
      border-radius:50%;
      background:${color};
      border:3px solid #fff;
      box-shadow:0 2px 8px rgba(15,23,42,.35);
    "></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function popupHtml(truck) {
  const cfg = window.FLEET_CONFIG.equipment[truck.equipment];
  return `
    <div class="popup-title">${equipmentLabel(truck.equipment)}</div>
    <div>${truck.city}, ${truck.state}</div>
    <div class="popup-meta">Ready: <strong>${formatDate(truck.readyDate)}</strong></div>
    ${truck.notes ? `<div class="popup-meta">${truck.notes}</div>` : ""}
    <div class="popup-meta">${cfg?.description?.slice(0, 80) ?? ""}</div>
  `;
}

function renderMapMarkers() {
  if (!markerLayer) return;
  markerLayer.clearLayers();

  window.fleetData.trucks.forEach((truck) => {
    const marker = L.marker([truck.lat, truck.lng], {
      icon: createMarkerIcon(equipmentColor(truck.equipment)),
    }).bindPopup(popupHtml(truck));

    marker.on("click", () => {
      if (isAdminLoggedIn()) {
        selectTruckForEdit(truck.id);
      }
    });

    markerLayer.addLayer(marker);
  });
}

function renderFleetTable() {
  const tbody = document.querySelector("#fleet-table-body");
  if (!tbody) return;

  tbody.innerHTML = window.fleetData.trucks
    .map(
      (truck) => `
      <tr>
        <td>${truck.city}, ${truck.state}</td>
        <td>${equipmentLabel(truck.equipment)}</td>
        <td>${formatDate(truck.readyDate)}</td>
        <td><span class="status-pill">${truck.status || "available"}</span></td>
        <td>${truck.notes || "—"}</td>
      </tr>
    `
    )
    .join("");

  const updated = document.querySelector("#fleet-updated");
  if (updated) {
    updated.textContent = window.fleetData.updatedAt
      ? `Last updated ${formatDate(window.fleetData.updatedAt.slice(0, 10))}`
      : "";
  }
}

function initMap() {
  const cfg = window.FLEET_CONFIG.map;
  map = L.map("fleet-map", {
    center: cfg.center,
    zoom: cfg.zoom,
    minZoom: cfg.minZoom,
    maxZoom: cfg.maxZoom,
    scrollWheelZoom: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);

  map.on("click", async (event) => {
    if (!isAdminLoggedIn()) return;
    pendingLatLng = event.latlng;
    clearTruckForm();
    document.querySelector("#truck-lat").value = event.latlng.lat.toFixed(5);
    document.querySelector("#truck-lng").value = event.latlng.lng.toFixed(5);

    const geo = await reverseGeocode(event.latlng.lat, event.latlng.lng);
    if (geo?.city) document.querySelector("#truck-city").value = geo.city;
    if (geo?.state) document.querySelector("#truck-state").value = geo.state;

    document.querySelector("#admin-form-title").textContent = "Add truck at map location";
    openAdminModal();
  });
}

function refreshFleetViews(data) {
  window.fleetData = data;
  renderMapMarkers();
  renderFleetTable();
  renderAdminList();
}

async function bootstrapFleet() {
  if (isFirebaseEnabled()) {
    initFirebase();
    subscribeFleetUpdates((data) => {
      refreshFleetViews(data);
      updateSyncStatus();
    });
    return;
  }

  const data = await loadFleetData();
  refreshFleetViews(data);
  updateSyncStatus();
}

function selectTruckForEdit(id) {
  const truck = window.fleetData.trucks.find((item) => item.id === id);
  if (!truck) return;
  selectedTruckId = id;
  fillTruckForm(truck);
  document.querySelector("#admin-form-title").textContent = "Edit truck";
  openAdminModal();
}

function fillTruckForm(truck) {
  document.querySelector("#truck-id").value = truck.id;
  document.querySelector("#truck-city").value = truck.city || "";
  document.querySelector("#truck-state").value = truck.state || "";
  document.querySelector("#truck-lat").value = truck.lat ?? "";
  document.querySelector("#truck-lng").value = truck.lng ?? "";
  document.querySelector("#truck-equipment").value = truck.equipment || "box-26";
  document.querySelector("#truck-ready").value = truck.readyDate || "";
  document.querySelector("#truck-status").value = truck.status || "available";
  document.querySelector("#truck-notes").value = truck.notes || "";
  document.querySelector("#btn-delete-truck").classList.remove("hidden");
}

function clearTruckForm() {
  selectedTruckId = null;
  document.querySelector("#truck-id").value = "";
  document.querySelector("#truck-city").value = "";
  document.querySelector("#truck-state").value = "";
  document.querySelector("#truck-lat").value = pendingLatLng?.lat?.toFixed(5) ?? "";
  document.querySelector("#truck-lng").value = pendingLatLng?.lng?.toFixed(5) ?? "";
  document.querySelector("#truck-equipment").value = "box-26";
  document.querySelector("#truck-ready").value = new Date().toISOString().slice(0, 10);
  document.querySelector("#truck-status").value = "available";
  document.querySelector("#truck-notes").value = "";
  document.querySelector("#btn-delete-truck").classList.add("hidden");
}

function readTruckForm() {
  return {
    id: document.querySelector("#truck-id").value || generateId(),
    city: document.querySelector("#truck-city").value.trim(),
    state: document.querySelector("#truck-state").value.trim(),
    lat: parseFloat(document.querySelector("#truck-lat").value),
    lng: parseFloat(document.querySelector("#truck-lng").value),
    equipment: document.querySelector("#truck-equipment").value,
    readyDate: document.querySelector("#truck-ready").value,
    status: document.querySelector("#truck-status").value,
    notes: document.querySelector("#truck-notes").value.trim(),
  };
}

function validateTruck(truck) {
  if (!truck.city || !truck.state) return "City and state are required.";
  if (Number.isNaN(truck.lat) || Number.isNaN(truck.lng)) return "Valid map coordinates are required.";
  if (!truck.readyDate) return "Ready date is required.";
  return null;
}

async function saveTruckFromForm() {
  const truck = readTruckForm();
  const error = validateTruck(truck);
  if (error) {
    alert(error);
    return;
  }

  const saveBtn = document.querySelector("#btn-save-truck");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  try {
    const saved = await persistTruck(truck);
    if (saved) refreshFleetViews(saved);
    clearTruckForm();
    document.querySelector("#admin-form-title").textContent = "Add or edit truck";
    if (isFirebaseEnabled()) {
      alert("Saved — everyone can see this truck now.");
    }
  } catch (err) {
    console.error(err);
    alert("Could not save truck. Check internet and try again.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save truck";
  }
}

async function deleteSelectedTruck() {
  if (!selectedTruckId) return;
  if (!confirm("Delete this truck from the map?")) return;

  try {
    const saved = await removeTruck(selectedTruckId);
    if (saved) refreshFleetViews(saved);
    clearTruckForm();
  } catch (err) {
    console.error(err);
    alert("Could not delete truck. Check internet and try again.");
  }
}

function renderAdminList() {
  const list = document.querySelector("#admin-truck-list");
  if (!list) return;

  list.innerHTML = window.fleetData.trucks
    .map(
      (truck) => `
      <div class="admin-list-item">
        <div>
          <strong>${truck.city}, ${truck.state}</strong><br>
          <span class="popup-meta">${equipmentLabel(truck.equipment)} · Ready ${formatDate(truck.readyDate)}</span>
        </div>
        <button class="btn btn-secondary btn-small" data-edit-id="${truck.id}">Edit</button>
      </div>
    `
    )
    .join("");

  list.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => selectTruckForEdit(button.dataset.editId));
  });
}

async function importFleetJson(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed.trucks)) throw new Error("Invalid fleet.json");
      const saved = await replaceAllTrucks(parsed.trucks);
      if (saved) refreshFleetViews(saved);
      alert("Fleet imported successfully.");
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    }
  };
  reader.readAsText(file);
}

async function clearAllTrucks() {
  if (!confirm("Remove ALL trucks from the map? Use this each morning before adding today's fleet.")) {
    return;
  }

  try {
    const saved = await replaceAllTrucks([]);
    if (saved) refreshFleetViews(saved);
    clearTruckForm();
  } catch (err) {
    console.error(err);
    alert("Could not clear fleet. Check internet and try again.");
  }
}

function resetFleetFromServer() {
  if (isFirebaseEnabled()) {
    alert("Cloud mode is on — the map already syncs automatically.");
    return;
  }
  if (!confirm("Reset to default fleet.json from server? Local changes will be lost.")) return;
  localStorage.removeItem(STORAGE_KEY);
  bootstrapFleet();
}

window.FleetMap = {
  initMap,
  bootstrapFleet,
  refreshFleetViews,
  saveTruckFromForm,
  deleteSelectedTruck,
  clearTruckForm,
  importFleetJson,
  resetFleetFromServer,
  clearAllTrucks,
  openAdminModal: () => document.querySelector("#admin-modal")?.classList.add("open"),
};

function openAdminModal() {
  document.querySelector("#admin-modal")?.classList.add("open");
}

function closeAdminModal() {
  document.querySelector("#admin-modal")?.classList.remove("open");
}

window.openAdminModal = openAdminModal;
window.closeAdminModal = closeAdminModal;
