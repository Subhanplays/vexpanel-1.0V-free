FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN cd apps/frontend && npm install
COPY apps/frontend ./apps/frontend
RUN cd apps/frontend && npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/apps/web ./apps/web
COPY --from=build /app/apps/frontend/dist ./apps/frontend/dist
EXPOSE 3000
CMD ["node", "dist/api/src/server.js"]
