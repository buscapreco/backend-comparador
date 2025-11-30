const fs = require('fs');

const content = fs.readFileSync('cb_search_result.html', 'utf8');
console.log('Content length:', content.length);

if (content.includes('__NEXT_DATA__')) {
    console.log('Found __NEXT_DATA__');
    const start = content.indexOf('__NEXT_DATA__');
    const end = content.indexOf('</script>', start);
    console.log('Snippet:', content.substring(start, start + 100));
} else {
    console.log('__NEXT_DATA__ not found');
}

if (content.includes('product-card')) {
    console.log('Found product-card');
    const start = content.indexOf('product-card');
    console.log('Snippet:', content.substring(start - 50, start + 100));
} else {
    console.log('product-card not found');
}

// Check for other common data patterns
if (content.includes('__PRELOADED_STATE__')) {
    console.log('Found __PRELOADED_STATE__');
}

// Check for specific product info
if (content.includes('iPhone 15')) {
    console.log('Found "iPhone 15"');
    const start = content.indexOf('iPhone 15');
    console.log('Snippet:', content.substring(start - 100, start + 100));
}
