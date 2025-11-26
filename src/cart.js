/**
 * Shopping Cart Module
 * Handles cart operations, item management, and checkout calculations
 */

const { Product } = require('./product');

class CartItem {
    constructor(product, quantity = 1) {
        this.productId = product.id;
        this.productName = product.name;
        this.unitPrice = product.price;
        this.discountedPrice = product.getDiscountedPrice();
        this.quantity = quantity;
        this.addedAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Gets the subtotal for this cart item
     * @returns {number} Subtotal price
     */
    getSubtotal() {
        return Math.round(this.discountedPrice * this.quantity * 100) / 100;
    }

    /**
     * Gets the savings from discount
     * @returns {number} Total savings
     */
    getSavings() {
        const fullPrice = this.unitPrice * this.quantity;
        const discountedTotal = this.discountedPrice * this.quantity;
        return Math.round((fullPrice - discountedTotal) * 100) / 100;
    }

    /**
     * Updates the quantity
     * @param {number} newQuantity - New quantity
     * @returns {boolean} True if quantity was updated
     */
    setQuantity(newQuantity) {
        if (typeof newQuantity !== 'number' || newQuantity < 1 || !Number.isInteger(newQuantity)) {
            return false;
        }
        this.quantity = newQuantity;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Increments quantity by specified amount
     * @param {number} amount - Amount to add
     * @returns {boolean} True if successful
     */
    incrementQuantity(amount = 1) {
        if (typeof amount !== 'number' || amount < 1 || !Number.isInteger(amount)) {
            return false;
        }
        this.quantity += amount;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Decrements quantity by specified amount
     * @param {number} amount - Amount to subtract
     * @returns {boolean} True if successful
     */
    decrementQuantity(amount = 1) {
        if (typeof amount !== 'number' || amount < 1 || !Number.isInteger(amount)) {
            return false;
        }
        if (this.quantity - amount < 1) {
            return false;
        }
        this.quantity -= amount;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Converts to JSON representation
     * @returns {Object} Cart item data
     */
    toJSON() {
        return {
            productId: this.productId,
            productName: this.productName,
            unitPrice: this.unitPrice,
            discountedPrice: this.discountedPrice,
            quantity: this.quantity,
            subtotal: this.getSubtotal(),
            savings: this.getSavings(),
            addedAt: this.addedAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * Shopping Cart class - manages cart items and calculations
 */
class ShoppingCart {
    constructor(userId, cartId = null) {
        this.cartId = cartId || this._generateCartId();
        this.userId = userId;
        this.items = new Map();
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.couponCode = null;
        this.couponDiscount = 0;
        this.notes = '';
        this.shippingAddress = null;
        this.billingAddress = null;
        this.status = 'active';
    }

    /**
     * Generates a unique cart ID
     * @returns {string} Unique cart ID
     * @private
     */
    _generateCartId() {
        return 'CART-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Adds a product to the cart
     * @param {Product} product - Product to add
     * @param {number} quantity - Quantity to add
     * @returns {Object} Result with success flag and message
     */
    addItem(product, quantity = 1) {
        if (this.status !== 'active') {
            return { success: false, message: 'Cart is not active' };
        }

        if (!(product instanceof Product)) {
            return { success: false, message: 'Invalid product' };
        }

        if (!product.isActive) {
            return { success: false, message: 'Product is not available' };
        }

        if (typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
            return { success: false, message: 'Invalid quantity' };
        }

        if (!product.isInStock(quantity)) {
            return { success: false, message: 'Insufficient stock' };
        }

        const existingItem = this.items.get(product.id);
        if (existingItem) {
            const totalQuantity = existingItem.quantity + quantity;
            if (!product.isInStock(totalQuantity)) {
                return { success: false, message: 'Insufficient stock for requested quantity' };
            }
            existingItem.incrementQuantity(quantity);
        } else {
            const cartItem = new CartItem(product, quantity);
            this.items.set(product.id, cartItem);
        }

        this.updatedAt = new Date();
        return { success: true, message: 'Item added to cart' };
    }

    /**
     * Removes an item from the cart
     * @param {string} productId - Product ID to remove
     * @returns {boolean} True if item was removed
     */
    removeItem(productId) {
        if (this.status !== 'active') {
            return false;
        }
        const result = this.items.delete(productId);
        if (result) {
            this.updatedAt = new Date();
        }
        return result;
    }

    /**
     * Updates item quantity
     * @param {string} productId - Product ID
     * @param {number} quantity - New quantity
     * @param {Product} product - Product reference for stock check
     * @returns {Object} Result with success flag and message
     */
    updateItemQuantity(productId, quantity, product = null) {
        if (this.status !== 'active') {
            return { success: false, message: 'Cart is not active' };
        }

        const item = this.items.get(productId);
        if (!item) {
            return { success: false, message: 'Item not found in cart' };
        }

        if (quantity <= 0) {
            this.removeItem(productId);
            return { success: true, message: 'Item removed from cart' };
        }

        if (product && !product.isInStock(quantity)) {
            return { success: false, message: 'Insufficient stock' };
        }

        if (!item.setQuantity(quantity)) {
            return { success: false, message: 'Invalid quantity' };
        }

        this.updatedAt = new Date();
        return { success: true, message: 'Quantity updated' };
    }

    /**
     * Gets an item from the cart
     * @param {string} productId - Product ID
     * @returns {CartItem|null} Cart item or null
     */
    getItem(productId) {
        return this.items.get(productId) || null;
    }

    /**
     * Gets all items in the cart
     * @returns {CartItem[]} Array of cart items
     */
    getAllItems() {
        return Array.from(this.items.values());
    }

    /**
     * Gets the total number of items
     * @returns {number} Total item count
     */
    getItemCount() {
        let count = 0;
        for (const item of this.items.values()) {
            count += item.quantity;
        }
        return count;
    }

    /**
     * Gets the number of unique products
     * @returns {number} Unique product count
     */
    getUniqueItemCount() {
        return this.items.size;
    }

    /**
     * Calculates the subtotal before taxes and shipping
     * @returns {number} Subtotal amount
     */
    getSubtotal() {
        let subtotal = 0;
        for (const item of this.items.values()) {
            subtotal += item.getSubtotal();
        }
        return Math.round(subtotal * 100) / 100;
    }

    /**
     * Calculates total savings from product discounts
     * @returns {number} Total savings
     */
    getTotalSavings() {
        let savings = 0;
        for (const item of this.items.values()) {
            savings += item.getSavings();
        }
        // Add coupon savings
        if (this.couponDiscount > 0) {
            const subtotal = this.getSubtotal();
            savings += (subtotal * this.couponDiscount) / 100;
        }
        return Math.round(savings * 100) / 100;
    }

    /**
     * Calculates tax amount
     * @param {number} taxRate - Tax rate percentage
     * @returns {number} Tax amount
     */
    calculateTax(taxRate = 0) {
        if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 100) {
            taxRate = 0;
        }
        const subtotalAfterCoupon = this.getSubtotalAfterCoupon();
        const tax = (subtotalAfterCoupon * taxRate) / 100;
        return Math.round(tax * 100) / 100;
    }

    /**
     * Gets subtotal after applying coupon discount
     * @returns {number} Discounted subtotal
     */
    getSubtotalAfterCoupon() {
        const subtotal = this.getSubtotal();
        if (this.couponDiscount <= 0) {
            return subtotal;
        }
        const discount = (subtotal * this.couponDiscount) / 100;
        return Math.round((subtotal - discount) * 100) / 100;
    }

    /**
     * Calculates shipping cost
     * @param {Object} options - Shipping options
     * @returns {number} Shipping cost
     */
    calculateShipping(options = {}) {
        const subtotal = this.getSubtotalAfterCoupon();
        const baseRate = options.baseRate || 5.99;
        const freeShippingThreshold = options.freeShippingThreshold || 50;
        const perItemRate = options.perItemRate || 0;

        if (subtotal >= freeShippingThreshold) {
            return 0;
        }

        let shipping = baseRate;
        if (perItemRate > 0) {
            shipping += perItemRate * this.getItemCount();
        }

        return Math.round(shipping * 100) / 100;
    }

    /**
     * Calculates the total amount
     * @param {number} taxRate - Tax rate percentage
     * @param {Object} shippingOptions - Shipping options
     * @returns {number} Total amount
     */
    getTotal(taxRate = 0, shippingOptions = {}) {
        const subtotal = this.getSubtotalAfterCoupon();
        const tax = this.calculateTax(taxRate);
        const shipping = this.calculateShipping(shippingOptions);
        return Math.round((subtotal + tax + shipping) * 100) / 100;
    }

    /**
     * Applies a coupon code
     * @param {string} code - Coupon code
     * @param {Object} couponDatabase - Database of valid coupons
     * @returns {Object} Result with success flag and message
     */
    applyCoupon(code, couponDatabase = {}) {
        if (this.status !== 'active') {
            return { success: false, message: 'Cart is not active' };
        }

        if (typeof code !== 'string' || code.trim() === '') {
            return { success: false, message: 'Invalid coupon code' };
        }

        const upperCode = code.toUpperCase();
        const coupon = couponDatabase[upperCode];

        if (!coupon) {
            return { success: false, message: 'Coupon not found' };
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return { success: false, message: 'Coupon has expired' };
        }

        if (coupon.minPurchase && this.getSubtotal() < coupon.minPurchase) {
            return { success: false, message: `Minimum purchase of $${coupon.minPurchase} required` };
        }

        this.couponCode = upperCode;
        this.couponDiscount = coupon.discount;
        this.updatedAt = new Date();
        return { success: true, message: `Coupon applied: ${coupon.discount}% off` };
    }

    /**
     * Removes applied coupon
     * @returns {boolean} True if coupon was removed
     */
    removeCoupon() {
        if (this.couponCode) {
            this.couponCode = null;
            this.couponDiscount = 0;
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    /**
     * Sets shipping address
     * @param {Object} address - Address object
     * @returns {Object} Result with success flag
     */
    setShippingAddress(address) {
        if (!address || typeof address !== 'object') {
            return { success: false, message: 'Invalid address' };
        }

        const requiredFields = ['street', 'city', 'state', 'zipCode', 'country'];
        for (const field of requiredFields) {
            if (!address[field] || typeof address[field] !== 'string') {
                return { success: false, message: `Missing required field: ${field}` };
            }
        }

        this.shippingAddress = { ...address };
        this.updatedAt = new Date();
        return { success: true, message: 'Shipping address set' };
    }

    /**
     * Sets billing address
     * @param {Object} address - Address object
     * @param {boolean} sameAsShipping - Use shipping address as billing
     * @returns {Object} Result with success flag
     */
    setBillingAddress(address, sameAsShipping = false) {
        if (sameAsShipping && this.shippingAddress) {
            this.billingAddress = { ...this.shippingAddress };
            this.updatedAt = new Date();
            return { success: true, message: 'Billing address set same as shipping' };
        }

        if (!address || typeof address !== 'object') {
            return { success: false, message: 'Invalid address' };
        }

        const requiredFields = ['street', 'city', 'state', 'zipCode', 'country'];
        for (const field of requiredFields) {
            if (!address[field] || typeof address[field] !== 'string') {
                return { success: false, message: `Missing required field: ${field}` };
            }
        }

        this.billingAddress = { ...address };
        this.updatedAt = new Date();
        return { success: true, message: 'Billing address set' };
    }

    /**
     * Sets notes for the cart/order
     * @param {string} notes - Notes text
     * @returns {boolean} True if notes were set
     */
    setNotes(notes) {
        if (typeof notes !== 'string') {
            return false;
        }
        this.notes = notes.substring(0, 500); // Limit to 500 chars
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Clears the cart
     * @returns {boolean} True if cart was cleared
     */
    clear() {
        this.items.clear();
        this.couponCode = null;
        this.couponDiscount = 0;
        this.notes = '';
        this.shippingAddress = null;
        this.billingAddress = null;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Checks if cart is empty
     * @returns {boolean} True if cart has no items
     */
    isEmpty() {
        return this.items.size === 0;
    }

    /**
     * Validates cart before checkout
     * @param {Object} productCatalog - Product catalog for validation
     * @returns {Object} Validation result
     */
    validateForCheckout(productCatalog) {
        const errors = [];

        if (this.isEmpty()) {
            errors.push('Cart is empty');
        }

        if (this.status !== 'active') {
            errors.push('Cart is not active');
        }

        if (!this.shippingAddress) {
            errors.push('Shipping address is required');
        }

        if (!this.billingAddress) {
            errors.push('Billing address is required');
        }

        // Validate each item
        for (const item of this.items.values()) {
            if (productCatalog) {
                const product = productCatalog.getProduct(item.productId);
                if (!product) {
                    errors.push(`Product ${item.productId} no longer exists`);
                } else if (!product.isActive) {
                    errors.push(`Product ${product.name} is no longer available`);
                } else if (!product.isInStock(item.quantity)) {
                    errors.push(`Insufficient stock for ${product.name}`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Marks cart as checked out
     */
    markAsCheckedOut() {
        this.status = 'checked_out';
        this.updatedAt = new Date();
    }

    /**
     * Abandons the cart
     */
    abandon() {
        this.status = 'abandoned';
        this.updatedAt = new Date();
    }

    /**
     * Converts cart to JSON representation
     * @returns {Object} Cart data
     */
    toJSON() {
        return {
            cartId: this.cartId,
            userId: this.userId,
            items: this.getAllItems().map(item => item.toJSON()),
            itemCount: this.getItemCount(),
            uniqueItemCount: this.getUniqueItemCount(),
            subtotal: this.getSubtotal(),
            couponCode: this.couponCode,
            couponDiscount: this.couponDiscount,
            subtotalAfterCoupon: this.getSubtotalAfterCoupon(),
            totalSavings: this.getTotalSavings(),
            notes: this.notes,
            shippingAddress: this.shippingAddress,
            billingAddress: this.billingAddress,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * Cart Manager - manages multiple shopping carts
 */
class CartManager {
    constructor() {
        this.carts = new Map();
        this.userCarts = new Map();
    }

    /**
     * Creates a new cart for a user
     * @param {string} userId - User ID
     * @returns {ShoppingCart} New shopping cart
     */
    createCart(userId) {
        if (typeof userId !== 'string' || userId.trim() === '') {
            return null;
        }

        const cart = new ShoppingCart(userId);
        this.carts.set(cart.cartId, cart);

        // Track user's carts
        if (!this.userCarts.has(userId)) {
            this.userCarts.set(userId, []);
        }
        this.userCarts.get(userId).push(cart.cartId);

        return cart;
    }

    /**
     * Gets a cart by ID
     * @param {string} cartId - Cart ID
     * @returns {ShoppingCart|null} Cart or null
     */
    getCart(cartId) {
        return this.carts.get(cartId) || null;
    }

    /**
     * Gets the active cart for a user
     * @param {string} userId - User ID
     * @returns {ShoppingCart|null} Active cart or null
     */
    getActiveCartForUser(userId) {
        const userCartIds = this.userCarts.get(userId);
        if (!userCartIds || userCartIds.length === 0) {
            return null;
        }

        // Find the most recent active cart
        for (let i = userCartIds.length - 1; i >= 0; i--) {
            const cart = this.carts.get(userCartIds[i]);
            if (cart && cart.status === 'active') {
                return cart;
            }
        }

        return null;
    }

    /**
     * Gets or creates an active cart for a user
     * @param {string} userId - User ID
     * @returns {ShoppingCart} Active cart
     */
    getOrCreateCart(userId) {
        let cart = this.getActiveCartForUser(userId);
        if (!cart) {
            cart = this.createCart(userId);
        }
        return cart;
    }

    /**
     * Gets all carts for a user
     * @param {string} userId - User ID
     * @returns {ShoppingCart[]} Array of carts
     */
    getAllCartsForUser(userId) {
        const userCartIds = this.userCarts.get(userId);
        if (!userCartIds) {
            return [];
        }
        return userCartIds
            .map(id => this.carts.get(id))
            .filter(cart => cart !== undefined);
    }

    /**
     * Removes a cart
     * @param {string} cartId - Cart ID
     * @returns {boolean} True if cart was removed
     */
    removeCart(cartId) {
        const cart = this.carts.get(cartId);
        if (!cart) {
            return false;
        }

        // Remove from user's cart list
        const userCartIds = this.userCarts.get(cart.userId);
        if (userCartIds) {
            const index = userCartIds.indexOf(cartId);
            if (index > -1) {
                userCartIds.splice(index, 1);
            }
        }

        return this.carts.delete(cartId);
    }

    /**
     * Gets abandoned carts
     * @param {number} ageInHours - Minimum age in hours
     * @returns {ShoppingCart[]} Array of abandoned carts
     */
    getAbandonedCarts(ageInHours = 24) {
        const cutoff = new Date(Date.now() - ageInHours * 60 * 60 * 1000);
        const abandoned = [];

        for (const cart of this.carts.values()) {
            if (cart.status === 'active' && cart.updatedAt < cutoff && !cart.isEmpty()) {
                abandoned.push(cart);
            }
        }

        return abandoned;
    }

    /**
     * Cleans up old abandoned carts
     * @param {number} ageInDays - Minimum age in days
     * @returns {number} Number of carts removed
     */
    cleanupOldCarts(ageInDays = 30) {
        const cutoff = new Date(Date.now() - ageInDays * 24 * 60 * 60 * 1000);
        let removed = 0;

        for (const [cartId, cart] of this.carts.entries()) {
            if (cart.updatedAt < cutoff && (cart.status === 'abandoned' || cart.status === 'checked_out')) {
                this.removeCart(cartId);
                removed++;
            }
        }

        return removed;
    }

    /**
     * Gets cart statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        let totalCarts = 0;
        let activeCarts = 0;
        let abandonedCarts = 0;
        let checkedOutCarts = 0;
        let totalItems = 0;
        let totalValue = 0;

        for (const cart of this.carts.values()) {
            totalCarts++;
            totalItems += cart.getItemCount();
            totalValue += cart.getSubtotal();

            switch (cart.status) {
                case 'active':
                    activeCarts++;
                    break;
                case 'abandoned':
                    abandonedCarts++;
                    break;
                case 'checked_out':
                    checkedOutCarts++;
                    break;
            }
        }

        return {
            totalCarts,
            activeCarts,
            abandonedCarts,
            checkedOutCarts,
            totalItems,
            totalValue: Math.round(totalValue * 100) / 100,
            averageCartValue: totalCarts > 0 ? Math.round((totalValue / totalCarts) * 100) / 100 : 0
        };
    }
}

module.exports = { CartItem, ShoppingCart, CartManager };
