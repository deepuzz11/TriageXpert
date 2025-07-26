// Triage Tool JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeTriageTool();

    // Load dark mode preference on page load (global consistency)
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        // Update all dark mode toggle icons to sun
        const toggleIcons = document.querySelectorAll('.dark-mode-toggle i');
        toggleIcons.forEach(icon => icon.className = 'fa-solid fa-sun');
    }
});

function initializeTriageTool() {
    const openModalBtn = document.getElementById('openModalBtn');
    const modal = document.getElementById('patientModal');
    const closeModal = document.querySelector('.close-modal');
    const patientForm = document.getElementById('patientDetailsForm');
    const symptomsTextarea = document.getElementById('symptoms');

    // Open modal when analyze button is clicked
    openModalBtn?.addEventListener('click', function() {
        const symptoms = symptomsTextarea.value.trim();
        if (!symptoms) {
            alert('Please describe your symptoms first.');
            symptomsTextarea.focus();
            return;
        }
        
        if (symptoms.length < 10) {
            alert('Please provide more detailed information about your symptoms.');
            symptomsTextarea.focus();
            return;
        }

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });

    // Close modal
    closeModal?.addEventListener('click', closeModalHandler);
    modal?.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModalHandler();
        }
    });

    // Handle form submission
    patientForm?.addEventListener('submit', handleTriageSubmission);

    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModalHandler();
        }
    });
}

function closeModalHandler() {
    const modal = document.getElementById('patientModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

async function handleTriageSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const symptoms = document.getElementById('symptoms').value.trim();
    
    // Collect medical history
    const historyCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const history = Array.from(historyCheckboxes).map(cb => cb.value);
    
    const triageData = {
        symptoms: symptoms,
        age: parseInt(formData.get('age')),
        gender: formData.get('gender'),
        height: parseFloat(formData.get('height')),
        weight: parseFloat(formData.get('weight')),
        history: history
    };

    // Validate data
    if (!validateTriageData(triageData)) {
        return;
    }

    // Close modal and show loading
    closeModalHandler();
    showLoading();

    try {
        const response = await fetch('/triage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(triageData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        hideLoading();
        displayTriageResults(result);
        
    } catch (error) {
        hideLoading();
        console.error('Triage analysis error:', error);
        showError('Sorry, there was an error analyzing your symptoms. Please try again.');
    }
}

function validateTriageData(data) {
    if (!data.symptoms || data.symptoms.length < 10) {
        alert('Please provide more detailed symptoms.');
        return false;
    }

    if (!data.age || data.age < 1 || data.age > 120) {
        alert('Please provide a valid age.');
        return false;
    }

    if (!data.gender) {
        alert('Please select your gender.');
        return false;
    }

    if (!data.height || data.height < 50 || data.height > 300) {
        alert('Please provide a valid height in centimeters.');
        return false;
    }

    if (!data.weight || data.weight < 10 || data.weight > 500) {
        alert('Please provide a valid weight in kilograms.');
        return false;
    }

    return true;
}

function displayTriageResults(result) {
    const resultsContainer = document.getElementById('triageResults');
    const resultsContent = resultsContainer.querySelector('.results-content');
    
    // Create urgency level display
    const urgencyClass = `urgency-${result.triage_category.toLowerCase()}`;
    const urgencyColor = getUrgencyColor(result.triage_category);
    
    let resultsHTML = `
        <div class="${urgencyClass}">
            <h3><i class="fa-solid fa-exclamation-triangle"></i> ${result.triage_category} Priority</h3>
            <p>Confidence: ${(result.confidence * 100).toFixed(0)}%</p>
        </div>
    `;

    // Display explanation details if available
    if (result.explanation_details) {
        const details = result.explanation_details;
        
        resultsHTML += `
            <div class="result-section">
                <h3><i class="fa-solid fa-info-circle"></i> Summary</h3>
                <p>${details.summary}</p>
            </div>
        `;

        if (details.immediate_actions && details.immediate_actions.length > 0) {
            resultsHTML += `
                <div class="result-section">
                    <h3><i class="fa-solid fa-bolt"></i> Immediate Actions</h3>
                    <ul>
                        ${details.immediate_actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (details.potential_conditions && details.potential_conditions.length > 0) {
            resultsHTML += `
                <div class="result-section">
                    <h3><i class="fa-solid fa-stethoscope"></i> Potential Conditions</h3>
                    <ul>
                        ${details.potential_conditions.map(condition => `<li>${condition}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (details.red_flags && details.red_flags.length > 0) {
            resultsHTML += `
                <div class="result-section">
                    <h3><i class="fa-solid fa-triangle-exclamation"></i> Warning Signs</h3>
                    <ul>
                        ${details.red_flags.map(flag => `<li>${flag}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (details.follow_up_recommendations && details.follow_up_recommendations.length > 0) {
            resultsHTML += `
                <div class="result-section">
                    <h3><i class="fa-solid fa-calendar-check"></i> Follow-up Recommendations</h3>
                    <ul>
                        ${details.follow_up_recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (details.lifestyle_advice && details.lifestyle_advice.length > 0) {
            resultsHTML += `
                <div class="result-section">
                    <h3><i class="fa-solid fa-heart"></i> Lifestyle Advice</h3>
                    <ul>
                        ${details.lifestyle_advice.map(advice => `<li>${advice}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (details.when_to_seek_help) {
            resultsHTML += `
                <div class="result-section">
                    <h3><i class="fa-solid fa-hospital"></i> When to Seek Help</h3>
                    <p>${details.when_to_seek_help}</p>
                </div>
            `;
        }

        if (details.disclaimer) {
            resultsHTML += `
                <div class="result-section" style="background: #fff3cd; border-left-color: #ffc107;">
                    <h3><i class="fa-solid fa-info"></i> Important Disclaimer</h3>
                    <p><strong>${details.disclaimer}</strong></p>
                </div>
            `;
        }
    }

    // Add identified keywords if available
    if (result.keywords && result.keywords.length > 0) {
        resultsHTML += `
            <div class="result-section">
                <h3><i class="fa-solid fa-tags"></i> Identified Symptoms</h3>
                <div class="keyword-tags">
                    ${result.keywords.map(keyword => `<span class="keyword-tag">${keyword}</span>`).join('')}
                </div>
            </div>
        `;
    }

    resultsContent.innerHTML = resultsHTML;
    resultsContainer.classList.remove('hidden');
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function getUrgencyColor(category) {
    switch (category.toLowerCase()) {
        case 'emergency':
            return '#dc3545';
        case 'urgent':
            return '#fd7e14';
        case 'routine':
        default:
            return '#28a745';
    }
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function showError(message) {
    alert(message); // Can be enhanced with custom modal
}

// Add some additional CSS for keyword tags
const additionalCSS = `
<style>
.keyword-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.keyword-tag {
    background: #007bff;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 500;
}

.urgency-emergency {
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

.urgency-urgent {
    background: linear-gradient(135deg, #fd7e14 0%, #e55b0d 100%);
}

.urgency-routine {
    background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
}
</style>
`;

// Inject additional CSS
document.head.insertAdjacentHTML('beforeend', additionalCSS);

// Global Dark Mode Toggle Function
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode);
    
    // Update all toggle icons (moon to sun or vice versa)
    const toggleIcons = document.querySelectorAll('.dark-mode-toggle i');
    toggleIcons.forEach(icon => {
        icon.className = isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        // Force visibility with inline style (fallback if CSS not applying)
        icon.style.color = isDarkMode ? '#ffd700' : '#4a5568';
    });
    
    console.log('Dark mode toggled:', isDarkMode ? 'ON' : 'OFF');
}
