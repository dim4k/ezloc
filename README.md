# 🏡 EzLoc - Website & CMS

This project is the showcase website for vacation rentals.
It includes a **self-hosted CMS (PocketBase)** allowing you to manage all content (texts, images, pricing, SEO) without touching the code.

---

## 🚀 Installation & Startup

### Prerequisites
*   **Docker** and **Docker Compose** installed on your machine.
*   **Node.js** (optional, only for local development).

### 1. Start the Project
The project uses a single Docker image containing both the backend (PocketBase) and the frontend.
**The Docker build automatically compiles the Tailwind CSS.**

```bash
# Start (and build) the container
docker-compose up --build
```

*   **Website**: [http://localhost:8090](http://localhost:8090)
*   **Admin Interface**: [http://localhost:8090/_/](http://localhost:8090/_/)

### 2. Data Initialization (First Run)

**0. Create the superuser (admin) account**
On first start, PocketBase prints a one-time installer link in the logs (`docker-compose logs app`): open it to create the superuser, with a long unique password. You can also create it from the command line (the password then stays in your shell history):

```bash
docker-compose exec app /pocketbase superuser upsert admin@example.com 'a-long-unique-password' --dir=/pb_data
```

**1. Prepare Configuration**
The `setup/config.json` file is ignored by Git. Copy the template to create your own configuration:

```bash
cp setup/config.json.dist setup/config.json
```
Then modify `setup/config.json` with your house information.

**2. Run Initialization**
Once the container is running and the config is ready, run the initialization script.
**Note:** If you are re-installing, it is recommended to stop Docker and delete the `pb_data` directory to ensure a clean schema application.

```bash
# Asks for the superuser password (and the code sent by email when two-factor login is on)
node setup/init_cms.js admin@example.com
```

This script will:
1.  Authenticate with PocketBase (password asked interactively, or read from `PB_ADMIN_PASSWORD`).
2.  Populate the database with data from `config.json`.
3.  Upload images from `setup/img/`.

*(The database schema is automatically applied via migrations in `pb_migrations/` at startup.)*

---

## 🛠️ Configuration & SEO

### Configuration Files
*   **`setup/config.json`**: Contains all initial site data. This is the source of truth for the first installation.
*   **`setup/img/`**: Contains initial images.

### Dynamic SEO
The `index.html` file is generic and contains placeholders (`{{SEO_TITLE}}`, `{{SEO_DESCRIPTION}}`, `{{SEO_URL}}`).
At Docker container startup, a script (`entrypoint.sh`) injects the values of these environment variables. `SEO_URL` (with its trailing slash) is also the canonical URL.

The site is rendered in the browser, and search engines or AI crawlers that do not run JavaScript would receive an empty page. So `pb_hooks/seo.pb.js` renders the home page on the server, from the CMS:
*   **Content**: the CMS texts as plain HTML inside `<app-root>` (one `<h1>`, the rooms, activities, prices, map details, reviews, FAQ, contact). The app replaces it on start; it only shows if the app has not started after 4 seconds.
*   **Head**: favicon (`site_identity.favicon`), share image (the first `hero_slides` photo, else `welcome.image`, cropped to 1200×630), font preloads, and the structured data: `VacationRental` and `FAQPage` (JSON-LD).
*   **Data**: the CMS content is inlined in the page, so the app needs no API call. `/api/site` returns the same content in one response.
*   **Sitemap**: `/sitemap.xml` with the photos and the published pages. `robots.txt` (generated at startup) points to it.
*   **Pages**: `/mentions-legales` and `/confidentialite` from the `pages` collection, once published. Unknown paths answer 404 (`--indexFallback=false`).

Rendered pages are cached in memory and rebuilt after any change in the dashboard. The other `SEO_*` variables (`SEO_IMAGE`, `SEO_FAVICON`, `SEO_PHONE`, `SEO_PRICE_RANGE`, `SEO_LAT`/`SEO_LNG`, `SEO_ADDRESS_*`) are only fallbacks when the CMS has no value.

---

## 📚 PocketBase Collections (Data Model)

Here are the different sections you can modify via the administration interface:

### 1. `site_identity` (Global Info)
*Unique (1 single record)*
*   **name**: House name (e.g., "Villa Paradiso").
*   **tagline**: Slogan.
*   **description**: Short description for SEO.
*   **favicon**: Site icon.
*   **apple_touch_icon** *(optional)*: Home screen icon on iPhone and iPad (square PNG, 180×180, no transparency: iOS rounds the corners itself).
*   **labels**: Interface texts (buttons, menus) in JSON format.
*   **external_links** *(optional)*: Other pages about the same house (JSON list of URLs: Airbnb listing, Google Maps…), declared as `sameAs` in the structured data.

### 2. `welcome` (Hero Section)
*Unique*
*   **title**: Main title on the homepage banner.
*   **subtitle**: Subtitle/Welcome message.
*   **image**: Banner background image.
*   **display_options**: Visual settings (JSON), e.g. `{ "theme": "pavillons", "animations": true }`. See [Themes](#-themes).

### 3. `house_config` (House Settings)
*Unique*
*   **title / subtitle**: Titles for the "The House" section.
*   **amenities**: List of amenities (JSON).
*   **max_guests** *(optional)*: Capacity. When set, the `pavillons` booking form shows a guests selector.
*   **bedrooms / bathrooms / checkin_time / checkout_time** *(optional)*: Facts for the structured data (times as `16:00`).

### 4. `house_features` (Highlights)
*List of house highlights*
*   **title**: Title (e.g., "The Pool").
*   **shortDesc**: Short description.
*   **fullDesc**: Detailed description.
*   **icon**: Icon name (Lucide Icons). Only the icons listed in `scripts/vendor.js` (`EXTRA_ICONS`) are bundled: add a new one there.
*   **thumbnail**: Main image.
*   **gallery**: Gallery of associated images.
*   **order**: Display order.

> Image fields declare a `160x120` thumbnail size, used for the thumbnail strips (`?thumb=160x120`). Larger sizes are not used: the uploaded photos are already web-sized and PocketBase's re-encoded versions turned out heavier.

### 5. `activities` (Activities & Region)
*List of nearby activities*
*   **title**: Activity title.
*   **description**: Description.
*   **images**: Activity photos.
*   **order**: Display order.
*(Configured via `activities_config` for section titles)*

### 6. `pricing_config` (Pricing Configuration)
*Unique*
*   **cleaningFee**: Cleaning fee.
*   **defaultPrice**: Default price (if outside defined periods).
*   **details** (JSON): List of conditions (e.g., "Linens included").

### 7. `pricing_periods` (Pricing Calendar)
*List of pricing periods*
*   **start**: Start date (DD/MM).
*   **end**: End date (DD/MM). A period may wrap around the new year (e.g. 20/12 → 05/01).
*   **price**: Price per night/week for this period.

### 8. `location` (Location)
*Unique*
*   **lat / lng**: GPS coordinates.
*   **address**: Full address (HTML allowed).
*   **zoom**: Map zoom level.

### 9. `contact` (Contact Details)
*Unique*
*   **email**: Email for receiving requests.
*   **phone**: Displayed phone number.
*   **name**: Contact name.
*   **airbnbUrl**: Airbnb iCal export URL (optional), used to grey out booked dates. It contains a private token, so it is a hidden field (`pb_migrations/1793600000_hide_calendar_url.js`): only superusers see it. The server fetches it through `/api/ical-proxy` (cached 10 minutes); only `https` Airbnb hosts are accepted, add other iCal hosts with `ICAL_ALLOWED_HOSTS` (e.g. `www.abritel.fr,admin.booking.com`).


### 10. `faq` (Frequently Asked Questions)
*List of questions*
*   **question**: The question asked.
*   **answer**: The answer.
*   **order**: Display order.

### 11. `messages` (Contact Form)
*List of received messages*
*   Stores requests sent via the site form.
*   **guests** / **options** *(optional)*: Number of guests and selected options (JSON), sent by the `pavillons` theme.

### 12. `stay_rules` (Stay Rules) *(optional)*
*Enforced by the `pavillons` dates picker; empty = no rule.*
*   **label**: Text shown to visitors (e.g. "location à la quinzaine uniquement").
*   **start / end**: Period (DD/MM). A rule applies to every stay with at least one night in the period.
*   **min_nights**: Minimum number of nights.
*   **nights_multiple**: Stays must last a multiple of this number of nights (e.g. 14 = fortnight).

### 13. `booking_options` (Booking Options) *(optional)*
*Options the visitor can tick in the `pavillons` booking form; empty = no options section.*
*   **name / description**: Displayed texts.
*   **price**: Price in euros.
*   **unit**: `stay` (once), `night`, `guest` or `guest_night`.
*   **order**: Display order.

> Collections 12–13 and the optional fields are added by `pb_migrations/1792966000_booking_rules_options.js`. The site works the same without them (an older database simply returns empty lists).

### 14. `reviews` (Guest Reviews) *(optional)*
*Shown by both themes between the map and the FAQ, newest stay first; empty = no section. Typed in the dashboard (copied from Airbnb, Google…): there is no automatic import.*
*   **author**: Guest name, e.g. "Marie, Nantes".
*   **text**: The review (plain text, line breaks kept).
*   **rating** *(optional)*: 1 to 5 stars.
*   **date** *(optional)*: Stay date, shown as "juillet 2025".
*   **source** *(optional)*: Where the review comes from, e.g. "Airbnb".

Section titles: `labels.reviews.title` (and `labels.reviews.subtitle` for `classic`, `labels.nav.reviews` for the `pavillons` eyebrow). Reviews are not declared in the structured data: Google ignores the reviews a business publishes about itself.

---

## ✉️ Emails (Resend)

| Variable | Role |
|---|---|
| `RESEND_API_KEY` | Required for any email. |
| `RESEND_TO_EMAIL` | Owner address receiving the new-request notification. |
| `RESEND_FROM_EMAIL` | Sender (verified Resend domain). Default: `contact@location-ile-aux-moines.fr`. |
| `RESEND_CONFIRMATION` | Set to `false` to disable the confirmation email sent to the guest. |

*   `pb_hooks/on_message_created.pb.js`: notification to the owner (now includes guests and options).
*   `pb_hooks/on_message_confirmation.pb.js`: confirmation to the guest (dates, estimate, conditions, address). The guest's free-text message is not echoed, user input is escaped and options are checked against `booking_options`, so the form cannot be used to send arbitrary content. The owner notification escapes every field too. The header image uses the PocketBase *Application URL* setting.

---

## 🛡️ Anti-abuse

The booking form is public, so requests are filtered before they are saved or emailed (`pb_hooks/on_message_guard.pb.js`):

*   **Honeypot**: a hidden `website` field that people never see; requests that fill it are rejected.
*   **Per address**: at most 3 requests per email address in 24 h, and the guest confirmation is sent only once per address in 24 h.
*   **Size limits** (`pb_migrations/1793500000_message_limits.js`): name 120 characters, dates 60, message 5 000, options 10 KB.
*   **Prices from the database**: both emails list the ticked options with their name and price from `booking_options`, whatever the browser sent; the owner email marks the estimate as computed by the visitor's browser.
*   **Per IP**: PocketBase rate limiter, enabled by `pb_migrations/1793300000_rate_limits.js` (3 booking requests per 10 minutes, 30 calendar requests per minute, plus PocketBase's defaults). Adjust in *Dashboard > Settings > Application > Rate limiting*.

Rejected visitors get an error message with the "send by email" fallback link, so a false positive never loses a request.

| Variable | Role |
|---|---|
| `TRUSTED_PROXY_HEADERS` | **Required behind a reverse proxy** (nginx, Caddy, Traefik, Cloudflare…): header(s) carrying the visitor IP, e.g. `X-Forwarded-For` or `CF-Connecting-IP`. Without it, every visitor shares the proxy's IP and the per-IP limits apply to the whole site. Leave empty when PocketBase is exposed directly. |

---

## 🔐 Admin access

The dashboard (`/_/`) stays reachable from anywhere, protected by:

*   **Two-factor login**: superusers enter their password, then a code sent to their email address. Turned on at startup by `pb_hooks/settings.pb.js` as soon as an SMTP server is configured (otherwise the code could not be delivered).
*   **Login rate limits** (`pb_migrations/1793400000_auth_rate_limits.js`): 5 login attempts per minute and 3 code requests per 5 minutes, per IP.
*   **New-login alerts**: PocketBase emails the superuser when their account logs in from a new location.

SMTP uses Resend's relay with your `RESEND_API_KEY` by default (the `RESEND_FROM_EMAIL` domain must be verified in Resend). Another server can be set with the `SMTP_*` variables.

| Variable | Role |
|---|---|
| `ADMIN_MFA` | `true` by default. Set to `false` and restart to turn two-factor login off, e.g. if the superuser mailbox is unreachable. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` / `SMTP_TLS` | Optional SMTP server instead of Resend (default port 465 with TLS). |

**Security headers** (`pb_hooks/security_headers.pb.js`): the site is served with a Content-Security-Policy that only runs the site's own script files, plus `Referrer-Policy`, `Permissions-Policy` and HSTS over https. Inline `<script>` and `onclick="…"` attributes are therefore blocked: attach listeners in the components instead, and add any new external origin (fonts, images, API) to the policy.

**Code not received?** Generate one from the server: `docker-compose exec app /pocketbase superuser otp admin@example.com --dir=/pb_data`. As a last resort, set `ADMIN_MFA=false`, restart, log in with the password, fix the email address or SMTP settings, then remove the variable. A forgotten password can be reset from the command line: `docker-compose exec app /pocketbase superuser update admin@example.com 'new-password' --dir=/pb_data`.

---

## 🎨 Themes

The site ships with two themes rendering the same PocketBase data:

| Theme | Description |
|---|---|
| `classic` (default) | Original design: Playfair Display / Lato, Flatpickr calendar, AOS animations. |
| `pavillons` | Immersive maritime design: Fraunces / Inter, dates picker showing nightly prices and enforcing stay rules, "fully booked" notice, full-screen photo viewer, guests & options in the booking form, yearly pricing chart, CSS scroll animations. |

**Choosing the theme**: in the admin, edit the `welcome` record and set `display_options` to:

```json
{ "theme": "pavillons" }
```

An empty or unknown value falls back to `classic`. With `pavillons`, `"animations": false` turns the animations off (they are also disabled for visitors who prefer reduced motion).

**Previewing** another theme without changing the setting: add `?theme=pavillons` (or `?theme=classic`) to the URL.

**Code structure**:

```
js/
  app.js               # Bootstrap: loads CMS data, then the theme
  theme.js             # Resolves the theme and loads its assets
  cms.js               # PocketBase data (shared)
  shared/              # Theme-independent logic: BaseComponent, booking (iCal, form submission)
  utils/BookingUtils.js
  themes/
    classic/           # index.js (layout, components, assets) + components/
    pavillons/         # index.js + components/, helpers.js, store.js
css/
  input.css            # Tailwind entry (classic-specific rules are scoped to [data-theme="classic"])
  themes/pavillons.css # Pavillons styles not covered by Tailwind
```

To add a theme, create `js/themes/<name>/index.js` exporting `{ layout, components, styles, scripts, bodyClass, setup, afterMount }` and register it in `js/theme.js`.

---

## 💻 Local Development

To work on the site locally with hot-reloading:

1.  Run `npm install` then `npm run vendor` once (libraries, fonts and the Lucide icon subset in `js/vendor` and `css/vendor`; run it again after adding an icon).
2.  Run `docker-compose up`.
3.  Modify `html`, `css`, or `js` files on your machine, changes will be visible immediately.

> **Note**: Locally, SEO tags in the source code will remain `{{SEO_TITLE}}` because the local file overrides the one generated by the container. This is normal and does not affect site functionality.

---


### 🚀 Deployment

To deploy to production:
1.  Build the image and start the container.
2.  The entrypoint script will generate the final `index.html` with the correct SEO.

### ⬆️ Upgrading from PocketBase 0.22

The image now ships PocketBase 0.40. On first start, PocketBase converts an existing 0.22 `pb_data` automatically (admins become `_superusers` records, same email and password). The migrations in `pb_migrations/` keep their file names, so they are not replayed on an existing database.

1.  **Back up `pb_data`** (stop the container and copy the directory). The conversion cannot be undone.
2.  Pull or build the new image and start it.
3.  Check the site and log into `/_/` with your existing admin account.

To roll back, restore the `pb_data` backup and run the previous image.

PocketBase now runs as an unprivileged `pb` user (uid 1000) instead of root: on start, the entrypoint hands `pb_data` over to that user, so on the host the `./pb_data` files end up owned by uid 1000.
