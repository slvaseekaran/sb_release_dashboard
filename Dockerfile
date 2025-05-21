# Use official Node.js image
FROM node:18-alpine

# Install git (no need for openssh)
RUN apk add --no-cache git

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app files
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start the app directly (no SSH/entrypoint needed)
CMD ["node", "server.js"]
