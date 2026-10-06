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
