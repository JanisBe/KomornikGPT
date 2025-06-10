export interface ExpenseCategory {
  mainCategory: string;
  subCategory: string;
  icon: string;
  parentCategory: string | null;
}

export interface CategoryGroup {
  mainCategory: string;
  subcategories: ExpenseCategory[];
}

// Main category constants
export const HOME = 'Dom';
export const ENTERTAINMENT = 'Rozrywka';
export const LIFE = 'Życie';
export const FOOD_DRINKS = 'Jedzenie i napoje';
export const NO_CATEGORY = 'Bez Kategorii';

// All expense categories
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  // No Category
  {mainCategory: NO_CATEGORY, subCategory: 'Ogólne', icon: 'category', parentCategory: null},

  // Home
  {mainCategory: HOME, subCategory: 'AGD', icon: 'kitchen', parentCategory: HOME},
  {mainCategory: HOME, subCategory: 'Czynsz', icon: 'home', parentCategory: HOME},
  {mainCategory: HOME, subCategory: 'Elektronika', icon: 'devices', parentCategory: HOME},
  {mainCategory: HOME, subCategory: 'Inne', icon: 'more_horiz', parentCategory: HOME},
  {mainCategory: HOME, subCategory: 'Kredyt', icon: 'account_balance', parentCategory: HOME},
  {mainCategory: HOME, subCategory: 'Meble', icon: 'chair', parentCategory: HOME},
  {mainCategory: HOME, subCategory: 'Usługi', icon: 'handyman', parentCategory: HOME},
  {mainCategory: HOME, subCategory: 'Utrzymanie', icon: 'build', parentCategory: HOME},
  {mainCategory: HOME, subCategory: 'Zwierzęta', icon: 'pets', parentCategory: HOME},

  // Entertainment
  {mainCategory: ENTERTAINMENT, subCategory: 'Filmy', icon: 'movie', parentCategory: ENTERTAINMENT},
  {mainCategory: ENTERTAINMENT, subCategory: 'Gry', icon: 'sports_esports', parentCategory: ENTERTAINMENT},
  {mainCategory: ENTERTAINMENT, subCategory: 'Inne', icon: 'more_horiz', parentCategory: ENTERTAINMENT},
  {mainCategory: ENTERTAINMENT, subCategory: 'Muzyka', icon: 'music_note', parentCategory: ENTERTAINMENT},
  {mainCategory: ENTERTAINMENT, subCategory: 'Sporty', icon: 'sports_soccer', parentCategory: ENTERTAINMENT},

  // Life
  {mainCategory: LIFE, subCategory: 'Edukacja', icon: 'school', parentCategory: LIFE},
  {mainCategory: LIFE, subCategory: 'Inne', icon: 'more_horiz', parentCategory: LIFE},
  {mainCategory: LIFE, subCategory: 'Opieka nad dziećmi', icon: 'child_care', parentCategory: LIFE},
  {mainCategory: LIFE, subCategory: 'Podatki', icon: 'receipt_long', parentCategory: LIFE},
  {mainCategory: LIFE, subCategory: 'Prezenty', icon: 'card_giftcard', parentCategory: LIFE},
  {mainCategory: LIFE, subCategory: 'Ubezpieczenie', icon: 'health_and_safety', parentCategory: LIFE},
  {mainCategory: LIFE, subCategory: 'Ubrania', icon: 'checkroom', parentCategory: LIFE},
  {mainCategory: LIFE, subCategory: 'Wydatki medyczne', icon: 'medical_services', parentCategory: LIFE},

  // Food and Drinks
  {mainCategory: FOOD_DRINKS, subCategory: 'Alkohol', icon: 'liquor', parentCategory: FOOD_DRINKS},
  {mainCategory: FOOD_DRINKS, subCategory: 'Artykuły spożywcze', icon: 'shopping_basket', parentCategory: FOOD_DRINKS},
  {mainCategory: FOOD_DRINKS, subCategory: 'Inne', icon: 'more_horiz', parentCategory: FOOD_DRINKS},
  {mainCategory: FOOD_DRINKS, subCategory: 'Jedzenie na mieście', icon: 'restaurant', parentCategory: FOOD_DRINKS}
];

// Get all main categories
export function getMainCategories(): string[] {
  return [HOME, ENTERTAINMENT, LIFE, FOOD_DRINKS, NO_CATEGORY];
}

