// Health Hub Interactive Functionality

let loadedSections = new Set();

// Toggle health section with accessibility and smooth scroll
async function toggleHealthSection(category) {
    const card = document.querySelector(`.health-category[data-category="${category}"] .category-card`);
    const detailsDiv = document.getElementById(`${category}-details`);
    const button = document.getElementById(`${category}-btn`);

    // Close other sections
    document.querySelectorAll('.health-details').forEach(el => {
        if (el !== detailsDiv) {
            el.style.display = 'none';
            el.setAttribute('aria-hidden', 'true');
        }
    });
    
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        if (btn !== button) {
            btn.textContent = 'Learn More ▼';
            btn.classList.remove('active');
            btn.closest('.category-card').setAttribute('aria-expanded', 'false');
        }
    });

    // Toggle clicked section
    if (detailsDiv.style.display === 'none' || detailsDiv.style.display === '') {
        // Load content if not already loaded
        if (!loadedSections.has(category)) {
            await loadHealthContent(category);
            loadedSections.add(category);
        }
        
        detailsDiv.style.display = 'block';
        detailsDiv.setAttribute('aria-hidden', 'false');
        button.textContent = 'Hide Details ▲';
        button.classList.add('active');
        card.setAttribute('aria-expanded', 'true');
        
        // Smooth scroll to the expanded section
        setTimeout(() => {
            detailsDiv.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 100);
    } else {
        detailsDiv.style.display = 'none';
        detailsDiv.setAttribute('aria-hidden', 'true');
        button.textContent = 'Learn More ▼';
        button.classList.remove('active');
        card.setAttribute('aria-expanded', 'false');
    }
}

// Load health content with error handling and retry
async function loadHealthContent(category) {
    const detailsDiv = document.getElementById(`${category}-details`);
    
    // Show loading state
    detailsDiv.innerHTML = `
        <div class="loading-content">
            <div class="content-spinner"></div>
            <p>Loading health tips...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/health-tips/${category}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.sections || data.sections.length === 0) {
            detailsDiv.innerHTML = `
                <div class="error-content">
                    <p><i class="fa-solid fa-exclamation-triangle"></i> No tips available for this category.</p>
                </div>
            `;
            return;
        }
        
        // Build content HTML
        const contentHTML = data.sections.map(section => `
            <div class="health-section">
                <div class="section-header">
                    <h4>
                        <span class="section-emoji">${section.icon}</span>
                        ${section.name}
                    </h4>
                </div>
                <ul class="tips-list">
                    ${section.tips.map(tip => `
                        <li class="tip-item">
                            <i class="fa-solid fa-check-circle tip-icon"></i>
                            ${tip}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');
        
        detailsDiv.innerHTML = contentHTML;
        
    } catch (error) {
        console.error('Error loading health content:', error);
        detailsDiv.innerHTML = `
            <div class="error-content">
                <p><i class="fa-solid fa-exclamation-triangle"></i> 
                Unable to load health tips at this time. Please try again later.</p>
                <button onclick="loadHealthContent('${category}')" class="retry-btn">
                    <i class="fa-solid fa-refresh"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Add keyboard accessibility (Enter key to toggle)
document.addEventListener('DOMContentLoaded', function() {
    console.log('Health Hub initialized');
    
    // Keyboard support for toggling
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const category = this.closest('.health-category').dataset.category;
                toggleHealthSection(category);
            }
        });
    });
});

// Inject the CSS (cleaned and optimized)
const healthHubCSS = `
<style>
.loading-content, .error-content {
    text-align: center;
    padding: 2rem;
    color: #666;
}

.content-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #e9ecef;
    border-top: 3px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.error-content i {
    color: #dc3545;
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    display: block;
}

.retry-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 1rem;
    transition: background-color 0.3s ease;
    font-size: 0.9rem;
}

.retry-btn:hover {
    background: #0056b3;
}

.section-header {
    margin-bottom: 1rem;
}

.section-header h4 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #2c3e50;
    font-size: 1.2rem;
    margin: 0;
}

.section-emoji {
    font-size: 1.5rem;
}

.tips-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.tip-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    background: white;
    padding: 1rem;
    margin-bottom: 0.75rem;
    border-radius: 8px;
    border-left: 4px solid #007bff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tip-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.tip-icon {
    color: #28a745;
    font-size: 1rem;
    margin-top: 0.1rem;
    flex-shrink: 0;
}

.health-section {
    margin-bottom: 2rem;
}

.health-section:last-child {
    margin-bottom: 0;
}

/* Category-specific styling */
.health-category[data-category="monsoon"] .tip-item {
    border-left-color: #17a2b8;
}

.health-category[data-category="monsoon"] .tip-icon {
    color: #17a2b8;
}

.health-category[data-category="heart"] .tip-item {
    border-left-color: #dc3545;
}

.health-category[data-category="heart"] .tip-icon {
    color: #dc3545;
}

.health-category[data-category="diabetes"] .tip-item {
    border-left-color: #28a745;
}

.health-category[data-category="diabetes"] .tip-icon {
    color: #28a745;
}

/* Smooth animations */
.health-details {
    transition: all 0.3s ease-out;
}

.health-section {
    animation: fadeInUp 0.5s ease-out;
    animation-fill-mode: both;
}

.health-section:nth-child(1) { animation-delay: 0.1s; }
.health-section:nth-child(2) { animation-delay: 0.2s; }
.health-section:nth-child(3) { animation-delay: 0.3s; }

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Mobile optimizations */
@media (max-width: 768px) {
    .tip-item {
        padding: 0.75rem;
    }
    
    .section-header h4 {
        font-size: 1.1rem;
    }
    
    .health-details {
        padding: 1rem;
    }
}
</style>
`;

// Inject the CSS
document.head.insertAdjacentHTML('beforeend', healthHubCSS);
