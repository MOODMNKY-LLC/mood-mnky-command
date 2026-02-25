# CODE MNKY Discord bot — build from services/discord-bots (context .)
FROM node:20-alpine AS builder
WORKDIR /app

COPY shared ./shared
RUN cd shared && npm install && npm run build

COPY code-mnky-bot/package.json code-mnky-bot/package-lock.json* code-mnky-bot/pnpm-lock.yaml* code-mnky-bot/tsconfig.json code-mnky-bot/
COPY code-mnky-bot/src ./code-mnky-bot/src
WORKDIR /app/code-mnky-bot
RUN npm install && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/shared ./shared
COPY --from=builder /app/code-mnky-bot/node_modules ./code-mnky-bot/node_modules
COPY --from=builder /app/code-mnky-bot/package.json ./code-mnky-bot/
COPY --from=builder /app/code-mnky-bot/dist ./code-mnky-bot/dist

WORKDIR /app/code-mnky-bot
CMD ["node", "dist/index.js"]
