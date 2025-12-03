FROM node:18-slim

# 1. Instalação do Chrome no Linux (Isso nós queremos)
RUN apt-get update \
  && apt-get install -y wget gnupg \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
  && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-kacst fonts-freefont-ttf libxss1 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# 2. Configurações de Ambiente para economizar memória
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
  NODE_ENV=production

# 3. Copiar arquivos de configuração PRIMEIRO
COPY package*.json ./
COPY .puppeteerrc.cjs ./

# 4. Instalar dependências com flags de economia de memória
# --omit=dev: Não instala ferramentas de desenvolvimento
# --no-audit: Não roda verificação de segurança (economiza RAM)
RUN npm install --omit=dev --no-audit --no-fund

# 5. Copiar o resto do código
COPY . .

EXPOSE 3000

CMD [ "node", "server.js" ]