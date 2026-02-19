FROM node:20-alpine AS builder

# Set working dir
WORKDIR /app

# Install dependencies with npm using the committed lockfile for reproducible installs
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy source and build
COPY . .

# Ensure `public` exists so runner stage can COPY it even if the repo has no public/ folder
RUN mkdir -p public

ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy build output and dependencies from builder
COPY --from=builder /app/.next .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "run", "start"]
