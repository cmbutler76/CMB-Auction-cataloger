CMB AUCTION CATALOGER — READY TO UPLOAD

WHAT IS INCLUDED
- index.html — the auction cataloger app
- manifest.webmanifest — makes the site installable on iPhone/iPad
- sw.js — basic offline app shell
- icon-192.png and icon-512.png — Home Screen icons
- netlify/functions/analyze.mjs — secure AI photo-analysis function
- netlify.toml — Netlify configuration

IMPORTANT
1. Upload the CONTENTS of this ZIP to a Netlify project (or connect the folder/repository to Netlify).
2. In Netlify, add the environment variable:
      OPENAI_API_KEY = your OpenAI API key
   Keep it marked as secret/sensitive.
3. Redeploy after adding the variable.
4. Open the Netlify site URL in Safari on the iPad/iPhone.
5. Use Share > Add to Home Screen.

The app starts at Lot 1.
The API key is NOT stored in the browser or this ZIP.
The AI button calls /.netlify/functions/analyze automatically.

Note: GitHub Pages alone cannot run the included Netlify server function. If you publish only the static files to GitHub Pages, AI photo analysis will not work unless the frontend is changed to call a separately deployed backend.

AI VALUE ESTIMATES (October 2026)
The Analyze All Photos button now fills low/high USD auction hammer-price estimates, valuation confidence/condition notes, and source-backed comparable prices when available. Estimates cover the whole lot, before shipping, tax or buyer fees. Sold and asking comparables are explicitly labeled. Dates remain blank unless the source provides them. Unidentifiable items may have no range, with an explanation. All generated fields remain editable.

AI requires internet access, OPENAI_API_KEY in Netlify, and API credit. It uses the existing gpt-5-mini model with web search; search adds usage cost. Photos stay local for backups; analysis sends reduced photos to the secure server function and OpenAI. The key is never included in browser code.

Saved lot data uses the existing cmbAuctionLots storage key. Updating the app does not clear saved lots. Export a backup regularly. Reopen or refresh the installed app while online to load this update.

Validation: node --test test/valuation.test.mjs
