import { generateChefGPTSuggestions } from './src/data/aiChefEngine.js';

console.log("--- TEST 1: Macaroni + Minced Meat ---");
const result1 = generateChefGPTSuggestions('макароны, фарш, лук');
console.log("Found:", result1.map(r => r.title));
console.log("Details:", JSON.stringify(result1[0]?.ingredients, null, 2));

console.log("\n--- TEST 2: Rice + Chicken ---");
const result2 = generateChefGPTSuggestions('рис, курица, морковь');
console.log("Found:", result2.map(r => r.title));

console.log("\n--- TEST 3: Lamb + Macaroni (Should NOT be creamy pasta) ---");
const result3 = generateChefGPTSuggestions('баранина, макароны');
console.log("Found:", result3.map(r => r.title));

console.log("\n--- TEST 4: Only Eggs ---");
const result4 = generateChefGPTSuggestions('яйца');
console.log("Found:", result4.map(r => r.title));
