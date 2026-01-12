## 1. Install Dependencies

```bash
npm install
```

## 2. Generate NextAuth Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output - you'll need it for your `.env.local` file.

## 3. Set Up Database

### Using Supabase (Your Project)

**Your Supabase Project:**
- Project URL: `https://hxlttkyxvxemkyweiyvg.supabase.co`
- Project Reference: `hxlttkyxvxemkyweiyvg`

**To get your database connection string:**

1. Go to your Supabase dashboard: [https://supabase.com/dashboard/project/hxlttkyxvxemkyweiyvg](https://supabase.com/dashboard/project/hxlttkyxvxemkyweiyvg)
2. Navigate to **Settings** → **Database**
3. Scroll down to **Connection string** section
4. Select **URI** tab (not Transaction mode)
5. Copy the connection string - it will look like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your database password (the one you set when creating the project, or reset it in Settings > Database > Database password)
7. Add it to `.env.local` as `DATABASE_URL`

**Note:** If you don't remember your database password, you can reset it in Settings > Database > Database password.


### Run Migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## 4. Environment Variables

Create a `.env.local` file in the root directory with:

```bash
# Authentication
GOOGLE_CLIENT_ID="<your-google-client-id>"
GOOGLE_CLIENT_SECRET="<your-google-client-secret>"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
NEXTAUTH_URL="http://localhost:3000"

# APIs
OMDB_API_KEY="<your-omdb-api-key>"
TAVILY_API_KEY="<your-tavily-api-key>"
OPENAI_API_KEY="sk-..."

# Database
DATABASE_URL="<your-postgresql-connection-string>"
```

## 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Troubleshooting

### "Unauthorized" Error

- Make sure you're signed in with Google
- Check that the Google OAuth credentials are correct
- Verify that the Calendar API scope is included in the authorization

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Make sure Prisma migrations have run: `npx prisma migrate dev`
- Check that your database is accessible

### API Errors

- Verify all API keys are set correctly in `.env.local`
- Check that the OMDb API key is valid
- Ensure Tavily API key is active

