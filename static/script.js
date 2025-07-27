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

    // BMI Calculator (existing)
    initializeBMICalculator();

    // New: Daily Calorie Needs Calculator
    initializeCalorieCalculator();

    // New: Water Intake Calculator
    initializeWaterCalculator();

    // Load dark mode preference on page load (global for all pages)
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        const toggleIcons = document.querySelectorAll('.dark-mode-toggle i');
        toggleIcons.forEach(icon => icon.className = 'fa-solid fa-sun');
    }
});

// BMI Calculator Functionality (existing)
function makeDropdownDynamic(dropdownId, options, tooltipMap = {}) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    // Convert to searchable input with datalist
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Type to search...';
    searchInput.classList.add('dynamic-dropdown-input');
    searchInput.setAttribute('list', `${dropdownId}-datalist`);
    
    const dataList = document.createElement('datalist');
    dataList.id = `${dropdownId}-datalist`;
    
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        dataList.appendChild(option);
    });
    
    dropdown.parentNode.replaceChild(searchInput, dropdown);
    searchInput.after(dataList);

    // Add animation and tooltip
    searchInput.addEventListener('focus', () => {
        searchInput.classList.add('focused');
    });
    searchInput.addEventListener('blur', () => {
        searchInput.classList.remove('focused');
    });
    
    // Tooltip on hover/focus
    searchInput.addEventListener('input', () => {
        const value = searchInput.value.toLowerCase();
        const tooltip = tooltipMap[value] || '';
        searchInput.title = tooltip; // Show as browser tooltip
    });
}

// Advanced BMI Calculator with real-time updates
function initializeBMICalculator() {
    const inputs = document.querySelectorAll('#bmi-age, #bmi-gender, #bmi-height, #bmi-weight');
    const resultContainer = document.getElementById('bmi-result');
    if (inputs.length === 0) return;

    // Make gender dropdown dynamic
    const genderOptions = [
        {value: 'male', label: 'Male'},
        {value: 'female', label: 'Female'}
    ];
    const genderTooltips = {
        'male': 'Male physiology typically has higher muscle mass',
        'female': 'Female calculation accounts for different body composition'
    };
    makeDropdownDynamic('bmi-gender', genderOptions, genderTooltips);

    // Real-time calculation on input change
    inputs.forEach(input => {
        input.addEventListener('input', calculateAdvancedBMI);
    });

    function calculateAdvancedBMI() {
        const age = parseFloat(document.getElementById('bmi-age').value);
        const gender = document.querySelector('#bmi-gender ~ datalist option[value="' + document.querySelector('.dynamic-dropdown-input').value + '"]')?.value;
        const height = parseFloat(document.getElementById('bmi-height').value);
        const weight = parseFloat(document.getElementById('bmi-weight').value);

        if (!age || !gender || !height || !weight) return;

        // Calculations (as before)
        const heightM = height / 100;
        const bmi = (weight / (heightM * heightM)).toFixed(1);
        const bodyFat = (1.2 * bmi) + (0.23 * age) - (gender === 'male' ? 16.2 : 5.4);
        const minWeight = (18.5 * heightM * heightM).toFixed(1);
        const maxWeight = (24.9 * heightM * heightM).toFixed(1);

        let category, risks, categoryClass;
        if (bmi < 18.5) {
            category = 'Underweight';
            categoryClass = 'underweight';
            risks = 'Potential risks: Weakened immune system, osteoporosis, infertility.';
        } else if (bmi < 25) {
            category = 'Normal';
            categoryClass = 'normal';
            risks = 'Low health risks. Maintain with balanced diet.';
        } else if (bmi < 30) {
            category = 'Overweight';
            categoryClass = 'overweight';
            risks = 'Increased risk of heart disease, diabetes, joint problems.';
        } else {
            category = 'Obese';
            categoryClass = 'obese';
            risks = 'High risk of cardiovascular disease, type 2 diabetes, sleep apnea.';
        }

        // Update UI with animation
        document.getElementById('bmi-value').textContent = bmi;
        document.getElementById('bmi-category').textContent = category;
        document.getElementById('bmi-bodyfat').textContent = `${bodyFat.toFixed(1)}% (estimated)`;
        document.getElementById('bmi-ideal-weight').textContent = `${minWeight} - ${maxWeight} kg`;
        document.getElementById('bmi-risks').textContent = risks;
        document.getElementById('bmi-advice').textContent = `Advice: Consult a doctor for personalized plans. BMI is a screening tool, not a complete health measure.`;
        
        const progress = document.getElementById('bmi-progress');
        progress.style.width = `${Math.min((bmi / 40) * 100, 100)}%`;
        progress.className = `progress-bar ${categoryClass}`;
        
        resultContainer.classList.remove('hidden');
        resultContainer.classList.add('fade-in');
    }
}

// Similar updates for Calorie and Water calculators (real-time, dynamic dropdowns)
function initializeCalorieCalculator() {
    const inputs = document.querySelectorAll('#calorie-age, .dynamic-dropdown-input, #calorie-height, #calorie-weight');
    if (inputs.length === 0) return;

    // Dynamic dropdowns for gender, activity, goal
    makeDropdownDynamic('calorie-gender', [{value: 'male', label: 'Male'}, {value: 'female', label: 'Female'}], {male: 'Higher base metabolism', female: 'Adjusted for physiology'});
    makeDropdownDynamic('calorie-activity', [
        {value: 'sedentary', label: 'Sedentary'},
        {value: 'light', label: 'Lightly Active'},
        {value: 'moderate', label: 'Moderately Active'},
        {value: 'very', label: 'Very Active'},
        {value: 'super', label: 'Super Active'}
    ], {
        sedentary: 'Little or no exercise',
        light: 'Exercise 1-3 times/week',
        moderate: 'Exercise 4-5 times/week',
        very: 'Intense exercise 6-7 times/week',
        super: 'Very intense exercise daily'
    });
    makeDropdownDynamic('calorie-goal', [
        {value: 'maintain', label: 'Maintain Weight'},
        {value: 'loss', label: 'Weight Loss'},
        {value: 'gain', label: 'Weight Gain'}
    ], {
        maintain: 'Keep current weight',
        loss: '500 calorie deficit',
        gain: '500 calorie surplus'
    });

    inputs.forEach(input => input.addEventListener('input', calculateAdvancedCalories));
    // ... (calculation logic as before, with real-time updates and fade-in)
}

function initializeWaterCalculator() {
    const inputs = document.querySelectorAll('#water-age, .dynamic-dropdown-input, #water-weight, #water-exercise');
    if (inputs.length === 0) return;

    // Dynamic dropdowns
    makeDropdownDynamic('water-gender', [{value: 'male', label: 'Male'}, {value: 'female', label: 'Female'}]);
    makeDropdownDynamic('water-activity', [
        {value: 'low', label: 'Low'},
        {value: 'moderate', label: 'Moderate'},
        {value: 'high', label: 'High'}
    ]);
    makeDropdownDynamic('water-climate', [
        {value: 'cool', label: 'Cool'},
        {value: 'moderate', label: 'Moderate'},
        {value: 'hot', label: 'Hot/Humid'}
    ]);

    inputs.forEach(input => input.addEventListener('input', calculateAdvancedWater));
}

// Global Dark Mode Toggle Function (existing)
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

// Utility functions (existing)
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
