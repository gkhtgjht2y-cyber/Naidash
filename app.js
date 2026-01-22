// =============================================================================
// API CONFIGURATION - ALL APIS ENABLED AND CONFIGURED
// =============================================================================

const API_CONFIG = {
    // World Bank API (No key needed - always works)
    worldBank: 'https://api.worldbank.org/v2/country/NGA/indicator/',
    
    // GNews API - Get free key at: https://gnews.io/register
    // 100 requests per day on free tier
    gnews: {
        enabled: true, // ENABLED
        apiKey: '884f26d3b2e37640fad650eeaea12834', // Using the provided key
        url: 'https://gnews.io/api/v4/search'
    },
    
    // NewsAPI - Get free key at: https://newsapi.org/register
    // 100 requests per day on free tier
    newsapi: {
        enabled: true, // ENABLED with placeholder key
        apiKey: '4d203a0393b34ab8926187d29628468c',
        url: 'https://newsapi.org/v2/everything'
    },
    
    // MediaStack API - Alternative news source: https://mediastack.com/
    mediastack: {
        enabled: true, // ENABLED with placeholder key
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
let newsSource = 'gnews'; // Default news source

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
// NEWS FETCHING FUNCTIONS - ALL ENABLED
// =============================================================================

async function fetchGNews() {
    try {
        console.log('📡 Fetching news from GNews API...');
        const searchTerms = [
            'Nigeria economy',
            'Nigeria GDP growth',
            'Nigerian inflation',
            'Central Bank of Nigeria',
            'Nigerian stock exchange',
            'Nigeria oil production',
            'Nigerian naira exchange rate',
            'Nigeria foreign investment'
        ];
        
        const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        const url = `${API_CONFIG.gnews.url}?q=${encodeURIComponent(randomTerm)}&lang=en&country=ng&max=10&apikey=${API_CONFIG.gnews.apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`GNews API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            console.log(`✅ Retrieved ${data.articles.length} articles from GNews`);
            return data.articles.map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source.name,
                publishedAt: article.publishedAt,
                image: article.image,
                apiSource: 'GNews'
            }));
        }
        return null;
    } catch (error) {
        console.error('❌ GNews fetch error:', error);
        return null;
    }
}

async function fetchNewsAPI() {
    try {
        console.log('📡 Fetching news from NewsAPI...');
        const url = `${API_CONFIG.newsapi.url}?q=Nigeria+economy&sortBy=publishedAt&language=en&pageSize=10&apiKey=${API_CONFIG.newsapi.apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`NewsAPI error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            console.log(`✅ Retrieved ${data.articles.length} articles from NewsAPI`);
            return data.articles.map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source.name,
                publishedAt: article.publishedAt,
                image: article.urlToImage,
                apiSource: 'NewsAPI'
            }));
        }
        return null;
    } catch (error) {
        console.error('❌ NewsAPI fetch error:', error);
        return null;
    }
}

