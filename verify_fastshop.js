const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function searchFastShop(query) {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        let products = [];

        // Intercept GraphQL API response
        await page.setRequestInterception(true);
        page.on('request', request => request.continue());

        const apiResponsePromise = new Promise((resolve) => {
            page.on('response', async response => {
                const url = response.url();
                if (url.includes('/api/graphql') && (url.includes('ClientManyProductsQuery') || url.includes('operationName=ClientManyProductsQuery'))) {
                    try {
                        const json = await response.json();
                        if (json.data && json.data.search && json.data.search.products && json.data.search.products.edges) {
                            resolve(json.data.search.products.edges);
                        }
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }
            });
            // Timeout for API response
            setTimeout(() => resolve([]), 20000);
        });

        const searchUrl = `https://site.fastshop.com.br/s/?q=${encodeURIComponent(query)}`;
        console.log(`Navigating to FastShop: ${searchUrl}`);

        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });

        const edges = await apiResponsePromise;

        if (edges && edges.length > 0) {
            console.log(`FastShop: Found ${edges.length} products via API`);
            products = edges.map(edge => {
                const item = edge.node;
                return {
                    title: item.name,
                    price: item.offers && item.offers.lowPrice ? item.offers.lowPrice : 0,
                    link: `https://www.fastshop.com.br/web/p/${item.slug}`,
                    image: item.image && item.image[0] ? item.image[0].url : '',
                    store: 'FastShop'
                };
            });
        } else {
            console.log('FastShop: No products found via API, checking DOM...');
            const items = await page.$$('[data-fs-product-card]');
            for (const item of items) {
                const title = await item.$eval('[data-fs-product-card-title]', el => el.innerText).catch(() => 'No Title');
                const priceText = await item.$eval('[data-fs-price-variant="spot"]', el => el.innerText).catch(() => '0');
                const link = await item.$eval('a', el => el.href).catch(() => '');
                const image = await item.$eval('img', el => el.src).catch(() => '');

                const price = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());

                if (title !== 'No Title') {
                    products.push({
                        title,
                        price,
                        link,
                        image,
                        store: 'FastShop'
                    });
                }
            }
        }

        await browser.close();
        return { results: products, success: true, store: 'FastShop' };

    } catch (error) {
        console.error('Error scraping FastShop:', error);
        if (browser) await browser.close();
        return { results: [], success: false, store: 'FastShop' };
    }
}

searchFastShop('iphone 15').then(res => {
    console.log('Result:', JSON.stringify(res, null, 2));
});
