FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY dist ./dist

USER node
ENTRYPOINT ["node", "dist/bin/unslop.js", "mcp"]
