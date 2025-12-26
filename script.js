// DOM Elements - Initialize when DOM is loaded
let landingPage, appContainer, jdInput, resumeInput, analyzeBtn, loadingOverlay, resultsDashboard;
let scoreText, scoreCircle, scoreVerdict, missingKeywordsContainer, actionPlanContainer;
let aiModal, aiModalTitle, aiModalContent, videoModal, demoVideoFrame;

// Stopwords for cleaner keyword extraction
const stopWords = new Set([
    "a", "an", "the", "and", "or", "but", "is", "are", "was", "were", "in", "on", "at", "to", "for", 
    "of", "with", "by", "as", "it", "this", "that", "which", "who", "what", "when", "where", "why", 
    "how", "be", "been", "being", "have", "has", "had", "do", "does", "did", "can", "could", "will", 
    "would", "shall", "should", "may", "might", "must", "i", "you", "he", "she", "we", "they", "me", 
    "him", "her", "us", "them", "my", "your", "his", "its", "our", "their", "mine", "yours", "hers", 
    "ours", "theirs", "myself", "yourself", "himself", "herself", "itself", "ourselves", "themselves", 
    "from", "up", "down", "out", "over", "under", "again", "further", "then", "once", "here", "there", 
    "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", 
    "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", 
    "should", "now"
]);

// Initialize DOM elements when page loads
function initializeElements() {
    landingPage = document.getElementById('landing-page');
    appContainer = document.getElementById('app-container');
    jdInput = document.getElementById('jd-input');
    resumeInput = document.getElementById('resume-input');
    analyzeBtn = document.getElementById('analyze-btn');
    loadingOverlay = document.getElementById('loading-overlay');
    resultsDashboard = document.getElementById('results-dashboard');
    
    scoreText = document.getElementById('score-text');
    scoreCircle = document.getElementById('score-circle');
    scoreVerdict = document.getElementById('score-verdict');
    missingKeywordsContainer = document.getElementById('missing-keywords-container');
    actionPlanContainer = document.getElementById('action-plan-container');

    // Modal Elements
    aiModal = document.getElementById('ai-modal');
    aiModalTitle = document.getElementById('ai-modal-title');
    aiModalContent = document.getElementById('ai-modal-content');
    
    // Video Modal Elements
    videoModal = document.getElementById('video-modal');
    demoVideoFrame = document.getElementById('demo-video-frame');

    // Close video modal on background click
    if (videoModal) {
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) closeVideoModal();
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (aiModal && !aiModal.classList.contains('hidden')) {
                closeModal();
            }
            if (videoModal && !videoModal.classList.contains('hidden')) {
                closeVideoModal();
            }
        }
    });
}

// Navigation
function switchView(view) {
    if (view === 'app') {
        landingPage.classList.add('hidden');
        appContainer.classList.remove('hidden');
        appContainer.classList.add('flex');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        appContainer.classList.add('hidden');
        appContainer.classList.remove('flex');
        landingPage.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Helpers
function clearInput(id) {
    const element = document.getElementById(id);
    if (element) {
        element.value = '';
    }
    if (resultsDashboard) {
        resultsDashboard.classList.add('hidden');
    }
}

// Timeout wrapper for fetch
function fetchWithTimeout(url, options, timeout = 60000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout after 60 seconds')), timeout)
        )
    ]);
}

// Shared API Caller
async function callGemini(prompt, responseSchema = null) {
    const apiKey = "AIzaSyDI5fls_udUqe0u-qsp3l27efshuKbyVxM";
    // Using gemini-1.5-flash as it's the stable model name
    const modelName = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: responseSchema ? "application/json" : "text/plain",
        }
    };

    if (responseSchema) {
        payload.generationConfig.responseSchema = responseSchema;
    }

    // Exponential backoff retry logic with timeout
    for (let i = 0; i < 3; i++) {
        try {
            const response = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }, 60000); // 60 second timeout
            
            if (!response.ok) {
                let errorText = '';
                try {
                    const errorData = await response.json();
                    errorText = errorData.error?.message || JSON.stringify(errorData);
                } catch (e) {
                    errorText = await response.text();
                }
                console.error("API Error Response:", errorText);
                throw new Error(`HTTP Error: ${response.status} - ${errorText.substring(0, 200)}`);
            }
            
            const data = await response.json();
            
            // Check for API errors in response
            if (data.error) {
                throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
            }
            
            let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!text) {
                console.error("API Response:", data);
                throw new Error("No text generated - check API response");
            }

            // Clean markdown code blocks if present (safeguard)
            if (text.startsWith('```')) {
                text = text.replace(/^```(json)?\n/, '').replace(/```$/, '');
            }

            return responseSchema ? JSON.parse(text) : text;
        } catch (error) {
            console.error(`API Call attempt ${i + 1} failed:`, error);
            if (i === 2) throw error;
            await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
        }
    }
}

