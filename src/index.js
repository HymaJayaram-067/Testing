/**
 * Main Application Entry Point
 * E-Commerce Shopping Cart System
 * 
 * This module provides the main integration of all components
 * and serves as the application entry point.
 */

const { Product, ProductCatalog } = require('./product');
const { CartItem, ShoppingCart, CartManager } = require('./cart');
const { Order, OrderItem, OrderManager, OrderStatus, PaymentStatus, PaymentMethod } = require('./order');
const { User, UserManager, UserRole, AccountStatus } = require('./user');
const { InventoryItem, InventoryManager, MovementType, AlertType } = require('./inventory');
const { Coupon, Promotion, DiscountManager, DiscountType, CouponStatus } = require('./discount');

/**
 * E-Commerce Application class
 * Integrates all modules and provides high-level operations
 */
class ECommerceApp {
    constructor() {
        this.productCatalog = new ProductCatalog();
        this.cartManager = new CartManager();
        this.orderManager = new OrderManager();
        this.userManager = new UserManager();
        this.inventoryManager = new InventoryManager();
        this.discountManager = new DiscountManager();
        this.taxRate = 8.25; // Default tax rate
        this.shippingOptions = {
            baseRate: 5.99,
            freeShippingThreshold: 50,
            perItemRate: 0
        };
    }

    /**
     * Initializes the application with sample data
     * @returns {boolean} True if initialized successfully
     */
    initialize() {
        try {
            // Create sample products
            this._createSampleProducts();
            // Create sample coupons
            this._createSampleCoupons();
            // Create sample promotions
            this._createSamplePromotions();
            return true;
        } catch (error) {
            console.error('Initialization error:', error);
            return false;
        }
    }

    /**
     * Creates sample products for testing
     * @private
     */
    _createSampleProducts() {
        const products = [
            { id: 'PROD001', name: 'Wireless Bluetooth Headphones', price: 79.99, category: 'Electronics', stock: 100 },
            { id: 'PROD002', name: 'USB-C Charging Cable 3-Pack', price: 19.99, category: 'Electronics', stock: 500 },
            { id: 'PROD003', name: 'Laptop Stand Adjustable', price: 49.99, category: 'Electronics', stock: 75 },
            { id: 'PROD004', name: 'Cotton T-Shirt Blue', price: 24.99, category: 'Clothing', stock: 200 },
            { id: 'PROD005', name: 'Denim Jeans Classic Fit', price: 59.99, category: 'Clothing', stock: 150 },
            { id: 'PROD006', name: 'Running Shoes', price: 89.99, category: 'Shoes', stock: 80 },
            { id: 'PROD007', name: 'Stainless Steel Water Bottle', price: 29.99, category: 'Home', stock: 300 },
            { id: 'PROD008', name: 'Organic Coffee Beans 1lb', price: 14.99, category: 'Food', stock: 250 },
            { id: 'PROD009', name: 'Yoga Mat Premium', price: 39.99, category: 'Sports', stock: 120 },
            { id: 'PROD010', name: 'Smartphone Case Clear', price: 12.99, category: 'Electronics', stock: 400 }
        ];

        for (const prodData of products) {
            const product = new Product(
                prodData.id,
                prodData.name,
                prodData.price,
                prodData.category,
                prodData.stock
            );
            this.productCatalog.addProduct(product);
            this.inventoryManager.addInventoryItem(prodData.id, prodData.stock);
        }
    }

    /**
     * Creates sample coupons for testing
     * @private
     */
    _createSampleCoupons() {
        // Percentage discount coupon
        const result1 = this.discountManager.createCoupon('SAVE10', DiscountType.PERCENTAGE, 10);
        if (result1.success) {
            result1.coupon.setMinPurchase(25);
            result1.coupon.description = '10% off orders over $25';
        }

        // Fixed amount coupon
        const result2 = this.discountManager.createCoupon('FLAT5', DiscountType.FIXED_AMOUNT, 5);
        if (result2.success) {
            result2.coupon.description = '$5 off any order';
        }

        // Free shipping coupon
        const result3 = this.discountManager.createCoupon('FREESHIP', DiscountType.FREE_SHIPPING, 0);
        if (result3.success) {
            result3.coupon.setMinPurchase(30);
            result3.coupon.description = 'Free shipping on orders over $30';
        }

        // Premium coupon with expiry
        const result4 = this.discountManager.createCoupon('PREMIUM20', DiscountType.PERCENTAGE, 20);
        if (result4.success) {
            result4.coupon.setMinPurchase(100);
            result4.coupon.maxDiscount = 50;
            result4.coupon.setExpiryDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days
            result4.coupon.setUsageLimits(100, 1);
            result4.coupon.description = '20% off orders over $100 (max $50 discount)';
        }
    }

