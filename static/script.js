// Main JavaScript for TriageXpert

/**
 * Event listener for when the DOM is fully loaded.
 * Initializes navigation, calculators, and dark mode.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Navigation toggle for mobile
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active'); // Toggle mobile menu visibility
        });
    }

    // Initialize all calculators (sets up button listeners)
    initializeBMICalculator();
    initializeCalorieCalculator();
    initializeWaterCalculator();

    // Load dark mode preference from localStorage
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode'); // Apply dark mode class to body
        const toggleIcons = document.querySelectorAll('.dark-mode-toggle i');
        toggleIcons.forEach(icon => icon.className = 'fa-solid fa-sun'); // Switch icon to sun
    }
});

/**
 * Makes a standard select dropdown into a dynamic, searchable input.
 * Displays labels only to the user, stores internal values in dataset.
 * @param {string} dropdownId - ID of the original select element.
 * @param {Array<{value: string, label: string}>} options - Array of options with value and label.
 * @param {Object} tooltipMap - Map of internal values to tooltip text.
 */
function makeDropdownDynamic(dropdownId, options, tooltipMap = {}) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return; // Exit if element not found

    // Create searchable text input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Type to search...';
    searchInput.classList.add('dynamic-dropdown-input');
    searchInput.setAttribute('list', `${dropdownId}-datalist`);
    
    // Create datalist for search suggestions
    const dataList = document.createElement('datalist');
    dataList.id = `${dropdownId}-datalist`;
    
    // Populate datalist with labels (visible) and store values in dataset
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.label;  // Display label only in search and options
        option.dataset.value = opt.value;  // Store internal value
        dataList.appendChild(option);
    });
    
    // Replace original select with new input and datalist
    dropdown.parentNode.replaceChild(searchInput, dropdown);
    searchInput.after(dataList);

    // Add focus animation
    searchInput.addEventListener('focus', () => {
        searchInput.classList.add('focused'); // Add glow effect on focus
    });
    searchInput.addEventListener('blur', () => {
        searchInput.classList.remove('focused'); // Remove glow on blur
    });
    
    // Add tooltip based on selected label's internal value
    searchInput.addEventListener('input', () => {
        const selectedOption = Array.from(dataList.options).find(opt => opt.value.toLowerCase() === searchInput.value.toLowerCase());
        const key = selectedOption ? selectedOption.dataset.value : '';
        const tooltip = tooltipMap[key] || '';
        searchInput.title = tooltip; // Display as browser tooltip
    });
}

/**
 * Initializes the advanced BMI calculator.
 * Results display only on button click.
 */
function initializeBMICalculator() {
    const calculateBtn = document.getElementById('calculate-bmi-btn');
    const resultContainer = document.getElementById('bmi-result');
    if (!calculateBtn) return; // Exit if not on BMI page

    // Setup dynamic gender dropdown (labels only)
    const genderOptions = [
        {value: 'male', label: 'Male'},
        {value: 'female', label: 'Female'}
    ];
    const genderTooltips = {
        'male': 'Male physiology typically has higher muscle mass',
        'female': 'Female calculation accounts for different body composition'
    };
    makeDropdownDynamic('bmi-gender', genderOptions, genderTooltips);

    // Calculate and show results only on button click
    calculateBtn.addEventListener('click', () => {
        const age = parseFloat(document.getElementById('bmi-age').value);
        const genderInput = document.querySelector(`.dynamic-dropdown-input[list="bmi-gender-datalist"]`);
        const selectedGender = Array.from(document.getElementById('bmi-gender-datalist').options)
            .find(opt => opt.value.toLowerCase() === genderInput.value.toLowerCase());
        const gender = selectedGender ? selectedGender.dataset.value : null;
        const height = parseFloat(document.getElementById('bmi-height').value);
        const weight = parseFloat(document.getElementById('bmi-weight').value);

        if (!age || !gender || !height || !weight) {
            alert('Please fill all fields.');
            return;
        }

        // BMI calculation
        const heightM = height / 100;
        const bmi = (weight / (heightM * heightM)).toFixed(1);
        
        // Body fat estimation (Deurenberg formula)
        const bodyFat = (1.2 * bmi) + (0.23 * age) - (gender === 'male' ? 16.2 : 5.4);
        
        // Ideal weight range
        const minWeight = (18.5 * heightM * heightM).toFixed(1);
        const maxWeight = (24.9 * heightM * heightM).toFixed(1);

        // Determine category and risks
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

        // Update UI elements
        document.getElementById('bmi-value').textContent = bmi;
        document.getElementById('bmi-category').textContent = category;
        document.getElementById('bmi-bodyfat').textContent = `${bodyFat.toFixed(1)}% (estimated)`;
        document.getElementById('bmi-ideal-weight').textContent = `${minWeight} - ${maxWeight} kg`;
        document.getElementById('bmi-risks').textContent = risks;
        document.getElementById('bmi-advice').textContent = `Advice: Consult a doctor for personalized plans. BMI is a screening tool, not a complete health measure.`;
        
        // Update progress bar
        const progress = document.getElementById('bmi-progress');
        progress.style.width = `${Math.min((bmi / 40) * 100, 100)}%`;
        progress.className = `progress-bar ${categoryClass}`;
        
        // Show and animate results
        resultContainer.classList.remove('hidden');
        resultContainer.classList.add('fade-in');
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    });
}

