// API Configuration
const API_ENDPOINTS = {
    worldBank: 'https://api.worldbank.org/v2/country/NGA/indicator/',
    // Add your API keys below when you get them
    gnews: 'https://gnews.io/api/v4/search?q=Nigeria+economy&lang=en&country=ng&max=10&apikey=884f26d3b2e37640fad650eeaea12834',
    newsapi: 'https://newsapi.org/v2/everything?q=Nigeria+economy&sortBy=publishedAt&language=en&pageSize=10&apiKey=4d203a0393b34ab8926187d29628468c'
};

// World Bank Economic Indicators
const INDICATORS = {
    'NY.GDP.MKTP.CD': 'GDP (Current US$)',
    'FP.CPI.TOTL.ZG': 'Inflation Rate',
    'SL.UEM.TOTL.ZS': 'Unemployment Rate',
    'NY.GDP.PCAP.CD': 'GDP per Capita',
    'BN.CAB.XOKA.GD.ZS': 'Current Account Balance',
    'GC.DOD.TOTL.GD.ZS': 'Government Debt (% of GDP)'
};

/**
 * Fetch data from World Bank API for a specific indicator
 */
async function fetchWorldBankData(indicator) {
    try {
        const response = await fetch(`${API_ENDPOINTS.worldBank}${indicator}?format=json&per_page=5`);
        const data = await response.json();
        
        if (data[1] && data[1].length > 0) {
            // Filter out null values and return the most recent 2 data points
            return data[1].filter(d => d.value !== null).slice(0, 2);
        }
        return null;
    } catch (error) {
        console.error(`Error fetching ${indicator}:`, error);
        return null;
    }
}

/**
 * Load and display all economic metrics
 */
async function loadEconomicData() {
    const metricsGrid = document.getElementById('metricsGrid');
    metricsGrid.innerHTML = '';

    for (const [indicator, label] of Object.entries(INDICATORS)) {
        const data = await fetchWorldBankData(indicator);
        
        if (data && data.length > 0) {
            const latest = data[0];
            const previous = data[1];
            
            let change = '';
            let changeClass = 'neutral';
            
            // Calculate percentage change if previous data exists
            if (previous && latest.value && previous.value) {
                const percentChange = ((latest.value - previous.value) / previous.value * 100).toFixed(2);
                
                if (percentChange > 0) {
                    change = `↑ ${percentChange}%`;
                    // For inflation and unemployment, increase is negative
                    changeClass = (label.includes('Inflation') || label.includes('Unemployment') || label.includes('Debt')) 
                        ? 'negative' : 'positive';
                } else if (percentChange < 0) {
                    change = `↓ ${Math.abs(percentChange)}%`;
                    // For inflation and unemployment, decrease is positive
                    changeClass = (label.includes('Inflation') || label.includes('Unemployment') || label.includes('Debt')) 
                        ? 'positive' : 'negative';
                } else {
                    change = 'No change';
                }
            }

            // Format the display value
            let displayValue = latest.value.toLocaleString();
            if (label.includes('GDP') && !label.includes('per Capita')) {
                // Convert to billions for GDP
                displayValue = '$' + (latest.value / 1e9).toFixed(2) + 'B';
            } else if (label.includes('per Capita')) {
                displayValue = '$' + latest.value.toLocaleString(undefined, {maximumFractionDigits: 0});
            } else if (label.includes('Rate') || label.includes('%')) {
                displayValue = latest.value.toFixed(2) + '%';
            }

            // Create metric card
            const card = document.createElement('div');
            card.className = 'metric-card';
            card.innerHTML = `
                <div class="metric-label">${label}</div>
                <div class="metric-value">${displayValue}</div>
                <div class="metric-change ${changeClass}">
                    ${change || 'Data from ' + latest.date}
                </div>
                <div style="margin-top: 10px; font-size: 0.8em; color: #999;">
                    Year: ${latest.date}
                </div>
            `;
            metricsGrid.appendChild(card);
        }
    }

    // Update timestamp
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
}

/**
 * Load news articles from free APIs
 */
async function loadNews() {
    const newsGrid = document.getElementById('newsGrid');
    
    try {
        // Try GNews API first (replace YOUR_GNEWS_API_KEY with actual key)
        // For now, we'll use placeholder news
        displayPlaceholderNews(newsGrid);
        
        // Uncomment below when you have API keys:
        /*
        const response = await fetch(API_ENDPOINTS.gnews);
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            displayNews(data.articles, newsGrid);
        } else {
            displayPlaceholderNews(newsGrid);
        }
        */
        
    } catch (error) {
        console.error('Error loading news:', error);
        displayPlaceholderNews(newsGrid);
    }
}

/**
 * Display news articles in the grid
 */
function displayNews(articles, container) {
    container.innerHTML = '';
    
    articles.slice(0, 8).forEach(article => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        
        const publishedDate = new Date(article.publishedAt);
        const timeAgo = getTimeAgo(publishedDate);
        
        newsItem.innerHTML = `
            <div class="news-title">${article.title}</div>
            <div class="news-meta">
                ${article.source.name} • ${timeAgo}
            </div>
            <div class="news-description">
                ${article.description || 'Click to read more...'}
            </div>
            <a href="${article.url}" target="_blank" class="news-link">Read full article →</a>
        `;
        
        container.appendChild(newsItem);
    });
}

