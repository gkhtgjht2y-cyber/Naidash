// =============================================================================
// API CONFIGURATION - ADD YOUR API KEYS HERE
// =============================================================================

const API_CONFIG = {
    // World Bank API (No key needed - always works)
    worldBank: 'https://api.worldbank.org/v2/country/NGA/indicator/',
    
    // GNews API - Get free key at: https://gnews.io/register
    // 100 requests per day on free tier
    gnews: {
        enabled: false, // Set to true after adding your key
        apiKey: '884f26d3b2e37640fad650eeaea12834',
        url: 'https://gnews.io/api/v4/search'
    },
    
    // NewsAPI - Get free key at: https://newsapi.org/register
    // 100 requests per day on free tier
    newsapi: {
        enabled: false, // Set to true after adding your key
        apiKey: '4d203a0393b34ab8926187d29628468c',
        url: 'https://newsapi.org/v2/everything'
    },
    
    // MediaStack API - Alternative news source: https://mediastack.com/
    mediastack: {
        enabled: false,
        apiKey: 'pub_a197e7eaf05f4f1ba8dedee42a9745c6',
        url: 'http://api.mediastack.com/v1/news'
    }
};

// =============================================================================
// ECONOMIC INDICATORS CONFIGURATION
// =============================================================================

const INDICATORS = {
    'NY.GDP.MKTP.CD': { 
        name: 'GDP', 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
        color: '#00D9FF',
        gradient: 'gradient-cyan',
        unit: 'billions',
        format: (val) => '$' + (val / 1e9).toFixed(2) + 'B'
    },
    'FP.CPI.TOTL.ZG': { 
        name: 'Inflation Rate', 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
        color: '#FF6B6B',
        gradient: 'gradient-red',
        unit: 'percent',
        format: (val) => val.toFixed(2) + '%'
    },
    'SL.UEM.TOTL.ZS': { 
        name: 'Unemployment', 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        color: '#FFB800',
        gradient: 'gradient-orange',
        unit: 'percent',
        format: (val) => val.toFixed(2) + '%'
    },
    'NY.GDP.PCAP.CD': { 
        name: 'GDP per Capita', 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
        color: '#4ECB71',
        gradient: 'gradient-green',
        unit: 'dollars',
        format: (val) => '$' + val.toLocaleString(undefined, {maximumFractionDigits: 0})
    },
    'NE.EXP.GNFS.ZS': { 
        name: 'Exports (% GDP)', 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
        color: '#A78BFA',
        gradient: 'gradient-purple',
        unit: 'percent',
        format: (val) => val.toFixed(2) + '%'
    },
    'NE.IMP.GNFS.ZS': { 
        name: 'Imports (% GDP)', 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>`,
        color: '#F472B6',
        gradient: 'gradient-pink',
        unit: 'percent',
        format: (val) => val.toFixed(2) + '%'
    }
};

// =============================================================================
// GLOBAL VARIABLES
// =============================================================================

let chartDataStore = {};
let mainChart = null;
let comparisonChart = null;
let selectedIndicator = 'NY.GDP.MKTP.CD';

// =============================================================================
// WORLD BANK DATA FUNCTIONS
// =============================================================================

async function fetchWorldBankData(indicator, years = 15) {
    try {
        const response = await fetch(
            `${API_CONFIG.worldBank}${indicator}?format=json&per_page=${years}`
        );
        const data = await response.json();
        
        if (data[1] && data[1].length > 0) {
            return data[1].filter(d => d.value !== null);
        }
        return [];
    } catch (error) {
        console.error(`Error fetching ${indicator}:`, error);
        return [];
    }
}

async function loadEconomicData() {
    const metricsGrid = document.getElementById('metricsGrid');
    metricsGrid.innerHTML = '';

    for (const [indicator, info] of Object.entries(INDICATORS)) {
        const data = await fetchWorldBankData(indicator, 15);
        
        if (data && data.length > 0) {
            chartDataStore[indicator] = data.reverse();
            
            const latest = data[data.length - 1];
            const previous = data[data.length - 2];
            
            let change = 0;
            let changeClass = 'positive';
            
            if (previous && latest.value && previous.value) {
                change = ((latest.value - previous.value) / previous.value * 100);
                
                if (change > 0) {
                    changeClass = (info.name.includes('Inflation') || info.name.includes('Unemployment')) 
                        ? 'negative' : 'positive';
                } else if (change < 0) {
                    changeClass = (info.name.includes('Inflation') || info.name.includes('Unemployment')) 
                        ? 'positive' : 'negative';
                }
            }

            const card = document.createElement('div');
            card.className = 'metric-card';
            card.dataset.indicator = indicator;
            card.style.color = info.color;
            if (indicator === selectedIndicator) {
                card.classList.add('active');
            }
            
            card.innerHTML = `
                <div class="metric-header">
                    <div class="metric-icon ${info.gradient}">
                        ${info.icon}
                    </div>
                    <div class="metric-change ${changeClass}">
                        ${change > 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}%
                    </div>
                </div>
                <div class="metric-label">${info.name}</div>
                <div class="metric-value" style="color: ${info.color}">${info.format(latest.value)}</div>
                <div class="metric-year">Year: ${latest.date}</div>
            `;
            
            card.addEventListener('click', () => {
                selectedIndicator = indicator;
                updateSelectedMetric();
                updateMainChart(indicator);
            });
            
            metricsGrid.appendChild(card);
        }
    }

    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    
    if (!mainChart) {
        initializeCharts();
    }
    updateMainChart(selectedIndicator);
    updateComparisonChart();
}

// =============================================================================
// NEWS FETCHING FUNCTIONS
// =============================================================================

async function fetchGNews() {
    if (!API_CONFIG.gnews.enabled || API_CONFIG.gnews.apiKey === 'YOUR_GNEWS_API_KEY_HERE') {
        return null;
    }
    
    try {
        const url = `${API_CONFIG.gnews.url}?q=Nigeria+economy&lang=en&country=ng&max=10&apikey=${API_CONFIG.gnews.apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.articles) {
            return data.articles.map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source.name,
                publishedAt: article.publishedAt,
                image: article.image
            }));
        }
    } catch (error) {
        console.error('GNews fetch error:', error);
    }
    return null;
}

