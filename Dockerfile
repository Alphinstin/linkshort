FROM node:20-alpine AS build
WORKDIR /app
COPY package-lock.json ./
COPY package.json ./
RUN npm ci
COPY . .
RUN npm run build
COPY ./src/rateLimit.lua dist/
    
FROM node:20-alpine 
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package-lock.json ./ 
COPY --from=build /app/package.json ./
RUN npm ci --omit=dev
USER node
CMD ["node", "dist/server.js"]