/**
 * Initializes the advanced Calorie calculator.
 * Results display only on button click.
 */
function initializeCalorieCalculator() {
    const calculateBtn = document.getElementById('calculate-calorie-btn');
    const resultContainer = document.getElementById('calorie-result');
    if (!calculateBtn) return;

    // Setup dynamic dropdowns (labels only)
    const genderOptions = [{value: 'male', label: 'Male'}, {value: 'female', label: 'Female'}];
    const genderTooltips = {'male': 'Higher base metabolism', 'female': 'Adjusted for physiology'};
    makeDropdownDynamic('calorie-gender', genderOptions, genderTooltips);

    const activityOptions = [
        {value: 'sedentary', label: 'Sedentary'},
        {value: 'light', label: 'Lightly Active'},
        {value: 'moderate', label: 'Moderately Active'},
        {value: 'very', label: 'Very Active'},
        {value: 'super', label: 'Super Active'}
    ];
    const activityTooltips = {
        'sedentary': 'Little or no exercise',
        'light': 'Exercise 1-3 times/week',
        'moderate': 'Exercise 4-5 times/week',
        'very': 'Intense exercise 6-7 times/week',
        'super': 'Very intense exercise daily'
    };
    makeDropdownDynamic('calorie-activity', activityOptions, activityTooltips);

    const goalOptions = [
        {value: 'maintain', label: 'Maintain Weight'},
        {value: 'loss', label: 'Weight Loss'},
        {value: 'gain', label: 'Weight Gain'}
    ];
    const goalTooltips = {
        'maintain': 'Keep current weight',
        'loss': '500 calorie deficit',
        'gain': '500 calorie surplus'
    };
    makeDropdownDynamic('calorie-goal', goalOptions, goalTooltips);

    // Calculate and show results only on button click
    calculateBtn.addEventListener('click', () => {
        const age = parseFloat(document.getElementById('calorie-age').value);
        
        // Retrieve gender internal value
        const genderInput = document.querySelector('.dynamic-dropdown-input[list="calorie-gender-datalist"]');
        const selectedGender = Array.from(document.getElementById('calorie-gender-datalist').options)
            .find(opt => opt.value.toLowerCase() === genderInput.value.toLowerCase());
        const gender = selectedGender ? selectedGender.dataset.value : null;

        // Retrieve activity internal value
        const activityInput = document.querySelector('.dynamic-dropdown-input[list="calorie-activity-datalist"]');
        const selectedActivity = Array.from(document.getElementById('calorie-activity-datalist').options)
            .find(opt => opt.value.toLowerCase() === activityInput.value.toLowerCase());
        const activity = selectedActivity ? selectedActivity.dataset.value : null;

        // Retrieve goal internal value
        const goalInput = document.querySelector('.dynamic-dropdown-input[list="calorie-goal-datalist"]');
        const selectedGoal = Array.from(document.getElementById('calorie-goal-datalist').options)
            .find(opt => opt.value.toLowerCase() === goalInput.value.toLowerCase());
        const goal = selectedGoal ? selectedGoal.dataset.value : null;

        const height = parseFloat(document.getElementById('calorie-height').value);
        const weight = parseFloat(document.getElementById('calorie-weight').value);

        if (!age || !gender || !height || !weight || !activity || !goal) {
            alert('Please fill all fields.');
            return;
        }

        // BMR calculation (Mifflin-St Jeor formula)
        let bmr = gender === 'male' 
            ? (10 * weight) + (6.25 * height) - (5 * age) + 5 
            : (10 * weight) + (6.25 * height) - (5 * age) - 161;

        // TDEE calculation
        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            very: 1.725,
            super: 1.9
        };
        let tdee = Math.round(bmr * activityMultipliers[activity]);

        // Goal adjustment
        let calories = tdee;
        let adviceSuffix = '';
        if (goal === 'loss') {
            calories -= 500;
            adviceSuffix = ' (500 calorie deficit for ~0.5kg/week loss)';
        } else if (goal === 'gain') {
            calories += 500;
            adviceSuffix = ' (500 calorie surplus for ~0.5kg/week gain)';
        }

        // Macronutrient breakdown (40% carbs, 30% protein, 30% fat)
        const carbs = Math.round((calories * 0.4) / 4);
        const protein = Math.round((calories * 0.3) / 4);
        const fat = Math.round((calories * 0.3) / 9);

        // Update UI with animation
        document.getElementById('calorie-value').textContent = calories + adviceSuffix;
        document.getElementById('calorie-bmr').textContent = `${Math.round(bmr)} calories (your base metabolic rate)`;
        document.getElementById('calorie-tdee').textContent = `${tdee} calories (total daily energy expenditure)`;
        document.getElementById('calorie-macros').textContent = `Carbs: ${carbs}g, Protein: ${protein}g, Fat: ${fat}g (balanced ratio)`;
        document.getElementById('calorie-advice').textContent = `This is an estimate. Track intake with an app and adjust based on progress. Consult a dietitian for medical conditions.`;
        
        resultContainer.classList.remove('hidden');
        resultContainer.classList.add('fade-in');
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    });
}

