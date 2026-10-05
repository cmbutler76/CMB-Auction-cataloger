CMB Auction Cataloger PWA

WHAT IS INCLUDED
- New auctions start at Lot 1.
- Sequential Save & Next Lot numbering.
- Multiple photos per lot.
- Camera capture and photo picker.
- Drag-to-reorder on desktop; photo ordering is preserved.
- Set Main Photo and Delete controls.
- Offline app shell via service worker.
- Local auction storage in IndexedDB (better suited to photo-heavy lots than localStorage).
- Editable title, description, maker/markings, condition and verification warnings.
- Low/high estimates and manual comparable-sale records.
- JSON backup export and CSV lot export.

IMPORTANT: INSTALLING ON IPHONE/IPAD
A PWA must be served from HTTPS (or localhost during development). Opening index.html directly from the Files app will not install the service worker/Home Screen PWA correctly.
1. Upload the contents of this folder to any HTTPS web host you control.
2. Open that HTTPS address in Safari on the iPhone/iPad.
3. Tap Share > Add to Home Screen.
4. Open CMB Cataloger from the Home Screen.

FILES / ICLOUD DRIVE EXPORT
Use Export Backup or Export CSV. iOS will offer its normal download/share/save workflow, where the file can be moved/saved in Files, iCloud Drive, or another installed storage provider.

AI / ONLINE COMPARABLES
The fields and workflow are present, but live AI photo analysis and online comparable-sale research need a secure server/backend. Do not place a private AI API key inside app.js or index.html.

DATA SAFETY
Local IndexedDB data is device/browser specific and can be lost if Safari website data is cleared. Export backups regularly, especially after a cataloging session.
