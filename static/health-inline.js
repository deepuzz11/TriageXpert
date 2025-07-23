// Health Hub Inline Functionality
let loadedSections = new Set();

async function toggleHealthSection(category) {
    const detailsDiv = document.getElementById(`${category}-details`);
    const button = document.getElementById(`${category}-btn`);
    
    // Toggle visibility
    if (detailsDiv.style.display === 'none') {
        // Load content if not already loaded
        if (!loadedSections.has(category)) {
            await loadHealthContent(category);
            loadedSections.add(category);
        }
        
        // Show section with smooth animation
        detailsDiv.style.display = 'block';
        button.textContent = 'Hide Details ▲';
        
        // Smooth scroll to the section
        detailsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        // Hide section
        detailsDiv.style.display = 'none';
        button.textContent = 'Learn More ▼';
    }
}

function toggleSection(category) {
  const details = document.getElementById(`${category}-details`);
  const button = document.getElementById(`${category}-btn`);
  
  if (details.style.display === 'none') {
    // Close other sections
    document.querySelectorAll('.health-details').forEach(d => d.style.display = 'none');
    document.querySelectorAll('.toggle-btn').forEach(b => {
      b.textContent = 'Learn More ▼';
      b.classList.remove('active');
    });
    
    // Open current section
    details.style.display = 'block';
    button.textContent = 'Hide Details ▲';
    button.classList.add('active');
    
    // Load content if not already loaded
    if (!details.innerHTML.trim()) {
      loadHealthContent(category);
    }
  } else {
    details.style.display = 'none';
    button.textContent = 'Learn More ▼';
    button.classList.remove('active');
  }
}

async function loadHealthContent(category) {
  const details = document.getElementById(`${category}-details`);
  try {
    const response = await fetch(`/api/health-tips/${category}`);
    const data = await response.json();
    
    if (data.sections) {
      details.innerHTML = data.sections.map(section => `
        <div class="health-section">
          <h4>${section.icon} ${section.name}</h4>
          <ul>
            ${section.tips.map(tip => `<li>${tip}</li>`).join('')}
          </ul>
        </div>
      `).join('');
    }
  } catch (error) {
    details.innerHTML = '<p>Unable to load tips. Please try again.</p>';
  }
}

async function loadHealthContent(category) {
    try {
        const response = await fetch(`/api/health-tips/${category}`);
        const data = await response.json();
        
        const detailsDiv = document.getElementById(`${category}-details`);
        
        if (!data.sections) return;
        
        detailsDiv.innerHTML = `
            <div class="health-sections">
                ${data.sections.map(section => `
                    <div class="health-section">
                        <div class="section-header">
                            <span class="section-icon">${section.icon}</span>
                            <h4 class="section-title">${section.name}</h4>
                        </div>
                        <ul class="tips-list">
                            ${section.tips.map(tip => `
                                <li class="tip-item">${tip}</li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading health content:', error);
        document.getElementById(`${category}-details`).innerHTML = 
            '<p class="error-message">Unable to load health tips. Please try again later.</p>';
    }
}

// Close all sections when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.health-category')) {
        // Close all expanded sections
        ['monsoon', 'heart', 'diabetes'].forEach(category => {
            const detailsDiv = document.getElementById(`${category}-details`);
            const button = document.getElementById(`${category}-btn`);
            if (detailsDiv.style.display === 'block') {
                detailsDiv.style.display = 'none';
                button.textContent = 'Learn More ▼';
            }
        });
    }
});
