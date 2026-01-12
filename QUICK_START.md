# Quick Start Guide

## Your Supabase Project Details

- **Project URL**: `https://hxlttkyxvxemkyweiyvg.supabase.co`
- **Project Reference**: `hxlttkyxvxemkyweiyvg`
- **Publishable API Key**: `sb_publishable_qtAV81FSCqWnluLI1NfDXw_T9EHJHCz`

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Your Database Connection String

1. Go to: https://supabase.com/dashboard/project/hxlttkyxvxemkyweiyvg/settings/database
2. Scroll to **Connection string** section
3. Click the **URI** tab
4. Copy the connection string
5. If you need to reset your database password: Settings > Database > Database password

### 3. Generate NextAuth Secret
```bash
openssl rand -base64 32
```

### 4. Create `.env.local` File

Create a file named `.env.local` in the root directory with this content:

```bash
# --- AUTHENTICATION (Google Console) ---
GOOGLE_CLIENT_ID="<your-google-client-id>"
GOOGLE_CLIENT_SECRET="<your-google-client-secret>"
NEXTAUTH_SECRET="<paste-the-output-from-openssl-rand-base64-32>"
NEXTAUTH_URL="http://localhost:3000"

# --- DISCOVERY & SEARCH ---
OMDB_API_KEY="<your-omdb-api-key>"
TAVILY_API_KEY="<your-tavily-api-key>"

# --- AI PROVIDER ---
OPENAI_API_KEY="sk-..."

# --- DATABASE (Supabase) ---
DATABASE_URL="<paste-your-supabase-connection-string-here>"
```

**Important:** 
- Replace `<paste-the-output-from-openssl-rand-base64-32>` with the secret you generated
- Replace `<paste-your-supabase-connection-string-here>` with your Supabase connection string
- Replace `sk-...` with your actual OpenAI API key

### 5. Initialize Database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Need Help?

- **Database connection issues?** Make sure your Supabase connection string includes your database password
- **Can't find your password?** Reset it in Supabase: Settings > Database > Database password
- **Migration errors?** Make sure your `DATABASE_URL` is correct and your Supabase project is active

