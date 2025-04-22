// Resume Analyzer main JavaScript functionality

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('resumeFile');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileName = document.getElementById('fileName');
    const resultsSection = document.getElementById('resultsSection');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const analyticsSection = document.getElementById('analyticsSection');
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    
    // Set up drag and drop functionality
    setupDragAndDrop();
    
    // Handle file selection
    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            updateFileInfo(file);
        }
    });
    
    // Handle form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!fileInput.files.length) {
            showError('Please select a resume file to analyze.');
            return;
        }
        
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('resume', file);
        
        // Add job description if provided
        const jobDescription = document.getElementById('jobDescription').value;
        if (jobDescription) {
            formData.append('job_description', jobDescription);
        }
        
        // Show loading spinner
        showLoading();
        
        try {
            // Send the file to the server for analysis
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error analyzing resume');
            }
            
            const data = await response.json();
            
            // Display the results
            displayResults(data);
            
        } catch (error) {
            showError(error.message || 'An error occurred during analysis');
        } finally {
            hideLoading();
        }
    });
    
    // Clear button functionality
    document.getElementById('clearBtn').addEventListener('click', () => {
        resetForm();
    });
    
    // Function to set up drag and drop
    function setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileUploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            fileUploadArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            fileUploadArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            fileUploadArea.classList.add('dragover');
        }
        
        function unhighlight() {
            fileUploadArea.classList.remove('dragover');
        }
        
        fileUploadArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length) {
                fileInput.files = files;
                updateFileInfo(files[0]);
            }
        }
    }
    
    // Function to update file information display
    function updateFileInfo(file) {
        const maxFileNameLength = 25;
        let fileNameText = file.name;
        
        if (fileNameText.length > maxFileNameLength) {
            fileNameText = fileNameText.substring(0, maxFileNameLength) + '...';
        }
        
        fileName.textContent = fileNameText;
        fileName.title = file.name; // Set full name as tooltip
        
        // Show file info section
        document.getElementById('fileInfo').classList.remove('d-none');
        
        // Validate file type
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'docx'].includes(fileExtension)) {
            showError('Please upload a PDF or DOCX file');
            resetFileInput();
        } else {
            hideError();
        }
    }
    
    // Function to show loading spinner
    function showLoading() {
        loadingSpinner.classList.remove('d-none');
        resultsSection.classList.add('d-none');
    }
    
    // Function to hide loading spinner
    function hideLoading() {
        loadingSpinner.classList.add('d-none');
    }
    
    // Function to show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorAlert.classList.remove('d-none');
    }
    
    // Function to hide error message
    function hideError() {
        errorAlert.classList.add('d-none');
    }
    
    // Function to reset file input
    function resetFileInput() {
        fileInput.value = '';
        fileName.textContent = '';
        document.getElementById('fileInfo').classList.add('d-none');
    }
    
    // Function to reset the entire form
    function resetForm() {
        resetFileInput();
        document.getElementById('jobDescription').value = '';
        resultsSection.classList.add('d-none');
        hideError();
    }
    
    // Function to display analysis results
    function displayResults(data) {
        // Show results section
        resultsSection.classList.remove('d-none');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Display personal information
        displayPersonalInfo(data.personal_info);
        
        // Display skills
        displaySkills(data.skills);
        
        // Display job match if available
        if (data.job_match && Object.keys(data.job_match).length > 0) {
            displayJobMatch(data.job_match);
            document.getElementById('jobMatchSection').classList.remove('d-none');
        } else {
            document.getElementById('jobMatchSection').classList.add('d-none');
        }
        
        // Display job role prediction
        displayJobRolePrediction(data.job_role_prediction);
        
        // Add the fade-in animation class
        analyticsSection.classList.add('fade-in');
    }
    
    // Function to display personal information
    function displayPersonalInfo(info) {
        const personalInfoSection = document.getElementById('personalInfo');
        
        // Name
        document.getElementById('nameValue').textContent = info.name || 'Not detected';
        
        // Email
        document.getElementById('emailValue').textContent = info.email || 'Not detected';
        
        // Phone
        document.getElementById('phoneValue').textContent = info.phone || 'Not detected';
        
        // Education
        const educationList = document.getElementById('educationList');
        educationList.innerHTML = '';
        
        if (info.education && info.education.length > 0) {
            info.education.forEach(edu => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                
                if (edu.degree) {
                    if (edu.institution && edu.year) {
                        li.innerHTML = `<strong>${edu.degree}</strong> - ${edu.institution} (${edu.year})`;
                    } else if (edu.institution) {
                        li.innerHTML = `<strong>${edu.degree}</strong> - ${edu.institution}`;
                    } else {
                        li.innerHTML = `<strong>${edu.degree}</strong>`;
                    }
                } else if (edu.description) {
                    li.textContent = edu.description;
                }
                
                educationList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = 'No education information detected';
            educationList.appendChild(li);
        }
        
        // Experience
        const experienceList = document.getElementById('experienceList');
        experienceList.innerHTML = '';
        
        if (info.experience && info.experience.length > 0) {
            info.experience.forEach(exp => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                
                if (exp.description) {
                    li.textContent = exp.description;
                }
                
                experienceList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = 'No work experience detected';
            experienceList.appendChild(li);
        }
    }
    
    // Function to display skills
    function displaySkills(skillsData) {
        // Update count in heading
        document.getElementById('skillsCount').textContent = skillsData.total_count || 0;
        
        // Update progress bars
        document.getElementById('technicalSkillsBar').style.width = `${skillsData.technical_percentage || 0}%`;
        document.getElementById('technicalSkillsText').textContent = `${skillsData.technical_count || 0} skills`;
        
        document.getElementById('softSkillsBar').style.width = `${skillsData.soft_percentage || 0}%`;
        document.getElementById('softSkillsText').textContent = `${skillsData.soft_count || 0} skills`;
        
        // Display Technical Skills
        const technicalSkillsList = document.getElementById('technicalSkillsList');
        technicalSkillsList.innerHTML = '';
        
        if (skillsData.technical && skillsData.technical.length > 0) {
            skillsData.technical.forEach(skill => {
                const span = document.createElement('span');
                span.className = 'skill-pill skill-technical';
                span.textContent = skill;
                technicalSkillsList.appendChild(span);
                technicalSkillsList.appendChild(document.createTextNode(' '));
            });
        } else {
            technicalSkillsList.innerHTML = '<p class="text-muted">No technical skills detected</p>';
        }
        
        // Display Soft Skills
        const softSkillsList = document.getElementById('softSkillsList');
        softSkillsList.innerHTML = '';
        
        if (skillsData.soft && skillsData.soft.length > 0) {
            skillsData.soft.forEach(skill => {
                const span = document.createElement('span');
                span.className = 'skill-pill skill-soft';
                span.textContent = skill;
                softSkillsList.appendChild(span);
                softSkillsList.appendChild(document.createTextNode(' '));
            });
        } else {
            softSkillsList.innerHTML = '<p class="text-muted">No soft skills detected</p>';
        }
        
        // Display Other Skills
        const otherSkillsList = document.getElementById('otherSkillsList');
        otherSkillsList.innerHTML = '';
        
        const otherSkills = skillsData.skills.filter(skill => 
            !skillsData.technical.includes(skill) && !skillsData.soft.includes(skill)
        );
        
        if (otherSkills.length > 0) {
            otherSkills.forEach(skill => {
                const span = document.createElement('span');
                span.className = 'skill-pill';
                span.style.backgroundColor = 'var(--bs-secondary)';
                span.style.color = 'var(--bs-white)';
                span.textContent = skill;
                otherSkillsList.appendChild(span);
                otherSkillsList.appendChild(document.createTextNode(' '));
            });
        } else {
            otherSkillsList.innerHTML = '<p class="text-muted">No other skills detected</p>';
        }
        
        // Display Languages
        const languagesList = document.getElementById('languagesList');
        languagesList.innerHTML = '';
        
        if (skillsData.languages && skillsData.languages.length > 0) {
            skillsData.languages.forEach(language => {
                const span = document.createElement('span');
                span.className = 'skill-pill skill-language';
                span.textContent = language;
                languagesList.appendChild(span);
                languagesList.appendChild(document.createTextNode(' '));
            });
        } else {
            languagesList.innerHTML = '<p class="text-muted">No languages detected</p>';
        }
        
        // Display Certifications
        const certificationsList = document.getElementById('certificationsList');
        certificationsList.innerHTML = '';
        
        if (skillsData.certifications && skillsData.certifications.length > 0) {
            skillsData.certifications.forEach(cert => {
                const span = document.createElement('span');
                span.className = 'skill-pill skill-certification';
                span.textContent = cert;
                certificationsList.appendChild(span);
                certificationsList.appendChild(document.createTextNode(' '));
            });
        } else {
            certificationsList.innerHTML = '<p class="text-muted">No certifications detected</p>';
        }
    }
    
    // Function to display job match
    function displayJobMatch(jobMatch) {
        // Update match percentage
        const matchPercentage = document.getElementById('matchPercentage');
        matchPercentage.textContent = `${jobMatch.match_percentage || 0}%`;
        
        // Style based on percentage
        matchPercentage.className = 'match-percentage';
        if (jobMatch.match_percentage >= 70) {
            matchPercentage.classList.add('match-good');
        } else if (jobMatch.match_percentage >= 40) {
            matchPercentage.classList.add('match-average');
        } else {
            matchPercentage.classList.add('match-poor');
        }
        
        // Update progress bar
        document.getElementById('matchProgressBar').style.width = `${jobMatch.match_percentage || 0}%`;
        
        // Display matched keywords
        const matchedKeywordsList = document.getElementById('matchedKeywordsList');
        matchedKeywordsList.innerHTML = '';
        
        if (jobMatch.matched_keywords && jobMatch.matched_keywords.length > 0) {
            jobMatch.matched_keywords.forEach(keyword => {
                const li = document.createElement('li');
                li.className = 'list-group-item list-group-item-success';
                li.textContent = keyword;
                matchedKeywordsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = 'No matching keywords found';
            matchedKeywordsList.appendChild(li);
        }
        
        // Display missing keywords
        const missingKeywordsList = document.getElementById('missingKeywordsList');
        missingKeywordsList.innerHTML = '';
        
        if (jobMatch.missing_keywords && jobMatch.missing_keywords.length > 0) {
            jobMatch.missing_keywords.forEach(keyword => {
                const li = document.createElement('li');
                li.className = 'list-group-item list-group-item-danger';
                li.textContent = keyword;
                missingKeywordsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = 'No missing keywords';
            missingKeywordsList.appendChild(li);
        }
    }
    
    // Function to display job role prediction
    function displayJobRolePrediction(prediction) {
        const rolesList = document.getElementById('rolesList');
        rolesList.innerHTML = '';
        
        if (prediction.top_roles && prediction.top_roles.length > 0) {
            // Create chart data
            const chartLabels = [];
            const chartData = [];
            
            prediction.top_roles.forEach(role => {
                // Add to list
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `
                    <span>${role.title}</span>
                    <span class="badge bg-primary rounded-pill">${role.score}%</span>
                `;
                rolesList.appendChild(li);
                
                // Add to chart data
                chartLabels.push(role.title);
                chartData.push(role.score);
            });
            
            // Display the chart
            displayRolesChart(chartLabels, chartData);
        } else {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = 'No role predictions available';
            rolesList.appendChild(li);
            
            // Hide chart container
            document.getElementById('rolesChartContainer').style.display = 'none';
        }
        
        // Display recommendations
        const recommendationsList = document.getElementById('recommendationsList');
        recommendationsList.innerHTML = '';
        
        if (prediction.recommendations && prediction.recommendations.length > 0) {
            prediction.recommendations.forEach(rec => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = rec;
                recommendationsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = 'No specific recommendations';
            recommendationsList.appendChild(li);
        }
    }
    
    // Function to display job roles chart
    function displayRolesChart(labels, data) {
        const chartContainer = document.getElementById('rolesChartContainer');
        chartContainer.style.display = 'block';
        
        const ctx = document.getElementById('rolesChart').getContext('2d');
        
        // Clear any existing chart
        if (window.rolesChart) {
            window.rolesChart.destroy();
        }
        
        // Create new chart
        window.rolesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Match Percentage',
                    data: data,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Match: ${context.raw}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Match Percentage'
                        }
                    }
                }
            }
        });
    }
    
    // Removed Grammar Check function

    // Removed Readability Analysis function
});