function getWords(text) {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, '') // remove punctuation
        .split(/\s+/) // split by whitespace
        .filter(w => w.length > 2 && !stopWords.has(w)); // filter short words and stopwords
}

function pasteDemoData() {
    if (!jdInput || !resumeInput) return;
    
    jdInput.value = `We are looking for a Senior Frontend Engineer with experience in React, TypeScript, and Tailwind CSS. The ideal candidate should have a strong understanding of UI/UX principles, performance optimization, and responsive design. Knowledge of state management (Redux/Zustand) and API integration is required. Experience with Agile methodologies and Git is a must.`;
    resumeInput.value = `Experienced Frontend Developer proficient in React and JavaScript. Skilled in creating responsive web applications using CSS and Bootstrap. Familiar with Git version control and working in agile teams. I focus on writing clean code and good UI design.`;
}

// File Upload Handler
async function handleFileUpload(event, targetId) {
    const file = event.target.files[0];
    if (!file) return;

    const targetTextarea = document.getElementById(targetId);
    if (!targetTextarea) return;

    // Visual feedback
    targetTextarea.placeholder = "Reading file...";
    targetTextarea.value = "";

    // Handle text files
    if (file.type === "text/plain" || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            targetTextarea.value = e.target.result;
            targetTextarea.placeholder = "Paste your content here...";
        };
        reader.onerror = function() {
            alert("Error reading file");
            targetTextarea.placeholder = "Paste your content here...";
        };
        reader.readAsText(file);
        return;
    }

    // Handle PDF files
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
        try {
            targetTextarea.placeholder = "Extracting text from PDF...";
            
            // Check if PDF.js is loaded
            if (typeof pdfjsLib === 'undefined') {
                throw new Error("PDF.js library is loading. Please wait a moment and try again.");
            }
            
            // Set up PDF.js worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            let fullText = '';
            const numPages = pdf.numPages;
            
            // Extract text from all pages
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                targetTextarea.placeholder = `Extracting page ${pageNum} of ${numPages}...`;
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n';
            }

            targetTextarea.value = fullText.trim();
            targetTextarea.placeholder = "Paste your content here...";
            
        } catch (error) {
            console.error("PDF extraction error:", error);
            alert(`Error extracting text from PDF: ${error.message}\n\nPlease try copying and pasting the text manually, or use a .txt file.`);
            targetTextarea.placeholder = "Paste your content here...";
            targetTextarea.value = "";
        }
        return;
    }

    // Handle DOC/DOCX files (show helpful message)
    if (file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
        alert("DOC/DOCX files are not supported for direct upload. Please:\n1. Open the file in Word\n2. Copy the text\n3. Paste it in the text area\n\nOr save the file as PDF and upload it.");
        targetTextarea.placeholder = "Paste your content here...";
        // Reset file input
        event.target.value = '';
        return;
    }

    // For other file types, show error
    alert("Unsupported file type. Please upload a .txt or .pdf file, or copy and paste the text.");
    targetTextarea.placeholder = "Paste your content here...";
    event.target.value = '';
}