async function fetchNewsAPI() {
    if (!API_CONFIG.newsapi.enabled || API_CONFIG.newsapi.apiKey === 'YOUR_NEWSAPI_KEY_HERE') {
        return null;
    }
    
    try {
        const url = `${API_CONFIG.newsapi.url}?q=Nigeria+economy&sortBy=publishedAt&language=en&pageSize=10&apiKey=${API_CONFIG.newsapi.apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.articles) {
            return data.articles.map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source.name,
                publishedAt: article.publishedAt,
                image: article.urlToImage
            }));
        }
    } catch (error) {
        console.error('NewsAPI fetch error:', error);
    }
    return null;
}

async function fetchMediaStack() {
    if (!API_CONFIG.mediastack.enabled || API_CONFIG.mediastack.apiKey === 'YOUR_MEDIASTACK_KEY_HERE') {
        return null;
    }
    
    try {
        const url = `${API_CONFIG.mediastack.url}?access_key=${API_CONFIG.mediastack.apiKey}&countries=ng&keywords=economy&limit=10`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.data) {
            return data.data.map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source,
                publishedAt: article.published_at,
                image: article.image
            }));
        }
    } catch (error) {
        console.error('MediaStack fetch error:', error);
    }
    return null;
}

// Fallback news when no API is configured
const FALLBACK_NEWS = [
    {
        title: "Nigeria's Tech Sector Attracts Record Foreign Investment",
        description: "Technology and fintech sectors continue to drive economic diversification, with venture capital funding reaching new heights in the digital economy space.",
        source: "Business Day",
        time: "2 hours ago",
        category: "Technology"
    },
    {
        title: "Central Bank Announces New Monetary Policy Framework",
        description: "The Central Bank of Nigeria unveils comprehensive measures to enhance price stability and support sustainable economic growth across key sectors.",
        source: "The Guardian Nigeria",
        time: "5 hours ago",
        category: "Finance"
    },
    {
        title: "Agricultural Exports Show Strong Growth in Q4",
        description: "Non-oil exports, particularly in agriculture and agro-processing, demonstrate robust performance contributing to improved trade balance.",
        source: "Premium Times",
        time: "1 day ago",
        category: "Trade"
    },
    {
        title: "Infrastructure Investment Plan Gains Federal Approval",
        description: "Government approves major infrastructure initiatives aimed at improving transportation networks and energy distribution across economic zones.",
        source: "Nairametrics",
        time: "1 day ago",
        category: "Infrastructure"
    },
    {
        title: "SME Sector Reports Increased Access to Credit Facilities",
        description: "Small and medium enterprises benefit from expanded lending programs, supporting job creation and economic diversification efforts.",
        source: "This Day Live",
        time: "2 days ago",
        category: "Business"
    },
    {
        title: "Digital Banking Services Expand to Rural Communities",
        description: "Mobile banking and digital payment platforms reach underserved areas, promoting financial inclusion and supporting rural economic development.",
        source: "Vanguard",
        time: "2 days ago",
        category: "Banking"
    }
];

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
    return Math.floor(seconds / 604800) + ' weeks ago';
}

async function loadNews() {
    const newsGrid = document.getElementById('newsGrid');
    newsGrid.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Fetching latest news...</p></div>';
    
    // Try to fetch from APIs
    let articles = await fetchGNews();
    if (!articles) articles = await fetchNewsAPI();
    if (!articles) articles = await fetchMediaStack();
    
    // Use fallback if no API configured
    if (!articles) {
        displayFallbackNews(newsGrid);
        return;
    }
    
    // Display fetched articles
    displayNews(articles, newsGrid);
}

function displayNews(articles, container) {
    container.innerHTML = '';
    
    articles.slice(0, 6).forEach(article => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        
        const timeAgo = article.publishedAt ? getTimeAgo(article.publishedAt) : article.time || 'Recently';
        
        newsItem.innerHTML = `
            <div class="news-source">${article.source}</div>
            <div class="news-title">${article.title}</div>
            <div class="news-meta">${timeAgo}</div>
            <div class="news-description">${article.description || 'Click to read more...'}</div>
            <a href="${article.url}" target="_blank" class="news-link">Read full article →</a>
        `;
        
        container.appendChild(newsItem);
    });
}

function displayFallbackNews(container) {
    container.innerHTML = '';
    
    FALLBACK_NEWS.forEach(article => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        
        newsItem.innerHTML = `
            <div class="news-source">${article.source}</div>
            <div class="news-title">${article.title}</div>
            <div class="news-meta">${article.time} • ${article.category}</div>
            <div class="news-description">${article.description}</div>
        `;
        
        container.appendChild(newsItem);
    });
    
    // Add API info banner
    const apiInfo = document.createElement('div');
    apiInfo.className = 'api-info';
    apiInfo.innerHTML = `
        <strong>💡 Get Live News Updates!</strong>
        <p>Add your free API key to get real-time news from:</p>
        <p>
            <a href="https://gnews.io" target="_blank">GNews.io</a> • 
            <a href="https://newsapi.org" target="_blank">NewsAPI.org</a> • 
            <a href="https://mediastack.com" target="_blank">MediaStack.com</a>
        </p>
        <p style="margin-top: 8px; font-size: 0.875rem;">Edit the API_CONFIG section in app.js to add your keys</p>
    `;
    container.appendChild(apiInfo);
}

// =============================================================================
// CHART FUNCTIONS
// =============================================================================

function updateSelectedMetric() {
    document.querySelectorAll('.metric-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.indicator === selectedIndicator) {
            card.classList.add('active');
        }
    });
    
    const info = INDICATORS[selectedIndicator];
    document.getElementById('selectedMetric').textContent = info.name;
}

function initializeCharts() {
    const mainCtx = document.getElementById('mainChart').getContext('2d');
    const compCtx = document.getElementById('comparisonChart').getContext('2d');
    
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    Chart.defaults.font.size = 13;
    Chart.defaults.font.weight = '600';
    
    mainChart = new Chart(mainCtx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: true, 
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 14, weight: '700' }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1F2937',
                    bodyColor: '#4B5563',
                    borderColor: '#E5E7EB',
                    borderWidth: 2,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            const info = INDICATORS[selectedIndicator];
                            return ' ' + info.name + ': ' + info.format(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { 
                        color: '#F3F4F6',
                        lineWidth: 1.5
                    },
                    ticks: {
                        callback: function(value) {
                            const info = INDICATORS[selectedIndicator];
                            if (info.unit === 'billions') {
                                return '$' + (value / 1e9).toFixed(1) + 'B';
                            } else if (info.unit === 'percent') {
                                return value.toFixed(1) + '%';
                            }
                            return value.toLocaleString();
                        },
                        font: { size: 12, weight: '600' },
                        color: '#6B7280'
                    }
                },
                x: {
                    grid: { 
                        color: '#F3F4F6',
                        lineWidth: 1.5
                    },
                    ticks: {
                        font: { size: 12, weight: '600' },
                        color: '#6B7280'
                    }
                }
            }
        }
    });
    
    comparisonChart = new Chart(compCtx, {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: true, 
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 14, weight: '700' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1F2937',
                    bodyColor: '#4B5563',
                    borderColor: '#E5E7EB',
                    borderWidth: 2,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return ' GDP: $' + context.parsed.y.toFixed(2) + 'B';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: '#F3F4F6', lineWidth: 1.5 },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0) + 'B';
                        },
                        font: { size: 12, weight: '600' },
                        color: '#6B7280'
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 12, weight: '600' },
                        color: '#6B7280'
                    }
                }
            }
        }
    });
}

function updateMainChart(indicator) {
    const data = chartDataStore[indicator];
    if (!data || !mainChart) return;
    
    const info = INDICATORS[indicator];
    const labels = data.map(d => d.date);
    const values = data.map(d => d.value);
    
    mainChart.data.labels = labels;
    mainChart.data.datasets = [{
        label: info.name,
        data: values,
        borderColor: info.color,
        backgroundColor: info.color + '40',
        borderWidth: 4,
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: info.color,
        pointBorderColor: '#fff',
        pointBorderWidth: 3
    }];
    
    mainChart.update();
}

function updateComparisonChart() {
    if (!comparisonChart) return;
    
    const gdpData = chartDataStore['NY.GDP.MKTP.CD'];
    if (!gdpData || gdpData.length < 5) return;
    
    const last5Years = gdpData.slice(-5);
    const labels = last5Years.map(d => d.date);
    const values = last5Years.map(d => d.value / 1e9);
    
    comparisonChart.data.labels = labels;
    comparisonChart.data.datasets = [{
        label: 'GDP (Billions USD)',
        data: values,
        backgroundColor: 'rgba(167, 139, 250, 0.8)',
        borderColor: '#A78BFA',
        borderWidth: 2,
        borderRadius: 12,
        borderSkipped: false
    }];
    
    comparisonChart.update();
}

// =============================================================================
// INITIALIZATION
// =============================================================================

async function initializeDashboard() {
    console.log('🚀 Initializing Nigeria Economic Dashboard...');
    
    // Load economic data
    await loadEconomicData();
    
    // Load news
    await loadNews();
    
    // Set up auto-refresh every 5 minutes
    setInterval(async () => {
        console.log('🔄 Refreshing data...');
        await loadEconomicData();
        await loadNews();
    }, 300000);
    
    console.log('✅ Dashboard initialized successfully!');
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeDashboard);
