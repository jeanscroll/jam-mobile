# === STAGE 1: Build ===
FROM node:20-alpine AS builder

ARG NEXT_PUBLIC_PLASMIC_PROJECT_ID
ARG NEXT_PUBLIC_PLASMIC_PROJECT_TOKEN
ARG NEXT_PUBLIC_SUPABASE_ID
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_PLASMIC_PROJECT_ID=$NEXT_PUBLIC_PLASMIC_PROJECT_ID \
    NEXT_PUBLIC_PLASMIC_PROJECT_TOKEN=$NEXT_PUBLIC_PLASMIC_PROJECT_TOKEN \
    NEXT_PUBLIC_SUPABASE_ID=$NEXT_PUBLIC_SUPABASE_ID \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=${NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN} \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}

WORKDIR /app

# Copie du package.json et package-lock.json pour installer les dépendances
COPY package.json package-lock.json ./

# Installer les dépendances et nettoyer le cache npm
RUN npm install && npm cache clean --force

# Copie du reste des fichiers de l'application
COPY . .

# Construction de l'application
RUN npm run build

# === STAGE 2: Runtime ===
FROM node:20-alpine AS runner

WORKDIR /app

# Copie des fichiers de l'étape précédente
COPY --from=builder /app/.next .next
COPY --from=builder /app/public public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json .

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]
