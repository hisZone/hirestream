# Deployment Guide: Render (Backend) & Vercel (Frontend)

This repository is configured for full-stack deployment:
- **Backend**: Laravel 12 API deployed on **Render** using a Blueprint specification (`render.yaml`), Docker container (PHP 8.3-FPM + Nginx + Supervisor), and a managed **Render PostgreSQL** database.
- **Frontend**: React 19 + Vite SPA deployed on **Vercel** with automatic SPA client-side routing rewrites (`vercel.json`) and environment variable configuration.

---

## Architecture Overview

```
                          ┌────────────────────────┐
                          │   Vercel Edge Network  │
                          │   (Frontend React SPA) │
                          └──────────┬─────────────┘
                                     │
                        HTTPS API & Storage Requests
                                     │
                                     ▼
                          ┌────────────────────────┐
                          │   Render Web Service   │
                          │ (Docker: PHP 8.3+Nginx)│
                          └──────────┬─────────────┘
                                     │
                           Internal Private Network
                                     │
                                     ▼
                          ┌────────────────────────┐
                          │    Render PostgreSQL   │
                          │   (Managed Database)   │
                          └────────────────────────┘
```

---

## Part 1: Deploying the Backend on Render (with Blueprint)

The root [render.yaml](file:///home/temesgensida/tom/deployed/Job-Listing-Platform/render.yaml) file defines the complete infrastructure (the web service and the PostgreSQL database).

### Step 1: Connect Repository to Render
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top right corner and choose **Blueprint**.
3. Select and connect this Git repository (`Job-Listing-Platform`).
4. Choose the target branch (e.g. `main` or your deployment branch).

### Step 2: Review Blueprint Resources
Render will detect `render.yaml` and show:
- **`job-listing-db`**: A managed PostgreSQL database instance (`job_listing_platform`).
- **`job-listing-backend`**: A Docker web service building from `./Backend/Dockerfile` within the `./Backend` context.

### Step 3: Configure Environment Variables in Render
Render will prompt you for any variables marked with `sync: false` (or you can edit them after creation under the service's **Environment** tab):

| Variable | Description | Example Value |
|---|---|---|
| `FRONTEND_URL` | The public URL of your deployed Vercel frontend (for CORS) | `https://job-listing-frontend.vercel.app` |
| `APP_FRONTEND_URL` | Frontend URL fallback | `https://job-listing-frontend.vercel.app` |
| `SANCTUM_STATEFUL_DOMAINS` | Domain name of the frontend (without protocol) | `job-listing-frontend.vercel.app` |
| `APP_URL` | The public Render service URL | `https://job-listing-backend.onrender.com` |

*(Note: If you haven't deployed your frontend yet, you can temporarily set `FRONTEND_URL` to `http://localhost:3000` or a placeholder, and update it once Vercel gives you your frontend URL).*

### Step 4: Apply and Deploy
1. Click **Apply**.
2. Render will provision the PostgreSQL database first, then automatically build and start the Docker web service.
3. The container's startup entrypoint automatically:
   - Sets up the dynamic `$PORT` for Nginx.
   - Symlinks the storage directory (`php artisan storage:link`).
   - Runs database migrations (`php artisan migrate --force`).
   - Optimizes Laravel caches (`config:cache`, `route:cache`, `view:cache`).
   - Starts Supervisor managing both PHP-FPM and Nginx.
4. Once deployed, test the health check endpoint:
   ```bash
   curl https://<your-render-service>.onrender.com/up
   # Expected: 200 OK
   ```

---

## Part 2: Deploying the Frontend on Vercel

### Method A: Monorepo Project Import (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** → **Project**.
2. Select your repository (`Job-Listing-Platform`).
3. In the **Project Configuration** screen:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Root Directory**: Click **Edit** and choose `Frontend`.
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
   - **Install Command**: `npm install` (default)
4. In the **Environment Variables** section, add:
   - `VITE_API_URL`: Your Render backend URL, e.g. `https://job-listing-backend.onrender.com`
5. Click **Deploy**.

### Method B: Deploying from Repository Root
If you prefer not setting the root directory to `Frontend`, the repository already contains a root [vercel.json](file:///home/temesgensida/tom/deployed/Job-Listing-Platform/vercel.json) that instructs Vercel to install and build from the `Frontend` directory:
- Add `VITE_API_URL` under Environment Variables and click **Deploy**.

---

## Part 3: Connecting Frontend and Backend

Once both services are deployed:

1. **Copy your Vercel URL** (e.g. `https://job-listing-platform.vercel.app`).
2. **Update Render Backend Environment Variables**:
   - Go to your `job-listing-backend` service on Render → **Environment**.
   - Set `FRONTEND_URL` = `https://job-listing-platform.vercel.app`
   - Set `APP_FRONTEND_URL` = `https://job-listing-platform.vercel.app`
   - Set `SANCTUM_STATEFUL_DOMAINS` = `job-listing-platform.vercel.app`
   - Click **Save Changes** (Render will trigger a zero-downtime redeploy).
3. **Verify Vercel Environment Variable**:
   - In Vercel → Project Settings → **Environment Variables**:
   - Ensure `VITE_API_URL` = `https://<your-backend>.onrender.com`
   - If changed, click **Redeploy** on the latest deployment.

---

## Part 4: Post-Deployment & Database Seeding

To seed sample data or create the initial admin user on Render:

1. Open your `job-listing-backend` web service on the Render Dashboard.
2. Click **Shell** in the left sidebar to open a live terminal inside the production container.
3. Run the database seeders:
   ```bash
   php artisan db:seed --force
   ```
4. Or create an admin user directly via Tinker:
   ```bash
   php artisan tinker
   ```
   ```php
   App\Models\User::factory()->create([
       'name' => 'Admin User',
       'email' => 'admin@example.com',
       'username' => 'admin',
       'role' => 'admin',
       'password' => bcrypt('StrongPassword123!'),
       'email_verified_at' => now(),
   ]);
   exit
   ```

---

## Troubleshooting & Maintenance

### Cold Starts on Free Tier
Render free-tier web services spin down after 15 minutes of inactivity. When a new request arrives, it may take 30–50 seconds to spin up. For production zero-downtime reliability, upgrading the service plan to `starter` in `render.yaml` or through the Render dashboard avoids spin-downs.

### CORS / Unauthorized Errors
- If requests from the frontend show CORS errors in the browser console, ensure `FRONTEND_URL` in the Render dashboard matches your exact Vercel origin including `https://` (and without trailing slash).
- Example: `https://job-listing-platform.vercel.app`

### Storage & Uploaded Files (CV / Logos)
- On Render free and starter instances, the container filesystem is ephemeral (persists across restarts but resets on new deploys).
- For persistent file storage in production, either attach a Render persistent disk or configure an S3-compatible cloud storage driver (AWS S3, Cloudflare R2) via `FILESYSTEM_DISK=s3` in your Render environment variables.
