FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

# Write VITE_API_URL from the runtime env var into .env so Vite picks it up, then start
CMD ["sh", "-c", "echo \"VITE_API_URL=$VITE_API_URL\" > .env && npm run dev -- --host --port 3001"]

