# MNKY VERSE Discord bot — build from services/discord-bots (context .)
FROM node:20-alpine AS builder
WORKDIR /app

COPY shared ./shared
RUN cd shared && npm install && npm run build

COPY mnky-verse-bot/package.json mnky-verse-bot/package-lock.json* mnky-verse-bot/pnpm-lock.yaml* mnky-verse-bot/tsconfig.json mnky-verse-bot/
COPY mnky-verse-bot/src ./mnky-verse-bot/src
WORKDIR /app/mnky-verse-bot
RUN npm install && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/shared ./shared
COPY --from=builder /app/mnky-verse-bot/node_modules ./mnky-verse-bot/node_modules
COPY --from=builder /app/mnky-verse-bot/package.json ./mnky-verse-bot/
COPY --from=builder /app/mnky-verse-bot/dist ./mnky-verse-bot/dist

WORKDIR /app/mnky-verse-bot
CMD ["node", "dist/index.js"]
