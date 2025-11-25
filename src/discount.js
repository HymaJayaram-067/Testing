/**
 * Discount and Promotion Module
 * Handles coupons, promotions, and pricing rules
 */

/**
 * Discount Types
 */
const DiscountType = {
    PERCENTAGE: 'percentage',
    FIXED_AMOUNT: 'fixed_amount',
    FREE_SHIPPING: 'free_shipping',
    BUY_ONE_GET_ONE: 'bogo',
    BUNDLE: 'bundle'
};

/**
 * Coupon Status
 */
const CouponStatus = {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    DEPLETED: 'depleted',
    DISABLED: 'disabled'
};

/**
 * Coupon class - represents a discount coupon
 */
class Coupon {
    constructor(code, discountType, discountValue) {
        this.code = code.toUpperCase();
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.minPurchase = 0;
        this.maxDiscount = null;
        this.startDate = new Date();
        this.expiryDate = null;
        this.usageLimit = null;
        this.usageCount = 0;
        this.perUserLimit = null;
        this.userUsage = new Map();
        this.applicableCategories = [];
        this.applicableProducts = [];
        this.excludedProducts = [];
        this.description = '';
        this.status = CouponStatus.ACTIVE;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Validates coupon data
     * @returns {Object} Validation result
     */
    validate() {
        const errors = [];

        if (!this.code || this.code.trim().length < 3) {
            errors.push('Coupon code must be at least 3 characters');
        }

        if (!Object.values(DiscountType).includes(this.discountType)) {
            errors.push('Invalid discount type');
        }

        if (this.discountType === DiscountType.PERCENTAGE) {
            if (this.discountValue <= 0 || this.discountValue > 100) {
                errors.push('Percentage discount must be between 0 and 100');
            }
        } else if (this.discountType === DiscountType.FIXED_AMOUNT) {
            if (this.discountValue <= 0) {
                errors.push('Fixed discount must be greater than 0');
            }
        }

        if (this.minPurchase < 0) {
            errors.push('Minimum purchase cannot be negative');
        }

        if (this.maxDiscount !== null && this.maxDiscount <= 0) {
            errors.push('Maximum discount must be greater than 0');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Checks if coupon is valid
     * @returns {boolean} True if coupon can be used
     */
    isValid() {
        if (this.status !== CouponStatus.ACTIVE) {
            return false;
        }

        const now = new Date();
        if (this.startDate && now < this.startDate) {
            return false;
        }

        if (this.expiryDate && now > this.expiryDate) {
            return false;
        }

        if (this.usageLimit !== null && this.usageCount >= this.usageLimit) {
            return false;
        }

        return true;
    }

    /**
     * Checks if coupon can be used by a specific user
     * @param {string} userId - User ID
     * @returns {Object} Result with canUse flag and reason
     */
    canBeUsedByUser(userId) {
        if (!this.isValid()) {
            return { canUse: false, reason: 'Coupon is not valid' };
        }

        if (this.perUserLimit !== null) {
            const userUsageCount = this.userUsage.get(userId) || 0;
            if (userUsageCount >= this.perUserLimit) {
                return { canUse: false, reason: 'User has reached usage limit for this coupon' };
            }
        }

        return { canUse: true, reason: '' };
    }

    /**
     * Checks if coupon applies to order
     * @param {Object} orderDetails - Order details with items and subtotal
     * @returns {Object} Result with applies flag and reason
     */
    appliesToOrder(orderDetails) {
        if (!orderDetails || typeof orderDetails !== 'object') {
            return { applies: false, reason: 'Invalid order details' };
        }

        // Check minimum purchase
        if (orderDetails.subtotal < this.minPurchase) {
            return { applies: false, reason: `Minimum purchase of $${this.minPurchase} required` };
        }

        // Check category restrictions
        if (this.applicableCategories.length > 0) {
            const hasApplicableCategory = orderDetails.items.some(item => 
                this.applicableCategories.includes(item.category)
            );
            if (!hasApplicableCategory) {
                return { applies: false, reason: 'Coupon not applicable to items in cart' };
            }
        }

        // Check product restrictions
        if (this.applicableProducts.length > 0) {
            const hasApplicableProduct = orderDetails.items.some(item =>
                this.applicableProducts.includes(item.productId)
            );
            if (!hasApplicableProduct) {
                return { applies: false, reason: 'Coupon not applicable to items in cart' };
            }
        }

        // Check excluded products
        if (this.excludedProducts.length > 0) {
            const hasExcludedProduct = orderDetails.items.every(item =>
                this.excludedProducts.includes(item.productId)
            );
            if (hasExcludedProduct) {
                return { applies: false, reason: 'All items in cart are excluded from this coupon' };
            }
        }

        return { applies: true, reason: '' };
    }

    /**
     * Calculates discount amount
     * @param {number} subtotal - Order subtotal
     * @param {Object[]} items - Order items
     * @returns {number} Discount amount
     */
    calculateDiscount(subtotal, items = []) {
        if (!this.isValid()) {
            return 0;
        }

        let discount = 0;

        switch (this.discountType) {
            case DiscountType.PERCENTAGE:
                discount = (subtotal * this.discountValue) / 100;
                break;
            case DiscountType.FIXED_AMOUNT:
                discount = this.discountValue;
                break;
            case DiscountType.FREE_SHIPPING:
                // Shipping cost is handled separately
                return 0;
            case DiscountType.BUY_ONE_GET_ONE:
                // Calculate BOGO discount
                discount = this._calculateBogoDiscount(items);
                break;
            case DiscountType.BUNDLE:
                discount = this._calculateBundleDiscount(items);
                break;
        }

        // Apply max discount cap if set
        if (this.maxDiscount !== null && discount > this.maxDiscount) {
            discount = this.maxDiscount;
        }

        // Discount cannot exceed subtotal
        if (discount > subtotal) {
            discount = subtotal;
        }

        return Math.round(discount * 100) / 100;
    }

    /**
     * Calculates BOGO discount
     * @param {Object[]} items - Order items
     * @returns {number} Discount amount
     * @private
     */
    _calculateBogoDiscount(items) {
        if (!items || items.length === 0) {
            return 0;
        }

        let discount = 0;
        for (const item of items) {
            // For every 2 items, 1 is free (the cheaper one)
            const freeQuantity = Math.floor(item.quantity / 2);
            discount += freeQuantity * item.discountedPrice;
        }

        return discount;
    }

    /**
     * Calculates bundle discount
     * @param {Object[]} items - Order items
     * @returns {number} Discount amount
     * @private
     */
    _calculateBundleDiscount(items) {
        if (!items || items.length < 2) {
            return 0;
        }

        // Simple bundle: if 3+ different items, apply percentage discount
        const uniqueProducts = new Set(items.map(i => i.productId));
        if (uniqueProducts.size >= 3) {
            const subtotal = items.reduce((sum, item) => sum + (item.discountedPrice * item.quantity), 0);
            return subtotal * (this.discountValue / 100);
        }

        return 0;
    }

    /**
     * Records usage of the coupon
     * @param {string} userId - User ID
     * @returns {boolean} True if recorded successfully
     */
    recordUsage(userId) {
        this.usageCount++;
        
        if (userId) {
            const currentUsage = this.userUsage.get(userId) || 0;
            this.userUsage.set(userId, currentUsage + 1);
        }

        // Check if depleted
        if (this.usageLimit !== null && this.usageCount >= this.usageLimit) {
            this.status = CouponStatus.DEPLETED;
        }

        this.updatedAt = new Date();
        return true;
    }

    /**
     * Sets expiry date
     * @param {Date} date - Expiry date
     * @returns {boolean} True if set successfully
     */
    setExpiryDate(date) {
        if (!(date instanceof Date)) {
            return false;
        }
        this.expiryDate = date;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Sets usage limits
     * @param {number} totalLimit - Total usage limit
     * @param {number} perUserLimit - Per user limit
     * @returns {boolean} True if set successfully
     */
    setUsageLimits(totalLimit, perUserLimit) {
        if (totalLimit !== null && (typeof totalLimit !== 'number' || totalLimit < 1)) {
            return false;
        }
        if (perUserLimit !== null && (typeof perUserLimit !== 'number' || perUserLimit < 1)) {
            return false;
        }
        this.usageLimit = totalLimit;
        this.perUserLimit = perUserLimit;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Sets minimum purchase requirement
     * @param {number} amount - Minimum purchase amount
     * @returns {boolean} True if set successfully
     */
    setMinPurchase(amount) {
        if (typeof amount !== 'number' || amount < 0) {
            return false;
        }
        this.minPurchase = amount;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Disables the coupon
     */
    disable() {
        this.status = CouponStatus.DISABLED;
        this.updatedAt = new Date();
    }

    /**
     * Enables the coupon
     */
    enable() {
        if (this.status === CouponStatus.DEPLETED || 
            (this.expiryDate && new Date() > this.expiryDate)) {
            return false;
        }
        this.status = CouponStatus.ACTIVE;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Converts to JSON
     * @returns {Object} Coupon data
     */
    toJSON() {
        return {
            code: this.code,
            discountType: this.discountType,
            discountValue: this.discountValue,
            minPurchase: this.minPurchase,
            maxDiscount: this.maxDiscount,
            startDate: this.startDate,
            expiryDate: this.expiryDate,
            usageLimit: this.usageLimit,
            usageCount: this.usageCount,
            perUserLimit: this.perUserLimit,
            applicableCategories: this.applicableCategories,
            applicableProducts: this.applicableProducts,
            excludedProducts: this.excludedProducts,
            description: this.description,
            status: this.status,
            isValid: this.isValid(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * Promotion class - represents a promotional offer
 */
class Promotion {
    constructor(id, name, discountType, discountValue) {
        this.id = id;
        this.name = name;
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.startDate = new Date();
        this.endDate = null;
        this.isActive = true;
        this.priority = 0;
        this.applicableCategories = [];
        this.applicableProducts = [];
        this.rules = [];
        this.description = '';
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Checks if promotion is currently active
     * @returns {boolean} True if promotion is active
     */
    isCurrentlyActive() {
        if (!this.isActive) {
            return false;
        }

        const now = new Date();
        if (this.startDate && now < this.startDate) {
            return false;
        }

        if (this.endDate && now > this.endDate) {
            return false;
        }

        return true;
    }

    /**
     * Checks if promotion applies to a product
     * @param {Object} product - Product object
     * @returns {boolean} True if applies
     */
    appliesToProduct(product) {
        if (!this.isCurrentlyActive()) {
            return false;
        }

        // If no restrictions, applies to all products
        if (this.applicableCategories.length === 0 && this.applicableProducts.length === 0) {
            return true;
        }

        // Check product-specific restrictions
        if (this.applicableProducts.length > 0 && this.applicableProducts.includes(product.id)) {
            return true;
        }

        // Check category restrictions
        if (this.applicableCategories.length > 0 && this.applicableCategories.includes(product.category)) {
            return true;
        }

        return false;
    }

    /**
     * Calculates promotional price for a product
     * @param {number} originalPrice - Original product price
     * @returns {number} Promotional price
     */
    calculatePromotionalPrice(originalPrice) {
        if (this.discountType === DiscountType.PERCENTAGE) {
            const discount = (originalPrice * this.discountValue) / 100;
            return Math.round((originalPrice - discount) * 100) / 100;
        } else if (this.discountType === DiscountType.FIXED_AMOUNT) {
            return Math.max(0, Math.round((originalPrice - this.discountValue) * 100) / 100);
        }
        return originalPrice;
    }

    /**
     * Adds a rule to the promotion
     * @param {Object} rule - Rule object
     * @returns {boolean} True if added
     */
    addRule(rule) {
        if (!rule || typeof rule !== 'object') {
            return false;
        }
        this.rules.push(rule);
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Activates the promotion
     */
    activate() {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    /**
     * Deactivates the promotion
     */
    deactivate() {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    /**
     * Converts to JSON
     * @returns {Object} Promotion data
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            discountType: this.discountType,
            discountValue: this.discountValue,
            startDate: this.startDate,
            endDate: this.endDate,
            isActive: this.isActive,
            isCurrentlyActive: this.isCurrentlyActive(),
            priority: this.priority,
            applicableCategories: this.applicableCategories,
            applicableProducts: this.applicableProducts,
            rules: this.rules,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * Discount Manager - manages all discounts and promotions
 */
class DiscountManager {
    constructor() {
        this.coupons = new Map();
        this.promotions = new Map();
    }

    /**
     * Creates a new coupon
     * @param {string} code - Coupon code
     * @param {string} discountType - Discount type
     * @param {number} discountValue - Discount value
     * @returns {Object} Result with coupon or error
     */
    createCoupon(code, discountType, discountValue) {
        if (!code || typeof code !== 'string') {
            return { success: false, message: 'Coupon code is required' };
        }

        const upperCode = code.toUpperCase();
        if (this.coupons.has(upperCode)) {
            return { success: false, message: 'Coupon code already exists' };
        }

        const coupon = new Coupon(upperCode, discountType, discountValue);
        const validation = coupon.validate();
        if (!validation.isValid) {
            return { success: false, message: validation.errors.join(', ') };
        }

        this.coupons.set(upperCode, coupon);
        return { success: true, coupon: coupon };
    }

    /**
     * Gets a coupon by code
     * @param {string} code - Coupon code
     * @returns {Coupon|null} Coupon or null
     */
    getCoupon(code) {
        if (!code) return null;
        return this.coupons.get(code.toUpperCase()) || null;
    }

    /**
     * Deletes a coupon
     * @param {string} code - Coupon code
     * @returns {boolean} True if deleted
     */
    deleteCoupon(code) {
        if (!code) return false;
        return this.coupons.delete(code.toUpperCase());
    }

    /**
     * Validates and applies a coupon
     * @param {string} code - Coupon code
     * @param {string} userId - User ID
     * @param {Object} orderDetails - Order details
     * @returns {Object} Result with discount or error
     */
    validateAndApplyCoupon(code, userId, orderDetails) {
        const coupon = this.getCoupon(code);
        if (!coupon) {
            return { success: false, message: 'Coupon not found' };
        }

        const userCheck = coupon.canBeUsedByUser(userId);
        if (!userCheck.canUse) {
            return { success: false, message: userCheck.reason };
        }

        const orderCheck = coupon.appliesToOrder(orderDetails);
        if (!orderCheck.applies) {
            return { success: false, message: orderCheck.reason };
        }

        const discount = coupon.calculateDiscount(orderDetails.subtotal, orderDetails.items);
        
        return {
            success: true,
            couponCode: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            calculatedDiscount: discount,
            freeShipping: coupon.discountType === DiscountType.FREE_SHIPPING
        };
    }

    /**
     * Records coupon usage
     * @param {string} code - Coupon code
     * @param {string} userId - User ID
     * @returns {boolean} True if recorded
     */
    recordCouponUsage(code, userId) {
        const coupon = this.getCoupon(code);
        if (!coupon) {
            return false;
        }
        return coupon.recordUsage(userId);
    }

    /**
     * Creates a new promotion
     * @param {string} id - Promotion ID
     * @param {string} name - Promotion name
     * @param {string} discountType - Discount type
     * @param {number} discountValue - Discount value
     * @returns {Object} Result with promotion or error
     */
    createPromotion(id, name, discountType, discountValue) {
        if (!id || typeof id !== 'string') {
            return { success: false, message: 'Promotion ID is required' };
        }

        if (this.promotions.has(id)) {
            return { success: false, message: 'Promotion ID already exists' };
        }

        const promotion = new Promotion(id, name, discountType, discountValue);
        this.promotions.set(id, promotion);
        return { success: true, promotion: promotion };
    }

    /**
     * Gets a promotion by ID
     * @param {string} id - Promotion ID
     * @returns {Promotion|null} Promotion or null
     */
    getPromotion(id) {
        return this.promotions.get(id) || null;
    }

    /**
     * Deletes a promotion
     * @param {string} id - Promotion ID
     * @returns {boolean} True if deleted
     */
    deletePromotion(id) {
        return this.promotions.delete(id);
    }

    /**
     * Gets active promotions for a product
     * @param {Object} product - Product object
     * @returns {Promotion[]} Active promotions
     */
    getActivePromotionsForProduct(product) {
        const promotions = [];
        for (const promo of this.promotions.values()) {
            if (promo.appliesToProduct(product)) {
                promotions.push(promo);
            }
        }
        return promotions.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Gets best promotion for a product
     * @param {Object} product - Product object
     * @returns {Promotion|null} Best promotion or null
     */
    getBestPromotionForProduct(product) {
        const promotions = this.getActivePromotionsForProduct(product);
        if (promotions.length === 0) {
            return null;
        }

        // Return highest priority promotion
        return promotions[0];
    }

    /**
     * Calculates best price for a product
     * @param {Object} product - Product object
     * @returns {Object} Price details
     */
    calculateBestPrice(product) {
        const originalPrice = product.price;
        let bestPrice = originalPrice;
        let appliedPromotion = null;

        // Check product's own discount
        if (product.discount > 0) {
            bestPrice = product.getDiscountedPrice();
        }

        // Check promotional discounts
        const promotion = this.getBestPromotionForProduct(product);
        if (promotion) {
            const promoPrice = promotion.calculatePromotionalPrice(originalPrice);
            if (promoPrice < bestPrice) {
                bestPrice = promoPrice;
                appliedPromotion = promotion;
            }
        }

        return {
            originalPrice: originalPrice,
            finalPrice: bestPrice,
            savings: Math.round((originalPrice - bestPrice) * 100) / 100,
            savingsPercent: Math.round(((originalPrice - bestPrice) / originalPrice) * 100),
            appliedPromotion: appliedPromotion ? appliedPromotion.toJSON() : null
        };
    }

    /**
     * Gets all active coupons
     * @returns {Coupon[]} Active coupons
     */
    getActiveCoupons() {
        return Array.from(this.coupons.values()).filter(c => c.isValid());
    }

    /**
     * Gets all active promotions
     * @returns {Promotion[]} Active promotions
     */
    getActivePromotions() {
        return Array.from(this.promotions.values()).filter(p => p.isCurrentlyActive());
    }

    /**
     * Gets statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        const coupons = Array.from(this.coupons.values());
        const promotions = Array.from(this.promotions.values());

        return {
            totalCoupons: coupons.length,
            activeCoupons: coupons.filter(c => c.isValid()).length,
            expiredCoupons: coupons.filter(c => c.status === CouponStatus.EXPIRED).length,
            depletedCoupons: coupons.filter(c => c.status === CouponStatus.DEPLETED).length,
            totalCouponUsage: coupons.reduce((sum, c) => sum + c.usageCount, 0),
            totalPromotions: promotions.length,
            activePromotions: promotions.filter(p => p.isCurrentlyActive()).length
        };
    }

    /**
     * Gets coupon database for cart compatibility
     * @returns {Object} Coupon database
     */
    getCouponDatabase() {
        const database = {};
        for (const coupon of this.coupons.values()) {
            if (coupon.isValid()) {
                database[coupon.code] = {
                    discount: coupon.discountValue,
                    minPurchase: coupon.minPurchase,
                    expiresAt: coupon.expiryDate
                };
            }
        }
        return database;
    }
}

module.exports = {
    Coupon,
    Promotion,
    DiscountManager,
    DiscountType,
    CouponStatus
};
