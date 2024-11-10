# Dockerfile (frontend/Dockerfile)
# 1. Utilise une image Node pour construire l'app Vue.js
FROM node:22 AS build-stage

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# 2. Construction du projet pour production
RUN npm run build

# 3. Utilise une image nginx pour servir les fichiers statiques
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf
# Expose le port 80 pour le serveur nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
