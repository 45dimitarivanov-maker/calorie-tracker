/**
 * AI Module - Handles OpenAI API integration for food parsing
 */

import { getApiKey } from './storage.js';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

/**
 * Parse food description using OpenAI API
 * @param {string} foodDescription - Natural language description of food eaten
 * @returns {Promise<Array>} - Array of parsed food items with calories
 */
export async function parseFoodDescription(foodDescription) {
    const apiKey = getApiKey();
    
    if (!apiKey) {
        throw new Error('OpenAI API key not configured. Please add your API key in Settings.');
    }
    
    const systemPrompt = `You are a nutrition assistant that parses food descriptions and estimates calories.

When given a description of food, extract each food item and estimate its calories.

IMPORTANT RULES:
1. Extract EACH distinct food item separately
2. Estimate realistic calorie values based on typical serving sizes
3. If quantity is mentioned, use it; otherwise assume a typical single serving
4. Be conservative with calorie estimates - better to slightly underestimate than overestimate
5. Return ONLY valid JSON, no other text

Return a JSON array with this exact structure:
[
  {
    "name": "Food name (capitalize properly)",
    "quantity": 1,
    "unit": "serving|piece|cup|tbsp|tsp|g|oz|slice|bowl|plate",
    "calories": estimated_calories_as_number,
    "notes": "optional brief note about the estimate"
  }
]

Examples:
- "two eggs and toast with butter" → extract: 2 eggs, 1 slice toast, 1 tbsp butter
- "a bowl of oatmeal with honey" → extract: 1 bowl oatmeal, 1 tbsp honey
- "chicken salad" → extract as one item if it's a composed dish

Common calorie references:
- Large egg: ~70 kcal
- Slice of bread: ~80 kcal
- Tbsp butter: ~100 kcal
- Cup of rice: ~200 kcal
- Chicken breast (6oz): ~280 kcal
- Apple: ~95 kcal
- Banana: ~105 kcal
- Cup of milk: ~150 kcal`;

    const userPrompt = `Parse this food description and return the JSON array of food items with estimated calories:

"${foodDescription}"`;

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.3,
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your OpenAI API key in Settings.');
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.');
            } else if (response.status === 500) {
                throw new Error('OpenAI service error. Please try again later.');
            } else {
                throw new Error(errorData.error?.message || `API error: ${response.status}`);
            }
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
            throw new Error('No response from AI');
        }
        
        // Parse the JSON response
        const foodItems = parseJsonResponse(content);
        
        // Validate and clean the response
        return validateFoodItems(foodItems);
        
    } catch (error) {
        console.error('AI parsing error:', error);
        throw error;
    }
}

/**
 * Parse JSON from AI response, handling potential formatting issues
 */
function parseJsonResponse(content) {
    // Try to extract JSON from the response
    let jsonStr = content.trim();
    
    // If response contains markdown code blocks, extract the JSON
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
    }
    
    // Try to find array brackets if not starting with [
    if (!jsonStr.startsWith('[')) {
        const arrayStart = jsonStr.indexOf('[');
        const arrayEnd = jsonStr.lastIndexOf(']');
        if (arrayStart !== -1 && arrayEnd !== -1) {
            jsonStr = jsonStr.slice(arrayStart, arrayEnd + 1);
        }
    }
    
    try {
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Failed to parse AI response as JSON:', content);
        throw new Error('Failed to parse AI response. Please try again.');
    }
}

/**
 * Validate and clean food items from AI response
 */
function validateFoodItems(items) {
    if (!Array.isArray(items)) {
        throw new Error('Invalid AI response format');
    }
    
    return items.map((item, index) => {
        // Ensure required fields exist
        if (!item.name || typeof item.name !== 'string') {
            throw new Error(`Invalid food item at position ${index + 1}`);
        }
        
        // Clean and validate calories
        let calories = parseInt(item.calories, 10);
        if (isNaN(calories) || calories < 0) {
            calories = 0;
        }
        if (calories > 5000) {
            calories = 5000; // Cap at reasonable maximum for single item
        }
        
        // Clean quantity
        let quantity = parseFloat(item.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            quantity = 1;
        }
        
        // Validate unit
        const validUnits = ['serving', 'piece', 'cup', 'tbsp', 'tsp', 'g', 'oz', 'slice', 'bowl', 'plate', 'ml', 'l'];
        let unit = item.unit?.toLowerCase() || 'serving';
        if (!validUnits.includes(unit)) {
            unit = 'serving';
        }
        
        return {
            name: item.name.trim(),
            quantity,
            unit,
            calories,
            notes: item.notes?.trim() || ''
        };
    });
}

/**
 * Test if API key is valid by making a minimal request
 */
export async function testApiKey(apiKey) {
    if (!apiKey || !apiKey.startsWith('sk-')) {
        return { valid: false, error: 'Invalid API key format' };
    }
    
    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            })
        });
        
        if (response.ok) {
            return { valid: true };
        } else if (response.status === 401) {
            return { valid: false, error: 'Invalid API key' };
        } else {
            return { valid: false, error: `API error: ${response.status}` };
        }
    } catch (error) {
        return { valid: false, error: 'Failed to connect to OpenAI' };
    }
}

/**
 * Quick calorie estimation for common foods (fallback when no API key)
 */
export function estimateCaloriesOffline(foodName) {
    const commonFoods = {
        // Proteins
        'egg': 70,
        'eggs': 140,
        'chicken': 280,
        'chicken breast': 280,
        'beef': 250,
        'fish': 200,
        'salmon': 280,
        'tuna': 180,
        'shrimp': 100,
        'bacon': 120,
        'sausage': 180,
        
        // Carbs
        'rice': 200,
        'bread': 80,
        'toast': 80,
        'pasta': 220,
        'noodles': 220,
        'oatmeal': 150,
        'cereal': 150,
        'pancake': 150,
        'waffle': 180,
        
        // Dairy
        'milk': 150,
        'cheese': 110,
        'yogurt': 150,
        'butter': 100,
        'cream': 50,
        
        // Fruits
        'apple': 95,
        'banana': 105,
        'orange': 65,
        'grapes': 100,
        'strawberry': 50,
        'strawberries': 50,
        'blueberries': 80,
        
        // Vegetables
        'salad': 50,
        'broccoli': 55,
        'carrot': 25,
        'potato': 160,
        'sweet potato': 110,
        'corn': 130,
        
        // Drinks
        'coffee': 5,
        'tea': 2,
        'juice': 120,
        'soda': 140,
        'beer': 150,
        'wine': 125,
        
        // Snacks
        'cookie': 80,
        'chips': 150,
        'nuts': 170,
        'chocolate': 150,
        'candy': 100,
        
        // Meals
        'sandwich': 350,
        'burger': 500,
        'pizza': 300,
        'soup': 150,
        'salad': 150,
        'steak': 400
    };
    
    const lowerName = foodName.toLowerCase();
    
    // Check for exact match
    if (commonFoods[lowerName]) {
        return commonFoods[lowerName];
    }
    
    // Check for partial match
    for (const [food, calories] of Object.entries(commonFoods)) {
        if (lowerName.includes(food) || food.includes(lowerName)) {
            return calories;
        }
    }
    
    // Default estimate
    return 150;
}