const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, 'history.json');

function saveHistory(query, results) {
    let history = {};
    if (fs.existsSync(HISTORY_FILE)) {
        try {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        } catch (e) {
            console.error('Error reading history file:', e);
        }
    }

    const timestamp = new Date().toISOString();

    // Normalize query to lowercase for better matching
    const normalizedQuery = query.toLowerCase().trim();

    if (!history[normalizedQuery]) {
        history[normalizedQuery] = [];
    }

    // Calculate average price or min price for the snapshot
    if (results.length > 0) {
        const minPrice = Math.min(...results.map(r => r.price));
        history[normalizedQuery].push({
            timestamp: timestamp,
            minPrice: minPrice,
            resultsCount: results.length
        });
    }

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function getHistory(query) {
    if (!fs.existsSync(HISTORY_FILE)) return [];

    try {
        const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        const normalizedQuery = query.toLowerCase().trim();
        return history[normalizedQuery] || [];
    } catch (e) {
        console.error('Error reading history file:', e);
        return [];
    }
}

module.exports = { saveHistory, getHistory };