/**
 * Display placeholder news when API is not available
 */
function displayPlaceholderNews(container) {
    container.innerHTML = `
        <div class="news-item">
            <div class="news-title">Nigeria's Economy Shows Resilience Amid Global Challenges</div>
            <div class="news-meta">Business Day • 2 hours ago</div>
            <div class="news-description">
                Recent economic indicators suggest Nigeria's economy is maintaining stability despite global headwinds, 
                with diversification efforts showing promising results in the non-oil sector.
            </div>
            <a href="#" class="news-link">Read full article →</a>
        </div>
        
        <div class="news-item">
            <div class="news-title">Central Bank Maintains Monetary Policy Stance</div>
            <div class="news-meta">The Guardian Nigeria • 5 hours ago</div>
            <div class="news-description">
                The Central Bank of Nigeria held interest rates steady as inflation concerns persist, 
                balancing growth objectives with price stability.
            </div>
            <a href="#" class="news-link">Read full article →</a>
        </div>
        
        <div class="news-item">
            <div class="news-title">Tech Sector Drives Economic Growth</div>
            <div class="news-meta">Nairametrics • 1 day ago</div>
            <div class="news-description">
                Nigeria's technology and fintech sectors continue to attract significant investment, 
                contributing to economic diversification and job creation across major cities.
            </div>
            <a href="#" class="news-link">Read full article →</a>
        </div>
        
        <div class="news-item">
            <div class="news-title">Agricultural Output Increases in Q4</div>
            <div class="news-meta">Premium Times • 1 day ago</div>
            <div class="news-description">
                Agricultural production shows positive growth trajectory, supporting food security initiatives 
                and rural economic development programs.
            </div>
            <a href="#" class="news-link">Read full article →</a>
        </div>
        
        <div class="news-item">
            <div class="news-title">Foreign Investment in Infrastructure Projects Rises</div>
            <div class="news-meta">This Day Live • 2 days ago</div>
            <div class="news-description">
                New infrastructure investments signal growing international confidence in Nigeria's economic prospects, 
                particularly in transportation and energy sectors.
            </div>
            <a href="#" class="news-link">Read full article →</a>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #666; font-size: 0.9em;">
            💡 To get live news updates, add your free API key from 
            <a href="https://gnews.io" target="_blank" style="color: #667eea;">GNews.io</a> or 
            <a href="https://newsapi.org" target="_blank" style="color: #667eea;">NewsAPI.org</a> 
            in the app.js file
        </div>
    `;
}

/**
 * Calculate time ago from date
 */
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [name, secondsInInterval] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInInterval);
        if (interval >= 1) {
            return interval === 1 ? `1 ${name} ago` : `${interval} ${name}s ago`;
        }
    }
    
    return 'Just now';
}

/**
 * Generate economic outlook based on available data
 */
function generateOutlook() {
    const outlook = document.getElementById('outlook');
    
    outlook.innerHTML = `
        <h3>📈 Current Economic Assessment</h3>
        <div class="outlook-text">
            <p><strong>Growth Prospects:</strong> Nigeria's economy continues to demonstrate resilience 
            with diversification efforts gaining significant traction. The non-oil sector, particularly 
            technology, agriculture, telecommunications, and services, is contributing substantially to GDP growth 
            and reducing dependency on oil revenues.</p>
            
            <p style="margin-top: 15px;"><strong>Key Challenges:</strong> Inflation management remains 
            a priority requiring careful monetary policy coordination. Currency stability and exchange rate 
            management continue to be central to economic planning, alongside addressing infrastructure gaps 
            and improving the business environment.</p>
            
            <p style="margin-top: 15px;"><strong>Positive Indicators:</strong> Increased foreign direct 
            investment in technology and infrastructure sectors, a thriving fintech ecosystem, growing youth 
            entrepreneurship, and improved agricultural productivity signal positive medium to long-term 
            economic prospects. The digital economy continues to expand rapidly.</p>
            
            <p style="margin-top: 15px;"><strong>Sector Highlights:</strong> The technology sector, 
            particularly fintech and e-commerce, continues to attract substantial investment. Agricultural 
            reforms are improving food security and rural incomes. The entertainment and creative industries 
            are gaining international recognition and generating significant export revenue.</p>
            
            <p style="margin-top: 15px;"><strong>Forward Outlook:</strong> With continued policy reforms, 
            investment in critical infrastructure, human capital development, and strategic positioning in 
            regional markets, Nigeria is positioned for sustainable economic growth. However, maintaining 
            vigilance on inflation control, fiscal discipline, and security challenges remains essential 
            for realizing this potential.</p>
        </div>
    `;
}

/**
 * Initialize the dashboard
 */
async function initializeDashboard() {
    console.log('Initializing Nigeria Economic Dashboard...');
    
    // Load initial data
    await loadEconomicData();
    await loadNews();
    generateOutlook();
    
    // Set up auto-refresh every 5 minutes (300000 milliseconds)
    setInterval(async () => {
        console.log('Refreshing data...');
        await loadEconomicData();
        await loadNews();
    }, 300000);
    
    console.log('Dashboard initialized successfully!');
}

// Start the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);
