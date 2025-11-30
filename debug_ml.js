const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function debugML() {
    const query = 'iphone 15';
    console.log(`Debugging ML for: ${query}`);

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(`https://lista.mercadolivre.com.br/${query}`, { waitUntil: 'domcontentloaded' });

    const items = await page.evaluate(() => {
        const els = document.querySelectorAll('.ui-search-layout__item');
        return Array.from(els).slice(0, 5).map(el => {
            const title = el.querySelector('.ui-search-item__title')?.innerText;
            const isAd = el.innerText.includes('Patrocinado');
            return { title, isAd };
        });
    });

    console.log('ML Items:', items);
    await browser.close();
}

debugML();
