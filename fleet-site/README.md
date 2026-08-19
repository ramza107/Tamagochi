# American Box & Conestoga Co. — Fleet Site

Static business-card website for a US trucking carrier specializing in **26′ box trucks** and **16′ Conestoga** trailers.

## Features

- Professional landing page (services, contact, authority numbers)
- Interactive **USA map** (Leaflet + OpenStreetMap)
- Truck pins with equipment type and **ready-for-load dates**
- Public availability table
- **Admin panel** (password protected) to add, edit, and delete truck locations

## Quick start

Serve the folder locally:

```bash
cd fleet-site
python3 -m http.server 8080
```

Open http://localhost:8080

## Admin

1. Click **Admin** in the footer
2. Default password: `fleetadmin` (change in `js/config.js` → `adminPassword`)
3. Sign in, then:
   - **Click the map** to place a new truck
   - Fill city/state, equipment, ready date
   - **Save truck**

### Publishing updates for all visitors

Admin edits are stored in the browser (`localStorage`) for instant preview.

To update what **everyone** sees on the live site:

1. In admin, click **Export fleet.json**
2. Replace `data/fleet.json` with the downloaded file
3. Redeploy / push to hosting

Or use **Import JSON** on another device after export.

## Customize company info

Edit `js/config.js`:

- Company name, phone, email, MC/DOT numbers
- Admin password
- Map default center/zoom

## Deploy (GitHub Pages)

This folder is self-contained static HTML. Point Pages to `/fleet-site` or copy contents to your site root.

Example workflow branch: `cursor/trucking-fleet-site-249e`.

## Stack

- HTML / CSS / vanilla JS
- [Leaflet](https://leafletjs.com/) for the map
- OpenStreetMap tiles
- Optional Nominatim reverse geocoding on map click (admin only)
