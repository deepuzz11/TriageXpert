// Main JavaScript for TriageXpert

document.addEventListener('DOMContentLoaded', function() {
    // Navigation toggle for mobile
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // BMI Calculator (if on index page)
    initializeBMICalculator();

    // Load dark mode preference on page load (global for all pages)
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        // Update all dark mode toggle icons to sun
        const toggleIcons = document.querySelectorAll('.dark-mode-toggle i');
        toggleIcons.forEach(icon => icon.className = 'fa-solid fa-sun');
    }
});

// BMI Calculator Functionality (only runs if elements exist)
function initializeBMICalculator() {
    const calculateBtn = document.getElementById('calculate-bmi-btn');
    if (!calculateBtn) return;

    const heightInput = document.getElementById('bmi-height');
    const weightInput = document.getElementById('bmi-weight');
    const resultContainer = document.getElementById('bmi-result');
    const bmiValue = document.getElementById('bmi-value');
    const bmiCategory = document.getElementById('bmi-category');
    const bmiAdvice = document.getElementById('bmi-advice');

    calculateBtn.addEventListener('click', function() {
        const height = parseFloat(heightInput.value);
        const weight = parseFloat(weightInput.value);

        if (!height || !weight || height <= 0 || weight <= 0) {
            alert('Please enter valid height and weight values.');
            return;
        }

        // Calculate BMI
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);

        // Display results
        displayBMIResult(bmi);
        resultContainer.classList.remove('hidden');
        
        // Smooth scroll to results
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    });

    // Enter key support
    [heightInput, weightInput].forEach(input => {
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    calculateBtn.click();
                }
            });
        }
    });
}

function displayBMIResult(bmi) {
    const bmiValue = document.getElementById('bmi-value');
    const bmiCategory = document.getElementById('bmi-category');
    const bmiAdvice = document.getElementById('bmi-advice');

    const roundedBMI = Math.round(bmi * 10) / 10;
    bmiValue.textContent = roundedBMI;

    let category, advice, categoryClass;

    if (bmi < 18.5) {
        category = 'Underweight';
        categoryClass = 'underweight';
        advice = 'Consider consulting a healthcare provider about healthy weight gain strategies. Focus on nutrient-dense foods and strength training.';
    } else if (bmi >= 18.5 && bmi < 25) {
        category = 'Normal Weight';
        categoryClass = 'normal';
        advice = 'Great! You\'re in a healthy weight range. Maintain your current lifestyle with regular exercise and a balanced diet.';
    } else if (bmi >= 25 && bmi < 30) {
        category = 'Overweight';
        categoryClass = 'overweight';
        advice = 'Consider adopting a healthier lifestyle with regular physical activity and a balanced diet. Consult a healthcare provider for personalized advice.';
    } else {
        category = 'Obese';
        categoryClass = 'obese';
        advice = 'It\'s important to consult with a healthcare provider for a comprehensive weight management plan. Focus on gradual, sustainable lifestyle changes.';
    }

    bmiCategory.textContent = category;
    bmiCategory.className = `bmi-category ${categoryClass}`;
    bmiAdvice.textContent = advice;
}

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

// Utility functions
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
    alert(message); // Simple error display - can be enhanced with custom modals
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
