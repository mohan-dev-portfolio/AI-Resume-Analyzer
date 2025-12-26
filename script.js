// --- 1. Demo Data Constants ---
const DEMO_JD = `Senior Frontend Engineer
        
We are looking for a Senior Frontend Engineer to build modern web applications.

Responsibilities:
- Build pixel-perfect, buttery smooth UIs across both mobile and desktop.
- Leverage React.js and TypeScript to build scalable frontend architecture.
- Optimize application for maximum speed and scalability.
- Implement responsive designs using Tailwind CSS.
- Collaborate with backend engineers to integrate RESTful APIs.
- Write unit and integration tests using Jest and React Testing Library.
- Maintain code quality through code reviews and documentation.

Requirements:
- 5+ years of experience with JavaScript (ES6+) and modern frameworks.
- Strong proficiency in React.js, Redux, and React Hooks.
- Deep understanding of HTML5, CSS3, and SCSS.
- Experience with TypeScript is mandatory.
- Familiarity with modern build pipelines and tools (Webpack, Vite).
- Knowledge of Git and CI/CD workflows.
- Experience with Agile methodologies.
- Bonus: Experience with Next.js and Server Side Rendering (SSR).`;

const DEMO_RESUME = `Alex Developer
San Francisco, CA | alex.dev@email.com | (555) 123-4567
linkedin.com/in/alexdev | github.com/alexdev

SUMMARY
Passionate Frontend Developer with 4 years of experience building responsive web applications. Specialized in the React ecosystem and UI/UX implementation.

SKILLS
Languages: JavaScript (ES6+), HTML5, CSS3, Python
Frameworks: React.js, Vue.js, Bootstrap, Tailwind CSS
Tools: Git, Webpack, npm, Figma, Jira
Testing: Jest, Cypress

EXPERIENCE
Frontend Developer | Tech Solutions Inc.
2020 - Present
- Developed and maintained the main company dashboard using React.js and Redux.
- Reduced page load time by 40% through code splitting and image optimization.
- Collaborated with UX designers to implement responsive designs.
- Integrated REST APIs for real-time data visualization.

Junior Web Developer | StartUp Creative
2018 - 2020
- Built landing pages using HTML, CSS, and vanilla JavaScript.
- Assisted in migrating legacy code to modern frameworks.
- Fixed bugs and improved cross-browser compatibility.

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2018
`;

// --- 2. Utilities & Configuration ---
const stopWords = new Set([
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", 
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", 
    "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", 
    "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", 
    "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", 
    "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", 
    "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", 
    "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", 
    "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", 
    "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", 
    "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", 
    "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", 
    "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", 
    "yourselves", "will", "can", "role", "work", "job", "team", "experience", "skills", "requirements", "responsibilities",
    "proficiency", "strong", "knowledge", "familiarity", "understanding", "looking", "seeking", "years"
]);

// DOM Elements
const jdInput = document.getElementById('jd-input');
const resumeInput = document.getElementById('resume-input');
const fileUpload = document.getElementById('file-upload');
const loadingOverlay = document.getElementById('loading-overlay');
const resultsSection = document.getElementById('results-section');
const loadingText = document.getElementById('loading-text');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');

// --- 3. Functions ---
// Toggle Mobile Menu
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        toggleMobileMenu();
    });
}

function toggleMobileMenu() {
    if (mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.remove('hidden');
        mobileMenuBtn.innerHTML = '<i class="fa-solid fa-xmark text-xl"></i>';
    } else {
        mobileMenu.classList.add('hidden');
        mobileMenuBtn.innerHTML = '<i class="fa-solid fa-bars text-xl"></i>';
    }
}

function loadDemoData() {
    // Typing effect simulation
    if (!jdInput || !resumeInput) {
        console.error("Input elements not found!");
        return;
    }
    jdInput.value = "";
    resumeInput.value = "";
    jdInput.value = DEMO_JD;
    resumeInput.value = DEMO_RESUME;
    // Highlight the action button slightly to guide user
    const btn = document.querySelector('button[onclick="analyzeResume()"]');
    btn.classList.add('animate-pulse');
    setTimeout(() => btn.classList.remove('animate-pulse'), 1000);
}

