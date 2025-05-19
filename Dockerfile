# Use official Node.js image
FROM node:18-alpine

# Install git and openssh for SSH-based git operations
RUN apk add --no-cache git openssh

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app files
COPY . .

# Create .ssh directory and set permissions (for runtime mounting of SSH keys)
RUN mkdir -p /root/.ssh && chmod 700 /root/.ssh

# Optionally, add known_hosts for github.com to prevent host authenticity prompts
RUN ssh-keyscan github.com >> /root/.ssh/known_hosts

# Expose the port your app runs on
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
