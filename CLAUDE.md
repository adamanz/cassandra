# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Cassandra Calendar Assistant is an AI-powered calendar management application built with Next.js 15, LangChain, and LangGraph. It provides intelligent natural language search and event creation capabilities for Google Calendar through Auth0 authentication with Token Vault integration, now enhanced with Google Maps location services.

## Key Commands

### Development
```bash
npm run dev      # Start development server on localhost:3000
npm run build    # Build for production
npm run start    # Build and start production server
```

### Code Quality
```bash
npm run lint     # Run Next.js lint checks
npm run format   # Format code with Prettier
```

### Testing
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode  
npm run test:coverage # Run tests with coverage report
npx jest path/to/test.tsx    # Run specific test file
npx jest --watch path/to/test.tsx  # Watch specific test file
```

### Deployment
```bash
npm run vercel       # Deploy to Vercel (staging)
npm run vercel:prod  # Deploy to Vercel (production)
npm run deploy       # Build and deploy to production
```

## Architecture Overview

### Tech Stack
- Next.js 15.2.4 (App Router)
- React 19.0.0
- TypeScript 5.7.3
- LangChain & LangGraph for AI orchestration
- Gemini 2.5 Flash Preview (Google) as primary LLM
- Auth0 with Token Vault for Google Calendar access
- Zustand for state management
- Tailwind CSS + Radix UI for components
- Jest + React Testing Library for tests

### Project Structure
- `/src/app/` - Next.js app directory with API routes and pages
- `/src/components/` - React components
  - `/playground/` - Chat UI components
  - `/ui/` - Reusable UI primitives
- `/src/lib/` - Core business logic and tool implementations
  - `enhanced-calendar-tools.ts` - Advanced calendar search with fuzzy matching
  - `enhanced-calendar-create-tool.ts` - Natural language event creation
  - `auth0.ts` - Auth0 configuration and Google token management
  - `google-maps-tools.ts` - Google Maps integration for location services
- `/src/utils/` - Utility functions
- `/src/store.ts` - Zustand state management

### Key Features

1. **Enhanced Calendar Search** (`enhanced-calendar-tools.ts`):
   - Fuzzy search with name variation generation
   - Company name abbreviation handling (e.g., "Acme Corporation" → "AC")
   - Intelligent time window expansion
   - Multi-calendar support
   - Current time awareness

2. **Natural Language Event Creation** (`enhanced-calendar-create-tool.ts`):
   - Smart date/time parsing
   - Attendee management
   - Location parsing

3. **Chat API** (`/api/chat/route.ts`):
   - LangChain agent with streaming responses
   - Tool call logging in development
   - Message history preservation
   - Error handling with graceful fallbacks

4. **Authentication Flow**:
   - Auth0 integration with Google OAuth2
   - Token Vault for secure Google API access  
   - Middleware-based session management
   - User profile and picture display

5. **Google Maps Integration** (`google-maps-tools.ts`):
   - Geocoding: Convert addresses to coordinates and vice versa
   - Place search: Find places by query with optional location/radius
   - Place details: Get detailed information about specific places
   - Distance matrix: Calculate travel times and distances
   - Elevation data: Get elevation information for coordinates
   - Directions: Get turn-by-turn navigation between points
   - Multiple travel modes supported (driving, walking, transit, bicycling)

### Environment Variables

Required:
- `AUTH0_SECRET` - Auth0 secret for JWT signing
- `AUTH0_BASE_URL` - Base URL (default: http://localhost:3000)
- `AUTH0_ISSUER_BASE_URL` - Auth0 domain
- `AUTH0_CLIENT_ID` - Auth0 application client ID
- `AUTH0_CLIENT_SECRET` - Auth0 application client secret  
- `GOOGLE_GENAI_API_KEY` - Google Generative AI API key for Gemini access
- `GOOGLE_API_KEY` - Alternative Google API key (can use same as GOOGLE_GENAI_API_KEY)

Optional:
- `SERPAPI_API_KEY` - For web search functionality
- `GOOGLE_MAPS_API_KEY` - For Google Maps location services
- `LANGCHAIN_TRACING_V2` - Enable LangSmith tracing
- `LANGCHAIN_API_KEY` - LangSmith API key
- `LANGCHAIN_PROJECT` - LangSmith project name

### Testing Strategy
- Unit tests for calendar tools and utilities
- Integration tests for calendar UI interactions  
- Snapshot tests for React components
- Test helpers in `src/__tests__/utils/test-helpers.ts`
- Mock implementations for external services
- Test configuration in `jest.config.js` with Next.js preset

### Key Dependencies
- `@auth0/nextjs-auth0` - Auth0 integration
- `@langchain/*` - LangChain ecosystem for LLM orchestration
- `googleapis` - Google Calendar API client
- `ai` - Vercel AI SDK for streaming
- `zustand` - State management
- `react-markdown` - Markdown rendering
- `dayjs` - Date manipulation

### Development Best Practices
- Use TypeScript strictly (`strict: true` in tsconfig.json)
- Utilize path aliases (`@/` for `src/`)
- Follow existing component patterns in `/src/components/ui/`
- Use Tailwind CSS for styling
- Implement proper error boundaries
- Add loading states for async operations
- Use `MemoizedMarkdown` component for performance
- Enable tool call logging in development mode

### Authentication & API Access
- Auth0 Token Vault must be enabled for Google Calendar access
- Google Calendar API scopes required: `https://www.googleapis.com/auth/calendar`
- Middleware handles auth checks (`src/middleware.ts`)
- Session data available server-side via `auth0.getSession()`
- Google access token retrieval through `getGoogleAccessToken()`

### Deployment Considerations
- Vercel deployment recommended (see `vercel.json`)
- Next.js Image optimization configured for Google profile pictures
- Proper HTTPS required for production
- Environment-specific configuration supported
- Docker deployment possible (see `DEPLOYMENT.md`)

### Common Workflows

1. **Adding new calendar functionality**:
   - Extend `EnhancedGoogleCalendarViewTool` or create new tool
   - Add tool to agent in `/api/chat/route.ts`
   - Write tests in `__tests__/lib/`
   - Update agent system template

2. **Modifying UI components**:
   - Check existing patterns in `/components/playground/`
   - Use UI primitives from `/components/ui/`
   - Add appropriate loading states
   - Test with different screen sizes

3. **Debugging auth issues**:
   - Check Auth0 logs in dashboard
   - Verify Token Vault is enabled
   - Ensure Google scopes are correct
   - Review middleware logs

4. **Integrating location services**:
   - Import Google Maps tools from `/lib/google-maps-tools.ts`
   - Ensure `GOOGLE_MAPS_API_KEY` is configured
   - Use appropriate tools for geocoding, place search, or directions
   - Handle Google Maps API errors gracefully
   - Consider rate limits for production usage

### Security Notes
- Never commit `.env` files
- Use platform-specific secret management in production
- Validate all user inputs
- Sanitize markdown output
- Follow Auth0 security best practices