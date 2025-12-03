const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    // Diz para o Puppeteer nunca baixar o Chrome automaticamente
    skipDownload: true,
};