/**
 * Initializes the advanced Water calculator.
 * Results display only on button click.
 */
function initializeWaterCalculator() {
    const calculateBtn = document.getElementById('calculate-water-btn');
    const resultContainer = document.getElementById('water-result');
    if (!calculateBtn) return;

    // Setup dynamic dropdowns (labels only)
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

    // Calculate and show results only on button click
    calculateBtn.addEventListener('click', () => {
        const age = parseFloat(document.getElementById('water-age').value);
        
        // Retrieve gender internal value
        const genderInput = document.querySelector('.dynamic-dropdown-input[list="water-gender-datalist"]');
        const selectedGender = Array.from(document.getElementById('water-gender-datalist').options)
            .find(opt => opt.value.toLowerCase() === genderInput.value.toLowerCase());
        const gender = selectedGender ? selectedGender.dataset.value : null;

        // Retrieve activity internal value
        const activityInput = document.querySelector('.dynamic-dropdown-input[list="water-activity-datalist"]');
        const selectedActivity = Array.from(document.getElementById('water-activity-datalist').options)
            .find(opt => opt.value.toLowerCase() === activityInput.value.toLowerCase());
        const activity = selectedActivity ? selectedActivity.dataset.value : null;

        // Retrieve climate internal value
        const climateInput = document.querySelector('.dynamic-dropdown-input[list="water-climate-datalist"]');
        const selectedClimate = Array.from(document.getElementById('water-climate-datalist').options)
            .find(opt => opt.value.toLowerCase() === climateInput.value.toLowerCase());
        const climate = selectedClimate ? selectedClimate.dataset.value : null;

        const weight = parseFloat(document.getElementById('water-weight').value);
        const exercise = parseFloat(document.getElementById('water-exercise').value) || 0;

        if (!age || !gender || !weight || !activity || !climate) {
            alert('Please fill all fields.');
            return;
        }

        // Base calculation (Holliday-Segar adjusted)
        let base = weight <= 10 ? (weight * 0.1) : (10 * 0.1) + ((weight - 10) * 0.05);
        if (age > 18) base = weight * 0.035;

        // Adjustments
        const activityAdjust = { low: 0, moderate: 0.5, high: 1.0 }[activity];
        const climateAdjust = { cool: -0.3, moderate: 0, hot: 0.5 }[climate];
        const genderAdjust = gender === 'male' ? 0.3 : 0;
        const ageAdjust = age > 60 ? -0.2 : 0;
        const exerciseAdjust = exercise * 0.6;

        const totalLiters = (base + activityAdjust + climateAdjust + genderAdjust + ageAdjust + exerciseAdjust).toFixed(1);

        // Update progress bar
        const progressPercent = Math.min((totalLiters / 5) * 100, 100);
        document.getElementById('water-progress').style.width = `${progressPercent}%`;
        document.getElementById('water-progress').className = 'progress-bar hydrate';

        // Update UI
        document.getElementById('water-value').textContent = totalLiters;
        document.getElementById('water-base').textContent = `${base.toFixed(1)}L (based on weight and age)`;
        document.getElementById('water-adjustments').textContent = `Activity: +${activityAdjust}L, Climate: +${climateAdjust}L, Exercise: +${exerciseAdjust}L, Other: +${(genderAdjust + ageAdjust).toFixed(1)}L`;
        document.getElementById('water-tips').textContent = `Spread intake evenly. Include water-rich foods. Signs of dehydration: dark urine, fatigue.`;
        document.getElementById('water-advice').textContent = `This is an estimate. Factors like pregnancy or illness may increase needs. Consult a doctor for medical advice.`;
        
        resultContainer.classList.remove('hidden');
        resultContainer.classList.add('fade-in');
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    });
}

// Global Dark Mode Toggle Function (unchanged)
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    localStorage.setItem('darkMode', isDarkMode);
    
    const toggleIcons = document.querySelectorAll('.dark-mode-toggle i');
    toggleIcons.forEach(icon => {
        icon.className = isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        icon.style.color = isDarkMode ? '#ffd700' : '#4a5568';
    });
    
    console.log('Dark mode toggled:', isDarkMode ? 'ON' : 'OFF');
}

// Utility functions (unchanged)
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
}

function showError(message) {
    alert(message);
}

// Smooth scrolling (unchanged)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});
