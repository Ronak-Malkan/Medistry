# Stage 1: development
FROM node:18-alpine AS development

WORKDIR /usr/src/app

# Install dev dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and start in dev mode
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

# Stage 2: production
FROM node:18-alpine AS production

WORKDIR /usr/src/app

# Install only production deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy the entire codebase, build, and run
COPY . .
RUN npm run build

EXPOSE 4000
CMD ["node", "dist/index.js"]
