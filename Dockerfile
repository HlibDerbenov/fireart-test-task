FROM node:20-alpine

# Create app dir
WORKDIR /usr/src/app

# Install build deps
COPY package.json package-lock.json* tsconfig.json ./

# Install all deps (devDeps needed for build & migration runner)
RUN npm ci

# Copy sources and build
COPY . .
RUN npm run build

# Copy and ensure entrypoint script is executable
COPY entrypoint.sh /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh

EXPOSE 3000

# Entrypoint runs migrations then starts the app
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
