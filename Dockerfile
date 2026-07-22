ARG NODE_VERSION=22.13.1

# Create build stage
FROM node:${NODE_VERSION}-slim AS build

# Set the working directory inside the container
WORKDIR /app

# Copy dependency manifests to leverage Docker layer caching.
# pnpm-workspace.yaml is required so pnpm reads the allowBuilds settings
# during install; otherwise build scripts fail with ERR_PNPM_IGNORED_BUILDS.
COPY ./package.json /app/
COPY ./pnpm-lock.yaml /app/
COPY ./pnpm-workspace.yaml /app/

# Install dependencies using the pnpm version pinned in package.json.
# corepack@latest is required to avoid signature verification errors with
# the outdated Corepack bundled in the Node image.
RUN npm install -g corepack@latest \
	&& corepack enable && corepack prepare --activate \
	&& pnpm install --frozen-lockfile

# Copy the rest of the application files to the working directory
COPY . ./

# Generate the Prisma client (prisma/generated is gitignored, so it is not
# present in the checkout and must be generated before building Nitro, which
# imports it from server/utils/db.ts). prisma.config.ts eagerly resolves
# DATABASE_URL, so a dummy value is provided; `generate` does not connect.
RUN DATABASE_URL="mysql://user:pass@localhost:3306/db" pnpm run db:generate

# Build the application
RUN pnpm run build

# Create a new stage for the production image
FROM node:${NODE_VERSION}-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the output from the build stage to the working directory
COPY --from=build /app/.output ./

# Define environment variables
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=4000 
ENV NODE_ENV=production

# Expose the port the application will run on
EXPOSE 4000

# Start the application
CMD ["node", "/app/server/index.mjs"]