# Stage 1: Build the Vite app
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

# Copy the built static files
COPY --from=build /app/dist /usr/share/nginx/html

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 3500