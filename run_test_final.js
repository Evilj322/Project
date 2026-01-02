import { generateChefGPTSuggestions } from './src/data/aiChefEngine.js';

(async () => {
    console.log("--- TEST: Rice + Chicken (Offline Mode) ---");
    // Pass null/empty string as second arg for apiKey to force offline
    const result1 = await generateChefGPTSuggestions('рис, курица, специи', '');
    console.log(result1.map(r => r.title));

    console.log("\n--- TEST: Pasta + Mince + Cheese (Offline Mode) ---");
    const result2 = await generateChefGPTSuggestions('макароны, фарш, сыр, томат', '');
    console.log(result2.map(r => r.title));
})();