// Get all subcategories for a specific main category
export function getSubcategoriesFor(mainCategory: string): ExpenseCategory[] {
  return EXPENSE_CATEGORIES.filter(category => category.mainCategory === mainCategory);
}

// Get all categories grouped by main category
export function getAllCategoriesGrouped(): CategoryGroup[] {
  const mainCategories = getMainCategories();
  return mainCategories.map(mainCategory => ({
    mainCategory,
    subcategories: getSubcategoriesFor(mainCategory)
  }));
}

// Find a category by main and subcategory names
export function findCategory(mainCategory: string, subCategory: string): ExpenseCategory | undefined {
  return EXPENSE_CATEGORIES.find(
    category => category.mainCategory === mainCategory && category.subCategory === subCategory
  );
}

// Convert a frontend ExpenseCategory to a backend enum string value
export function categoryToEnumValue(category: ExpenseCategory): string {
  // Direct mapping from frontend category to exact backend enum name
  const categoryMap: Record<string, string> = {
    // No Category
    'Bez Kategorii-Ogólne': 'NO_CATEGORY_GENERAL',

    // Home categories
    'Dom-AGD': 'HOME_APPLIANCES',
    'Dom-Czynsz': 'HOME_RENT',
    'Dom-Elektronika': 'HOME_ELECTRONICS',
    'Dom-Inne': 'HOME_OTHER',
    'Dom-Kredyt': 'HOME_MORTGAGE',
    'Dom-Meble': 'HOME_FURNITURE',
    'Dom-Usługi': 'HOME_SERVICES',
    'Dom-Utrzymanie': 'HOME_MAINTENANCE',
    'Dom-Zwierzęta': 'HOME_PETS',

    // Entertainment categories
    'Rozrywka-Filmy': 'ENTERTAINMENT_MOVIES',
    'Rozrywka-Gry': 'ENTERTAINMENT_GAMES',
    'Rozrywka-Inne': 'ENTERTAINMENT_OTHER',
    'Rozrywka-Muzyka': 'ENTERTAINMENT_MUSIC',
    'Rozrywka-Sporty': 'ENTERTAINMENT_SPORTS',

    // Life categories
    'Życie-Edukacja': 'LIFE_EDUCATION',
    'Życie-Inne': 'LIFE_OTHER',
    'Życie-Opieka nad dziećmi': 'LIFE_CHILDCARE',
    'Życie-Podatki': 'LIFE_TAXES',
    'Życie-Prezenty': 'LIFE_GIFTS',
    'Życie-Ubezpieczenie': 'LIFE_INSURANCE',
    'Życie-Ubrania': 'LIFE_CLOTHING',
    'Życie-Wydatki medyczne': 'LIFE_MEDICAL',

    // Food and Drinks categories
    'Jedzenie i napoje-Alkohol': 'FOOD_ALCOHOL',
    'Jedzenie i napoje-Artykuły spożywcze': 'FOOD_GROCERIES',
    'Jedzenie i napoje-Inne': 'FOOD_OTHER',
    'Jedzenie i napoje-Jedzenie na mieście': 'FOOD_RESTAURANT'
  };

  const key = `${category.mainCategory}-${category.subCategory}`;
  const enumValue = categoryMap[key];

  if (!enumValue) {
    console.error(`No matching enum value found for category: ${key}`);
    return 'NO_CATEGORY_GENERAL'; // Default fallback
  }

  return enumValue;
}

// Convert backend enum value to frontend category object
export function enumValueToCategory(enumValue: string): ExpenseCategory {
  // Reverse mapping from backend enum to frontend category
  const reverseMap: Record<string, ExpenseCategory> = {};

  // Build the reverse mapping
  EXPENSE_CATEGORIES.forEach(category => {
    const enumVal = categoryToEnumValue(category);
    reverseMap[enumVal] = category;
  });

  // Return the matching category or default
  if (enumValue && reverseMap[enumValue]) {
    return reverseMap[enumValue];
  }

  console.warn(`No matching category found for enum value: ${enumValue}`);
  return DEFAULT_CATEGORY;
}

// Default category
export const DEFAULT_CATEGORY: ExpenseCategory = EXPENSE_CATEGORIES[0];