    /**
     * Creates sample promotions for testing
     * @private
     */
    _createSamplePromotions() {
        // Electronics sale
        const result1 = this.discountManager.createPromotion('PROMO001', 'Electronics Sale', DiscountType.PERCENTAGE, 15);
        if (result1.success) {
            result1.promotion.applicableCategories = ['Electronics'];
            result1.promotion.description = '15% off all electronics';
            result1.promotion.priority = 1;
        }

        // Clothing bundle
        const result2 = this.discountManager.createPromotion('PROMO002', 'Clothing Bundle Deal', DiscountType.BUNDLE, 10);
        if (result2.success) {
            result2.promotion.applicableCategories = ['Clothing'];
            result2.promotion.description = '10% off when buying 3+ clothing items';
            result2.promotion.priority = 2;
        }
    }

    /**
     * Registers a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} firstName - First name
     * @param {string} lastName - Last name
     * @returns {Object} Result with user or error
     */
    registerUser(email, password, firstName, lastName) {
        return this.userManager.register(email, password, firstName, lastName);
    }

    /**
     * Authenticates a user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Result with session or error
     */
    login(email, password) {
        return this.userManager.authenticate(email, password);
    }

    /**
     * Logs out a user
     * @param {string} sessionId - Session ID
     * @returns {boolean} True if logged out
     */
    logout(sessionId) {
        return this.userManager.logout(sessionId);
    }

    /**
     * Gets or creates a cart for a user
     * @param {string} userId - User ID
     * @returns {ShoppingCart} User's cart
     */
    getCart(userId) {
        return this.cartManager.getOrCreateCart(userId);
    }

    /**
     * Adds a product to user's cart
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity to add
     * @returns {Object} Result with success flag
     */
    addToCart(userId, productId, quantity = 1) {
        const product = this.productCatalog.getProduct(productId);
        if (!product) {
            return { success: false, message: 'Product not found' };
        }

        const inventoryItem = this.inventoryManager.getInventoryItem(productId);
        if (!inventoryItem || inventoryItem.getAvailableStock() < quantity) {
            return { success: false, message: 'Insufficient stock' };
        }

        const cart = this.getCart(userId);
        const result = cart.addItem(product, quantity);

        if (result.success) {
            // Reserve stock
            this.inventoryManager.reserveStock(productId, quantity);
        }

        return result;
    }

    /**
     * Removes a product from user's cart
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @returns {boolean} True if removed
     */
    removeFromCart(userId, productId) {
        const cart = this.cartManager.getActiveCartForUser(userId);
        if (!cart) {
            return false;
        }

        const item = cart.getItem(productId);
        if (item) {
            // Release reserved stock
            this.inventoryManager.releaseReservedStock(productId, item.quantity);
        }

        return cart.removeItem(productId);
    }

    /**
     * Updates cart item quantity
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @param {number} newQuantity - New quantity
     * @returns {Object} Result with success flag
     */
    updateCartQuantity(userId, productId, newQuantity) {
        const cart = this.cartManager.getActiveCartForUser(userId);
        if (!cart) {
            return { success: false, message: 'Cart not found' };
        }

        const item = cart.getItem(productId);
        if (!item) {
            return { success: false, message: 'Item not in cart' };
        }

        const product = this.productCatalog.getProduct(productId);
        const inventoryItem = this.inventoryManager.getInventoryItem(productId);
        
        if (newQuantity > item.quantity) {
            // Need more stock
            const additionalNeeded = newQuantity - item.quantity;
            if (!inventoryItem || inventoryItem.getAvailableStock() < additionalNeeded) {
                return { success: false, message: 'Insufficient stock' };
            }
            this.inventoryManager.reserveStock(productId, additionalNeeded);
        } else if (newQuantity < item.quantity) {
            // Release extra reserved stock
            const toRelease = item.quantity - newQuantity;
            this.inventoryManager.releaseReservedStock(productId, toRelease);
        }

        return cart.updateItemQuantity(productId, newQuantity, product);
    }

