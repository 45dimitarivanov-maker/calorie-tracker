# Calorie Tracker - Project Overview

## Vision
A mobile-friendly web application for tracking daily food intake with AI-powered voice/text recognition and macro nutrient tracking.

## Problem Statement
Traditional calorie tracking apps require manual searching and selection of food items, which is time-consuming. This app uses AI to automatically parse natural language descriptions of meals (in English or Bulgarian) and estimate calories and macros.

## Key Features

### 1. AI-Powered Food Analysis
- **Voice Input**: Speak what you ate (supports Bulgarian and English)
- **Text Input**: Type food descriptions for better accuracy
- **OpenAI GPT-4o-mini**: Parses food descriptions and estimates nutrition

### 2. Macro Tracking
- **Protein** (displayed in red)
- **Carbohydrates** (displayed in orange)
- **Fat** (displayed in blue)
- Automatic calorie calculation: P×4 + C×4 + F×9

### 3. User Experience
- **Confirmation before AI call**: Review transcribed text before sending
- **Edit suggestions**: Modify AI suggestions before adding
- **Language toggle**: Switch between Bulgarian 🇧🇬 and English 🇬🇧
- **Dark mode support**: Automatic based on system preference

### 4. Data Storage
- All data stored locally in browser (localStorage)
- No backend required
- Privacy-focused: API key stored locally

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JavaScript (no frameworks)
- **AI**: OpenAI GPT-4o-mini API
- **Voice**: Web Speech API (browser native)
- **Storage**: localStorage
- **Hosting**: GitHub Pages (static hosting)

## File Structure
```
calorie-tracker/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styles with CSS variables
├── js/
│   └── app.js          # All JavaScript (bundled)
├── docs/
│   ├── projectOverview.md    # This file
│   ├── architecture.md       # Technical details
│   └── activeContext.md      # Current development state
└── README.md           # User-facing documentation
```

## Target Users
- Health-conscious individuals
- Bulgarian speakers who want voice input in their native language
- People who prefer quick voice/text input over manual food search

## API Cost
- Uses GPT-4o-mini (~$0.025/month with daily use)
- User provides their own OpenAI API key