const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const loader = document.getElementById('loader');

function formatPrice(price) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(price);
}

async function searchProducts() {
    const query = searchInput.value.trim();
    if (!query) return;

    // Clear previous results and show loader
    resultsGrid.innerHTML = '';
    const searchStatus = document.getElementById('searchStatus');
    if (searchStatus) {
        searchStatus.innerHTML = '';
        searchStatus.style.display = 'none';
    }
    loader.style.display = 'flex';

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`Erro no servidor: ${response.statusText}`);
        }
        const responseData = await response.json();

        const products = responseData.results || [];
        const status = responseData.status;

        loader.style.display = 'none';

        // Display Status
        if (status && searchStatus) {
            let statusHtml = '';

            if (status.success && status.success.length > 0) {
                status.success.forEach(store => {
                    statusHtml += `<div class="status-item status-success">✓ ${store}</div>`;
                });
            }

            if (status.failed && status.failed.length > 0) {
                status.failed.forEach(store => {
                    statusHtml += `<div class="status-item status-failed">✕ ${store}</div>`;
                });
            }

            if (statusHtml) {
                searchStatus.innerHTML = statusHtml;
                searchStatus.style.display = 'flex';
            }
        }

        if (products.length === 0) {
            resultsGrid.innerHTML = `
                <div class="empty-state">
                    <h3>Nenhum produto encontrado</h3>
                    <p>Tente buscar com termos diferentes</p>
                </div>
            `;
            return;
        }

        // Add history button
        const historyBtnContainer = document.createElement('div');
        historyBtnContainer.className = 'history-btn-container';
        historyBtnContainer.innerHTML = `<button class="history-btn" onclick="showHistory('${query.replace(/'/g, "\\'")}')">Ver Histórico de Preços</button>`;
        resultsGrid.appendChild(historyBtnContainer);

        // Show button
        setTimeout(() => {
            const btn = document.querySelector('.history-btn');
            if (btn) btn.style.display = 'inline-block';
        }, 100);

        products.forEach((product, index) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.style.animationDelay = `${index * 0.1}s`;

            card.innerHTML = `
                <span class="store-badge">${product.store}</span>
                <img src="${product.image}" alt="${product.title}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title" title="${product.title}">${product.title}</h3>
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <a href="${product.link}" target="_blank" class="view-btn">Ver na Loja</a>
                </div>
            `;

            resultsGrid.appendChild(card);
        });

    } catch (error) {
        console.error('Error:', error);
        loader.style.display = 'none';
        resultsGrid.innerHTML = `
            <div class="empty-state">
                <h3>Erro ao buscar produtos</h3>
                <p>Ocorreu um erro ao tentar buscar os produtos. Tente novamente.</p>
                <p class="error-details">${error.message}</p>
            </div>
        `;
    }
}

searchBtn.addEventListener('click', searchProducts);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchProducts();
    }
});

// History Modal Logic
const modal = document.getElementById("historyModal");
const span = document.getElementsByClassName("close")[0];
let priceChart = null;

if (span) {
    span.onclick = function () {
        modal.style.display = "none";
    }
}

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

async function showHistory(query) {
    modal.style.display = "block";

    try {
        const response = await fetch(`/api/history?q=${encodeURIComponent(query)}`);
        const historyData = await response.json();

        renderChart(historyData);
    } catch (error) {
        console.error('Error fetching history:', error);
    }
}

function renderChart(data) {
    const ctx = document.getElementById('priceChart').getContext('2d');

    // Sort data by timestamp
    data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const labels = data.map(d => {
        const date = new Date(d.timestamp);
        return date.toLocaleDateString('pt-BR');
    });

    const prices = data.map(d => d.minPrice);

    if (priceChart) {
        priceChart.destroy();
    }

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Menor Preço Encontrado (R$)',
                data: prices,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#fff'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#aaa',
                        callback: function (value) {
                            return 'R$ ' + value.toFixed(2);
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#aaa'
                    }
                }
            }
        }
    });
}
