# 🍎 Calorie Tracker

A smart calorie tracking app with AI-powered voice and text input. Supports Bulgarian and English.

![Calorie Tracker](https://img.shields.io/badge/Made%20with-JavaScript-yellow)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- 🎤 **Voice Input** - Speak what you ate in Bulgarian or English
- ✏️ **Text Input** - Type food descriptions for better accuracy  
- 🤖 **AI-Powered** - GPT-4o-mini parses food and estimates nutrition
- 📊 **Macro Tracking** - Track Protein, Carbs, and Fat
- 🎯 **Smart Goals** - Set macro goals, calories auto-calculate
- 🌙 **Dark Mode** - Automatic based on system preference
- 📱 **Mobile-Friendly** - Optimized for phone use

## 🚀 Quick Start

### Option 1: Use Locally
1. Download or clone this repository
2. Open `index.html` in your browser
3. Add your [OpenAI API key](https://platform.openai.com/api-keys) in Settings
4. Start tracking!

### Option 2: Host on GitHub Pages (Free)
1. Fork this repository
2. Go to **Settings** → **Pages**
3. Source: Deploy from branch → **main** → **/root**
4. Click Save
5. Your app will be live at: `https://yourusername.github.io/calorie-tracker/`

## 📱 Using on Your Phone

After hosting on GitHub Pages:
1. Open the URL on your phone
2. Add to Home Screen (for app-like experience):
   - **iOS**: Tap Share → "Add to Home Screen"
   - **Android**: Tap Menu → "Add to Home Screen"

## 💰 Cost

This app uses **GPT-4o-mini**, which is very affordable:
- ~$0.00017 per food entry
- ~$0.025 per month with daily use (4-5 meals/day)
- You need your own [OpenAI API key](https://platform.openai.com/api-keys)

## 🇧🇬 Bulgarian Support

- Voice recognition supports Bulgarian (`bg-BG`)
- AI understands Bulgarian food names:
  - пилешко филе, сирене, кисело мляко
  - баница, кебапче, шопска салата
- Switch language with the 🇧🇬/🇬🇧 toggle

## 🔧 Configuration

### Setting Macro Goals
1. Click the ⚙️ Settings button
2. Enter your daily goals:
   - Protein (grams)
   - Carbs (grams)
   - Fat (grams)
3. Calories are auto-calculated: P×4 + C×4 + F×9
4. Save Settings

### API Key
Your OpenAI API key is stored locally in your browser. It's never sent anywhere except directly to OpenAI's servers.

## 📁 Project Structure

```
calorie-tracker/
├── index.html          # Main app
├── css/styles.css      # Styles
├── js/app.js           # All JavaScript
├── docs/               # Documentation
│   ├── projectOverview.md
│   ├── architecture.md
│   └── activeContext.md
└── README.md           # This file
```

## 🔒 Privacy

- **No backend** - Everything runs in your browser
- **No tracking** - No analytics or telemetry
- **Local storage** - All data saved in browser localStorage
- **API key** - Only you have access to your key

## 🛠️ Development

No build step required! Just edit the files and refresh.

```bash
# Clone the repo
git clone https://github.com/yourusername/calorie-tracker.git

# Open in browser
open calorie-tracker/index.html
```

## 📄 License

MIT License - feel free to use and modify!

---

Made with ❤️ for healthy eating