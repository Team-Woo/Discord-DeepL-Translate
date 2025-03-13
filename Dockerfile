# ----- Stage 1: Build the application -----
FROM node:18-alpine AS builder
WORKDIR /app

# Copy project files needed for installing dependencies and building
COPY package*.json tsconfig.json ./
COPY src ./src

# Install dependencies and build the TypeScript project
RUN npm install
RUN npm run build

# ----- Stage 2: Run the application -----
FROM node:18-alpine
WORKDIR /app

# Only copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Use npm start defined in package.json, which runs "node dist/index.js"
CMD ["npm", "start"]