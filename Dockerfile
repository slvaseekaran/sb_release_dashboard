# Use official Node.js image
FROM node:18-alpine

# Install git and other necessary packages
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app files
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
