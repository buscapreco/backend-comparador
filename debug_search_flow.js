const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function debugSearch() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        // Casas Bahia
        console.log('Testing Casas Bahia...');
        const pageCB = await browser.newPage();
        await pageCB.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await pageCB.goto('https://www.casasbahia.com.br', { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('Casas Bahia Home loaded');

        // Try to find search input
        const searchInputSelector = '#search-form-input, input[type="search"], input[name="strBusca"], input[placeholder*="procura"]';
        await pageCB.waitForSelector(searchInputSelector, { timeout: 10000 });
        await pageCB.type(searchInputSelector, 'iphone 15');
        await pageCB.keyboard.press('Enter');

        await pageCB.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('Casas Bahia Search URL:', pageCB.url());

    } catch (e) {
        console.error('Casas Bahia Error:', e.message);
    }

    try {
        // FastShop
        console.log('Testing FastShop...');
        const pageFS = await browser.newPage();
        await pageFS.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await pageFS.goto('https://www.fastshop.com.br', { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('FastShop Home loaded');

        // Try to find search input
        // FastShop often has a search icon that needs to be clicked first, or an input visible.
        // Let's look for input directly first.
        const searchInputSelectorFS = 'input[type="search"], input[placeholder*="O que você procura"], input[id*="search"]';

        // Sometimes FastShop has a different structure.
        if (await pageFS.$(searchInputSelectorFS) === null) {
            console.log('Search input not found immediately, checking for search button...');
            // Maybe click a search icon first?
        }

        await pageFS.waitForSelector(searchInputSelectorFS, { timeout: 10000 });
        await pageFS.type(searchInputSelectorFS, 'iphone 15');
        await pageFS.keyboard.press('Enter');

        await pageFS.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('FastShop Search URL:', pageFS.url());

    } catch (e) {
        console.error('FastShop Error:', e.message);
    }

    await browser.close();
}

debugSearch();
