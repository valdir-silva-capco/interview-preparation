FROM node:24-alpine AS node-runtime

FROM python:3.14-alpine
RUN apk add --no-cache libstdc++ util-linux \
    && test -x /usr/bin/prlimit
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
WORKDIR /opt/runner
COPY package.json server.mjs ./
ENV NODE_ENV=production
CMD ["node", "server.mjs"]
