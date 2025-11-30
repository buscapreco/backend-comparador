const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function verifyFastShop() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.setRequestInterception(true);
        page.on('request', request => request.continue());

        page.on('response', async response => {
            const url = response.url();
            if (url.includes('/api/graphql') && (url.includes('ClientManyProductsQuery') || url.includes('operationName=ClientManyProductsQuery'))) {
                try {
                    const json = await response.json();
                    if (json.data && json.data.search && json.data.search.products && json.data.search.products.edges) {
                        const edges = json.data.search.products.edges;
                        console.log(`Captured response with ${edges.length} items`);
                        edges.forEach((edge, i) => {
                            const item = edge.node;
                            console.log(`Item ${i}: ${item.name}`);
                            console.log(`  Price: ${item.offers ? item.offers.lowPrice : 'N/A'}`);
                            console.log(`  Image: ${item.image && item.image[0] ? item.image[0].url : 'N/A'}`);
                        });
                    } else {
                        console.log('Captured response but no products found in it');
                    }
                } catch (e) {
                    console.log('Error parsing JSON:', e.message);
                }
            }
        });

        const query = 'galaxy tab s10';
        const searchUrl = `https://site.fastshop.com.br/s/?q=${encodeURIComponent(query)}`;
        console.log(`Navigating to: ${searchUrl}`);

        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

verifyFastShop();
