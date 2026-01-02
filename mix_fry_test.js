import { generateChefGPTSuggestions } from './src/data/aiChefEngine.js';

console.log("--- TEST: Multiple Suggestions ---");
// Ingredients that should trigger "Roast Meat" (strict) + others (versatile)
const result = generateChefGPTSuggestions('картошка, мясо, лук');

console.log(`Total suggestions: ${result.length}`);
result.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title} (${r.category}) [Score logic hidden]`);
});
