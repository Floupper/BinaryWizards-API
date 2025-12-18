# # Utiliser une image Node.js basée sur Debian
# FROM node:18-slim

# # Définir le répertoire de travail
# WORKDIR /app

# # Installer les dépendances nécessaires pour la compilation
# RUN apt-get update && apt-get install -y \
#     python3 \
#     make \
#     g++ \
#     && rm -rf /var/lib/apt/lists/*

# # Copier uniquement les fichiers nécessaires pour installer les dépendances
# COPY package.json package-lock.json ./

# # Supprimer complètement le node_modules s'il existe déjà dans le contexte
# RUN rm -rf node_modules

# # Installer les dépendances en forçant la reconstruction de bcrypt
# RUN npm ci

# # Copier le reste de l'application
# COPY . .

# # Nettoyer les node_modules/bcrypt préexistants du contexte de build si présents
# RUN rm -rf node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node || true

# # Réinstaller bcrypt spécifiquement pour s'assurer qu'il est compilé pour cette architecture
# RUN npm ci bcrypt

# # Compiler Prisma
# RUN npx prisma generate

# # Exposer le port
# EXPOSE 33012

# # Commande de démarrage
# CMD ["node", "/app/src/index.js"]

FROM node:24-slim AS build

USER root

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

ADD package.json package-lock.json ./

RUN npm install

ADD . .

RUN npx prisma generate

RUN groupadd -r api && \
    useradd -r -g api -d /home/apiUser -s /bin/bash -m apiUser && \
    mkdir -p /home/apiUser && chown -R apiUser:api /app /home/apiUser

FROM build AS production

ENV NODE_ENV=production

USER apiUser

WORKDIR /app

EXPOSE 33012

CMD ["node", "/app/src/index.js"]