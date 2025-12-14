# Etapa 1: dependências (Bun)
FROM oven/bun:1.2.23 as deps

WORKDIR /app

COPY package.json bun.lock ./

# Dependências para runtime (sem devDependencies)
RUN bun install --frozen-lockfile --production


# Etapa 2: build (Bun)
FROM oven/bun:1.2.23 as builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build


# Etapa 3: runtime (Node)
FROM node:20-slim as runner

WORKDIR /app

ENV NODE_ENV=production

# Necessário para o Sharp renderizar SVG/texto com fontes.
RUN apt-get update \
  && apt-get install -y --no-install-recommends libfontconfig1 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY package.json ./

EXPOSE 3000

# react-router-serve é feito para Node (evita incompatibilidades do Bun com react-dom/server).
CMD ["node", "./node_modules/.bin/react-router-serve", "./build/server/index.js"]
