# Creating the Cassandra Repository

## Option 1: Using GitHub CLI

1. Install GitHub CLI:
   ```bash
   brew install gh
   ```

2. Authenticate:
   ```bash
   gh auth login
   ```

3. Run our setup script:
   ```bash
   ./cassandra-setup.sh
   ```

## Option 2: Using GitHub Web Interface

1. Go to https://github.com/new
2. Repository name: `Cassandra`
3. Description: `AI-powered calendar management assistant with Google Calendar integration`
4. Set to Private
5. Click "Create repository"

6. Then in your terminal, run:
   ```bash
   # Add the new remote
   git remote add cassandra git@github.com:adamanz/Cassandra.git
   
   # Push your code
   git add .
   git commit -m "Initial commit - Cassandra calendar assistant"
   git push cassandra main
   
   # Optionally, change the default remote
   git remote remove origin
   git remote rename cassandra origin
   ```

## Option 3: Just Rename Existing Repository

1. Go to https://github.com/adamanz/cal-agent/settings
2. Change repository name from `cal-agent` to `Cassandra`
3. Update local remote:
   ```bash
   git remote set-url origin git@github.com:adamanz/Cassandra.git
   ```

## Current Status

Your code currently has these changes that should be committed:
- Modified files: .env.example, .env.production.example, CLAUDE.md, src/app/api/chat/route.ts
- New files: Google Maps integration files and tests

Remember to commit these changes before pushing to the new repository!