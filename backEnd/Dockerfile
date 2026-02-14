FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# ✅ create uploads + permissions
RUN mkdir -p /app/uploads \
    && chown -R node:node /app

USER node

EXPOSE 5000

CMD ["npm", "start"]
