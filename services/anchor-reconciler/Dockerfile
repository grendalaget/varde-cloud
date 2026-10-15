FROM node:22-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm exec tsc -p tsconfig.json

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
CMD ["node", "dist/index.js"]
