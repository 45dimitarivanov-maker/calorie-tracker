# Active Context

## Current State
The Calorie Tracker app is fully functional and ready for deployment.

## Recent Changes (Latest Session)

### Features Added
1. **Macro Tracking** - Protein, Carbs, Fat displayed in daily summary
2. **Macro-Based Goals** - Set P/C/F goals, calories auto-calculated
3. **Text Input** - Alternative to voice for better accuracy
4. **Voice Confirmation** - Review transcription before AI call
5. **Language Toggle** - Switch between Bulgarian 🇧🇬 and English 🇬🇧
6. **Improved AI Prompt** - Better nutrition data, raw vs cooked

### Bug Fixes
- Fixed loading overlay appearing on page load
- Fixed ES modules not working with file:// protocol (bundled all JS)
- Fixed language toggle visibility (only shows in Voice mode)

## Known Issues
- AI sometimes returns "serving" instead of exact gram quantity
- Voice recognition quality depends on browser and microphone

## Pending Tasks
- [ ] Deploy to GitHub Pages
- [ ] Add PWA support (offline capability, install prompt)
- [ ] Add food history/favorites
- [ ] Add export/import data feature
- [ ] Add date navigation (view previous days)

## Development Notes

### To run locally:
Just open `index.html` in a browser. No server required.

### To deploy to GitHub Pages:
1. Push to GitHub repository
2. Go to Settings → Pages
3. Select source: main branch, root folder
4. Site will be available at: `https://username.github.io/repo-name/`

### Important Files
- `js/app.js` - All application logic (bundled)
- `css/styles.css` - All styles
- `index.html` - Entry point

### Environment
- Requires HTTPS for voice recognition (GitHub Pages provides this)
- Requires user's OpenAI API key
- Stores all data in browser localStorage