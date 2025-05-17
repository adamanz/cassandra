# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the Cassandra Calendar Assistant - an AI-powered calendar management application built with Next.js, LangChain, and LangGraph. It provides intelligent natural language search and event creation capabilities for Google Calendar through Auth0 authentication.

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
```

### Test a Single File
```bash
npx jest path/to/test.tsx    # Run specific test file
npx jest --watch path/to/test.tsx  # Watch specific test file
```

## Architecture Overview

### Project Structure
- `/src/app/` - Next.js app directory with API routes and pages
- `/src/components/` - React components including chat UI, markdown renderer, and playground components
- `/src/lib/` - Core business logic and tool implementations
- `/src/store.ts` - Zustand state management

### Key Components

1. **Calendar Search Tool** (`enhanced-calendar-tools.ts`):
   - Advanced fuzzy search with name variations
   - Intelligent time window expansion
   - Company name abbreviation handling

2. **Calendar Create Tool** (`enhanced-calendar-create-tool.ts`):
   - Natural language event creation
   - Smart date parsing

3. **Chat API** (`src/app/api/chat/route.ts`):
   - LangChain agent configuration
   - Claude 3.7 Sonnet integration
   - Message streaming

4. **Auth Integration** (`lib/auth0.ts`):
   - Auth0 authentication with Google Calendar scopes
   - Token vault for secure Google API access

### Key Dependencies
- Next.js 15.2.4 
- React 19.0.0
- LangChain ecosystem (anthropic, google-genai, community tools)
- Zustand for state management
- Testing: Jest + React Testing Library

### Environment Variables

Required:
- `AUTH0_SECRET` - Auth0 secret for JWT signing
- `AUTH0_BASE_URL` - Base URL (default: http://localhost:3000)
- `AUTH0_ISSUER_BASE_URL` - Auth0 domain
- `AUTH0_CLIENT_ID` - Auth0 application client ID  
- `AUTH0_CLIENT_SECRET` - Auth0 application client secret
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude access

Optional:
- `SERPAPI_API_KEY` - For web search functionality
- `LANGCHAIN_TRACING_V2` - Enable LangSmith tracing
- `LANGCHAIN_API_KEY` - LangSmith API key

### Testing Strategy
- Unit tests for calendar tools and utilities
- Integration tests for calendar UI interactions
- Snapshot tests for React components
- Test configuration in `jest.config.js` with Next.js preset

### Development Notes
- Uses Tailwind CSS for styling with custom components in `/src/components/ui/`
- Markdown rendering with custom `MemoizedMarkdown` component for performance
- Streaming chat responses with AI SDK's LangChainAdapter
- Tool call logging enabled in development mode