/**
 * Lightweight built-in food database for instant autocomplete.
 * Values are per 100g unless noted. Extended lookup uses USDA FoodData API.
 *
 * Format: { name, protein (g), calories (kcal), unit, servingSize (g) }
 */
export const FOOD_DATABASE = [
  // Proteins
  { name: 'Chicken Breast', protein: 31, calories: 165, unit: 'g', servingSize: 100 },
  { name: 'Chicken Thigh', protein: 26, calories: 209, unit: 'g', servingSize: 100 },
  { name: 'Salmon', protein: 25, calories: 208, unit: 'g', servingSize: 100 },
  { name: 'Tuna (canned)', protein: 26, calories: 116, unit: 'g', servingSize: 100 },
  { name: 'Beef Mince (lean)', protein: 26, calories: 215, unit: 'g', servingSize: 100 },
  { name: 'Beef Steak', protein: 27, calories: 242, unit: 'g', servingSize: 100 },
  { name: 'Pork Loin', protein: 25, calories: 180, unit: 'g', servingSize: 100 },
  { name: 'Turkey Breast', protein: 29, calories: 135, unit: 'g', servingSize: 100 },
  { name: 'Shrimp', protein: 24, calories: 99, unit: 'g', servingSize: 100 },
  { name: 'Cod', protein: 18, calories: 82, unit: 'g', servingSize: 100 },
  { name: 'Egg', protein: 6, calories: 78, unit: 'piece', servingSize: 50 },
  { name: 'Egg White', protein: 3.6, calories: 17, unit: 'piece', servingSize: 33 },
  // Dairy
  { name: 'Greek Yogurt', protein: 10, calories: 59, unit: 'g', servingSize: 100 },
  { name: 'Cottage Cheese', protein: 11, calories: 98, unit: 'g', servingSize: 100 },
  { name: 'Milk (whole)', protein: 3.4, calories: 61, unit: 'ml', servingSize: 100 },
  { name: 'Milk (skimmed)', protein: 3.4, calories: 35, unit: 'ml', servingSize: 100 },
  { name: 'Cheddar Cheese', protein: 25, calories: 403, unit: 'g', servingSize: 100 },
  { name: 'Whey Protein Powder', protein: 80, calories: 400, unit: 'g', servingSize: 30 },
  // Carbs / Grains
  { name: 'Oats', protein: 17, calories: 389, unit: 'g', servingSize: 100 },
  { name: 'White Rice (cooked)', protein: 2.7, calories: 130, unit: 'g', servingSize: 100 },
  { name: 'Brown Rice (cooked)', protein: 2.6, calories: 112, unit: 'g', servingSize: 100 },
  { name: 'Pasta (cooked)', protein: 5, calories: 158, unit: 'g', servingSize: 100 },
  { name: 'White Bread', protein: 9, calories: 265, unit: 'g', servingSize: 100 },
  { name: 'Wholegrain Bread', protein: 13, calories: 247, unit: 'g', servingSize: 100 },
  { name: 'Sweet Potato (cooked)', protein: 1.6, calories: 86, unit: 'g', servingSize: 100 },
  { name: 'Potato (boiled)', protein: 2, calories: 87, unit: 'g', servingSize: 100 },
  { name: 'Quinoa (cooked)', protein: 4.4, calories: 120, unit: 'g', servingSize: 100 },
  // Vegetables
  { name: 'Broccoli', protein: 2.8, calories: 34, unit: 'g', servingSize: 100 },
  { name: 'Spinach', protein: 2.9, calories: 23, unit: 'g', servingSize: 100 },
  { name: 'Kale', protein: 4.3, calories: 49, unit: 'g', servingSize: 100 },
  { name: 'Mixed Salad', protein: 1.5, calories: 20, unit: 'g', servingSize: 100 },
  { name: 'Cucumber', protein: 0.7, calories: 15, unit: 'g', servingSize: 100 },
  { name: 'Tomato', protein: 0.9, calories: 18, unit: 'g', servingSize: 100 },
  { name: 'Avocado', protein: 2, calories: 160, unit: 'g', servingSize: 100 },
  // Fruits
  { name: 'Banana', protein: 1.1, calories: 89, unit: 'piece', servingSize: 120 },
  { name: 'Apple', protein: 0.3, calories: 52, unit: 'piece', servingSize: 182 },
  { name: 'Blueberries', protein: 0.7, calories: 57, unit: 'g', servingSize: 100 },
  { name: 'Strawberries', protein: 0.8, calories: 32, unit: 'g', servingSize: 100 },
  { name: 'Orange', protein: 0.9, calories: 47, unit: 'piece', servingSize: 130 },
  // Fats / Nuts
  { name: 'Almonds', protein: 21, calories: 579, unit: 'g', servingSize: 100 },
  { name: 'Peanut Butter', protein: 25, calories: 588, unit: 'g', servingSize: 100 },
  { name: 'Olive Oil', protein: 0, calories: 884, unit: 'ml', servingSize: 100 },
  { name: 'Butter', protein: 0.9, calories: 717, unit: 'g', servingSize: 100 },
  // Snacks / Other
  { name: 'Protein Bar', protein: 20, calories: 200, unit: 'piece', servingSize: 60 },
  { name: 'Rice Cakes', protein: 7, calories: 387, unit: 'g', servingSize: 100 },
]

/**
 * Search food database by name (fuzzy, case-insensitive)
 */
export function searchFoods(query, limit = 8) {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  return FOOD_DATABASE
    .filter(f => f.name.toLowerCase().includes(q))
    .slice(0, limit)
}

/**
 * Calculate macros for a given food item + quantity in grams
 */
export function calculateMacros(food, quantityG) {
  const ratio = quantityG / food.servingSize
  return {
    protein: Math.round(food.protein * ratio * 10) / 10,
    calories: Math.round(food.calories * ratio)
  }
}

/**
 * USDA FoodData Central API lookup (fallback when not in local DB)
 * Returns top match with nutritional data
 */
export async function lookupFoodUSDA(query) {
  try {
    const params = new URLSearchParams({
      query,
      dataType: 'Foundation,SR Legacy',
      pageSize: 5,
      api_key: 'DEMO_KEY'  // Replace with actual key in production
    })
    const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    const food = data.foods?.[0]
    if (!food) return null

    const protein = food.foodNutrients?.find(n => n.nutrientName === 'Protein')?.value ?? 0
    const calories = food.foodNutrients?.find(n => n.nutrientName === 'Energy')?.value ?? 0

    return {
      name: food.description,
      protein,
      calories,
      unit: 'g',
      servingSize: 100,
      source: 'USDA',
      approximate: true
    }
  } catch {
    return null
  }
}
