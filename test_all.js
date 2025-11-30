const fetch = require('node-fetch');

async function testAllScrapers() {
    const query = 'iphone 15';
    console.log(`Testing all scrapers for query: ${query}`);

    try {
        const response = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        const results = data.results || [];
        const status = data.status || {};

        console.log('\n--- Status ---');
        console.log('Success:', status.success);
        console.log('Failed:', status.failed);

        console.log('\n--- Results Breakdown ---');
        const counts = {};
        results.forEach(r => {
            counts[r.store] = (counts[r.store] || 0) + 1;
        });
        console.table(counts);

        console.log('\n--- Sample Prices ---');
        Object.keys(counts).forEach(store => {
            const item = results.find(r => r.store === store);
            console.log(`${store}: ${item.title.substring(0, 30)}... - R$ ${item.price}`);
        });

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testAllScrapers();
