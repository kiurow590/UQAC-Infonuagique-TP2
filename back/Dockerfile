# Dockerfile (backend/Dockerfile)
FROM node:20

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Expose le port où ton serveur Node écoute
EXPOSE 3000

# Démarre l'application
CMD ["npm", "start"]
