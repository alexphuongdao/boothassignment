# .devcontainer/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy the rest of the source code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
