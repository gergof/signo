FROM node:16-alpine AS builder

RUN apk add python3 make gcc g++

WORKDIR /root
COPY . /root
RUN npm ci
RUN npm run build
RUN npm ci --only=prod

FROM node:16-alpine

# Install PKCS#11 modules
RUN apk add yubico-piv-tool-dev

WORKDIR /app
COPY --from=builder /root/dist /app/
COPY --from=builder /root/node_modules /app/node_modules/
COPY --from=builder /root/package.json /app/

RUN addgroup -S app && adduser -S app -G app
RUN chown app:app /app

USER app
ENV NODE_ENV=production

ENTRYPOINT ["node", "/app/index.js"]
