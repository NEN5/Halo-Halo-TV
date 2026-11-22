# Lumen

A mobile-first streaming web app (movies, TV, short dramas) with a tiny Node server that keeps your API keys private.

## Quick start

```bash
cp .env.example .env     # then fill in your providers
node server.js           # Node 18 or newer, no npm install needed
```

Open http://localhost:3000

With no `.env` (or with every `BASE_URL` blank) the app runs on built-in sample data, so you can preview the UI right away.

## Folder layout

```
lumen/
├── server.js          Static server + key-hiding proxy (reads .env)
├── .env.example       Provider settings template, copy to .env
├── package.json       `npm start` runs server.js
├── .gitignore         Keeps .env out of git
└── public/            Everything the browser loads
    ├── index.html     Page shell and script order
    ├── css/
    │   └── styles.css All styling
    └── js/
        ├── config.js  Endpoints, tabs, genres, JSON mappers   <- edit this to fit your API
        ├── data.js    Sample data used when no provider is set
        ├── api.js     Provider layer: talks to the proxy, merges providers
        ├── ui.js      Helpers, icons, poster and card builders
        ├── views.js   One function per screen (Movies, Shorts, Discover, Me, ...)
        └── app.js     Router and startup
```

Scripts are plain files loaded in that order, so there is no build step and `public/index.html` also opens directly from disk.

## Adding providers (.env)

Each provider is a block of variables named `MOVIES_<NAME>_...` or `SHORTS_<NAME>_...`. `NAME` is letters and digits only. A provider is active when its `BASE_URL` is filled in.

| Variable | Meaning |
| --- | --- |
| `LABEL` | Name shown in the app |
| `BASE_URL` | API root without trailing slash |
| `API_KEY` | Your key |
| `AUTH_HEADER` / `AUTH_PREFIX` | Header that carries the key and the text before it (default `Authorization` / `"Bearer "`) |
| `KEY_QUERY_PARAM` | Send the key as `?param=` instead of a header |
| `EXTRA_HEADERS` | `Name:Value;Name2:Value2` |

Keys stay on the server. The browser only sees provider names from `/api/providers` and calls `/api/proxy/<kind>/<id>/...`. Restart the server after editing `.env`.

## Matching your API's responses

Open `public/js/config.js`:

- `endpoints` holds the paths the app requests (`/home`, `/titles`, `/shorts`, ...).
- `mapTitle`, `mapHome`, `mapList`, `mapShorts` turn your JSON into the shape the UI expects:
  `{ id, title, poster, banner, type, tags, year, rating, synopsis, badge, corner, dubbing, latest, episodes: [{ n, title, src }] }`
- A provider with a different shape gets its own entry under `providers`, keyed by its lowercase `.env` name:

```js
providers: {
  alpha: { endpoints: { home: "/v2/home" }, mapTitle: r => ({ /* ... */ }) }
}
```

## Notes

- The proxy only forwards `GET` requests, only to the host in each provider's `BASE_URL`.
- Episode video links are played by the browser directly and are not proxied.
- Server options in `.env`: `PORT` (default 3000) and `HOST` (default 127.0.0.1; use `0.0.0.0` to reach it from your phone on the same Wi-Fi).
- Watch history and My List are stored in the browser (localStorage).