    /**
     * Applies a coupon to user's cart
     * @param {string} userId - User ID
     * @param {string} couponCode - Coupon code
     * @returns {Object} Result with success flag
     */
    applyCoupon(userId, couponCode) {
        const cart = this.cartManager.getActiveCartForUser(userId);
        if (!cart) {
            return { success: false, message: 'Cart not found' };
        }

        const orderDetails = {
            subtotal: cart.getSubtotal(),
            items: cart.getAllItems().map(item => {
                const product = this.productCatalog.getProduct(item.productId);
                return {
                    productId: item.productId,
                    category: product ? product.category : 'Unknown',
                    discountedPrice: item.discountedPrice,
                    quantity: item.quantity
                };
            })
        };

        const validation = this.discountManager.validateAndApplyCoupon(couponCode, userId, orderDetails);
        if (!validation.success) {
            return validation;
        }

        const couponDatabase = this.discountManager.getCouponDatabase();
        return cart.applyCoupon(couponCode, couponDatabase);
    }

    /**
     * Processes checkout for a user
     * @param {string} userId - User ID
     * @param {Object} paymentDetails - Payment details
     * @returns {Object} Result with order or error
     */
    checkout(userId, paymentDetails) {
        const cart = this.cartManager.getActiveCartForUser(userId);
        if (!cart) {
            return { success: false, message: 'Cart not found' };
        }

        // Validate cart
        const validation = cart.validateForCheckout(this.productCatalog);
        if (!validation.isValid) {
            return { success: false, message: validation.errors.join(', ') };
        }

        // Create order
        const orderResult = this.orderManager.createOrder(
            cart,
            this.productCatalog,
            this.taxRate,
            this.shippingOptions
        );

        if (!orderResult.success) {
            return orderResult;
        }

        const order = orderResult.order;

        // Set payment method
        if (paymentDetails && paymentDetails.method) {
            order.setPaymentMethod(paymentDetails.method);
        }

        // Process payment
        const paymentResult = order.processPayment(paymentDetails);
        if (!paymentResult.success) {
            // Revert inventory changes
            for (const item of cart.getAllItems()) {
                this.inventoryManager.releaseReservedStock(item.productId, item.quantity);
            }
            return paymentResult;
        }

        // Confirm inventory deductions
        for (const item of cart.getAllItems()) {
            const inventoryItem = this.inventoryManager.getInventoryItem(item.productId);
            if (inventoryItem) {
                inventoryItem.confirmSale(item.quantity);
                this.inventoryManager.recordMovement(
                    item.productId,
                    MovementType.SALE,
                    item.quantity,
                    order.orderId,
                    `Sale - Order ${order.orderId}`
                );
            }
        }

        // Record coupon usage
        if (cart.couponCode) {
            this.discountManager.recordCouponUsage(cart.couponCode, userId);
        }

        return {
            success: true,
            order: order,
            message: 'Order placed successfully'
        };
    }

    /**
     * Gets order by ID
     * @param {string} orderId - Order ID
     * @returns {Order|null} Order or null
     */
    getOrder(orderId) {
        return this.orderManager.getOrder(orderId);
    }

    /**
     * Gets orders for a user
     * @param {string} userId - User ID
     * @returns {Order[]} User's orders
     */
    getUserOrders(userId) {
        return this.orderManager.getOrdersForUser(userId);
    }

    /**
     * Cancels an order
     * @param {string} orderId - Order ID
     * @param {string} reason - Cancellation reason
     * @returns {Object} Result with success flag
     */
    cancelOrder(orderId, reason = '') {
        const order = this.orderManager.getOrder(orderId);
        if (!order) {
            return { success: false, message: 'Order not found' };
        }

        const result = order.cancel(reason);
        if (result.success) {
            // Return items to inventory
            for (const item of order.items) {
                this.inventoryManager.processReturn(item.productId, item.quantity, orderId);
            }
        }

        return result;
    }

