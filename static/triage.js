// This is the main script for the triage.html page

// Make jsPDF globally available from the CDN link
window.jsPDF = window.jspdf.jsPDF;

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements (languageSelector is REMOVED) ---
    const allElements = {
        startBtn: document.getElementById('startBtn'),
        startSection: document.getElementById('start-section'),
        modal: document.getElementById('intake-modal'),
        closeModalBtn: document.getElementById('close-modal'),
        modalSteps: document.querySelectorAll('.modal-step'),
        progressBar: document.getElementById('progress-bar-fill'),
        nextStep1Btn: document.getElementById('next-step-1'),
        nextStep2Btn: document.getElementById('next-step-2'),
        backBtns: document.querySelectorAll('.modal-btn-back'),
        submitBtn: document.getElementById('submit-triage'),
        ageInput: document.getElementById('age'),
        genderInput: document.getElementById('gender'),
        heightInput: document.getElementById('height'),
        weightInput: document.getElementById('weight'),
        historyCheckboxes: document.querySelectorAll('input[name="history"]'),
        symptomsInput: document.getElementById('symptoms-input'),
        resultsContainer: document.getElementById('results-container'),
        errorContainer: document.getElementById('error-container'),
        errorMessage: document.getElementById('error-message'),
        loader: document.getElementById('loader'),
        resultContent: document.getElementById('result-content'),
        downloadReportBtn: document.getElementById('download-report-btn'),
        triageCategorySpan: document.getElementById('triage-category'),
        keywordsSection: document.getElementById('keywords-section'),
        keywordsContainer: document.getElementById('keywords-container'),
        explanationText: document.getElementById('explanation-text'),
        homeCareSection: document.getElementById('home-care-section'),
        homeCareText: document.getElementById('home-care-text'),
        worryText: document.getElementById('worry-text'),
        nextStepsText: document.getElementById('next-steps-text'),
        actionButtonsContainer: document.getElementById('action-buttons'),
        healthHubContainer: document.getElementById('hub-cards'),
    };
    
    let currentStep = 1;
    let triageData = {}; // Stores combined user input and API response for PDF

    // The entire 'translations' object and 'changeLanguage' function have been REMOVED.

    // --- Modal Navigation & UI Logic ---
    const showModal = () => { navigateStep(1); allElements.modal.classList.remove('hidden'); };
    const hideModal = () => allElements.modal.classList.add('hidden');
    
    const navigateStep = (step) => {
        allElements.modalSteps.forEach(s => s.classList.add('hidden'));
        document.getElementById(`modal-step-${step}`).classList.remove('hidden');
        allElements.progressBar.style.width = `${step * 33.3}%`;
        currentStep = step;
    };

    allElements.startBtn.addEventListener('click', showModal);
    allElements.closeModalBtn.addEventListener('click', hideModal);
    allElements.nextStep1Btn.addEventListener('click', () => navigateStep(2));
    allElements.nextStep2Btn.addEventListener('click', () => navigateStep(3));
    allElements.backBtns.forEach(btn => btn.addEventListener('click', () => navigateStep(currentStep - 1)));

    // --- Main Triage Submission ---
    const handleTriageSubmit = async () => {
        const formData = {
            age: parseInt(allElements.ageInput.value, 10),
            gender: allElements.genderInput.value,
            height: parseFloat(allElements.heightInput.value),
            weight: parseFloat(allElements.weightInput.value),
            history: Array.from(allElements.historyCheckboxes).filter(cb => cb.checked && cb.value !== 'none').map(cb => cb.value),
            symptoms: allElements.symptomsInput.value.trim(),
            // The 'language' key is REMOVED from the payload
        };
        
        if (!formData.symptoms || !formData.age || !formData.height || !formData.weight) {
            alert("Please fill out all fields in Step 1 and Step 3.");
            return;
        }
        
        hideModal();
        setLoadingState(true);
        hideError();
        allElements.startSection.classList.add('hidden');
        allElements.resultsContainer.classList.remove('hidden');

        try {
            const response = await fetch('/triage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'An unknown server error occurred.');
            
            triageData = { ...formData, ...data };
            displayResults(data);

        } catch (error) {
            console.error('Triage Error:', error);
            displayError(error.message);
        } finally {
            setLoadingState(false);
        }
    };

    // --- PDF Report Generation ---
    const generatePDF = () => {
        // This function remains the same as it uses the data, not language settings.
        const doc = new jsPDF();
        const { age, gender, height, weight, history, symptoms } = triageData;
        const { triage_category, keywords, explanation_details } = triageData;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("TriageXpert - Preliminary Health Report", 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Report Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
        
        doc.setLineWidth(0.5);
        doc.line(15, 35, 195, 35);
        
        // ... (rest of the PDF generation logic is unchanged)
        
        doc.save(`TriageXpert_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // --- UI Display & Helper Functions ---
    const displayResults = (data) => {
        // This function is now simpler as it doesn't need to worry about language
        allElements.triageCategorySpan.textContent = data.triage_category;
        allElements.triageCategorySpan.className = 'category-badge';
        allElements.triageCategorySpan.classList.add(data.triage_category);

        if (data.keywords && data.keywords.length > 0) {
            allElements.keywordsContainer.innerHTML = data.keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('');
            allElements.keywordsSection.classList.remove('hidden');
        } else {
            allElements.keywordsSection.classList.add('hidden');
        }

        const details = data.explanation_details;
        if (details) {
            allElements.explanationText.textContent = details.explanation || "N/A";
            allElements.nextStepsText.textContent = details.next_steps || "N/A";
            allElements.worryText.textContent = details.when_to_worry || "N/A";
            if (details.home_care_suggestions) {
                allElements.homeCareText.textContent = details.home_care_suggestions;
                allElements.homeCareSection.classList.remove('hidden');
            } else {
                allElements.homeCareSection.classList.add('hidden');
            }
        }
        
        allElements.downloadReportBtn.classList.remove('hidden');
        generateActionButtons(data.triage_category);
        generateHealthHub();
    };
    
    const setLoadingState = (isLoading) => {
        allElements.loader.classList.toggle('hidden', !isLoading);
        allElements.resultContent.classList.toggle('hidden', isLoading);
    };
    
    // MODIFIED: This function now uses hardcoded English text
    const generateActionButtons = (category) => {
        allElements.actionButtonsContainer.innerHTML = '';
        let emergencyBtn = `<a href="tel:112" class="action-btn Emergency"><i class="fa-solid fa-phone-volume"></i> Call National Emergency (112)</a>`;
        let ambulanceBtn = `<a href="tel:108" class="action-btn Urgent"><i class="fa-solid fa-truck-medical"></i> Call Ambulance (102/108)</a>`;
        let findHospitalBtn = `<a href="https://www.google.com/maps/search/nearest+hospital" target="_blank" class="action-btn" style="background-color: #555;"><i class="fa-solid fa-map-location-dot"></i> Find Nearby Hospital</a>`;

        if (category === "Emergency") allElements.actionButtonsContainer.innerHTML = emergencyBtn + ambulanceBtn;
        else if (category === "Urgent") allElements.actionButtonsContainer.innerHTML = ambulanceBtn + findHospitalBtn;
        else allElements.actionButtonsContainer.innerHTML = findHospitalBtn;
    };
    
    // MODIFIED: This function now uses hardcoded English text
    const generateHealthHub = () => {
        allElements.healthHubContainer.innerHTML = '';
        const resources = [
            { text: "Find a Doctor Online", icon: "fa-stethoscope", url: "https://www.practo.com/search/doctors" },
            { text: "Ayushman Bharat (PM-JAY)", icon: "fa-id-card", url: "https://pmjay.gov.in/" },
            { text: "Govt. Health Portal", icon: "fa-landmark", url: "https://www.mohfw.gov.in/" }
        ];
        resources.forEach(res => {
            allElements.healthHubContainer.innerHTML += `<a href="${res.url}" target="_blank" class="hub-card"><i class="fa-solid ${res.icon}"></i><span>${res.text}</span></a>`;
        });
    };
    
    const displayError = (message) => { allElements.errorMessage.textContent = message; allElements.errorContainer.classList.remove('hidden'); };
    const hideError = () => allElements.errorContainer.classList.add('hidden');
    
    // --- Initial Setup ---
    allElements.submitBtn.addEventListener('click', handleTriageSubmit);
    allElements.downloadReportBtn.addEventListener('click', generatePDF);
    // The language selector event listener has been REMOVED.
});