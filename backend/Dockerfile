FROM node:24-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:24-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["sh", "-c", "npm run migration:run && node dist/main.js"]
