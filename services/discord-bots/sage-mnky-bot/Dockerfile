# SAGE MNKY Discord bot — build from services/discord-bots (context .)
FROM node:20-alpine AS builder
WORKDIR /app

COPY shared ./shared
RUN cd shared && npm install && npm run build

COPY sage-mnky-bot/package.json sage-mnky-bot/package-lock.json* sage-mnky-bot/pnpm-lock.yaml* sage-mnky-bot/tsconfig.json sage-mnky-bot/
COPY sage-mnky-bot/src ./sage-mnky-bot/src
WORKDIR /app/sage-mnky-bot
RUN npm install && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/shared ./shared
COPY --from=builder /app/sage-mnky-bot/node_modules ./sage-mnky-bot/node_modules
COPY --from=builder /app/sage-mnky-bot/package.json ./sage-mnky-bot/
COPY --from=builder /app/sage-mnky-bot/dist ./sage-mnky-bot/dist

WORKDIR /app/sage-mnky-bot
CMD ["node", "dist/index.js"]
