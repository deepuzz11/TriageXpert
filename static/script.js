document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links on the landing page
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.hostname === window.location.hostname && this.pathname === window.location.pathname) {
                e.preventDefault();
                const targetElement = document.querySelector(this.getAttribute('href'));
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // --- NEW: BMI Calculator Logic ---
    const calculateBmiBtn = document.getElementById('calculate-bmi-btn');
    if (calculateBmiBtn) {
        calculateBmiBtn.addEventListener('click', () => {
            const heightInput = document.getElementById('bmi-height');
            const weightInput = document.getElementById('bmi-weight');
            const resultContainer = document.getElementById('bmi-result');
            const bmiValueSpan = document.getElementById('bmi-value');
            const bmiCategoryP = document.getElementById('bmi-category');

            const height = parseFloat(heightInput.value);
            const weight = parseFloat(weightInput.value);

            if (height > 0 && weight > 0) {
                const heightInMeters = height / 100;
                const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
                
                let category = '';
                if (bmi < 18.5) category = 'Underweight';
                else if (bmi >= 18.5 && bmi <= 24.9) category = 'Normal weight';
                else if (bmi >= 25 && bmi <= 29.9) category = 'Overweight';
                else category = 'Obesity';

                bmiValueSpan.textContent = bmi;
                bmiCategoryP.textContent = `Category: ${category}`;
                resultContainer.classList.remove('hidden');
            } else {
                alert('Please enter valid height and weight.');
            }
        });
    }
});