const express = require('express');
const cors = require('cors');
const path = require('path');
const { saveHistory, getHistory } = require('./history_manager');

// --- CONFIGURAÇÃO PUPPETEER CORRIGIDA ---
// 1. Usamos 'puppeteer-extra' como o objeto principal
const puppeteer = require('puppeteer-extra');

// 2. Adicionamos o plugin Stealth
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// 3. Importamos o 'core' apenas para ajudar a achar o caminho do executável
const { executablePath } = require('puppeteer-core');
// ----------------------------------------

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// --- FUNÇÃO MESTRA DE CONFIGURAÇÃO DO NAVEGADOR ---
// Esta função garante que o código rode tanto no seu Windows quanto no Render
const getLaunchOptions = () => {
    return {
        headless: 'new', // Modo sem interface gráfica
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Economiza memória no Render
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
        // Lógica inteligente: 
        // Se estiver no Render (ENV definido), usa o caminho do Render.
        // Se estiver no seu PC, o executablePath('chrome') do puppeteer-core acha o Chrome do sistema.
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || executablePath('chrome')
    };
};

async function searchMercadoLivre(query) {
    let browser = null;
    try {
        browser = await puppeteer.launch(getLaunchOptions());
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(`https://lista.mercadolivre.com.br/${query}`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const products = await page.evaluate(() => {
            const items = document.querySelectorAll('.ui-search-layout__item');
            const results = [];

            items.forEach(item => {
                const titleEl = item.querySelector('.ui-search-item__title') ||
                    item.querySelector('.poly-component__title-wrapper') ||
                    item.querySelector('.poly-component__title') ||
                    item.querySelector('h2');

                const priceEl = item.querySelector('.poly-price__current .andes-money-amount__fraction') ||
                    item.querySelector('.ui-search-price__part--medium .andes-money-amount__fraction') ||
                    item.querySelector('.andes-money-amount__fraction');

                const linkEl = item.querySelector('.ui-search-link') || item.querySelector('a');

                const imageEl = item.querySelector('.ui-search-result-image__element') ||
                    item.querySelector('.poly-component__picture');

                if (titleEl && priceEl && linkEl) {
                    let imageUrl = '';
                    if (imageEl) {
                        imageUrl = imageEl.getAttribute('data-src') || imageEl.getAttribute('src') || '';
                    }

                    results.push({
                        title: titleEl.innerText,
                        price: parseFloat(priceEl.innerText.replace(/\./g, '').replace(',', '.')),
                        link: linkEl.href,
                        image: imageUrl,
                        store: 'Mercado Livre'
                    });
                }
            });
            return results.slice(0, 5);
        });

        await browser.close();
        return { results: products, success: true, store: 'Mercado Livre' };
    } catch (error) {
        console.error('Error scraping Mercado Livre:', error);
        if (browser) await browser.close();
        return { results: [], success: false, store: 'Mercado Livre' };
    }
}

async function searchAmazon(query) {
    let browser = null;
    try {
        browser = await puppeteer.launch(getLaunchOptions());
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(`https://www.amazon.com.br/s?k=${query}`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const products = await page.evaluate(() => {
            const items = document.querySelectorAll('[data-component-type="s-search-result"]');
            const results = [];

            items.forEach(item => {
                const titleEl = item.querySelector('h2 a span') || item.querySelector('h2 span');
                const priceEl = item.querySelector('.a-price-whole');
                const priceFractionEl = item.querySelector('.a-price-fraction');
                const linkEl = item.querySelector('h2 a') || item.querySelector('.a-link-normal');
                const imageEl = item.querySelector('.s-image');

                if (titleEl && priceEl && linkEl) {
                    let priceStr = priceEl.innerText.replace(/\./g, '').replace(',', '').trim();
                    if (priceFractionEl) {
                        priceStr += '.' + priceFractionEl.innerText;
                    }

                    results.push({
                        title: titleEl.innerText,
                        price: parseFloat(priceStr),
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
        console.error('Error scraping Amazon:', error);
        if (browser) await browser.close();
        return { results: [], success: false, store: 'Amazon Brasil' };
    }
}

async function searchMagalu(query) {
    let browser = null;
    try {
        browser = await puppeteer.launch(getLaunchOptions());
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(`https://www.magazineluiza.com.br/busca/${query}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const products = await page.evaluate(() => {
            const results = [];
            const links = document.querySelectorAll('a[href*="/p/"]');

            links.forEach(link => {
                if (results.length >= 5) return;
                const container = link;

                const titleEl = container.querySelector('h2, h3, [data-testid="product-title"]');
                let priceEl = container.querySelector('[data-testid="price-value"]');
                if (!priceEl) priceEl = container.querySelector('[data-testid="price-original"]');
                const imageEl = container.querySelector('img');

                if (titleEl && priceEl) {
                    const priceText = priceEl.innerText;
                    const match = priceText.match(/R\$\s*([\d.,]+)/);
                    if (match) {
                        results.push({
                            title: titleEl.innerText.trim(),
                            price: parseFloat(match[1].replace(/\./g, '').replace(',', '.')),
                            link: link.href,
                            image: imageEl ? imageEl.src : '',
                            store: 'Magazine Luiza'
                        });
                    }
                }
            });
            // Filtra duplicatas
            return results.filter((v, i, a) => a.findIndex(t => (t.link === v.link)) === i);
        });

        await browser.close();
        return { results: products, success: true, store: 'Magazine Luiza' };
    } catch (error) {
        console.error('Error scraping Magalu:', error);
        if (browser) await browser.close();
        return { results: [], success: false, store: 'Magazine Luiza' };
    }
}

async function searchBuscape(query) {
    let browser = null;
    try {
        browser = await puppeteer.launch(getLaunchOptions());
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(`https://www.buscape.com.br/search?q=${query}`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const products = await page.evaluate(() => {
            const items = document.querySelectorAll('[data-testid="product-card"]');
            const results = [];

            items.forEach(item => {
                const titleEl = item.querySelector('[data-testid="product-card::name"]');
                const priceEl = item.querySelector('[data-testid="product-card::price"]');
                const linkEl = item.querySelector('a');
                const imageEl = item.querySelector('img');

                if (titleEl && priceEl && linkEl) {
                    const priceText = priceEl.innerText;
                    const price = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());

                    let link = linkEl.href;
                    if (link.startsWith('/')) link = `https://www.buscape.com.br${link}`;

                    results.push({
                        title: titleEl.innerText,
                        price: price,
                        link: link,
                        image: imageEl ? imageEl.src : '',
                        store: 'Buscapé'
                    });
                }
            });
            return results.slice(0, 5);
        });

        await browser.close();
        return { results: products, success: true, store: 'Buscapé' };
    } catch (error) {
        console.error('Error scraping Buscapé:', error);
        if (browser) await browser.close();
        return { results: [], success: false, store: 'Buscapé' };
    }
}

async function searchCasasBahia(query) {
    let browser = null;
    try {
        browser = await puppeteer.launch(getLaunchOptions());
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(`https://www.casasbahia.com.br/b?strBusca=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const products = await page.evaluate(() => {
            const results = [];
            const cards = document.querySelectorAll('[data-testid="product-card"], .product-card');

            cards.forEach(card => {
                if (results.length >= 5) return;
                const titleEl = card.querySelector('[data-testid="product-title"], h3, h2');
                const priceEl = card.querySelector('[data-testid="product-price-value"], .product-price');
                const linkEl = card.querySelector('a');
                const imageEl = card.querySelector('img');

                if (titleEl && priceEl && linkEl) {
                    const match = priceEl.innerText.match(/R\$\s*([\d.,]+)/);
                    if (match) {
                        results.push({
                            title: titleEl.innerText,
                            price: parseFloat(match[1].replace(/\./g, '').replace(',', '.')),
                            link: linkEl.href,
                            image: imageEl ? imageEl.src : '',
                            store: 'Casas Bahia'
                        });
                    }
                }
            });
            return results;
        });

        await browser.close();
        return { results: products, success: true, store: 'Casas Bahia' };
    } catch (error) {
        console.error('Error scraping Casas Bahia:', error);
        if (browser) await browser.close();
        return { results: [], success: false, store: 'Casas Bahia' };
    }
}

async function searchZoom(query) {
    let browser = null;
    try {
        browser = await puppeteer.launch(getLaunchOptions());
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(`https://www.zoom.com.br/search?q=${query}`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const products = await page.evaluate(() => {
            const items = document.querySelectorAll('[data-testid="product-card"]');
            const results = [];

            items.forEach(item => {
                const titleEl = item.querySelector('[data-testid="product-card::name"]');
                const priceEl = item.querySelector('[data-testid="product-card::price"]');
                const linkEl = item.querySelector('a');
                const imageEl = item.querySelector('img');

                if (titleEl && priceEl && linkEl) {
                    const priceText = priceEl.innerText;
                    const price = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());

                    let link = linkEl.href;
                    if (link.startsWith('/')) link = `https://www.zoom.com.br${link}`;

                    results.push({
                        title: titleEl.innerText,
                        price: price,
                        link: link,
                        image: imageEl ? imageEl.src : '',
                        store: 'Zoom'
                    });
                }
            });
            return results.slice(0, 5);
        });

        await browser.close();
        return { results: products, success: true, store: 'Zoom' };
    } catch (error) {
        console.error('Error scraping Zoom:', error);
        if (browser) await browser.close();
        return { results: [], success: false, store: 'Zoom' };
    }
}

async function searchFastShop(query) {
    let browser = null;
    try {
        browser = await puppeteer.launch(getLaunchOptions());
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // FastShop é complexo (GraphQL), usamos uma estratégia simplificada para economizar recursos no Free Tier
        const searchUrl = `https://site.fastshop.com.br/s/?q=${encodeURIComponent(query)}`;

        try {
            await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        } catch (e) {
            console.log('FastShop timeout, skipping...');
            await browser.close();
            return { results: [], success: false, store: 'FastShop' };
        }

        // Placeholder para implementação futura mais robusta se necessário
        await browser.close();
        return { results: [], success: true, store: 'FastShop (Indisponível no modo leve)' };

    } catch (error) {
        console.error('Error scraping FastShop:', error);
        if (browser) await browser.close();
        return { results: [], success: false, store: 'FastShop' };
    }
}

app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    console.log(`Searching for: ${q}`);

    // Executa as buscas em paralelo
    const scraperResults = await Promise.all([
        searchMercadoLivre(q),
        searchAmazon(q),
        searchMagalu(q),
        searchBuscape(q),
        searchCasasBahia(q),
        searchZoom(q)
    ]);

    const allResults = [];
    const status = { success: [], failed: [] };

    scraperResults.forEach(result => {
        if (result.success && result.results && result.results.length > 0) {
            status.success.push(result.store);
            allResults.push(...result.results);
        } else {
            status.failed.push(result.store);
        }
    });

    // Lógica de Filtros e Normalização
    const normalize = (str) => str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
    const queryNorm = normalize(q);

    // Palavras que indicam acessório
    const exclusionKeywords = ['capa', 'case', 'pelicula', 'vidro', 'folha', 'suporte', 'cabo', 'carregador', 'adaptador'];
    const isAccessorySearch = exclusionKeywords.some(kw => queryNorm.includes(kw));

    let filteredResults = allResults.filter(item => {
        const titleNorm = normalize(item.title);

        // Se não está buscando acessório, remove itens que tenham palavras de acessório
        if (!isAccessorySearch && exclusionKeywords.some(kw => titleNorm.includes(kw))) {
            return false;
        }

        // Verifica se TODAS as palavras da busca estão no título
        const queryTerms = queryNorm.split(/\s+/).filter(t => t.length > 1);
        return queryTerms.every(term => {
            if (term.includes('+')) { // Trata A9+ como A9 Plus
                const base = term.replace(/\+/g, '');
                return titleNorm.includes(term) || titleNorm.includes(`${base} plus`);
            }
            return titleNorm.includes(term);
        });
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