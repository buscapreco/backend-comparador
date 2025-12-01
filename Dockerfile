# Imagem base
FROM node:18-slim

# 1. Instalação do Chrome para o Puppeteer (Essencial para o Render)
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 2. Diretório de trabalho
WORKDIR /usr/src/app

# 3. Copiar dependências
COPY package*.json ./

# 4. Configurar Puppeteer para usar o Chrome instalado acima
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# 5. Instalar pacotes do Node
RUN npm install

# 6. Copiar o projeto
COPY . .

# 7. Expor a porta
EXPOSE 3000

# 8. Rodar o servidor
CMD [ "node", "server.js" ]