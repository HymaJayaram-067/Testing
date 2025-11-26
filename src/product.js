/**
 * Product Management Module
 * Handles product creation, validation, and management
 */

class Product {
    constructor(id, name, price, category, stock = 0, description = '') {
        this.id = id;
        this.name = name;
        this.price = price;
        this.category = category;
        this.stock = stock;
        this.description = description;
        this.ratings = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.isActive = true;
        this.discount = 0;
        this.tags = [];
        this.attributes = {};
    }

    /**
     * Validates if the product has valid data
     * @returns {Object} Validation result with isValid flag and errors array
     */
    validate() {
        const errors = [];

        if (!this.id || typeof this.id !== 'string' || this.id.trim() === '') {
            errors.push('Product ID is required and must be a non-empty string');
        }

        if (!this.name || typeof this.name !== 'string' || this.name.trim() === '') {
            errors.push('Product name is required and must be a non-empty string');
        } else if (this.name.length < 2 || this.name.length > 200) {
            errors.push('Product name must be between 2 and 200 characters');
        }

        if (typeof this.price !== 'number' || this.price < 0) {
            errors.push('Product price must be a non-negative number');
        } else if (this.price > 1000000) {
            errors.push('Product price cannot exceed 1,000,000');
        }

        if (!this.category || typeof this.category !== 'string') {
            errors.push('Product category is required');
        }

        if (typeof this.stock !== 'number' || this.stock < 0 || !Number.isInteger(this.stock)) {
            errors.push('Product stock must be a non-negative integer');
        }

        if (this.discount < 0 || this.discount > 100) {
            errors.push('Product discount must be between 0 and 100');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Calculates the discounted price
     * @returns {number} Final price after discount
     */
    getDiscountedPrice() {
        if (this.discount <= 0) {
            return this.price;
        }
        if (this.discount >= 100) {
            return 0;
        }
        const discountAmount = (this.price * this.discount) / 100;
        return Math.round((this.price - discountAmount) * 100) / 100;
    }

    /**
     * Adds a rating to the product
     * @param {number} rating - Rating value between 1 and 5
     * @param {string} userId - ID of the user providing the rating
     * @param {string} review - Optional review text
     * @returns {boolean} True if rating was added successfully
     */
    addRating(rating, userId, review = '') {
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return false;
        }
        if (!userId || typeof userId !== 'string') {
            return false;
        }

        // Check if user already rated this product
        const existingRating = this.ratings.find(r => r.userId === userId);
        if (existingRating) {
            existingRating.rating = rating;
            existingRating.review = review;
            existingRating.updatedAt = new Date();
        } else {
            this.ratings.push({
                userId: userId,
                rating: rating,
                review: review,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Gets the average rating for the product
     * @returns {number} Average rating or 0 if no ratings
     */
    getAverageRating() {
        if (this.ratings.length === 0) {
            return 0;
        }
        const sum = this.ratings.reduce((acc, r) => acc + r.rating, 0);
        return Math.round((sum / this.ratings.length) * 10) / 10;
    }

    /**
     * Updates stock quantity
     * @param {number} quantity - Quantity to add (positive) or remove (negative)
     * @returns {boolean} True if stock was updated successfully
     */
    updateStock(quantity) {
        if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
            return false;
        }
        const newStock = this.stock + quantity;
        if (newStock < 0) {
            return false;
        }
        this.stock = newStock;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Checks if product is in stock
     * @param {number} requiredQuantity - Quantity needed
     * @returns {boolean} True if enough stock available
     */
    isInStock(requiredQuantity = 1) {
        if (typeof requiredQuantity !== 'number' || requiredQuantity <= 0) {
            return false;
        }
        return this.stock >= requiredQuantity && this.isActive;
    }

    /**
     * Adds tags to the product
     * @param {string[]} tags - Array of tag strings
     * @returns {number} Number of tags added
     */
    addTags(tags) {
        if (!Array.isArray(tags)) {
            return 0;
        }
        let added = 0;
        for (const tag of tags) {
            if (typeof tag === 'string' && tag.trim() !== '' && !this.tags.includes(tag.toLowerCase())) {
                this.tags.push(tag.toLowerCase());
                added++;
            }
        }
        if (added > 0) {
            this.updatedAt = new Date();
        }
        return added;
    }

    /**
     * Removes a tag from the product
     * @param {string} tag - Tag to remove
     * @returns {boolean} True if tag was removed
     */
    removeTag(tag) {
        if (typeof tag !== 'string') {
            return false;
        }
        const index = this.tags.indexOf(tag.toLowerCase());
        if (index > -1) {
            this.tags.splice(index, 1);
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    /**
     * Sets product attributes
     * @param {string} key - Attribute key
     * @param {*} value - Attribute value
     * @returns {boolean} True if attribute was set
     */
    setAttribute(key, value) {
        if (typeof key !== 'string' || key.trim() === '') {
            return false;
        }
        this.attributes[key] = value;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Gets a product attribute
     * @param {string} key - Attribute key
     * @returns {*} Attribute value or undefined
     */
    getAttribute(key) {
        if (typeof key !== 'string') {
            return undefined;
        }
        return this.attributes[key];
    }

    /**
     * Deactivates the product
     */
    deactivate() {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    /**
     * Activates the product
     */
    activate() {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    /**
     * Sets discount percentage
     * @param {number} discountPercent - Discount percentage (0-100)
     * @returns {boolean} True if discount was set
     */
    setDiscount(discountPercent) {
        if (typeof discountPercent !== 'number' || discountPercent < 0 || discountPercent > 100) {
            return false;
        }
        this.discount = discountPercent;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Converts product to JSON representation
     * @returns {Object} Product data as plain object
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            price: this.price,
            discountedPrice: this.getDiscountedPrice(),
            category: this.category,
            stock: this.stock,
            description: this.description,
            ratings: this.ratings,
            averageRating: this.getAverageRating(),
            isActive: this.isActive,
            discount: this.discount,
            tags: this.tags,
            attributes: this.attributes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * Product Catalog - manages a collection of products
 */
class ProductCatalog {
    constructor() {
        this.products = new Map();
        this.categories = new Set();
    }

    /**
     * Adds a product to the catalog
     * @param {Product} product - Product to add
     * @returns {Object} Result with success flag and message
     */
    addProduct(product) {
        if (!(product instanceof Product)) {
            return { success: false, message: 'Invalid product object' };
        }

        const validation = product.validate();
        if (!validation.isValid) {
            return { success: false, message: validation.errors.join(', ') };
        }

        if (this.products.has(product.id)) {
            return { success: false, message: 'Product with this ID already exists' };
        }

        this.products.set(product.id, product);
        this.categories.add(product.category);
        return { success: true, message: 'Product added successfully' };
    }

    /**
     * Gets a product by ID
     * @param {string} productId - Product ID
     * @returns {Product|null} Product or null if not found
     */
    getProduct(productId) {
        if (typeof productId !== 'string') {
            return null;
        }
        return this.products.get(productId) || null;
    }

    /**
     * Updates a product
     * @param {string} productId - Product ID
     * @param {Object} updates - Object with fields to update
     * @returns {Object} Result with success flag and message
     */
    updateProduct(productId, updates) {
        const product = this.getProduct(productId);
        if (!product) {
            return { success: false, message: 'Product not found' };
        }

        if (typeof updates !== 'object' || updates === null) {
            return { success: false, message: 'Invalid updates object' };
        }

        const allowedFields = ['name', 'price', 'category', 'stock', 'description', 'discount'];
        for (const field of allowedFields) {
            if (updates.hasOwnProperty(field)) {
                product[field] = updates[field];
            }
        }

        const validation = product.validate();
        if (!validation.isValid) {
            return { success: false, message: validation.errors.join(', ') };
        }

        product.updatedAt = new Date();
        if (updates.category) {
            this.categories.add(updates.category);
        }

        return { success: true, message: 'Product updated successfully' };
    }

    /**
     * Removes a product from the catalog
     * @param {string} productId - Product ID
     * @returns {boolean} True if product was removed
     */
    removeProduct(productId) {
        return this.products.delete(productId);
    }

    /**
     * Gets all products in a category
     * @param {string} category - Category name
     * @param {boolean} activeOnly - Only return active products
     * @returns {Product[]} Array of products
     */
    getProductsByCategory(category, activeOnly = true) {
        if (typeof category !== 'string') {
            return [];
        }
        const results = [];
        for (const product of this.products.values()) {
            if (product.category === category) {
                if (!activeOnly || product.isActive) {
                    results.push(product);
                }
            }
        }
        return results;
    }

    /**
     * Searches products by name or description
     * @param {string} query - Search query
     * @param {boolean} activeOnly - Only return active products
     * @returns {Product[]} Array of matching products
     */
    searchProducts(query, activeOnly = true) {
        if (typeof query !== 'string' || query.trim() === '') {
            return [];
        }
        const lowerQuery = query.toLowerCase();
        const results = [];
        for (const product of this.products.values()) {
            if (activeOnly && !product.isActive) {
                continue;
            }
            if (product.name.toLowerCase().includes(lowerQuery) ||
                product.description.toLowerCase().includes(lowerQuery) ||
                product.tags.some(tag => tag.includes(lowerQuery))) {
                results.push(product);
            }
        }
        return results;
    }

    /**
     * Gets products with low stock
     * @param {number} threshold - Stock threshold
     * @returns {Product[]} Array of products below threshold
     */
    getLowStockProducts(threshold = 10) {
        if (typeof threshold !== 'number' || threshold < 0) {
            threshold = 10;
        }
        const results = [];
        for (const product of this.products.values()) {
            if (product.isActive && product.stock < threshold) {
                results.push(product);
            }
        }
        return results;
    }

    /**
     * Gets products sorted by price
     * @param {string} order - 'asc' or 'desc'
     * @param {boolean} activeOnly - Only return active products
     * @returns {Product[]} Sorted array of products
     */
    getProductsSortedByPrice(order = 'asc', activeOnly = true) {
        const products = Array.from(this.products.values())
            .filter(p => !activeOnly || p.isActive);

        if (order === 'desc') {
            return products.sort((a, b) => b.getDiscountedPrice() - a.getDiscountedPrice());
        }
        return products.sort((a, b) => a.getDiscountedPrice() - b.getDiscountedPrice());
    }

    /**
     * Gets products sorted by rating
     * @param {boolean} activeOnly - Only return active products
     * @returns {Product[]} Sorted array of products
     */
    getProductsSortedByRating(activeOnly = true) {
        return Array.from(this.products.values())
            .filter(p => !activeOnly || p.isActive)
            .sort((a, b) => b.getAverageRating() - a.getAverageRating());
    }

    /**
     * Gets all categories
     * @returns {string[]} Array of category names
     */
    getAllCategories() {
        return Array.from(this.categories);
    }

    /**
     * Gets total product count
     * @param {boolean} activeOnly - Only count active products
     * @returns {number} Product count
     */
    getProductCount(activeOnly = false) {
        if (!activeOnly) {
            return this.products.size;
        }
        let count = 0;
        for (const product of this.products.values()) {
            if (product.isActive) {
                count++;
            }
        }
        return count;
    }

    /**
     * Applies a bulk discount to products in a category
     * @param {string} category - Category name
     * @param {number} discountPercent - Discount percentage
     * @returns {number} Number of products updated
     */
    applyBulkDiscount(category, discountPercent) {
        if (typeof category !== 'string' || typeof discountPercent !== 'number') {
            return 0;
        }
        if (discountPercent < 0 || discountPercent > 100) {
            return 0;
        }
        let updated = 0;
        for (const product of this.products.values()) {
            if (product.category === category && product.isActive) {
                product.setDiscount(discountPercent);
                updated++;
            }
        }
        return updated;
    }

    /**
     * Gets products with tags
     * @param {string[]} tags - Array of tags to search for
     * @param {boolean} matchAll - Require all tags to match
     * @returns {Product[]} Array of matching products
     */
    getProductsByTags(tags, matchAll = false) {
        if (!Array.isArray(tags) || tags.length === 0) {
            return [];
        }
        const lowerTags = tags.map(t => t.toLowerCase());
        const results = [];
        for (const product of this.products.values()) {
            if (!product.isActive) {
                continue;
            }
            if (matchAll) {
                if (lowerTags.every(tag => product.tags.includes(tag))) {
                    results.push(product);
                }
            } else {
                if (lowerTags.some(tag => product.tags.includes(tag))) {
                    results.push(product);
                }
            }
        }
        return results;
    }
}

module.exports = { Product, ProductCatalog };
