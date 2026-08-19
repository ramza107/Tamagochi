function applyCompanyBranding() {
  const cfg = window.FLEET_CONFIG.company;
  document.title = `${cfg.name} | Fleet Availability Map`;

  const setText = (selector, value) => {
    const el = document.querySelector(selector);
    if (el && value) el.textContent = value;
  };

  setText("#brand-name", cfg.name);
  setText("#brand-tag", cfg.shortName);
  setText("#hero-title", cfg.name);
  setText("#hero-tagline", cfg.tagline);
  setText("#contact-phone", cfg.phone);
  setText("#contact-email", cfg.email);
  setText("#contact-mc", `MC ${cfg.mcNumber.replace(/^MC-?/i, "")}`);
  setText("#contact-dot", `USDOT ${cfg.dotNumber.replace(/^DOT\s?/i, "")}`);
  setText("#contact-hq", cfg.headquarters);
  setText("#footer-copy", `© ${new Date().getFullYear()} ${cfg.name}. All rights reserved.`);

  const mailLink = document.querySelector("#contact-email-link");
  if (mailLink) mailLink.href = `mailto:${cfg.email}`;
  const phoneLink = document.querySelector("#contact-phone-link");
  if (phoneLink) phoneLink.href = `tel:${cfg.phone.replace(/\D/g, "")}`;
}

function bindUiEvents() {
  document.querySelector("#btn-view-map")?.addEventListener("click", () => {
    document.querySelector("#fleet-map-section")?.scrollIntoView({ behavior: "smooth" });
  });

  document.querySelector("#admin-entry")?.addEventListener("click", (event) => {
    event.preventDefault();
    if (isAdminLoggedIn()) {
      openAdminModal();
    } else {
      document.querySelector("#login-modal")?.classList.add("open");
    }
  });

  document.querySelector("#login-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = document.querySelector("#admin-password").value;
    if (password === window.FLEET_CONFIG.adminPassword) {
      setAdminLoggedIn(true);
      document.querySelector("#login-modal")?.classList.remove("open");
      document.querySelector("#admin-password").value = "";
      openAdminModal();
    } else {
      alert("Incorrect password.");
    }
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      button.closest(".modal-backdrop")?.classList.remove("open");
    });
  });

  document.querySelector("#btn-save-truck")?.addEventListener("click", saveTruckFromForm);
  document.querySelector("#btn-delete-truck")?.addEventListener("click", deleteSelectedTruck);
  document.querySelector("#btn-new-truck")?.addEventListener("click", () => {
    clearTruckForm();
    document.querySelector("#admin-form-title").textContent = "Add new truck";
  });

  document.querySelector("#btn-export-fleet")?.addEventListener("click", () => {
    exportFleetJson(window.fleetData);
  });

  document.querySelector("#btn-import-fleet")?.addEventListener("click", () => {
    document.querySelector("#fleet-import-input")?.click();
  });

  document.querySelector("#fleet-import-input")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) importFleetJson(file);
    event.target.value = "";
  });

  document.querySelector("#btn-reset-fleet")?.addEventListener("click", resetFleetFromServer);

  document.querySelector("#btn-admin-logout")?.addEventListener("click", () => {
    setAdminLoggedIn(false);
    closeAdminModal();
    alert("Logged out of admin.");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  applyCompanyBranding();
  initMap();
  await bootstrapFleet();
  bindUiEvents();
});
