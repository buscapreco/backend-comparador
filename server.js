const express = require('express');
const puppeteer = require('puppeteer-core);
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');
const path = require('path');
const { saveHistory, getHistory } = require('./history_manager');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

async function searchMercadoLivre(query) {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(`https://lista.mercadolivre.com.br/${query}`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const products = await page.evaluate(() => {
            const items = document.querySelectorAll('.ui-search-layout__item');
            const results = [];

            items.forEach(item => {
                // Support for new poly-card structure and old structure
                const titleEl = item.querySelector('.ui-search-item__title') ||
                    item.querySelector('.poly-component__title-wrapper') ||
                    item.querySelector('.poly-component__title') ||
                    item.querySelector('h2');

                // Prioritize current price selectors
                const priceEl = item.querySelector('.poly-price__current .andes-money-amount__fraction') ||
                    item.querySelector('.ui-search-price__part--medium .andes-money-amount__fraction') ||
                    item.querySelector('.andes-money-amount__fraction');

                const linkEl = item.querySelector('.ui-search-link') ||
                    item.querySelector('a');
                const imageEl = item.querySelector('.ui-search-result-image__element') ||
                    item.querySelector('.poly-component__picture');

                // Coupon / Discount extraction
                const couponEl = item.querySelector('.ui-search-item__highlight-label__text') ||
                    item.querySelector('.poly-price__disc_label') ||
                    item.querySelector('.ui-search-price__discount');

                let couponText = '';
                if (couponEl) {
                    couponText = couponEl.innerText.trim();
                }

                if (titleEl && priceEl && linkEl) {
                    let title = titleEl.innerText;
                    if (couponText) {
                        title += ` [${couponText}]`;
                    }

                    let imageUrl = '';
                    if (imageEl) {
                        imageUrl = imageEl.getAttribute('data-src') || imageEl.getAttribute('src') || '';
                        if (imageUrl.startsWith('data:')) {
                            // Try to find another source if it's a base64 placeholder
                            imageUrl = imageEl.getAttribute('data-src') || '';
                        }
                    }

                    results.push({
                        title: title,
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
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(`https://www.amazon.com.br/s?k=${query}`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const products = await page.evaluate(() => {
            const items = document.querySelectorAll('[data-component-type="s-search-result"]');
            const results = [];

            items.forEach(item => {
                const titleEl = item.querySelector('h2 a span') ||
                    item.querySelector('h2 span') ||
                    item.querySelector('h2');

                const priceEl = item.querySelector('.a-price-whole');
                const priceFractionEl = item.querySelector('.a-price-fraction');
                const linkEl = item.querySelector('h2 a') || item.querySelector('.a-link-normal');
                const imageEl = item.querySelector('.s-image');

                if (titleEl && priceEl && linkEl) {
                    let priceStr = priceEl.innerText.replace(/\./g, '').replace(',', '');
                    priceStr = priceStr.replace(/\n/g, '').trim();

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
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(`https://www.magazineluiza.com.br/busca/${query}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const products = await page.evaluate(() => {
            const results = [];
            const links = document.querySelectorAll('a[href*="/p/"]');

            links.forEach(link => {
                if (results.length >= 5) return;

                const container = link;
                if (!container) return;

                const titleEl = container.querySelector('h2, h3, [data-testid="product-title"]');
                let priceEl = container.querySelector('[data-testid="price-value"]');
                if (!priceEl) priceEl = container.querySelector('[data-testid="price-original"]');
                if (!priceEl) priceEl = Array.from(container.querySelectorAll('*')).find(el => el.innerText && el.innerText.includes('R$'));

                const imageEl = container.querySelector('img');

                let title = titleEl ? titleEl.innerText : '';
                if (!title && container.innerText) {
                    const lines = container.innerText.split('\n');
                    title = lines.find(l => l.length > 10 && !l.includes('R$'));
                }

                let price = 0;
                if (priceEl) {
                    const priceText = priceEl.innerText;
                    const match = priceText.match(/R\$\s*([\d.,]+)/);
                    if (match) {
                        price = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
                    }
                }

                if (title && price > 0) {
                    results.push({
                        title: title.trim(),
                        price: price,
                        link: link.href,
                        image: imageEl ? imageEl.src : '',
                        store: 'Magazine Luiza'
                    });
                }
            });

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
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
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
                    if (link.startsWith('/')) {
                        link = `https://www.buscape.com.br${link}`;
                    }

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
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(`https://www.casasbahia.com.br/b?strBusca=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        try {
            await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
        } catch (e) {
            // console.log('Casas Bahia: Product selector timeout');
        }

        const products = await page.evaluate(() => {
            const results = [];
            const cards = document.querySelectorAll('[data-testid="product-card"], .product-card, div[class*="product-card"]');

            cards.forEach(card => {
                if (results.length >= 5) return;

                const titleEl = card.querySelector('[data-testid="product-title"], h3, h2, .product-title');
                const priceEl = card.querySelector('[data-testid="product-price-value"], .product-price, [class*="price"]');
                const linkEl = card.querySelector('a');
                const imageEl = card.querySelector('img');

                if (titleEl && priceEl && linkEl) {
                    const priceText = priceEl.innerText;
                    const match = priceText.match(/R\$\s*([\d.,]+)/);
                    if (match) {
                        const price = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));

                        results.push({
                            title: titleEl.innerText,
                            price: price,
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
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
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
                    if (link.startsWith('/')) {
                        link = `https://www.zoom.com.br${link}`;
                    }

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
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        let capturedProducts = [];

        // Intercept GraphQL API response
        await page.setRequestInterception(true);
        page.on('request', request => request.continue());

        page.on('response', async response => {
            const url = response.url();
            if (url.includes('/api/graphql') && (url.includes('ClientManyProductsQuery') || url.includes('operationName=ClientManyProductsQuery'))) {
                try {
                    const json = await response.json();
                    if (json.data && json.data.search && json.data.search.products && json.data.search.products.edges) {
                        const edges = json.data.search.products.edges;
                        const newProducts = edges.map(edge => {
                            const item = edge.node;
                            let price = item.offers && item.offers.lowPrice ? item.offers.lowPrice : 0;

                            // Fallback if price is 0
                            if (price === 0 && item.offers && item.offers.offers) {
                                const validOffer = item.offers.offers.find(o => o.price > 0);
                                if (validOffer) price = validOffer.price;
                            }

                            return {
                                title: item.name,
                                price: price,
                                link: `https://www.fastshop.com.br/web/p/${item.slug}`,
                                image: item.image && item.image[0] ? item.image[0].url : '',
                                store: 'FastShop'
                            };
                        });
                        capturedProducts.push(...newProducts);
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        });

        const searchUrl = `https://site.fastshop.com.br/s/?q=${encodeURIComponent(query)}`;

        try {
            await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });
        } catch (e) {
            console.log('FastShop navigation timeout, proceeding with captured data...');
        }

        // Deduplicate products based on link
        const uniqueProducts = [];
        const seenLinks = new Set();

        for (const p of capturedProducts) {
            if (!seenLinks.has(p.link) && p.price > 0) { // Only keep items with valid price
                seenLinks.add(p.link);
                uniqueProducts.push(p);
            }
        }

        await browser.close();
        return { results: uniqueProducts, success: true, store: 'FastShop' };

    } catch (error) {
        console.error('Error scraping FastShop:', error);
        if (browser) await browser.close();
        return { results: [], success: false, store: 'FastShop' };
    }
}

app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    console.log(`Searching for: ${q}`);

    try {
        const scraperResults = await Promise.all([
            searchMercadoLivre(q),
            searchAmazon(q),
            searchMagalu(q),
            searchBuscape(q),
            searchCasasBahia(q),
            searchZoom(q),
            searchFastShop(q)
        ]);

        const allResults = [];
        const status = {
            success: [],
            failed: []
        };
        scraperResults.forEach(result => {
            if (result.success && result.results.length > 0) {
                status.success.push(result.store);
                allResults.push(...result.results);
            } else {
                status.failed.push(result.store);
            }
        });

        // Helper function to normalize text (remove accents, lowercase)
        const normalize = (str) => {
            return str.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
        };

        const queryNorm = normalize(q);

        // Expanded exclusion list (unaccented)
        const exclusionKeywords = [
            'capa', 'case', 'pelicula', 'vidro', 'folha', 'suporte', 'cabo',
            'carregador', 'fone', 'kit', 'acessorio', 'compativel', 'lente',
            'smart cover', 'bumper', 'caneta', 'teclado', 'adaptador'
        ];

        // Check if the user is explicitly searching for an accessory
        const isAccessorySearch = exclusionKeywords.some(kw => queryNorm.includes(kw));

        let filteredResults = allResults.filter(item => {
            const titleNorm = normalize(item.title);

            // 1. Filter Accessories
            // If the user is NOT searching for an accessory, filter out items that contain accessory keywords
            if (!isAccessorySearch) {
                // Check if title contains any exclusion keyword
                if (exclusionKeywords.some(kw => titleNorm.includes(kw))) return false;
            }

            // 2. Strict Keyword Matching
            // The title must contain ALL words from the query
            const queryTerms = queryNorm.split(/\s+/).filter(t => t.length > 1);

            const matchesTerms = queryTerms.every(term => {
                // Handle "plus" / "+" equivalence
                if (term.includes('+')) {
                    const base = term.replace(/\+/g, '');
                    // Check for "term" (e.g. a9+) OR "base plus" (e.g. a9 plus) OR "baseplus"
                    return titleNorm.includes(term) ||
                        titleNorm.includes(`${base} plus`) ||
                        titleNorm.includes(`${base}plus`);
                }
                return titleNorm.includes(term);
            });

            if (!matchesTerms) return false;

            // 3. Specific exclusion for Phones if searching for Tablet
            if ((queryNorm.includes('tablet') || queryNorm.includes('tab')) &&
                (titleNorm.includes('smartphone') || titleNorm.includes('celular'))) {
                return false;
            }

            return true;
        });

        filteredResults.sort((a, b) => a.price - b.price);
        saveHistory(q, filteredResults);

        res.json({
            results: filteredResults,
            status: status
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/history', (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    const history = getHistory(q);

    if (history.length === 0) {
        const mockHistory = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(now.getMonth() - i);
            mockHistory.push({
                timestamp: date.toISOString(),
                minPrice: 3000 + Math.random() * 500 - (i * 50),
                resultsCount: 10
            });
        }
        return res.json(mockHistory);
    }

    res.json(history);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