// Analysis Logic
async function analyzeResume() {
    if (!jdInput || !resumeInput || !loadingOverlay || !resultsDashboard) return;

    const jdText = jdInput.value.trim();
    const resumeText = resumeInput.value.trim();

    if (!jdText || !resumeText) {
        alert("Please fill in both the Job Description and Resume fields.");
        return;
    }

    // UI State: Loading
    loadingOverlay.classList.remove('hidden');
    resultsDashboard.classList.add('hidden');
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
    }

    try {
        // Gemini API Logic
        const prompt = `
        You are an expert Applicant Tracking System (ATS) and Resume Coach. 
        Analyze the following Job Description and Resume.
        
        JOB DESCRIPTION:
        ${jdText.substring(0, 10000)}
        
        RESUME:
        ${resumeText.substring(0, 10000)}
        
        Compare them strictly and provide a detailed analysis.
        
        IMPORTANT REQUIREMENTS:
        1. Calculate a match score (0-100) based on keyword matching, skills alignment, and overall fit
        2. Provide a SHORT verdict (3-6 words only) like "Excellent Match", "Good Match", "Needs Improvement", "Poor Match"
        3. List AT LEAST 5-10 missing keywords (hard skills, soft skills, tools, technologies) found in JD but missing in Resume. If there are many missing, list the most important ones.
        4. Provide EXACTLY 3 actionable tips to improve the resume for this specific job
        
        Output format (JSON):
        {
            "score": <integer 0-100>,
            "verdict": "<3-6 word summary>",
            "missingKeywords": ["keyword1", "keyword2", "keyword3", ...],
            "actionPlan": ["tip 1", "tip 2", "tip 3"]
        }
        
        CRITICAL: 
        - verdict must be 3-6 words maximum
        - missingKeywords must be a non-empty array with at least 3 items (if score < 80)
        - actionPlan must have exactly 3 items
        - All fields are REQUIRED
        `;

        const schema = {
            type: "OBJECT",
            properties: {
                score: { type: "INTEGER" },
                verdict: { type: "STRING" },
                missingKeywords: { type: "ARRAY", items: { type: "STRING" } },
                actionPlan: { type: "ARRAY", items: { type: "STRING" } }
            }
        };

        const aiResult = await callGemini(prompt, schema);
        
        // Validate and sanitize the response
        if (!aiResult || typeof aiResult !== 'object') {
            throw new Error("Invalid API response format");
        }
        
        const score = Math.max(0, Math.min(100, parseInt(aiResult.score) || 0));
        const verdict = (aiResult.verdict || "Analysis Complete").trim();
        
        // Ensure arrays are valid and filter out empty values
        let missingKeywords = [];
        if (Array.isArray(aiResult.missingKeywords)) {
            missingKeywords = aiResult.missingKeywords
                .filter(k => k && typeof k === 'string' && k.trim().length > 0)
                .map(k => k.trim());
        }
        
        let actionPlan = [];
        if (Array.isArray(aiResult.actionPlan)) {
            actionPlan = aiResult.actionPlan
                .filter(p => p && typeof p === 'string' && p.trim().length > 0)
                .map(p => p.trim());
        }
        
        // Log for debugging - show raw response too
        console.log("Raw API Response:", aiResult);
        console.log("Processed Data:", { 
            score, 
            verdict, 
            missingKeywordsCount: missingKeywords.length, 
            actionPlanCount: actionPlan.length,
            missingKeywords: missingKeywords.slice(0, 10), // Log first 10
            actionPlan: actionPlan.slice(0, 3) // Log first 3
        });
        
        // If missing keywords is empty but score is low, try to extract keywords as fallback
        if (missingKeywords.length === 0 && score < 80) {
            console.warn("No keywords returned from API, using fallback extraction");
            const jdWords = getWords(jdText);
            const resumeWords = new Set(getWords(resumeText));
            const uniqueJdKeywords = [...new Set(jdWords)];
            const fallbackMissing = uniqueJdKeywords.filter(word => !resumeWords.has(word));
            if (fallbackMissing.length > 0) {
                missingKeywords = fallbackMissing.slice(0, 15); // Use top 15 fallback keywords
                console.log("Using fallback keywords:", missingKeywords.slice(0, 5));
            }
        }
        
        renderResults(score, missingKeywords, actionPlan, verdict);

    } catch (error) {
        console.error("AI Analysis Failed:", error);
        console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        // Show user-friendly error message
        const errorMessage = error.message || "Unknown error occurred";
        let userMessage = "AI Service unavailable. ";
        
        if (errorMessage.includes("timeout")) {
            userMessage = "Request timed out. The analysis is taking too long. ";
        } else if (errorMessage.includes("401") || errorMessage.includes("403")) {
            userMessage = "API authentication failed. Please check your API key. ";
        } else if (errorMessage.includes("429")) {
            userMessage = "API rate limit exceeded. Please try again later. ";
        } else if (errorMessage.includes("400")) {
            userMessage = "Invalid request. Please check your input. ";
        }
        
        // Fallback Local Logic
        const jdWords = getWords(jdText);
        const resumeWords = new Set(getWords(resumeText));
        const uniqueJdKeywords = [...new Set(jdWords)];
        const matches = uniqueJdKeywords.filter(word => resumeWords.has(word));
        const missing = uniqueJdKeywords.filter(word => !resumeWords.has(word));
        let score = 0;
        if (uniqueJdKeywords.length > 0) score = Math.round((matches.length / uniqueJdKeywords.length) * 100);
        
        renderResults(score, missing, [
            userMessage + "Using basic keyword matching.",
            "Check your internet connection and API key.",
            "Try again in a few moments."
        ], "Offline Analysis");
    } finally {
        loadingOverlay.classList.add('hidden');
        resultsDashboard.classList.remove('hidden');
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
        }
    }
}

