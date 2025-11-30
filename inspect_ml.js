const puppeteer = require('puppeteer');

async function inspectML() {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto('https://lista.mercadolivre.com.br/iphone', { waitUntil: 'domcontentloaded' });

    const html = await page.evaluate(() => {
        const item = document.querySelector('.ui-search-layout__item');
        return item ? item.innerHTML : 'No item found';
    });

    console.log(html);
    await browser.close();
}

inspectML();