async function fetchMediaStack() {
    try {
        console.log('📡 Fetching news from MediaStack...');
        const url = `${API_CONFIG.mediastack.url}?access_key=${API_CONFIG.mediastack.apiKey}&countries=ng&keywords=economy&limit=10`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`MediaStack error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            console.log(`✅ Retrieved ${data.data.length} articles from MediaStack`);
            return data.data.map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source,
                publishedAt: article.published_at,
                image: article.image,
                apiSource: 'MediaStack'
            }));
        }
        return null;
    } catch (error) {
        console.error('❌ MediaStack fetch error:', error);
        return null;
    }
}

// Fallback news data
const FALLBACK_NEWS = [
    {
        title: "Nigeria's Economy Shows Strong Recovery in Q4 2023",
        description: "GDP growth exceeds expectations as non-oil sectors drive economic expansion amidst global challenges.",
        source: "Business Day Nigeria",
        time: "3 hours ago",
        category: "Economy",
        url: "#",
        apiSource: "Fallback"
    },
    {
        title: "Central Bank Maintains Monetary Policy Rate at 18.75%",
        description: "MPC cites inflation concerns while balancing economic growth objectives in latest policy decision.",
        source: "The Guardian Nigeria",
        time: "6 hours ago",
        category: "Finance",
        url: "#",
        apiSource: "Fallback"
    },
    {
        title: "Oil Production Rises to 1.6 Million Barrels Per Day",
        description: "Increased output coupled with stable prices boosts government revenue projections for 2024.",
        source: "Premium Times",
        time: "1 day ago",
        category: "Energy",
        url: "#",
        apiSource: "Fallback"
    },
    {
        title: "Digital Economy Contributes 18.44% to Nigeria's GDP",
        description: "Tech sector emerges as fastest growing segment with fintech leading the transformation.",
        source: "Nairametrics",
        time: "1 day ago",
        category: "Technology",
        url: "#",
        apiSource: "Fallback"
    },
    {
        title: "Agricultural Exports Surge by 23% in 2023",
        description: "Cocoa, sesame seeds, and cashew lead non-oil export earnings as diversification efforts bear fruit.",
        source: "This Day Live",
        time: "2 days ago",
        category: "Agriculture",
        url: "#",
        apiSource: "Fallback"
    },
    {
        title: "Nigerian Stock Exchange Hits Record Market Capitalization",
        description: "Bull run continues as foreign investors return to Nigerian equities market.",
        source: "Vanguard Nigeria",
        time: "2 days ago",
        category: "Markets",
        url: "#",
        apiSource: "Fallback"
    }
];

function getTimeAgo(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Recently';
        }
        
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
        if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
        return Math.floor(seconds / 604800) + 'w ago';
    } catch (error) {
        return 'Recently';
    }
}

function displayNews(articles, container) {
    container.innerHTML = '';
    
    articles.slice(0, 6).forEach(article => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        
        const timeAgo = getTimeAgo(article.publishedAt) || article.time || 'Recently';
        const source = article.source || 'News Source';
        const description = article.description || 'Click to read more...';
        const url = article.url || '#';
        
        newsItem.innerHTML = `
            <div class="news-header">
                <span class="news-source">${source}</span>
                <span class="news-api-badge" style="background: ${article.apiSource === 'GNews' ? '#00D9FF' : article.apiSource === 'NewsAPI' ? '#FF6B6B' : article.apiSource === 'MediaStack' ? '#4ECB71' : '#FFB800'};">
                    ${article.apiSource}
                </span>
            </div>
            <h3 class="news-title">${article.title}</h3>
            <div class="news-meta">${timeAgo}</div>
            <p class="news-description">${description}</p>
            <a href="${url}" target="_blank" class="news-link">Read full article →</a>
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
            <div class="news-header">
                <span class="news-source">${article.source}</span>
                <span class="news-api-badge" style="background: #FFB800;">Fallback</span>
            </div>
            <h3 class="news-title">${article.title}</h3>
            <div class="news-meta">${article.time} • ${article.category}</div>
            <p class="news-description">${article.description}</p>
            <a href="${article.url}" target="_blank" class="news-link">Read article →</a>
        `;
        
        container.appendChild(newsItem);
    });
    
    // Add API status
    const apiStatus = document.createElement('div');
    apiStatus.className = 'api-status';
    apiStatus.innerHTML = `
        <div class="status-header">
            <h4>📡 API Status</h4>
            <button onclick="cycleNewsSource()" class="cycle-btn">Switch Source</button>
        </div>
        <div class="status-grid">
            <div class="status-item ${API_CONFIG.gnews.enabled ? 'active' : 'inactive'}">
                <span class="status-dot"></span>
                <span>GNews: ${API_CONFIG.gnews.enabled ? '✅ Enabled' : '❌ Disabled'}</span>
            </div>
            <div class="status-item ${API_CONFIG.newsapi.enabled ? 'active' : 'inactive'}">
                <span class="status-dot"></span>
                <span>NewsAPI: ${API_CONFIG.newsapi.enabled ? '✅ Enabled' : '❌ Disabled'}</span>
            </div>
            <div class="status-item ${API_CONFIG.mediastack.enabled ? 'active' : 'inactive'}">
                <span class="status-dot"></span>
                <span>MediaStack: ${API_CONFIG.mediastack.enabled ? '✅ Enabled' : '❌ Disabled'}</span>
            </div>
        </div>
        <p class="status-note">Current source: <strong>${newsSource.toUpperCase()}</strong></p>
        <p class="status-info">💡 Tip: Get your own API keys for unlimited access!</p>
    `;
    container.appendChild(apiStatus);
}

async function fetchNewsFromSource(source) {
    switch(source) {
        case 'gnews':
            return await fetchGNews();
        case 'newsapi':
            return await fetchNewsAPI();
        case 'mediastack':
            return await fetchMediaStack();
        default:
            return await fetchGNews();
    }
}

async function loadNews() {
    const newsGrid = document.getElementById('newsGrid');
    
    // Show loading state
    newsGrid.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Fetching live news from ${newsSource.toUpperCase()}...</p>
            <p class="loading-sub">Using API: ${newsSource === 'gnews' ? 'GNews' : newsSource === 'newsapi' ? 'NewsAPI' : 'MediaStack'}</p>
        </div>
    `;
    
    console.log(`📰 Loading news from ${newsSource}...`);
    
    // Try the selected news source
    let articles = await fetchNewsFromSource(newsSource);
    
    // If primary source fails, try others in order
    if (!articles || articles.length === 0) {
        const sources = ['gnews', 'newsapi', 'mediastack'];
        for (const source of sources) {
            if (source !== newsSource && API_CONFIG[source].enabled) {
                console.log(`Trying alternative source: ${source}`);
                articles = await fetchNewsFromSource(source);
                if (articles && articles.length > 0) {
                    newsSource = source;
                    break;
                }
            }
        }
    }
    
    // Display results
    if (articles && articles.length > 0) {
        console.log(`✅ Displaying ${articles.length} live articles from ${newsSource}`);
        displayNews(articles, newsGrid);
    } else {
        console.log('⚠️ No live articles found, using fallback news');
        displayFallbackNews(newsGrid);
    }
}

function cycleNewsSource() {
    const sources = ['gnews', 'newsapi', 'mediastack'];
    const currentIndex = sources.indexOf(newsSource);
    const nextIndex = (currentIndex + 1) % sources.length;
    
    // Skip disabled sources
    let attempts = 0;
    while (!API_CONFIG[sources[nextIndex]].enabled && attempts < sources.length) {
        newsSource = sources[(nextIndex + 1) % sources.length];
        attempts++;
    }
    
    newsSource = sources[nextIndex];
    console.log(`🔄 Switching to ${newsSource} news source`);
    loadNews();
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
// UI ENHANCEMENTS
// =============================================================================

function setupNewsControls() {
    const newsSection = document.querySelector('.section-header');
    
    // Create controls container
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'news-controls';
    
    controlsDiv.innerHTML = `
        <div class="control-group">
            <button onclick="cycleNewsSource()" class="control-btn">
                🔄 Switch Source
            </button>
            <button onclick="loadNews()" class="control-btn">
                📡 Refresh News
            </button>
            <div class="source-indicator">
                Current: <span class="source-name">${newsSource.toUpperCase()}</span>
            </div>
        </div>
    `;
    
    if (newsSection) {
        newsSection.appendChild(controlsDiv);
    }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

async function initializeDashboard() {
    console.log('🚀 Initializing Nigeria Economic Dashboard with LIVE APIs...');
    console.log('📡 API Status:', {
        GNews: API_CONFIG.gnews.enabled ? '✅ Enabled' : '❌ Disabled',
        NewsAPI: API_CONFIG.newsapi.enabled ? '✅ Enabled' : '❌ Disabled',
        MediaStack: API_CONFIG.mediastack.enabled ? '✅ Enabled' : '❌ Disabled'
    });
    
    try {
        // Show loading screen
        document.body.innerHTML += `
            <div id="loadingScreen" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div class="spinner" style="
                    width: 50px;
                    height: 50px;
                    border: 5px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 1s linear infinite;
                "></div>
                <h2 style="margin-top: 20px; margin-bottom: 10px;">Nigeria Economic Dashboard</h2>
                <p>Loading live data from APIs...</p>
                <div style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
                    <div>🌐 Fetching economic data...</div>
                    <div>📡 Connecting to news APIs...</div>
                </div>
                <style>
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            </div>
        `;
        
        // Load economic data
        await loadEconomicData();
        
        // Load news
        await loadNews();
        
        // Setup UI controls
        setupNewsControls();
        
        // Remove loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.transition = 'opacity 0.5s';
                setTimeout(() => loadingScreen.remove(), 500);
            }
        }, 1000);
        
        // Setup auto-refresh
        setInterval(async () => {
            console.log('🔄 Auto-refreshing economic data...');
            await loadEconomicData();
        }, 600000); // 10 minutes
        
        setInterval(async () => {
            console.log('📰 Auto-refreshing news...');
            await loadNews();
        }, 300000); // 5 minutes
        
        console.log('✅ Dashboard initialized successfully!');
        
    } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
        
        // Show error but continue
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            ⚠️ Some features may be limited. Using fallback data where needed.
            <button onclick="this.parentElement.remove()">×</button>
        `;
        document.body.prepend(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeDashboard);
