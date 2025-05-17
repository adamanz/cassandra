#!/bin/bash

# Script to create a new GitHub repository called "Cassandra"

echo "This script will help you create a new GitHub repository called 'Cassandra'"
echo "Prerequisites:"
echo "1. You need to have the GitHub CLI (gh) installed"
echo "2. You need to be authenticated with GitHub CLI"
echo ""
echo "To install GitHub CLI: brew install gh"
echo "To authenticate: gh auth login"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Please install it first."
    echo "Run: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "You are not authenticated with GitHub CLI."
    echo "Please run: gh auth login"
    exit 1
fi

# Create new repository
echo "Creating new GitHub repository 'Cassandra'..."
gh repo create Cassandra --private --description "AI-powered calendar management assistant with Google Calendar integration"

# Add new remote
echo "Adding new remote for Cassandra repository..."
git remote add cassandra git@github.com:adamanz/Cassandra.git

# Show current remotes
echo "Current remotes:"
git remote -v

echo ""
echo "Repository created! To push to the new Cassandra repository:"
echo "1. First, commit your changes: git add . && git commit -m 'Initial commit'"
echo "2. Then push to Cassandra: git push cassandra main"
echo ""
echo "To change the default remote to Cassandra:"
echo "git remote remove origin"
echo "git remote rename cassandra origin"