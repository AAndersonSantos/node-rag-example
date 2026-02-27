# Usando imagem oficial do Node
FROM node:20-alpine

# Diretório dentro do container
WORKDIR /app

# Copia package primeiro (melhor para cache)
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o resto do projeto
COPY . .

# Compila TypeScript
RUN npx tsc

# Expõe a porta
EXPOSE 3000

# Comando para iniciar
CMD ["node", "dist/index.js"]