// Modal Logic
function openModal(title, iconClass) {
    if (!aiModalTitle || !aiModalContent || !aiModal) return;
    
    aiModalTitle.innerHTML = `<i class="${iconClass} text-blue-400"></i> ${title}`;
    aiModalContent.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 space-y-4">
            <div class="w-10 h-10 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <p class="text-slate-500 animate-pulse font-mono text-xs">COMMUNICATING WITH GEMINI AI...</p>
        </div>
    `;
    aiModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeModal() {
    if (!aiModal) return;
    aiModal.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
}

// Video Modal Logic
function openVideoModal() {
    if (!videoModal || !demoVideoFrame) return;
    
    // Using a generic 'How to beat ATS' tutorial video ID for demo purposes
    // You can replace 'y75X8jB3668' with any YouTube video ID
    demoVideoFrame.src = "https://www.youtube.com/embed/y75X8jB3668?autoplay=1&rel=0"; 
    videoModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeVideoModal() {
    if (!videoModal || !demoVideoFrame) return;
    
    videoModal.classList.add('hidden');
    demoVideoFrame.src = ""; // Stop video playback
    document.body.style.overflow = ''; // Restore scrolling
}

function copyModalContent(event) {
    if (!aiModalContent) return;
    
    const text = aiModalContent.innerText;
    // Use modern Clipboard API with fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            const btn = event.currentTarget;
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => btn.innerHTML = originalHtml, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            fallbackCopy(text, event);
        });
    } else {
        fallbackCopy(text, event);
    }
}

function fallbackCopy(text, event) {
    // Use fallback method for iframe compatibility
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        const btn = event.currentTarget;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => btn.innerHTML = originalHtml, 2000);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    
    document.body.removeChild(textArea);
}

// Feature 1: Cover Letter
async function generateCoverLetter() {
    if (!jdInput || !resumeInput) return;
    
    openModal("Draft Cover Letter", "fa-solid fa-file-signature");
    
    const jdText = jdInput.value.trim();
    const resumeText = resumeInput.value.trim();
    
    const prompt = `
    Write a professional, compelling cover letter for the following Candidate and Job Description.
    
    CANDIDATE RESUME:
    ${resumeText.substring(0, 5000)}
    
    JOB DESCRIPTION:
    ${jdText.substring(0, 5000)}
    
    Tone: Professional, enthusiastic, and confident.
    Structure:
    1. Opening: State position and enthusiasm.
    2. Body Paragraphs: Connect 2-3 specific achievements from resume to JD requirements.
    3. Closing: Call to action.
    Format: Use HTML <p class="mb-4"> tags for paragraphs. Do NOT include markdown code blocks.
    `;

    try {
        const text = await callGemini(prompt);
        // Simple formatting cleanup
        if (aiModalContent) {
            aiModalContent.innerHTML = `<div class="prose prose-invert max-w-none text-slate-300">${text}</div>`;
        }
    } catch (e) {
        console.error(e);
        if (aiModalContent) {
            aiModalContent.innerHTML = `<div class="text-red-400 p-4 border border-red-500/50 rounded bg-red-500/10">Error generating cover letter. Please try again.</div>`;
        }
    }
}

// Feature 2: Interview Prep
async function generateInterviewPrep() {
    if (!jdInput || !resumeInput) return;
    
    openModal("Interview Preparation", "fa-solid fa-user-tie");
    
    const jdText = jdInput.value.trim();
    const resumeText = resumeInput.value.trim();

    const prompt = `
    Based on the Job Description and Resume, generate 3 specific Behavioral Interview Questions that this candidate is likely to be asked.
    For each question, provide a "Coach's Tip" on how they should answer using their specific experience.
    
    Format output as a JSON array of objects: [{ "question": "...", "tip": "..." }]
    `;
    
    const schema = {
        type: "ARRAY",
        items: {
            type: "OBJECT",
            properties: {
                question: { type: "STRING" },
                tip: { type: "STRING" }
            }
        }
    };

    try {
        const data = await callGemini(prompt, schema);
        let html = '<div class="space-y-6">';
        data.forEach((item, index) => {
            html += `
                <div class="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all">
                    <div class="flex gap-4 mb-4">
                        <span class="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-500/20">${index + 1}</span>
                        <h4 class="font-bold text-white text-lg">${item.question}</h4>
                    </div>
                    <div class="ml-12 p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-xl relative">
                        <div class="absolute top-0 left-0 w-1 h-full bg-emerald-500/50 rounded-l-xl"></div>
                        <p class="text-sm text-emerald-200/90 italic leading-relaxed"><i class="fa-solid fa-lightbulb mr-2 text-emerald-400"></i>${item.tip}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        if (aiModalContent) {
            aiModalContent.innerHTML = html;
        }
    } catch (e) {
        console.error(e);
        if (aiModalContent) {
            aiModalContent.innerHTML = `<div class="text-red-400 p-4 border border-red-500/50 rounded bg-red-500/10">Error generating interview prep. Please try again.</div>`;
        }
    }
}

