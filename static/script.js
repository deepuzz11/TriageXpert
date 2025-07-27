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
function initializeBMICalculator() {
    const calculateBtn = document.getElementById('calculate-bmi-btn');
    const heightInput = document.getElementById('bmi-height');
    const weightInput = document.getElementById('bmi-weight');
    const resultContainer = document.getElementById('bmi-result');
    const bmiValue = document.getElementById('bmi-value');
    const bmiCategory = document.getElementById('bmi-category');
    const bmiAdvice = document.getElementById('bmi-advice');

    if (!calculateBtn) return;

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

        // Display results with animation
        displayBMIResult(bmi);
        resultContainer.classList.remove('hidden');
        resultContainer.style.animation = 'fadeIn 0.5s ease-in';

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

// New: Daily Calorie Needs Calculator
function initializeCalorieCalculator() {
    const calculateBtn = document.getElementById('calculate-calorie-btn');
    if (!calculateBtn) return;

    const ageInput = document.getElementById('calorie-age');
    const genderSelect = document.getElementById('calorie-gender');
    const heightInput = document.getElementById('calorie-height');
    const weightInput = document.getElementById('calorie-weight');
    const activitySelect = document.getElementById('calorie-activity');
    const resultContainer = document.getElementById('calorie-result');
    const calorieValue = document.getElementById('calorie-value');
    const calorieAdvice = document.getElementById('calorie-advice');

    calculateBtn.addEventListener('click', function() {
        const age = parseFloat(ageInput.value);
        const gender = genderSelect.value;
        const height = parseFloat(heightInput.value);
        const weight = parseFloat(weightInput.value);
        const activity = activitySelect.value;

        if (!age || !gender || !height || !weight || !activity) {
            alert('Please fill all fields.');
            return;
        }

        // Calculate BMR using Harris-Benedict equation
        let bmr;
        if (gender === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }

        // Activity multiplier
        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            very: 1.725,
            super: 1.9
        };
        const calories = Math.round(bmr * activityMultipliers[activity]);

        // Display results
        calorieValue.textContent = calories;
        calorieAdvice.textContent = `This is an estimate for weight maintenance. Adjust up/down by 500 calories for weight gain/loss. Consult a nutritionist for personalized advice.`;
        resultContainer.classList.remove('hidden');
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    });
}

// New: Water Intake Calculator
function initializeWaterCalculator() {
    const calculateBtn = document.getElementById('calculate-water-btn');
    if (!calculateBtn) return;

    const weightInput = document.getElementById('water-weight');
    const activitySelect = document.getElementById('water-activity');
    const climateSelect = document.getElementById('water-climate');
    const resultContainer = document.getElementById('water-result');
    const waterValue = document.getElementById('water-value');
    const waterAdvice = document.getElementById('water-advice');

    calculateBtn.addEventListener('click', function() {
        const weight = parseFloat(weightInput.value);
        const activity = activitySelect.value;
        const climate = climateSelect.value;

        if (!weight || !activity || !climate) {
            alert('Please fill all fields.');
            return;
        }

        // Base calculation: 30ml per kg
        let baseIntake = weight * 0.03;

        // Activity adjustment
        const activityAdjust = {
            low: 0,
            moderate: 0.5,
            high: 1.0
        };

        // Climate adjustment
        const climateAdjust = {
            cool: -0.5,
            moderate: 0,
            hot: 0.5
        };

        const totalLiters = (baseIntake + activityAdjust[activity] + climateAdjust[climate]).toFixed(1);

        // Display results
        waterValue.textContent = totalLiters;
        waterAdvice.textContent = `Drink water gradually throughout the day. Increase if sweating or in hot weather. This is an estimate; listen to your body.`;
        resultContainer.classList.remove('hidden');
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    });
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
