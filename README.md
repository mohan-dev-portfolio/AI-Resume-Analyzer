# 🤖 AI-Resume-Analyzer

A modern, responsive single-page application built with HTML, Tailwind CSS, and **Google Gemini API**. Features instant resume scoring against job descriptions, keyword gap analysis, AI cover letter generation, and interview prep. Fully responsive with a sleek dark-mode glassmorphism design and client-side processing.

## 🚀 Features

- **ATS Simulator**: Simulate how Applicant Tracking Systems parse your resume
- **Keyword Gap Analysis**: Identify missing hard and soft skills
- **Instant Scoring**: Get a match score from 0-100%
- **AI Cover Letter Generation**: Powered by Gemini API
- **Interview Preparation**: Get personalized interview questions and tips
- **Fully Responsive**: Modern design that works on all devices

## 🔧 Technology Stack

- **Frontend**: HTML5, Tailwind CSS, JavaScript
- **AI Engine**: Google Gemini 2.5 Flash API
- **Icons**: Font Awesome
- **Fonts**: Plus Jakarta Sans (Google Fonts)

## 📝 Gemini API Integration

This application uses **Google Gemini API** (`gemini-2.5-flash-preview-09-2025`) for:

1. **Resume Analysis**: Comparing resumes against job descriptions
2. **Cover Letter Generation**: Creating tailored cover letters
3. **Interview Prep**: Generating behavioral interview questions and tips

### API Usage Locations:
- `script.js` - `callGemini()` function (line 92)
- API Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent`
- Loading message: "COMMUNICATING WITH GEMINI AI..." (line 264)

### Setup:
Add your Gemini API key to the `apiKey` variable in `script.js` (line 93).

## 📁 Project Structure

```
AI-Resume-Analyzer/
├── index.html      # Main HTML structure
├── styles.css      # Custom CSS styles
├── script.js       # JavaScript functionality & Gemini API integration
└── README.md       # Documentation
```

## 🎨 Design Features

- Dark mode glassmorphism design
- Smooth animations and transitions
- Responsive grid layouts
- Custom scrollbars
- Modern UI components

## 📄 License

Designed & Developed by Mohan Prasath - 2025 Edition
