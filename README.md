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
On first start, PocketBase prints a one-time installer link in the logs (`docker-compose logs app`): open it to create the superuser. You can also create it from the command line:

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
# Replace with your desired admin email and password
node setup/init_cms.js admin@example.com 1234567890
```

This script will:
1.  Authenticate with PocketBase.
2.  Populate the database with data from `config.json`.
3.  Upload images from `setup/img/`.

*(The database schema is automatically applied via migrations in `pb_migrations/` at startup.)*

---

## 🛠️ Configuration & SEO

### Configuration Files
*   **`setup/config.json`**: Contains all initial site data. This is the source of truth for the first installation.
*   **`setup/img/`**: Contains initial images.

### Dynamic SEO
The `index.html` file is generic and contains placeholders (`{{SEO_TITLE}}`, etc.).
At Docker container startup, a script (`entrypoint.sh`) automatically injects the SEO values defined in the configuration.

*   **Robots.txt & Sitemap.xml**: These are also generated automatically at startup based on the site URL defined in the config.

---

## 📚 PocketBase Collections (Data Model)

Here are the different sections you can modify via the administration interface:

### 1. `site_identity` (Global Info)
*Unique (1 single record)*
*   **name**: House name (e.g., "Villa Paradiso").
*   **tagline**: Slogan.
*   **description**: Short description for SEO.
*   **favicon**: Site icon.
*   **labels**: Interface texts (buttons, menus) in JSON format.

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

### 4. `house_features` (Highlights)
*List of house highlights*
*   **title**: Title (e.g., "The Pool").
*   **shortDesc**: Short description.
*   **fullDesc**: Detailed description.
*   **icon**: Icon name (Lucide Icons).
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
*   **airbnbUrl**: Link to Airbnb calendar (optional).


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

---

## ✉️ Emails (Resend)

| Variable | Role |
|---|---|
| `RESEND_API_KEY` | Required for any email. |
| `RESEND_TO_EMAIL` | Owner address receiving the new-request notification. |
| `RESEND_FROM_EMAIL` | Sender (verified Resend domain). Default: `contact@location-ile-aux-moines.fr`. |
| `RESEND_CONFIRMATION` | Set to `false` to disable the confirmation email sent to the guest. |

*   `pb_hooks/on_message_created.pb.js`: notification to the owner (now includes guests and options).
*   `pb_hooks/on_message_confirmation.pb.js`: confirmation to the guest (dates, estimate, conditions, address). The guest's free-text message is not echoed, user input is escaped and options are checked against `booking_options`, so the form cannot be used to send arbitrary content. The header image uses the PocketBase *Application URL* setting.

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

1.  Run `docker-compose up`.
2.  Modify `html`, `css`, or `js` files on your machine, changes will be visible immediately.

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
