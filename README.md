# Cal-Explorer AI

An agentic automation platform that bridges the gap between web discovery and personal scheduling. Transform conversational intent into verified calendar entries.

## Features

- 🔍 **Web Discovery**: Search the web for upcoming events, movies, concerts, and activities using Tavily AI
- 🎬 **Metadata Enrichment**: Fetch rich movie details from OMDb API (posters, plots, ratings)
- 📅 **Calendar Integration**: Automatically add events to Google Calendar
- 🤖 **AI Agent**: Autonomous tool-calling AI that decides when to search, enrich, and schedule

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **AI**: Vercel AI SDK with OpenAI
- **Authentication**: NextAuth.js (Auth.js) with Google OAuth
- **Database**: Supabase + Prisma
- **UI**: Tailwind CSS + Shadcn UI

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```bash
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"
   OMDB_API_KEY="your-omdb-key"
   TAVILY_API_KEY="your-tavily-key"
   OPENAI_API_KEY="your-openai-key"
   DATABASE_URL="your-postgresql-connection-string"
   ```

3. **Set up the database**:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000)

## Architecture

### Tools

The AI agent has access to three tools:

1. **`searchWeb`**: Searches the web using Tavily API for events and activities
2. **`getMovieDetails`**: Fetches movie metadata from OMDb API
3. **`createCalendarEvent`**: Creates events in Google Calendar

### Authentication Flow

- Users sign in with Google OAuth
- Access tokens are persisted in the database via Prisma
- Tokens are refreshed automatically using NextAuth.js callbacks

## Usage

Simply describe what you want to schedule:

- "Find upcoming sci-fi movies and schedule them"
- "Search for concerts in New York next month"
- "Add the latest Marvel movie to my calendar"

The AI will:
1. Search the web for relevant events
2. Enrich them with metadata (if applicable)
3. Create calendar entries automatically

