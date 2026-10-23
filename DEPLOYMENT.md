# 🚀 FlexiScheduler - Deployment Guide (Vercel + Supabase)

Follow these step-by-step instructions to deploy **flexiScheduler** to **Vercel** (Frontend & Serverless Twilio Dispatch) and **Supabase** (PostgreSQL Database & Realtime Backend).

---

## Part 1: Supabase Setup (Database & Backend)

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com/) and sign in (or sign up with GitHub).
2. Click **"New Project"**.
3. Choose your organization, set a project name (e.g. `flexischeduler`), select a strong database password, and choose your preferred region.
4. Click **"Create new project"** and wait ~1-2 minutes for the database to provision.

### Step 2: Run the Database Schema & Seed Data
1. In your Supabase Dashboard, click on **SQL Editor** (icon on the left sidebar: `>_`).
2. Click **"New query"**.
3. Open the file [`supabase_schema.sql`](file:///c:/Users/krish/OneDrive/Attachments/Desktop/FlexiScheduler/flexiScheduler/supabase_schema.sql) from your project folder.
4. Copy the entire contents and paste it into the Supabase SQL Editor.
5. Click **"Run"** (green button).
   - This creates the tables:
     - `machines` (Machine health, vibration, temperature, telemetry, and reassignments)
     - `orders` (Pipeline stages and FIFO queue)
     - `breakdown_alerts` (Twilio WhatsApp and SMS incident logs)
     - `disruptions` (Simulation event logs)
   - Configures Row Level Security (RLS) policies.
   - Enables Realtime subscriptions.
   - Populates initial factory seed data!

### Step 3: Copy Your Supabase API Keys
1. Go to **Project Settings** (gear icon on bottom left) -> **API**.
2. Copy two values:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **anon / public key** (under `Project API keys`)

---

## Part 2: Vercel Deployment (Frontend & Serverless Functions)

### Option A: Deploy via GitHub (Recommended)
1. Commit and push your latest code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Configure Vercel serverless API and Supabase database backend"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com/) and click **"Add New..."** -> **"Project"**.
3. Select your repository `flexiScheduler` and click **"Import"**.
4. In the **Environment Variables** section, add the following variables:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | *(your Supabase Project URL)* | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | *(your Supabase anon key)* | Supabase Public Anon Key |
| `TWILIO_ACCOUNT_SID` | *(your Twilio Account SID)* | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | *(your Twilio Auth Token)* | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | *(your Twilio phone number)* | Twilio Outbound Phone Number |
| `TWILIO_WHATSAPP_NUMBER` | `whatsapp:+14155238886` | Twilio WhatsApp Sandbox Number |
| `VITE_RECIPIENT_PHONE` | *(recipient phone in E.164 format)* | Maintenance Target Mobile Number |
| `VITE_WHATSAPP_SANDBOX_CODE` | *(your sandbox join code)* | WhatsApp Sandbox Join Code |

5. Click **"Deploy"**. Vercel will build your Vite app in seconds and deploy your serverless endpoint `/api/twilio/send`.

---

### Option B: Deploy via Vercel CLI (Direct from Terminal)
If you prefer deploying directly from your computer:
1. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```
2. Run in the `flexiScheduler` directory:
   ```bash
   vercel
   ```
3. Follow the CLI prompts to link to your Vercel account and set environment variables.
4. For production deployment:
   ```bash
   vercel --prod
   ```

---

## Part 3: Architecture Summary

```
                       ┌──────────────────────────────────────────────┐
                       │          Vercel Production Edge              │
                       ├──────────────────────┬───────────────────────┤
                       │  Vite React Frontend │ Serverless Functions  │
                       │   (UI, Gantt, Twin)  │  (/api/twilio/send)   │
                       └───────────┬──────────┴───────────┬───────────┘
                                   │                      │
                      Supabase Client                     │ Twilio REST API
                      (@supabase/js)                      │ (HTTP Basic Auth)
                                   │                      │
                                   ▼                      ▼
               ┌───────────────────────────────┐ ┌─────────────────────────┐
               │     Supabase Cloud Engine     │ │   Twilio Cloud Gateway  │
               ├───────────────────────────────┤ ├─────────────────────────┤
               │ • PostgreSQL Schema & RLS     │ │ • WhatsApp Sandbox      │
               │ • Realtime WebSocket Engine   │ │   (join shirt-dug)      │
               │ • Tables: machines, orders,   │ │ • SMS Gateway (+1775...)│
               │   breakdown_alerts            │ │   Recipient: 8210868501 │
               └───────────────────────────────┘ └─────────────────────────┘
```
