#!/bin/sh
set -e

# Ensure .ssh directory exists
mkdir -p /root/.ssh

# Write the private key from environment variable
echo "$SSH_PRIVATE_KEY" | sed 's/\\n/\n/g' > /root/.ssh/id_rsa

# Set correct permissions
chmod 600 /root/.ssh/id_rsa

# Add github.com to known_hosts to avoid authenticity prompt
ssh-keyscan github.com >> /root/.ssh/known_hosts

# Start your app
exec node server.js
