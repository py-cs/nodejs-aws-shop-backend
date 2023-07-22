FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --quiet

COPY . .

RUN npm run build:es

FROM alpine AS production

RUN apk add --update nodejs

WORKDIR /app

COPY --from=builder /app/dist ./dist

ENV PORT=8080

EXPOSE 8080

CMD [ "node", "./dist/index" ]