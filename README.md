# Cassandra: An Intelligent Calendar Assistant

Cassandra is a specialized AI calendar assistant designed to help you manage your schedule efficiently. The application uses advanced natural language processing to find events and create new ones with minimal user input.

## Features

1. **Smart Calendar Search:** Find meetings with just a company name or keyword. The assistant intelligently expands search terms to match various formats (e.g., "sendblue" → "SendBlue", "send-blue", "SendBlue Inc").

2. **Efficient Event Creation:** Create calendar events with natural language. Simply specify the date, time, title, and optional location.

3. **Schedule Management:** Get quick insights about your availability, conflicts, and upcoming meetings.

4. **Secure Authentication:** Built with Auth0 integration for secure access to your Google Calendar.

## Technical Highlights

- **Enhanced Search Capabilities:** Uses advanced name variation generation, intelligent time window expansion, and fuzzy matching to find events even with minimal input.

- **Integration with Google Calendar:** Securely connects to Google Calendar using Auth0's Token Vault feature.

- **Powered by Gemini AI:** Utilizes Google's Gemini 2.5 Flash Preview model for fast, accurate responses.

- **Built with Modern Stack:** Next.js, LangChain, and LangGraph.js for a responsive, streaming experience.

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Auth0 account with Token Vault enabled
- Google API credentials
- Gemini API key

### Setup

1. Clone this repository:
```bash
git clone https://github.com/adamanz/cal-agent.git
cd cal-agent
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Create a `.env.local` file with necessary credentials:
```
AUTH0_SECRET=
AUTH0_BASE_URL=
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
GOOGLE_API_KEY=
```

4. Run the development server:
```bash
npm run dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) to use the assistant.

## Usage Examples

- "What meetings do I have tomorrow?"
- "Schedule team meeting Tuesday at 2pm"
- "Do I have any conflicts this week?"
- "sendblue" (find meetings with just a company name)
- "acme" (works with just a keyword)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.