const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function debugSites() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // 1. Casas Bahia: Test simple URL
    try {
        console.log('Testing Casas Bahia simple URL...');
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const url = 'https://www.casasbahia.com.br/iphone-15';
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const title = await page.title();
        console.log('CB Title:', title);

        // Check for products
        const content = await page.content();
        if (content.includes('Apple iPhone 15')) {
            console.log('CB: Found "Apple iPhone 15"');
        } else {
            console.log('CB: "Apple iPhone 15" NOT found');
        }

        // Dump if successful
        if (title && title !== 'Página não encontrada') {
            const fs = require('fs');
            fs.writeFileSync('cb_simple_dump.html', content);
        }

    } catch (e) {
        console.log('CB Error:', e.message);
    }

    // 2. FastShop: Intercept API
    try {
        console.log('Testing FastShop API interception...');
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.setRequestInterception(true);

        page.on('request', request => {
            request.continue();
        });

        page.on('response', async response => {
            const url = response.url();
            if (url.includes('api') || url.includes('search') || url.includes('query') || url.includes('products')) {
                // console.log('Response URL:', url);
                try {
                    const contentType = response.headers()['content-type'];
                    if (contentType && contentType.includes('application/json')) {
                        const json = await response.json();
                        // Check if it looks like product data
                        const str = JSON.stringify(json);
                        if (str.includes('iphone') || str.includes('iPhone')) {
                            console.log('Found potential API:', url);
                            // console.log('Snippet:', str.substring(0, 200));
                        }
                    }
                } catch (e) {
                    // Ignore errors reading response body
                }
            }
        });

        await page.goto('https://site.fastshop.com.br/s/?q=iphone 15', { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('FastShop navigation complete');

    } catch (e) {
        console.log('FastShop Error:', e.message);
    }

    await browser.close();
}

debugSites();