// Handle File Upload
if (fileUpload) {
    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                resumeInput.value = e.target.result;
            };
            reader.readAsText(file);
        }
    });
}

function cleanText(text) {
    return text.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
}

function extractKeywords(text) {
    const words = cleanText(text).split(' ');
    const wordMap = new Map();
    words.forEach(word => {
        if (!stopWords.has(word) && word.length > 2) {
            wordMap.set(word, (wordMap.get(word) || 0) + 1);
        }
    });
    return Array.from(wordMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
}

async function analyzeResume() {
    const jdText = jdInput.value.trim();
    const resumeText = resumeInput.value.trim();
    if (!jdText || !resumeText) {
        alert("Please provide both Job Description and Resume content.");
        return;
    }
    // UI Transitions
    loadingOverlay.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const stages = [
        "Tokenizing job description...", 
        "Parsing resume architecture...", 
        "Extracting semantic entities...", 
        "Calculating match probability..."
    ];
    for (let i = 0; i < stages.length; i++) {
        loadingText.innerText = stages[i];
        await new Promise(r => setTimeout(r, 600)); 
    }
    // Analysis Logic
    const jdKeywords = extractKeywords(jdText);
    const resumeClean = cleanText(resumeText);
    const resumeWordsSet = new Set(resumeClean.split(' '));
    const matchedKeywords = [];
    const missingKeywords = [];
    // Focus on top 20 significant keywords for sharper analysis
    const scoringKeywords = jdKeywords.slice(0, 25);
    scoringKeywords.forEach(keyword => {
        if (resumeWordsSet.has(keyword)) {
            matchedKeywords.push(keyword);
        } else {
            missingKeywords.push(keyword);
        }
    });
    // Scoring
    // 70% content, 30% format
    const keywordScore = (matchedKeywords.length / scoringKeywords.length) * 100;
    let formatScore = 100;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phoneRegex = /(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
    const hasEmail = emailRegex.test(resumeText);
    const hasPhone = phoneRegex.test(resumeText);
    const hasLink = resumeText.toLowerCase().includes('linkedin') || resumeText.toLowerCase().includes('github') || resumeText.toLowerCase().includes('portfolio');
    const wordCount = resumeText.split(/\s+/).length;
    if (!hasEmail) formatScore -= 20;
    if (!hasPhone) formatScore -= 10;
    if (wordCount < 200) formatScore -= 20;
    if (wordCount > 1500) formatScore -= 10;
    const finalScore = Math.round((keywordScore * 0.7) + (formatScore * 0.3));
    updateUI(finalScore, matchedKeywords, missingKeywords, hasEmail, hasPhone, hasLink, wordCount);
    loadingOverlay.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    // Animation for circle
    setTimeout(() => {
        const circle = document.getElementById('score-circle');
        const offset = 100 - finalScore;
        circle.style.strokeDasharray = `${finalScore}, 100`;
        // Color Transition based on score
        if(finalScore >= 80) circle.classList.replace('text-brand-500', 'text-green-500');
        else if(finalScore < 50) circle.classList.replace('text-brand-500', 'text-red-500');
    }, 100);
    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateUI(score, matched, missing, hasEmail, hasPhone, hasLink, wordCount) {
    document.getElementById('score-text').innerText = `${score}%`;
    const verdictTitle = document.getElementById('verdict-title');
    const verdictDesc = document.getElementById('verdict-desc');
    const verdictBadge = document.getElementById('verdict-badge');
    verdictBadge.classList.remove('hidden');
    if (score >= 80) {
        verdictTitle.innerText = "Excellent Match";
        verdictBadge.innerText = "Top 10% Candidate";
        verdictBadge.className = "inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider mb-3";
        verdictDesc.innerText = "Your resume is highly optimized. You have a strong chance of passing the ATS filter.";
    } else if (score >= 50) {
        verdictTitle.innerText = "Good Potential";
        verdictBadge.innerText = "Optimization Needed";
        verdictBadge.className = "inline-block px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-3";
        verdictDesc.innerText = "You have the basics, but you're missing specific technical keywords the employer is scanning for.";
    } else {
        verdictTitle.innerText = "Significant Gaps";
        verdictBadge.innerText = "High Risk";
        verdictBadge.className = "inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider mb-3";
        verdictDesc.innerText = "The ATS may reject this resume. Focus on adding the missing keywords listed below.";
    }
    document.getElementById('word-count').innerText = wordCount;
    document.getElementById('skill-count').innerText = matched.length;
    renderKeywords('matched-keywords-container', matched, 'bg-green-500/10 text-green-400 border-green-500/20');
    renderKeywords('missing-keywords-container', missing, 'bg-red-500/10 text-red-400 border-red-500/20');
    updateCheckIcon('check-email', hasEmail);
    updateCheckIcon('check-phone', hasPhone);
    updateCheckIcon('check-link', hasLink);
    updateCheckIcon('check-length', wordCount >= 300 && wordCount <= 1200);
    generateSuggestions(missing, hasEmail, score, wordCount);
}

function renderKeywords(containerId, list, classes) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    if (list.length === 0) {
        container.innerHTML = '<span class="text-slate-500 italic text-sm">None detected.</span>';
        return;
    }
    list.forEach(word => {
        const span = document.createElement('span');
        span.className = `px-3 py-1.5 rounded-md text-xs font-medium border ${classes} inline-block mb-2 mr-2 transition-transform hover:scale-105 cursor-default`;
        span.innerText = word;
        container.appendChild(span);
    });
}

function updateCheckIcon(id, status) {
    const el = document.getElementById(id);
    if (status) {
        el.innerHTML = '<i class="fa-solid fa-circle-check text-green-400 text-lg drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]"></i>';
    } else {
        el.innerHTML = '<i class="fa-solid fa-circle-xmark text-red-400 text-lg drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]"></i>';
    }
}

function generateSuggestions(missing, hasEmail, score, wordCount) {
    const suggestionsDiv = document.getElementById('suggestions-container');
    suggestionsDiv.innerHTML = '';
    const suggestions = [];
    if (missing.length > 0) {
        suggestions.push({
            icon: 'fa-triangle-exclamation',
            color: 'text-red-400',
            text: `Add high-impact keywords: <b>${missing.slice(0, 3).join(", ")}</b>.`
        });
    }
    if (!hasEmail) {
        suggestions.push({
            icon: 'fa-envelope',
            color: 'text-orange-400',
            text: "Your contact information is incomplete. Add a professional email address."
        });
    }
    if (wordCount < 300) {
        suggestions.push({
            icon: 'fa-file-lines',
            color: 'text-yellow-400',
            text: "Your resume is too short. Elaborate on your projects and responsibilities."
        });
    }
    if (score < 50) {
        suggestions.push({
            icon: 'fa-wand-magic-sparkles',
            color: 'text-brand-400',
            text: "Rewrite your 'Summary' to explicitly mention the role title found in the Job Description."
        });
    }
    if (suggestions.length === 0) {
        suggestions.push({
            icon: 'fa-thumbs-up',
            color: 'text-green-400',
            text: "Great job! Your resume is well-optimized. Consider a human proofread next."
        });
    }
    suggestions.forEach(sug => {
        const div = document.createElement('div');
        div.className = "p-4 rounded-xl bg-dark-900/30 border border-white/5 flex gap-3 items-start transition-colors hover:bg-dark-900/50";
        div.innerHTML = `
            <div class="mt-0.5 ${sug.color}"><i class="fa-solid ${sug.icon}"></i></div>
            <span class="text-sm text-slate-300 leading-relaxed">${sug.text}</span>
        `;
        suggestionsDiv.appendChild(div);
    });
}

function downloadReport() {
    // Primary method: Print Dialog
    window.print();
    // Fallback: Generate Text File if print doesn't happen or user wants text
    // This ensures "Download" functionality works even if print is blocked in preview
    const score = document.getElementById('score-text').innerText;
    const verdict = document.getElementById('verdict-title').innerText;
    const suggestions = Array.from(document.querySelectorAll('#suggestions-container > div')).map(d => d.innerText).join('\n- ');
    const reportContent = `ResuMatch.ai Analysis Report\n\n` +
        `Match Score: ${score}\nVerdict: ${verdict}\n\n` +
        `Action Plan:\n- ${suggestions}\n\n` +
        `Generated on: ${new Date().toLocaleDateString()}`;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ResuMatch_Report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
