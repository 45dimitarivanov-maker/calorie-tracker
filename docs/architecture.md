# Architecture

## Technical Architecture

### Single-Page Application (SPA)
The app is built as a single HTML file with bundled JavaScript to ensure:
- Works directly from `file://` protocol (no server required for development)
- Can be hosted on any static file server
- No build step required

### Module Structure (Bundled in app.js)
```
app.js
├── Storage Module     # localStorage operations
├── UI Module          # DOM manipulation and rendering
├── Voice Module       # Web Speech API wrapper
├── AI Module          # OpenAI API integration
└── Main Application   # Event handlers and state management
```

## Data Flow

### Voice Input Flow
```
User speaks → Web Speech API → Transcription displayed
    → User confirms → OpenAI API → Food items parsed
    → User reviews suggestions → Confirms/Edits → Saved to localStorage
```

### Text Input Flow
```
User types → Submit → OpenAI API → Food items parsed
    → User reviews suggestions → Confirms/Edits → Saved to localStorage
```

## Storage Schema

### localStorage Keys
- `calorieTracker_foodEntries` - All food entries organized by date
- `calorieTracker_settings` - User settings (macro goals)
- `calorieTracker_apiKey` - OpenAI API key

### Food Entry Structure
```javascript
{
    id: "unique-id",
    name: "Chicken Breast",
    quantity: 150,
    unit: "g",
    calories: 180,
    protein: 33,
    carbs: 0,
    fat: 4,
    timestamp: "2024-01-01T12:00:00.000Z"
}
```

### Settings Structure
```javascript
{
    dailyGoal: 2000,      // Auto-calculated from macros
    proteinGoal: 150,     // grams
    carbsGoal: 250,       // grams
    fatGoal: 65           // grams
}
```

## API Integration

### OpenAI API
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Model**: `gpt-4o-mini` (cost-effective, multilingual)
- **Temperature**: 0.3 (more deterministic responses)

### System Prompt
The AI is instructed with:
- Comprehensive nutrition reference data (raw vs cooked)
- Bulgarian food names (сирене, кисело мляко, etc.)
- Rules for preserving exact user quantities
- JSON output format specification

## Browser APIs Used

### Web Speech API
- `SpeechRecognition` / `webkitSpeechRecognition`
- Supports Bulgarian (`bg-BG`) and English (`en-US`)
- Returns interim results for real-time feedback

### localStorage API
- Persistent storage across sessions
- ~5MB limit per origin
- Data survives browser restarts

## CSS Architecture

### CSS Variables
All colors, spacing, and typography defined as CSS custom properties in `:root`:
- Easy theming
- Dark mode via `@media (prefers-color-scheme: dark)`

### Responsive Design
- Mobile-first approach
- Max-width container (480px)
- Touch-friendly button sizes

## Security Considerations

1. **API Key Storage**: Stored in localStorage (client-side only)
2. **No Backend**: All processing happens client-side or via OpenAI
3. **HTTPS Required**: Voice API requires secure context when hosted
4. **CORS**: OpenAI API allows cross-origin requests with valid API key