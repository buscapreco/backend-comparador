# Como publicar no Google Cloud Run (Gratuitamente)

Este guia passo a passo ajudará você a implantar seu Comparador de Preços no Google Cloud Run. O Cloud Run é ideal porque escala a zero quando não está em uso, mantendo os custos baixos (ou gratuitos dentro do nível gratuito).

## Pré-requisitos

1.  **Conta Google Cloud**: Crie uma conta em [cloud.google.com](https://cloud.google.com/).
2.  **Google Cloud CLI (gcloud)**: Instale a ferramenta de linha de comando. [Instruções aqui](https://cloud.google.com/sdk/docs/install).
3.  **Projeto**: Crie um novo projeto no console do Google Cloud.

## Passo 1: Login e Configuração

Abra seu terminal (PowerShell ou CMD) e execute:

```bash
# Faça login na sua conta Google
gcloud auth login

# Defina o projeto que você criou (substitua SEU_ID_DO_PROJETO pelo ID real)
gcloud config set project SEU_ID_DO_PROJETO
```

## Passo 2: Habilitar Serviços Necessários

Habilite o Cloud Run e o Container Registry (ou Artifact Registry):

```bash
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com
```

## Passo 3: Implantar

Execute o comando abaixo para construir e implantar sua aplicação.
**Nota**: O Puppeteer precisa de memória. Vamos definir 2GB de RAM para garantir que o Chrome rode bem.

```bash
gcloud run deploy price-comparator \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 60s
```

*   `--source .`: Usa o código na pasta atual.
*   `--region us-central1`: Região comum (geralmente mais barata e com nível gratuito).
*   `--allow-unauthenticated`: Permite que qualquer pessoa acesse seu site (público).
*   `--memory 2Gi`: Garante memória suficiente para o Chrome.

## Passo 4: Aguardar e Testar

O comando levará alguns minutos para construir o container e implantá-lo.
Ao final, ele mostrará uma URL (ex: `https://price-comparator-xyz-uc.a.run.app`).

Acesse essa URL no seu navegador e seu comparador estará no ar!

## Notas Importantes sobre Custos

*   **Nível Gratuito**: O Cloud Run oferece 2 milhões de requisições mensais gratuitas, mas o uso de memória e CPU também conta.
*   Como sua aplicação usa 2GB de RAM, ela consumirá seus créditos gratuitos mais rápido do que uma aplicação leve.
*   No entanto, como o Cloud Run "desliga" quando ninguém está acessando, para uso pessoal ou de demonstração, é muito provável que você permaneça no nível gratuito.
