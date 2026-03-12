# MOOD MNKY Discord bot — build from services/discord-bots (context .)
FROM node:20-alpine AS builder
WORKDIR /app

COPY shared ./shared
RUN cd shared && npm install && npm run build

COPY mood-mnky-bot/package.json mood-mnky-bot/package-lock.json* mood-mnky-bot/pnpm-lock.yaml* mood-mnky-bot/tsconfig.json mood-mnky-bot/
COPY mood-mnky-bot/src ./mood-mnky-bot/src
WORKDIR /app/mood-mnky-bot
RUN npm install && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/shared ./shared
COPY --from=builder /app/mood-mnky-bot/node_modules ./mood-mnky-bot/node_modules
COPY --from=builder /app/mood-mnky-bot/package.json ./mood-mnky-bot/
COPY --from=builder /app/mood-mnky-bot/dist ./mood-mnky-bot/dist

WORKDIR /app/mood-mnky-bot
CMD ["node", "dist/index.js"]
