# Bike Bunker Advert Writer

Pulls your in-stock bikes from MotorDesk, lets you fill in the key details with dropdowns, and writes an AutoTrader advert (attention grabber + description) and a website advert with Claude. Copy each one straight into MotorDesk.

## Files

```
index.html                     the app
netlify/functions/stock.js     reads your stock from the MotorDesk API (key kept on the server)
netlify/functions/generate.js  writes the adverts with the Claude API (key kept on the server)
netlify.toml                   tells Netlify where the functions are
```

## Setup (about 15 minutes)

### 1. Get a MotorDesk API key
In MotorDesk, create an API key with **read access to vehicles** (the key looks like `key_id.secret`). If you can't find where to create one, ask MotorDesk support for "an API v2 key with vehicles read scope". Read-only is all this app needs.

### 2. Get a Claude API key
From console.anthropic.com > API keys. (You can reuse the one from your bike evaluation app, but a separate key makes it easier to see the cost of each.) Each advert costs roughly 1–2p.

### 3. Put it on GitHub and Netlify
Same way as your evaluation app:
1. Create a new GitHub repository and upload all these files, keeping the `netlify/functions` folder structure.
2. In Netlify: **Add new site > Import an existing project > GitHub** and pick the repo. Leave the build settings blank (netlify.toml handles it).

### 4. Add environment variables
Netlify > Site configuration > Environment variables:

| Name | Value |
|---|---|
| `MOTORDESK_API_KEY` | your MotorDesk key |
| `ANTHROPIC_API_KEY` | your Claude key |
| `APP_PASSWORD` | any password you like – **recommended**, stops anyone who finds the URL using your stock data or Claude credit |

Then **Deploys > Trigger deploy** so the functions pick them up.

### 5. First run
Open the site, click **Settings**, enter your app password, phone number and standard selling points, then Save. The badge at the top turns green ("Live · N bikes from MotorDesk") once it's connected.

## If something doesn't look right

- **Badge says "Demo mode"** – hover over it to see the error. Usually a missing or wrong `MOTORDESK_API_KEY`, or the key doesn't have vehicles read access. You can still use the app with the demo bikes or **+ Add manually**.
- **Some basics are blank (e.g. owners or mileage)** – MotorDesk might use different field names than expected. Click **Settings > Show raw MotorDesk data**, copy what appears and send it to Claude; the fix is a one-line change in `stock.js`.
- **Sold bikes are showing** – add an environment variable `MOTORDESK_STATUS` with the status name MotorDesk uses for in-stock bikes.

## Changing the dropdowns
All dropdown options are near the top of the script in `index.html` (the `DROPDOWNS` list). Add, remove or reword options there, and the advert writer picks them up automatically.

## Where your details are saved
Everything you enter for a bike (and the finished adverts) is saved in your browser on that computer, so you can come back to a bike later. It isn't shared between devices.
