const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function debugCBNetwork() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        console.log('Testing Casas Bahia Network...');
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.setRequestInterception(true);

        page.on('request', request => {
            request.continue();
        });

        page.on('response', async response => {
            const url = response.url();
            if (url.includes('api') || url.includes('search') || url.includes('query') || url.includes('products')) {
                try {
                    const contentType = response.headers()['content-type'];
                    if (contentType && contentType.includes('application/json')) {
                        const json = await response.json();
                        const str = JSON.stringify(json);
                        if (str.includes('iPhone') || str.includes('iphone')) {
                            console.log('Found potential CB API:', url);
                        }
                    }
                } catch (e) {
                    // Ignore
                }
            }
        });

        // Try the search URL that "worked" (returned results, even if wrong) to see the API
        await page.goto('https://www.casasbahia.com.br/busca/iphone 15', { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('CB navigation complete');

    } catch (e) {
        console.log('CB Error:', e.message);
    }

    await browser.close();
}

debugCBNetwork();
