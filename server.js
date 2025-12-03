const express = require('express');
const cors = require('cors');
const { saveHistory, getHistory } = require('./history_manager');

// --- MODO LEVE (PUPPETEER CORE PURO) ---
const puppeteer = require('puppeteer-core');
// ---------------------------------------

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Configuração do Navegador
const getLaunchOptions = () => {
    return {
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'google-chrome-stable'
    };
};

// Função auxiliar para bloquear imagens e fontes (Economiza MUITA memória)
async function configurePage(page) {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
            req.abort(); // Não baixa imagens nem estilos pesados
        } else {
            req.continue();
        }
    });
    // User Agent simples
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
}

// --- SCRAPERS ---

async function searchMercadoLivre(query) {
    let browser = null;
    try {
        browser = await puppeteer.launch(getLaunchOptions());
        const page = await browser.newPage();
        await configurePage(page);

        await page.goto(`https://lista.mercadolivre.com.br/${query}`, { waitUntil: 'domcontentloaded', timeout: 20000 });

        const products = await page.evaluate(() => {
            const items = document.querySelectorAll('.ui-search-layout__item');
            const results = [];
            items.forEach(item => {
                const titleEl = item.querySelector('.ui-search-item__title') || item.querySelector('.poly-component__title');
                const priceEl = item.querySelector('.andes-money-amount__fraction');
                const linkEl = item.querySelector('a');
                // Pegamos o src mesmo sem baixar a imagem
                const imageEl = item.querySelector('img');

                if (titleEl && priceEl && linkEl) {
                    results.push({
                        title: titleEl.innerText,
                        price: parseFloat(priceEl.innerText.replace(/\./g, '').replace(',', '.')),
                        link: linkEl.href,
                        image: imageEl ? (imageEl.getAttribute('data-src') || imageEl.src) : '',
                        store: 'Mercado Livre'
                    });
                }
            });
            return results.slice(0, 5);
        });
        await browser.close();
        return { results: products, success: true, store: 'Mercado Livre' };
    } catch (error) {
        console.error('ML Error:', error.message);
        if (browser) await browser.close();
        return { results: [], success: false, store: 'Mercado Livre' };
    }
}

async function searchAmazon(query) {
    let browser = null;
    try {
        browser = await puppeteer.launch(getLaunchOptions());
        const page = await browser.newPage();
        await configurePage(page);

        await page.goto(`https://www.amazon.com.br/s?k=${query}`, { waitUntil: 'domcontentloaded', timeout: 20000 });

        const products = await page.evaluate(() => {
            const items = document.querySelectorAll('[data-component-type="s-search-result"]');
            const results = [];
            items.forEach(item => {
                const titleEl = item.querySelector('h2 span');
                const priceEl = item.querySelector('.a-price-whole');
                const linkEl = item.querySelector('h2 a');
                const imageEl = item.querySelector('.s-image');

                if (titleEl && priceEl && linkEl) {
                    results.push({
                        title: titleEl.innerText,
                        price: parseFloat(priceEl.innerText.replace(/\./g, '').replace(',', '')),
                        link: linkEl.href,
                        image: imageEl ? imageEl.src : '',
                        store: 'Amazon Brasil'
                    });
                }
            });
            return results.slice(0, 5);
        });
        await browser.close();
        return { results: products, success: true, store: 'Amazon Brasil' };
    } catch (error) {
        console.error('Amazon Error:', error.message);
        if (browser) await browser.close();
        return { results: [], success: false, store: 'Amazon Brasil' };
    }
}

app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    console.log(`Searching for: ${q}`);

    const allResults = [];
    const status = { success: [], failed: [] };

    // --- MUDANÇA CRUCIAL: EXECUÇÃO SEQUENCIAL ---
    // Faz um de cada vez para não estourar a memória

    // 1. Mercado Livre
    try {
        const mlRes = await searchMercadoLivre(q);
        if (mlRes.success) {
            status.success.push(mlRes.store);
            allResults.push(...mlRes.results);
        } else {
            status.failed.push(mlRes.store);
        }
    } catch (e) { status.failed.push('Mercado Livre'); }

    // 2. Amazon
    try {
        const amzRes = await searchAmazon(q);
        if (amzRes.success) {
            status.success.push(amzRes.store);
            allResults.push(...amzRes.results);
        } else {
            status.failed.push(amzRes.store);
        }
    } catch (e) { status.failed.push('Amazon Brasil'); }

    // --- FIM DA EXECUÇÃO SEQUENCIAL ---

    // Lógica de Filtro
    const normalize = (str) => str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
    const queryNorm = normalize(q);
    const exclusionKeywords = ['capa', 'case', 'pelicula', 'vidro', 'suporte', 'cabo'];
    const isAccessorySearch = exclusionKeywords.some(kw => queryNorm.includes(kw));

    let filteredResults = allResults.filter(item => {
        const titleNorm = normalize(item.title);
        if (!isAccessorySearch && exclusionKeywords.some(kw => titleNorm.includes(kw))) return false;

        const queryTerms = queryNorm.split(/\s+/).filter(t => t.length > 1);
        return queryTerms.every(term => titleNorm.includes(term));
    });

    filteredResults.sort((a, b) => a.price - b.price);
    saveHistory(q, filteredResults);

    res.json({ results: filteredResults, status: status });
});

app.get('/api/history', (req, res) => {
    const { q } = req.query;
    const history = getHistory(q || '');
    res.json(history);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});