# Multi-stage build for production optimization
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm install --production && \
    npm cache clean --force

# Install all dependencies (for build stage)
FROM base AS deps-dev
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# Development stage
FROM base AS development
WORKDIR /app

# Copy node_modules from deps-dev
COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Start development server
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Production stage
FROM base AS production
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start production server
CMD ["node", "server.js"]