function renderResults(score, missingWords, actionPlan, verdict) {
    if (!scoreCircle || !scoreText || !scoreVerdict || !missingKeywordsContainer || !actionPlanContainer) return;
    
    // Update Score Circle
    const strokeDash = `${score}, 100`;
    scoreCircle.setAttribute('stroke-dasharray', strokeDash);
    
    // Animate Score Text
    let currentScore = 0;
    const interval = setInterval(() => {
        if (currentScore >= score) {
            clearInterval(interval);
            scoreText.textContent = `${score}%`;
        } else {
            currentScore++;
            scoreText.textContent = `${currentScore}%`;
        }
    }, 20);

    // Color Coding Score - Truncate verdict if too long
    let displayVerdict = verdict || "Analysis Complete";
    // Ensure verdict is short (max 5 words or 40 characters) for badge display
    const words = displayVerdict.trim().split(/\s+/);
    if (words.length > 5 || displayVerdict.length > 40) {
        displayVerdict = words.slice(0, 5).join(' ');
        if (displayVerdict.length > 40) {
            displayVerdict = displayVerdict.substring(0, 37) + '...';
        }
    }
    scoreVerdict.textContent = displayVerdict;
    // Store full verdict in title attribute for hover tooltip
    scoreVerdict.setAttribute('title', verdict || displayVerdict);
    if (score >= 80) {
        scoreCircle.setAttribute('stroke', '#10B981'); // Emerald
        scoreCircle.style.filter = "drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))";
        scoreVerdict.className = "px-4 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-sm font-bold mt-4 text-emerald-400";
        scoreText.classList.add("text-emerald-400");
        scoreText.classList.remove("text-blue-500", "text-amber-400", "text-red-400");
    } else if (score >= 50) {
        scoreCircle.setAttribute('stroke', '#F59E0B'); // Amber
        scoreCircle.style.filter = "drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))";
        scoreVerdict.className = "px-4 py-1.5 rounded-full bg-amber-900/30 border border-amber-500/30 text-sm font-bold mt-4 text-amber-400";
        scoreText.classList.add("text-amber-400");
        scoreText.classList.remove("text-blue-500", "text-emerald-400", "text-red-400");
    } else {
        scoreCircle.setAttribute('stroke', '#EF4444'); // Red
        scoreCircle.style.filter = "drop-shadow(0 0 10px rgba(239, 68, 68, 0.6))";
        scoreVerdict.className = "px-4 py-1.5 rounded-full bg-red-900/30 border border-red-500/30 text-sm font-bold mt-4 text-red-400";
        scoreText.classList.add("text-red-400");
        scoreText.classList.remove("text-blue-500", "text-emerald-400", "text-amber-400");
    }

    // Update Missing Keywords
    missingKeywordsContainer.innerHTML = '';
    
    // Validate missingWords array
    const validMissingWords = (Array.isArray(missingWords) && missingWords.length > 0) 
        ? missingWords.filter(w => w && typeof w === 'string' && w.trim().length > 0)
        : [];
    
    if (validMissingWords.length === 0) {
        // Only show "all matched" if score is very high (90+)
        if (score >= 90) {
            missingKeywordsContainer.innerHTML = `
                <div class="w-full flex flex-col items-center justify-center py-8">
                    <div class="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                        <i class="fa-solid fa-check text-emerald-400"></i>
                    </div>
                    <span class="text-emerald-400 text-sm font-medium">All keywords matched! Outstanding.</span>
                </div>`;
        } else {
            // If score is low but no keywords from API, show helpful message
            missingKeywordsContainer.innerHTML = `
                <div class="w-full flex flex-col items-center justify-center py-8">
                    <div class="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-3">
                        <i class="fa-solid fa-exclamation-triangle text-amber-400"></i>
                    </div>
                    <span class="text-amber-400 text-sm font-medium text-center px-4">No keywords identified. Review the job description for required skills.</span>
                </div>`;
        }
    } else {
        validMissingWords.slice(0, 15).forEach(word => { // Limit to top 15
            const tag = document.createElement('span');
            tag.className = 'px-3 py-1.5 bg-red-500/5 border border-red-500/20 text-red-300 text-xs font-medium rounded-lg capitalize mb-1 hover:bg-red-500/10 transition-colors cursor-default';
            tag.innerText = word;
            missingKeywordsContainer.appendChild(tag);
        });
        if (validMissingWords.length > 15) {
            const moreTag = document.createElement('span');
            moreTag.className = 'px-3 py-1.5 text-slate-500 text-xs italic border border-transparent';
            moreTag.innerText = `+${validMissingWords.length - 15} more...`;
            missingKeywordsContainer.appendChild(moreTag);
        }
    }

    // Update Action Plan
    actionPlanContainer.innerHTML = '';
    
    if (actionPlan && Array.isArray(actionPlan) && actionPlan.length > 0) {
        actionPlan.forEach((plan, index) => {
            const icons = [
                {icon: 'fa-circle-exclamation', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20'},
                {icon: 'fa-bullseye', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20'},
                {icon: 'fa-wand-magic-sparkles', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20'}
            ];
            const style = icons[index % icons.length];
            
            const div = document.createElement('div');
            div.className = 'flex items-start gap-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all group';
            div.innerHTML = `
                <div class="shrink-0 w-8 h-8 rounded-lg ${style.bg} ${style.border} border flex items-center justify-center mt-0.5">
                    <i class="fa-solid ${style.icon} ${style.color} text-xs"></i>
                </div>
                <p class="text-slate-300 text-sm leading-relaxed font-light group-hover:text-white transition-colors">${plan}</p>
            `;
            actionPlanContainer.appendChild(div);
        });
    } else {
        // Provide default action plan if API didn't return one
        const defaultPlan = [
            "Review the job description and identify key skills and requirements",
            "Add missing technologies and skills from the job description to your resume",
            "Use similar terminology and keywords from the job description in your resume"
        ];
        defaultPlan.forEach((plan, index) => {
            const icons = [
                {icon: 'fa-circle-exclamation', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20'},
                {icon: 'fa-bullseye', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20'},
                {icon: 'fa-wand-magic-sparkles', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20'}
            ];
            const style = icons[index % icons.length];
            
            const div = document.createElement('div');
            div.className = 'flex items-start gap-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all group';
            div.innerHTML = `
                <div class="shrink-0 w-8 h-8 rounded-lg ${style.bg} ${style.border} border flex items-center justify-center mt-0.5">
                    <i class="fa-solid ${style.icon} ${style.color} text-xs"></i>
                </div>
                <p class="text-slate-300 text-sm leading-relaxed font-light group-hover:text-white transition-colors">${plan}</p>
            `;
            actionPlanContainer.appendChild(div);
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeElements);
} else {
    initializeElements();
}

