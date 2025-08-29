# Builder: install all deps (including dev) and build the app
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build deps
COPY package.json package-lock.json* tsconfig.json ./
# TODO: for long-term correctness consider aligning @nestjs/swagger version with the Nest major or upgrading Nest to v11 and adjusting dependencies
RUN npm ci --legacy-peer-deps

# Copy sources and build
COPY . .
RUN npm run build

# Runner: minimal runtime image with only production deps and built artifacts
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/package-lock.json ./package-lock.json
# TODO: for long-term correctness consider aligning @nestjs/swagger version with the Nest major or upgrading Nest to v11 and adjusting dependencies
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built output and entrypoint
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/entrypoint.sh ./entrypoint.sh

# Ensure entrypoint is executable
RUN chmod +x /usr/src/app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
