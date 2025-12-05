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
*   **display_options**: Visual settings (JSON).

### 3. `house_config` (House Settings)
*Unique*
*   **title / subtitle**: Titles for the "The House" section.
*   **amenities**: List of amenities (JSON).

### 4. `house_features` (Highlights)
*List of house highlights*
*   **title**: Title (e.g., "The Pool").
*   **shortDesc**: Short description.
*   **fullDesc**: Detailed description.
*   **icon**: Icon name (Lucide Icons).
*   **thumbnail**: Main image.
*   **gallery**: Gallery of associated images.
*   **order**: Display order.

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
*   **start**: Start date (MM-DD).
*   **end**: End date (MM-DD).
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
*   **captchaSiteKey / Secret**: Cloudflare Turnstile keys.

### 10. `faq` (Frequently Asked Questions)
*List of questions*
*   **question**: The question asked.
*   **answer**: The answer.
*   **order**: Display order.

### 11. `messages` (Contact Form)
*List of received messages*
*   Stores requests sent via the site form.

---

## 💻 Local Development

To work on the site locally with hot-reloading:

1.  Run `docker-compose up`.
2.  Modify `html`, `css`, or `js` files on your machine, changes will be visible immediately.

> **Note**: Locally, SEO tags in the source code will remain `{{SEO_TITLE}}` because the local file overrides the one generated by the container. This is normal and does not affect site functionality.

---

### 🛡️ Security (Captcha)

To protect the contact form with Cloudflare Turnstile:
1.  Go to the **Contact** collection in PocketBase.
2.  Edit the single record.
3.  Fill in `captchaSiteKey` and `captchaSecretKey` (obtained from Cloudflare).
4.  Restart the container to load the server-side hooks: `docker-compose restart`.

### 🚀 Deployment

To deploy to production:
1.  Build the image and start the container.
2.  The entrypoint script will generate the final `index.html` with the correct SEO.
