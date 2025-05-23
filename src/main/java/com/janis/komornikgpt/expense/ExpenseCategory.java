package com.janis.komornikgpt.expense;

import lombok.Getter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Getter
public enum ExpenseCategory {
    // Main category constants are defined as enum values with their subcategories

    // Main category: No Category
    NO_CATEGORY_GENERAL("Bez Kategorii", "Ogólne", "category", null),

    // Main category: Home
    HOME_APPLIANCES("Dom", "AGD", "kitchen", "Dom"),
    HOME_RENT("Dom", "Czynsz", "home", "Dom"),
    HOME_ELECTRONICS("Dom", "Elektronika", "devices", "Dom"),
    HOME_OTHER("Dom", "Inne", "more_horiz", "Dom"),
    HOME_MORTGAGE("Dom", "Kredyt", "account_balance", "Dom"),
    HOME_FURNITURE("Dom", "Meble", "chair", "Dom"),
    HOME_SERVICES("Dom", "Usługi", "handyman", "Dom"),
    HOME_MAINTENANCE("Dom", "Utrzymanie", "build", "Dom"),
    HOME_PETS("Dom", "Zwierzęta", "pets", "Dom"),

    // Main category: Entertainment
    ENTERTAINMENT_MOVIES("Rozrywka", "Filmy", "movie", "Rozrywka"),
    ENTERTAINMENT_GAMES("Rozrywka", "Gry", "sports_esports", "Rozrywka"),
    ENTERTAINMENT_OTHER("Rozrywka", "Inne", "more_horiz", "Rozrywka"),
    ENTERTAINMENT_MUSIC("Rozrywka", "Muzyka", "music_note", "Rozrywka"),
    ENTERTAINMENT_SPORTS("Rozrywka", "Sporty", "sports_soccer", "Rozrywka"),

    // Main category: Life
    LIFE_EDUCATION("Życie", "Edukacja", "school", "Życie"),
    LIFE_OTHER("Życie", "Inne", "more_horiz", "Życie"),
    LIFE_CHILDCARE("Życie", "Opieka nad dziećmi", "child_care", "Życie"),
    LIFE_TAXES("Życie", "Podatki", "receipt_long", "Życie"),
    LIFE_GIFTS("Życie", "Prezenty", "card_giftcard", "Życie"),
    LIFE_INSURANCE("Życie", "Ubezpieczenie", "health_and_safety", "Życie"),
    LIFE_CLOTHING("Życie", "Ubrania", "checkroom", "Życie"),
    LIFE_MEDICAL("Życie", "Wydatki medyczne", "medical_services", "Życie"),

    // Main category: Food and Drinks
    FOOD_ALCOHOL("Jedzenie i napoje", "Alkohol", "liquor", "Jedzenie i napoje"),
    FOOD_GROCERIES("Jedzenie i napoje", "Artykuły spożywcze", "shopping_basket", "Jedzenie i napoje"),
    FOOD_OTHER("Jedzenie i napoje", "Inne", "more_horiz", "Jedzenie i napoje"),
    FOOD_RESTAURANT("Jedzenie i napoje", "Jedzenie na mieście", "restaurant", "Jedzenie i napoje");

    // Constants for main categories
    public static final String HOME = "Dom";
    public static final String ENTERTAINMENT = "Rozrywka";
    public static final String LIFE = "Życie";
    public static final String FOOD_DRINKS = "Jedzenie i napoje";
    public static final String NO_CATEGORY = "Bez Kategorii";

    private final String mainCategory;
    private final String subCategory;
    private final String icon;
    private final String parentCategory;

    ExpenseCategory(String mainCategory, String subCategory, String icon, String parentCategory) {
        this.mainCategory = mainCategory;
        this.subCategory = subCategory;
        this.icon = icon;
        this.parentCategory = parentCategory;
    }

    /**
     * Get all main categories
     *
     * @return List of main category names
     */
    public static List<String> getMainCategories() {
        return Arrays.asList(HOME, ENTERTAINMENT, LIFE, FOOD_DRINKS, NO_CATEGORY);
    }

    /**
     * Get all subcategories for a given main category
     *
     * @param mainCategory The main category name
     * @return List of ExpenseCategory objects belonging to the main category
     */
    public static List<ExpenseCategory> getSubcategoriesFor(String mainCategory) {
        return Arrays.stream(ExpenseCategory.values())
                .filter(category -> category.getMainCategory().equals(mainCategory))
                .collect(Collectors.toList());
    }

    /**
     * Find a category by main and subcategory names
     *
     * @param mainCategory The main category name
     * @param subCategory  The subcategory name
     * @return The matching ExpenseCategory or null if not found
     */
    public static ExpenseCategory findCategory(String mainCategory, String subCategory) {
        return Arrays.stream(ExpenseCategory.values())
                .filter(category -> category.getMainCategory().equals(mainCategory)
                        && category.getSubCategory().equals(subCategory))
                .findFirst()
                .orElse(NO_CATEGORY_GENERAL);
    }
}