    /**
     * Gets product details with best price
     * @param {string} productId - Product ID
     * @returns {Object|null} Product details with pricing
     */
    getProductDetails(productId) {
        const product = this.productCatalog.getProduct(productId);
        if (!product) {
            return null;
        }

        const pricing = this.discountManager.calculateBestPrice(product);
        const inventory = this.inventoryManager.getInventoryItem(productId);

        return {
            ...product.toJSON(),
            pricing: pricing,
            availableStock: inventory ? inventory.getAvailableStock() : 0,
            inStock: inventory ? !inventory.isOutOfStock() : false
        };
    }

    /**
     * Searches products
     * @param {string} query - Search query
     * @returns {Object[]} Search results with pricing
     */
    searchProducts(query) {
        const products = this.productCatalog.searchProducts(query);
        return products.map(product => this.getProductDetails(product.id));
    }

    /**
     * Gets products by category
     * @param {string} category - Category name
     * @returns {Object[]} Products with pricing
     */
    getProductsByCategory(category) {
        const products = this.productCatalog.getProductsByCategory(category);
        return products.map(product => this.getProductDetails(product.id));
    }

    /**
     * Gets dashboard statistics
     * @returns {Object} Dashboard statistics
     */
    getDashboardStats() {
        return {
            products: {
                total: this.productCatalog.getProductCount(),
                active: this.productCatalog.getProductCount(true),
                categories: this.productCatalog.getAllCategories()
            },
            inventory: this.inventoryManager.getStatistics(),
            orders: this.orderManager.getStatistics(),
            users: this.userManager.getStatistics(),
            carts: this.cartManager.getStatistics(),
            discounts: this.discountManager.getStatistics()
        };
    }

    /**
     * Processes a product return
     * @param {string} orderId - Order ID
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity to return
     * @returns {Object} Result with success flag
     */
    processReturn(orderId, productId, quantity) {
        const order = this.orderManager.getOrder(orderId);
        if (!order) {
            return { success: false, message: 'Order not found' };
        }

        if (order.status !== OrderStatus.DELIVERED) {
            return { success: false, message: 'Can only return delivered orders' };
        }

        const orderItem = order.items.find(i => i.productId === productId);
        if (!orderItem) {
            return { success: false, message: 'Product not found in order' };
        }

        if (quantity > orderItem.quantity) {
            return { success: false, message: 'Return quantity exceeds ordered quantity' };
        }

        // Process inventory return
        const inventoryResult = this.inventoryManager.processReturn(productId, quantity, orderId);
        if (!inventoryResult.success) {
            return inventoryResult;
        }

        return { 
            success: true, 
            message: 'Return processed successfully',
            refundAmount: orderItem.discountedPrice * quantity
        };
    }

    /**
     * Gets low stock alerts
     * @returns {Object[]} Low stock alerts
     */
    getLowStockAlerts() {
        return this.inventoryManager.getActiveAlerts().map(alert => ({
            ...alert.toJSON(),
            product: this.productCatalog.getProduct(alert.productId)?.toJSON()
        }));
    }

    /**
     * Restocks a product
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity to add
     * @param {string} purchaseOrder - PO reference
     * @returns {Object} Result with success flag
     */
    restockProduct(productId, quantity, purchaseOrder = '') {
        const product = this.productCatalog.getProduct(productId);
        if (!product) {
            return { success: false, message: 'Product not found' };
        }

        const result = this.inventoryManager.restock(productId, quantity, purchaseOrder);
        if (result.success) {
            product.updateStock(quantity);
        }

        return result;
    }
}

// Export all modules
module.exports = {
    // Main App
    ECommerceApp,
    
    // Product Module
    Product,
    ProductCatalog,
    
    // Cart Module
    CartItem,
    ShoppingCart,
    CartManager,
    
    // Order Module
    Order,
    OrderItem,
    OrderManager,
    OrderStatus,
    PaymentStatus,
    PaymentMethod,
    
    // User Module
    User,
    UserManager,
    UserRole,
    AccountStatus,
    
    // Inventory Module
    InventoryItem,
    InventoryManager,
    MovementType,
    AlertType,
    
    // Discount Module
    Coupon,
    Promotion,
    DiscountManager,
    DiscountType,
    CouponStatus
};
