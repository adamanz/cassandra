# Deployment Guide for Cassandra Calendar Assistant

## Prerequisites

- Node.js 18+ (LTS recommended)
- Auth0 account with Token Vault enabled
- Google Cloud Console access for Calendar API
- Anthropic API key
- Deployment platform account (Vercel, Heroku, AWS, etc.)

## Environment Variables

For production deployment, you'll need to set the following environment variables:

### Required Variables

```env
# Auth0 Configuration
AUTH0_SECRET=<your-auth0-secret>
AUTH0_BASE_URL=https://your-production-domain.com
AUTH0_ISSUER_BASE_URL=https://your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=<your-auth0-client-id>
AUTH0_CLIENT_SECRET=<your-auth0-client-secret>

# Anthropic API (for Claude LLM)
ANTHROPIC_API_KEY=<your-anthropic-api-key>

# Application URL
APP_BASE_URL=https://your-production-domain.com
```

### Optional Variables

```env
# LangChain Tracing (for monitoring)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=<your-langsmith-api-key>
LANGCHAIN_PROJECT=cassandra-calendar-prod

# Search functionality (if using web search)
SERPAPI_API_KEY=<your-serpapi-key>
```

## Auth0 Configuration

1. **Create Production Application**:
   - Log into Auth0 dashboard
   - Create a new Regular Web Application
   - Set callback URL: `https://your-production-domain.com/api/auth/callback`
   - Set logout URL: `https://your-production-domain.com`

2. **Enable Token Vault**:
   - In your Auth0 application settings, navigate to Add-ons
   - Enable "Token Vault for Google APIs"
   - Configure Google Calendar scope: `https://www.googleapis.com/auth/calendar`

3. **Configure Social Connection**:
   - Go to Authentication > Social
   - Enable Google connection
   - Add Google Calendar scope

## Google API Setup

1. **Create Project** (if not already done):
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing

2. **Enable APIs**:
   - Enable Google Calendar API

3. **Configure OAuth Consent Screen**:
   - Add authorized domains
   - Set up privacy policy and terms of service URLs

## Deployment Steps

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**:
   - Go to Vercel dashboard
   - Navigate to Project Settings > Environment Variables
   - Add all required variables

### Manual Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm run start
   ```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t cassandra-calendar .
docker run -p 3000:3000 --env-file .env.production cassandra-calendar
```

## Security Considerations

1. **Secrets Management**:
   - Never commit `.env` files to version control
   - Use platform-specific secret management (Vercel secrets, AWS Secrets Manager, etc.)
   - Rotate API keys regularly

2. **HTTPS**:
   - Always use HTTPS in production
   - Configure SSL certificates properly

3. **CORS**:
   - Review and configure CORS settings appropriately
   - Whitelist only required domains

4. **Rate Limiting**:
   - Implement rate limiting for API endpoints
   - Monitor API usage

## Monitoring and Logging

1. **Application Monitoring**:
   - Use LangSmith for LangChain tracing
   - Set up error tracking (Sentry, LogRocket, etc.)

2. **Performance Monitoring**:
   - Enable Next.js analytics
   - Monitor Core Web Vitals

3. **Logs**:
   - Configure structured logging
   - Set up log aggregation service

## Scaling Considerations

1. **Database**: Currently using Auth0 Token Vault for Google tokens
2. **Caching**: Implement Redis for session management if needed
3. **CDN**: Use Vercel Edge Network or CloudFlare
4. **Load Balancing**: Handle via deployment platform

## Troubleshooting

### Common Issues

1. **Auth0 Callback Errors**:
   - Verify redirect URLs match exactly
   - Check AUTH0_BASE_URL is correct

2. **Google Calendar Access Issues**:
   - Ensure Token Vault is configured
   - Verify Google Calendar API is enabled
   - Check OAuth consent screen configuration

3. **Missing Environment Variables**:
   - Double-check all required variables are set
   - Verify no trailing spaces in values

4. **Build Failures**:
   - Clear `.next` directory and rebuild
   - Check Node.js version compatibility

## Support

For deployment issues:
- Review application logs
- Check environment variable configuration
- Verify external service connectivity
- Consult platform-specific documentation