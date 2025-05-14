#!/bin/bash

# Set the remote origin
git remote add origin git@github.com:adamanz/cal-agent.git

# Push to GitHub
git push -u origin main

echo "Repository successfully pushed to GitHub!"
echo "Your private repository is available at: https://github.com/adamanz/cal-agent"