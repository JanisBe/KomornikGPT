package com.janis.komornikgpt.expense;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for managing expense categories
 */
@Service
public class ExpenseCategoryService {

    /**
     * Get all main categories
     *
     * @return List of main category names
     */
    public List<String> getAllMainCategories() {
        return ExpenseCategory.getMainCategories();
    }

    /**
     * Get all subcategories for a specific main category
     *
     * @param mainCategory The main category name
     * @return List of subcategories
     */
    public List<ExpenseCategory> getSubcategoriesForMainCategory(String mainCategory) {
        return ExpenseCategory.getSubcategoriesFor(mainCategory);
    }

    /**
     * Get a map of all categories grouped by main category
     *
     * @return Map with main category as key and list of subcategories as value
     */
    public Map<String, List<ExpenseCategory>> getAllCategoriesGrouped() {
        return Arrays.stream(ExpenseCategory.values())
                .collect(Collectors.groupingBy(ExpenseCategory::getMainCategory));
    }

    /**
     * Find a category by its main and subcategory names
     *
     * @param mainCategory The main category name
     * @param subCategory  The subcategory name
     * @return The matching ExpenseCategory or NO_CATEGORY_GENERAL if not found
     */
    public ExpenseCategory findCategory(String mainCategory, String subCategory) {
        return ExpenseCategory.findCategory(mainCategory, subCategory);
    }

    /**
     * Get the icon name for a specific category
     *
     * @param category The ExpenseCategory
     * @return The icon name for Angular Material
     */
    public String getCategoryIcon(ExpenseCategory category) {
        return category.getIcon();
    }
}
