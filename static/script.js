document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const submitBtn = document.getElementById('submitBtn');
    const symptomsTextarea = document.getElementById('symptoms');
    const resultsContainer = document.getElementById('results-container');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const loader = document.getElementById('loader');
    const resultContent = document.getElementById('result-content');

    // Result display elements
    const triageCategorySpan = document.getElementById('triage-category');
    const confidenceSpan = document.getElementById('confidence');
    const explanationP = document.getElementById('explanation');

    /**
     * Handles the form submission logic.
     */
    const handleTriageSubmit = async () => {
        const symptoms = symptomsTextarea.value.trim();

        if (!symptoms) {
            displayError("Symptom description cannot be empty.");
            return;
        }

        // --- UI State Management ---
        setLoadingState(true);
        hideError();
        resultsContainer.classList.remove('hidden');

        try {
            // --- API Call ---
            const response = await fetch('/triage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ symptoms: symptoms }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle HTTP errors (e.g., 400, 500)
                throw new Error(data.error || 'An unknown error occurred.');
            }
            
            // --- Display Results ---
            displayResults(data);

        } catch (error) {
            console.error('Triage Error:', error);
            displayError(error.message);
        } finally {
            // --- UI State Management ---
            setLoadingState(false);
        }
    };

    /**
     * Sets the loading state for the UI.
     * @param {boolean} isLoading - True to show loader, false to hide.
     */
    const setLoadingState = (isLoading) => {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Analyzing...';
            loader.classList.remove('hidden');
            resultContent.classList.add('hidden');
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Triage Symptoms';
            loader.classList.add('hidden');
            resultContent.classList.remove('hidden');
        }
    };
    
    /**
     * Displays the triage results in the UI.
     * @param {object} data - The response data from the API.
     */
    const displayResults = (data) => {
        // Set category and confidence
        triageCategorySpan.textContent = data.triage_category;
        confidenceSpan.textContent = `${(data.confidence * 100).toFixed(0)}%`;

        // Style the category badge based on the result
        triageCategorySpan.className = 'category-badge'; // Reset classes
        triageCategorySpan.classList.add(data.triage_category);

        // Set explanation
        explanationP.textContent = data.explanation_suggestion;
        
        // Ensure results are visible
        resultsContainer.classList.remove('hidden');
    };

    /**
     * Displays an error message in the UI.
     * @param {string} message - The error message to display.
     */
    const displayError = (message) => {
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
        resultsContainer.classList.add('hidden'); // Hide results if an error occurs
    };

    /**
     * Hides the error message container.
     */
    const hideError = () => {
        errorContainer.classList.add('hidden');
    };

    // --- Event Listeners ---
    submitBtn.addEventListener('click', handleTriageSubmit);
    symptomsTextarea.addEventListener('input', hideError); // Hide error when user starts typing again
});