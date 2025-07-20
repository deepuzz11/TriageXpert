// This is the main script for the triage.html page

// Make jsPDF globally available from the CDN link in triage.html
window.jsPDF = window.jspdf.jsPDF;

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
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
        languageSelector: document.getElementById('languageSelector'),
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

    // --- Translations (with all keys for the tool page) ---
    const translations = {
        en: {
            title: "Triage Pre-Screening Tool", subtitle: "Please provide your information for a more accurate analysis.", start_button: "Start Pre-Screening",
            report_title: "Preliminary Health Report", download_button: "Download Report", triage_level: "Triage Level:",
            keywords_title: "Identified Keywords:", explanation_title: "Explanation", home_care_title: "Home Care Suggestions", 
            worry_title: "When to Seek Immediate Help", next_steps_title: "Next Steps", hub_title: "Indian Health Resources Hub",
            call_ambulance: "Call Ambulance (102/108)", call_emergency: "Call National Emergency (112)",
            find_doctor: "Find a Doctor Online", find_hospital: "Find Nearby Hospital", govt_portal: "Govt. Health Portal", ayushman_bharat: "Ayushman Bharat (PM-JAY)",
            modal_step1_title: "Step 1: Basic Information", age_label: "Age", gender_label: "Gender", gender_male: "Male", gender_female: "Female", gender_other: "Other",
            height_label: "Height (cm)", weight_label: "Weight (kg)", next_button: "Next", back_button: "Back",
            modal_step2_title: "Step 2: Medical History", modal_step2_subtitle: "Select any pre-existing conditions.",
            history_hyper: "Hypertension", history_diab: "Diabetes", history_asthma: "Asthma", history_heart: "Heart Disease", history_none: "None of the above",
            modal_step3_title: "Step 3: Describe Your Symptoms", symptoms_placeholder_modal: "Start with your main complaint...", analyze_button_modal: "Analyze Symptoms"
        },
        // Add Hindi, Tamil, Telugu, Malayalam, and Kannada translations here
    };
    
    let currentLanguage = 'en';
    const changeLanguage = (lang) => {
        if (!translations[lang]) lang = 'en'; // Fallback to English
        currentLanguage = lang;
        localStorage.setItem('triage_language', lang);
        document.querySelectorAll('[data-key]').forEach(element => {
            const key = element.getAttribute('data-key');
            if (translations[lang] && translations[lang][key]) {
                if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                    element.placeholder = translations[lang][key];
                } else {
                    const icon = element.querySelector('i');
                    element.innerHTML = (icon ? icon.outerHTML + " " : "") + translations[lang][key];
                }
            }
        });
    };

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
            language: currentLanguage
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
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Patient Summary", 15, 45);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`- Age: ${age}, Gender: ${gender}`, 20, 55);
        doc.text(`- Vitals: ${height} cm / ${weight} kg`, 20, 62);
        doc.text(`- Medical History: ${history.length > 0 ? history.join(', ').replace(/_/g, ' ') : 'None reported'}`, 20, 69);
        const symptomLines = doc.splitTextToSize(`- Reported Symptoms: ${symptoms}`, 170);
        doc.text(symptomLines, 20, 76);
        let yPos = 76 + symptomLines.length * 5;

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("AI Analysis", 15, yPos + 10);
        yPos += 20;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`Triage Level: `, 20, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(`${triage_category}`, 50, yPos);
        yPos += 7;
        
        doc.setFont("helvetica", "bold");
        doc.text(`Keywords: `, 20, yPos);
        doc.setFont("helvetica", "normal");
        const keywordLines = doc.splitTextToSize(keywords.join(', '), 140);
        doc.text(keywordLines, 45, yPos);
        yPos += keywordLines.length * 4 + 7;

        doc.setLineWidth(0.2);
        doc.line(15, yPos, 195, yPos);
        yPos += 10;
        
        const addWrappedText = (title, content) => {
            if (!content || yPos > 260) return;
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(title, 15, yPos);
            yPos += 8;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const textLines = doc.splitTextToSize(content, 180);
            doc.text(textLines, 15, yPos);
            yPos += textLines.length * 4 + 8;
        };

        addWrappedText("Explanation", explanation_details.explanation);
        addWrappedText("Recommended Next Steps", explanation_details.next_steps);
        addWrappedText("When to Seek Immediate Help", explanation_details.when_to_worry);
        if (explanation_details.home_care_suggestions) {
            addWrappedText("Home Care Suggestions", explanation_details.home_care_suggestions);
        }
        
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text("Disclaimer: This is an AI-generated report for pre-screening purposes and not a medical diagnosis.", 105, 285, { align: 'center' });

        doc.save(`TriageXpert_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // --- UI Display & Helper Functions ---
    const displayResults = (data) => {
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
    
    const generateActionButtons = (category) => {
        allElements.actionButtonsContainer.innerHTML = '';
        const lang = currentLanguage;
        const langPack = translations[lang] || translations.en;
        let emergencyBtn = `<a href="tel:112" class="action-btn Emergency"><i class="fa-solid fa-phone-volume"></i> <span data-key="call_emergency">${langPack.call_emergency}</span></a>`;
        let ambulanceBtn = `<a href="tel:108" class="action-btn Urgent"><i class="fa-solid fa-truck-medical"></i> <span data-key="call_ambulance">${langPack.call_ambulance}</span></a>`;
        let findHospitalBtn = `<a href="https://www.google.com/maps/search/nearest+hospital" target="_blank" class="action-btn" style="background-color: #555;"><i class="fa-solid fa-map-location-dot"></i> <span data-key="find_hospital">${langPack.find_hospital}</span></a>`;

        if (category === "Emergency") allElements.actionButtonsContainer.innerHTML = emergencyBtn + ambulanceBtn;
        else if (category === "Urgent") allElements.actionButtonsContainer.innerHTML = ambulanceBtn + findHospitalBtn;
        else allElements.actionButtonsContainer.innerHTML = findHospitalBtn;
    };
    
    const generateHealthHub = () => {
        allElements.healthHubContainer.innerHTML = '';
        const lang = currentLanguage;
        const langPack = translations[lang] || translations.en;
        const resources = [
            { textKey: "find_doctor", icon: "fa-stethoscope", url: "https://www.practo.com/search/doctors" },
            { textKey: "ayushman_bharat", icon: "fa-id-card", url: "https://pmjay.gov.in/" },
            { textKey: "govt_portal", icon: "fa-landmark", url: "https://www.mohfw.gov.in/" }
        ];
        resources.forEach(res => {
            allElements.healthHubContainer.innerHTML += `<a href="${res.url}" target="_blank" class="hub-card"><i class="fa-solid ${res.icon}"></i><span data-key="${res.textKey}">${langPack[res.textKey]}</span></a>`;
        });
    };
    
    const displayError = (message) => { allElements.errorMessage.textContent = message; allElements.errorContainer.classList.remove('hidden'); };
    const hideError = () => allElements.errorContainer.classList.add('hidden');
    
    // --- Initial Setup ---
    allElements.submitBtn.addEventListener('click', handleTriageSubmit);
    allElements.downloadReportBtn.addEventListener('click', generatePDF);
    const savedLang = localStorage.getItem('triage_language') || 'en';
    allElements.languageSelector.value = savedLang;
    changeLanguage(savedLang);
    allElements.languageSelector.addEventListener('change', (e) => changeLanguage(e.target.value));
});