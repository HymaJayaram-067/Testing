/**
 * Integration Tests for ECommerceApp
 * Tests the main application integration layer (index.js)
 */

const { expect } = require('chai');
const {
    ECommerceApp,
    Product,
    ProductCatalog,
    ShoppingCart,
    CartManager,
    Order,
    OrderStatus,
    PaymentStatus,
    PaymentMethod,
    User,
    UserRole,
    AccountStatus,
    InventoryItem,
    MovementType,
    AlertType,
    Coupon,
    Promotion,
    DiscountType,
    CouponStatus
} = require('../src/index');

describe('ECommerceApp', function() {
    let app;

    beforeEach(function() {
        app = new ECommerceApp();
    });

    describe('Constructor', function() {
        it('should create app with default settings', function() {
            expect(app.productCatalog).to.be.instanceof(ProductCatalog);
            expect(app.cartManager).to.be.instanceof(CartManager);
            expect(app.taxRate).to.equal(8.25);
            expect(app.shippingOptions.baseRate).to.equal(5.99);
            expect(app.shippingOptions.freeShippingThreshold).to.equal(50);
            expect(app.shippingOptions.perItemRate).to.equal(0);
        });

        it('should have initialized managers', function() {
            expect(app.orderManager).to.not.be.null;
            expect(app.userManager).to.not.be.null;
            expect(app.inventoryManager).to.not.be.null;
            expect(app.discountManager).to.not.be.null;
        });
    });

    describe('initialize()', function() {
        it('should initialize with sample data', function() {
            const result = app.initialize();
            expect(result).to.be.true;
        });

        it('should create sample products', function() {
            app.initialize();
            const stats = app.getDashboardStats();
            expect(stats.products.total).to.be.greaterThan(0);
        });

        it('should create sample coupons', function() {
            app.initialize();
            const stats = app.discountManager.getStatistics();
            expect(stats.totalCoupons).to.be.greaterThan(0);
        });

        it('should create sample promotions', function() {
            app.initialize();
            const stats = app.discountManager.getStatistics();
            expect(stats.totalPromotions).to.be.greaterThan(0);
        });

        it('should setup inventory', function() {
            app.initialize();
            const stats = app.inventoryManager.getStatistics();
            expect(stats.totalProducts).to.be.greaterThan(0);
        });
    });

    describe('registerUser()', function() {
        it('should register new user', function() {
            const result = app.registerUser('test@example.com', 'Password123', 'John', 'Doe');
            expect(result.success).to.be.true;
            expect(result.user).to.not.be.null;
            expect(result.user.email).to.equal('test@example.com');
        });

        it('should reject duplicate email', function() {
            app.registerUser('test@example.com', 'Password123', 'John', 'Doe');
            const result = app.registerUser('test@example.com', 'Password456', 'Jane', 'Doe');
            expect(result.success).to.be.false;
        });

        it('should reject invalid email', function() {
            const result = app.registerUser('invalid', 'Password123', 'John', 'Doe');
            expect(result.success).to.be.false;
        });

        it('should reject weak password', function() {
            const result = app.registerUser('test@example.com', '123', 'John', 'Doe');
            expect(result.success).to.be.false;
        });
    });

    describe('login()', function() {
        beforeEach(function() {
            const result = app.registerUser('test@example.com', 'Password123', 'John', 'Doe');
            result.user.verifyAccount(result.verificationToken);
        });

        it('should login with valid credentials', function() {
            const result = app.login('test@example.com', 'Password123');
            expect(result.success).to.be.true;
            expect(result.session).to.not.be.null;
        });

        it('should reject invalid password', function() {
            const result = app.login('test@example.com', 'WrongPassword');
            expect(result.success).to.be.false;
        });

        it('should reject non-existent user', function() {
            const result = app.login('nobody@example.com', 'Password123');
            expect(result.success).to.be.false;
        });
    });

    describe('logout()', function() {
        it('should logout valid session', function() {
            const regResult = app.registerUser('test@example.com', 'Password123', 'John', 'Doe');
            regResult.user.verifyAccount(regResult.verificationToken);
            const loginResult = app.login('test@example.com', 'Password123');
            
            const result = app.logout(loginResult.session.sessionId);
            expect(result).to.be.true;
        });

        it('should return false for invalid session', function() {
            const result = app.logout('invalid-session');
            expect(result).to.be.false;
        });
    });

    describe('getCart()', function() {
        it('should create new cart for user', function() {
            const cart = app.getCart('user123');
            expect(cart).to.be.instanceof(ShoppingCart);
            expect(cart.userId).to.equal('user123');
        });

        it('should return same cart for same user', function() {
            const cart1 = app.getCart('user123');
            const cart2 = app.getCart('user123');
            expect(cart1).to.equal(cart2);
        });
    });

    describe('addToCart()', function() {
        beforeEach(function() {
            app.initialize();
        });

        it('should add product to cart', function() {
            const result = app.addToCart('user123', 'PROD001', 1);
            expect(result.success).to.be.true;
        });

        it('should reserve stock when adding to cart', function() {
            const inventoryBefore = app.inventoryManager.getInventoryItem('PROD001');
            const availableBefore = inventoryBefore.getAvailableStock();
            
            app.addToCart('user123', 'PROD001', 2);
            
            const inventoryAfter = app.inventoryManager.getInventoryItem('PROD001');
            expect(inventoryAfter.getAvailableStock()).to.equal(availableBefore - 2);
        });

        it('should reject non-existent product', function() {
            const result = app.addToCart('user123', 'NONEXISTENT', 1);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Product not found');
        });

        it('should reject insufficient stock', function() {
            const result = app.addToCart('user123', 'PROD001', 10000);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Insufficient stock');
        });

        it('should add multiple quantities', function() {
            app.addToCart('user123', 'PROD001', 3);
            const cart = app.getCart('user123');
            const item = cart.getItem('PROD001');
            expect(item.quantity).to.equal(3);
        });

        it('should use default quantity of 1', function() {
            app.addToCart('user123', 'PROD001');
            const cart = app.getCart('user123');
            const item = cart.getItem('PROD001');
            expect(item.quantity).to.equal(1);
        });
    });

    describe('removeFromCart()', function() {
        beforeEach(function() {
            app.initialize();
            app.addToCart('user123', 'PROD001', 2);
        });

        it('should remove item from cart', function() {
            const result = app.removeFromCart('user123', 'PROD001');
            expect(result).to.be.true;
        });

        it('should release reserved stock', function() {
            const inventoryBefore = app.inventoryManager.getInventoryItem('PROD001');
            const reservedBefore = inventoryBefore.reservedStock;
            
            app.removeFromCart('user123', 'PROD001');
            
            const inventoryAfter = app.inventoryManager.getInventoryItem('PROD001');
            expect(inventoryAfter.reservedStock).to.equal(reservedBefore - 2);
        });

        it('should return false for non-existent cart', function() {
            const result = app.removeFromCart('nonexistent', 'PROD001');
            expect(result).to.be.false;
        });

        it('should return false for non-existent item', function() {
            const result = app.removeFromCart('user123', 'NONEXISTENT');
            expect(result).to.be.false;
        });
    });

    describe('updateCartQuantity()', function() {
        beforeEach(function() {
            app.initialize();
            app.addToCart('user123', 'PROD001', 2);
        });

        it('should update quantity', function() {
            const result = app.updateCartQuantity('user123', 'PROD001', 5);
            expect(result.success).to.be.true;
            
            const cart = app.getCart('user123');
            const item = cart.getItem('PROD001');
            expect(item.quantity).to.equal(5);
        });

        it('should reserve additional stock when increasing', function() {
            const inventoryBefore = app.inventoryManager.getInventoryItem('PROD001');
            const reservedBefore = inventoryBefore.reservedStock;
            
            app.updateCartQuantity('user123', 'PROD001', 5);
            
            const inventoryAfter = app.inventoryManager.getInventoryItem('PROD001');
            expect(inventoryAfter.reservedStock).to.equal(reservedBefore + 3);
        });

        it('should release stock when decreasing', function() {
            const inventoryBefore = app.inventoryManager.getInventoryItem('PROD001');
            const reservedBefore = inventoryBefore.reservedStock;
            
            app.updateCartQuantity('user123', 'PROD001', 1);
            
            const inventoryAfter = app.inventoryManager.getInventoryItem('PROD001');
            expect(inventoryAfter.reservedStock).to.equal(reservedBefore - 1);
        });

        it('should reject insufficient stock for increase', function() {
            const result = app.updateCartQuantity('user123', 'PROD001', 10000);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Insufficient stock');
        });

        it('should reject non-existent cart', function() {
            const result = app.updateCartQuantity('nonexistent', 'PROD001', 3);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Cart not found');
        });

        it('should reject non-existent item', function() {
            const result = app.updateCartQuantity('user123', 'NONEXISTENT', 3);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Item not in cart');
        });
    });

    describe('applyCoupon()', function() {
        beforeEach(function() {
            app.initialize();
            app.addToCart('user123', 'PROD001', 1); // $79.99
        });

        it('should apply valid coupon', function() {
            const result = app.applyCoupon('user123', 'SAVE10');
            expect(result.success).to.be.true;
        });

        it('should reject non-existent cart', function() {
            const result = app.applyCoupon('nonexistent', 'SAVE10');
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Cart not found');
        });

        it('should reject invalid coupon', function() {
            const result = app.applyCoupon('user123', 'INVALIDCOUPON');
            expect(result.success).to.be.false;
        });
    });

    describe('checkout()', function() {
        const validAddress = {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
        };

        beforeEach(function() {
            app.initialize();
            app.addToCart('user123', 'PROD001', 1);
            const cart = app.getCart('user123');
            cart.setShippingAddress(validAddress);
            cart.setBillingAddress(validAddress);
        });

        it('should complete checkout with valid payment', function() {
            const paymentDetails = {
                method: PaymentMethod.CREDIT_CARD,
                cardNumber: '4532015112830366',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'John Doe'
            };

            const result = app.checkout('user123', paymentDetails);
            expect(result.success).to.be.true;
            expect(result.order).to.not.be.null;
        });

        it('should update inventory on checkout', function() {
            const paymentDetails = {
                method: PaymentMethod.CASH_ON_DELIVERY
            };

            app.checkout('user123', paymentDetails);
            // Inventory is updated (reserved becomes confirmed sale)
            const inventory = app.inventoryManager.getInventoryItem('PROD001');
            expect(inventory.reservedStock).to.equal(0); // Reserved is cleared after sale
        });

        it('should record coupon usage', function() {
            app.applyCoupon('user123', 'FLAT5');
            
            const paymentDetails = {
                method: PaymentMethod.CASH_ON_DELIVERY
            };

            app.checkout('user123', paymentDetails);
            
            const coupon = app.discountManager.getCoupon('FLAT5');
            expect(coupon.usageCount).to.be.greaterThan(0);
        });

        it('should reject empty cart', function() {
            const newCart = app.getCart('newuser');
            newCart.setShippingAddress(validAddress);
            newCart.setBillingAddress(validAddress);
            
            const result = app.checkout('newuser', { method: PaymentMethod.CASH_ON_DELIVERY });
            expect(result.success).to.be.false;
        });

        it('should reject non-existent cart', function() {
            const result = app.checkout('nonexistent', { method: PaymentMethod.CASH_ON_DELIVERY });
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Cart not found');
        });

        it('should reject invalid payment', function() {
            const paymentDetails = {
                method: PaymentMethod.CREDIT_CARD,
                cardNumber: 'invalid',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'John Doe'
            };

            const result = app.checkout('user123', paymentDetails);
            expect(result.success).to.be.false;
        });

        it('should release stock on payment failure', function() {
            const inventoryBefore = app.inventoryManager.getInventoryItem('PROD001');
            const reservedBefore = inventoryBefore.reservedStock;
            
            const paymentDetails = {
                method: PaymentMethod.CREDIT_CARD,
                cardNumber: '4532015112830366',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'John Doe',
                simulateFail: true
            };

            app.checkout('user123', paymentDetails);
            
            const inventoryAfter = app.inventoryManager.getInventoryItem('PROD001');
            expect(inventoryAfter.reservedStock).to.equal(0);
        });
    });

    describe('getOrder()', function() {
        beforeEach(function() {
            app.initialize();
        });

        it('should return order by ID', function() {
            app.addToCart('user123', 'PROD001', 1);
            const cart = app.getCart('user123');
            cart.setShippingAddress({ street: '123 Main', city: 'NYC', state: 'NY', zipCode: '10001', country: 'USA' });
            cart.setBillingAddress({ street: '123 Main', city: 'NYC', state: 'NY', zipCode: '10001', country: 'USA' });
            
            const checkoutResult = app.checkout('user123', { method: PaymentMethod.CASH_ON_DELIVERY });
            const order = app.getOrder(checkoutResult.order.orderId);
            
            expect(order).to.equal(checkoutResult.order);
        });

        it('should return null for non-existent order', function() {
            const order = app.getOrder('NONEXISTENT');
            expect(order).to.be.null;
        });
    });

    describe('getUserOrders()', function() {
        beforeEach(function() {
            app.initialize();
        });

        it('should return all user orders', function() {
            // Create first order
            app.addToCart('user123', 'PROD001', 1);
            let cart = app.getCart('user123');
            cart.setShippingAddress({ street: '123 Main', city: 'NYC', state: 'NY', zipCode: '10001', country: 'USA' });
            cart.setBillingAddress({ street: '123 Main', city: 'NYC', state: 'NY', zipCode: '10001', country: 'USA' });
            app.checkout('user123', { method: PaymentMethod.CASH_ON_DELIVERY });

            // Create second order (need new cart after checkout)
            app.addToCart('user123', 'PROD002', 1);
            cart = app.getCart('user123');
            cart.setShippingAddress({ street: '123 Main', city: 'NYC', state: 'NY', zipCode: '10001', country: 'USA' });
            cart.setBillingAddress({ street: '123 Main', city: 'NYC', state: 'NY', zipCode: '10001', country: 'USA' });
            app.checkout('user123', { method: PaymentMethod.CASH_ON_DELIVERY });

            const orders = app.getUserOrders('user123');
            expect(orders.length).to.be.greaterThanOrEqual(1);
        });

        it('should return empty array for user without orders', function() {
            const orders = app.getUserOrders('noorders');
            expect(orders).to.be.an('array').that.is.empty;
        });
    });

    describe('cancelOrder()', function() {
        let orderId;
        const validAddress = {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
        };

        beforeEach(function() {
            app.initialize();
            app.addToCart('user123', 'PROD001', 2);
            const cart = app.getCart('user123');
            cart.setShippingAddress(validAddress);
            cart.setBillingAddress(validAddress);
            const result = app.checkout('user123', { method: PaymentMethod.CASH_ON_DELIVERY });
            orderId = result.order.orderId;
        });

        it('should cancel order', function() {
            const result = app.cancelOrder(orderId, 'Changed my mind');
            expect(result.success).to.be.true;
        });

        it('should return items to inventory', function() {
            const inventoryBefore = app.inventoryManager.getInventoryItem('PROD001');
            const stockBefore = inventoryBefore.currentStock;
            
            app.cancelOrder(orderId);
            
            const inventoryAfter = app.inventoryManager.getInventoryItem('PROD001');
            expect(inventoryAfter.currentStock).to.equal(stockBefore + 2);
        });

        it('should reject non-existent order', function() {
            const result = app.cancelOrder('NONEXISTENT');
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Order not found');
        });
    });

    describe('getProductDetails()', function() {
        beforeEach(function() {
            app.initialize();
        });

        it('should return product with pricing', function() {
            const details = app.getProductDetails('PROD001');
            expect(details).to.not.be.null;
            expect(details.id).to.equal('PROD001');
            expect(details.pricing).to.not.be.null;
            expect(details.availableStock).to.be.a('number');
            expect(details.inStock).to.be.a('boolean');
        });

        it('should return null for non-existent product', function() {
            const details = app.getProductDetails('NONEXISTENT');
            expect(details).to.be.null;
        });

        it('should include inventory information', function() {
            const details = app.getProductDetails('PROD001');
            expect(details.availableStock).to.be.greaterThan(0);
            expect(details.inStock).to.be.true;
        });
    });

    describe('searchProducts()', function() {
        beforeEach(function() {
            app.initialize();
        });

        it('should search products by name', function() {
            const results = app.searchProducts('Headphones');
            expect(results.length).to.be.greaterThan(0);
        });

        it('should return empty for no matches', function() {
            const results = app.searchProducts('XYZNONEXISTENT');
            expect(results).to.be.an('array').that.is.empty;
        });

        it('should include pricing info', function() {
            const results = app.searchProducts('Headphones');
            if (results.length > 0) {
                expect(results[0].pricing).to.not.be.null;
            }
        });
    });

    describe('getProductsByCategory()', function() {
        beforeEach(function() {
            app.initialize();
        });

        it('should get products by category', function() {
            const results = app.getProductsByCategory('Electronics');
            expect(results.length).to.be.greaterThan(0);
            results.forEach(product => {
                expect(product.category).to.equal('Electronics');
            });
        });

        it('should return empty for non-existent category', function() {
            const results = app.getProductsByCategory('NonExistentCategory');
            expect(results).to.be.an('array').that.is.empty;
        });
    });

    describe('getDashboardStats()', function() {
        beforeEach(function() {
            app.initialize();
        });

        it('should return complete statistics', function() {
            const stats = app.getDashboardStats();
            
            expect(stats.products).to.not.be.null;
            expect(stats.products.total).to.be.greaterThan(0);
            expect(stats.products.categories).to.be.an('array');
            
            expect(stats.inventory).to.not.be.null;
            expect(stats.orders).to.not.be.null;
            expect(stats.users).to.not.be.null;
            expect(stats.carts).to.not.be.null;
            expect(stats.discounts).to.not.be.null;
        });

        it('should have correct product count', function() {
            const stats = app.getDashboardStats();
            expect(stats.products.total).to.equal(10); // 10 sample products
        });
    });

    describe('processReturn()', function() {
        let orderId;
        const validAddress = {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
        };

        beforeEach(function() {
            app.initialize();
            app.addToCart('user123', 'PROD001', 2);
            const cart = app.getCart('user123');
            cart.setShippingAddress(validAddress);
            cart.setBillingAddress(validAddress);
            const result = app.checkout('user123', { method: PaymentMethod.CASH_ON_DELIVERY });
            orderId = result.order.orderId;
        });

        it('should process return for delivered order', function() {
            const order = app.getOrder(orderId);
            order.updateStatus(OrderStatus.PROCESSING);
            order.updateStatus(OrderStatus.SHIPPED);
            order.updateStatus(OrderStatus.DELIVERED);
            
            const result = app.processReturn(orderId, 'PROD001', 1);
            expect(result.success).to.be.true;
            expect(result.refundAmount).to.be.greaterThan(0);
        });

        it('should reject return for non-delivered order', function() {
            const result = app.processReturn(orderId, 'PROD001', 1);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Can only return delivered orders');
        });

        it('should reject non-existent order', function() {
            const result = app.processReturn('NONEXISTENT', 'PROD001', 1);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Order not found');
        });

        it('should reject non-existent product in order', function() {
            const order = app.getOrder(orderId);
            order.status = OrderStatus.DELIVERED;
            
            const result = app.processReturn(orderId, 'NONEXISTENT', 1);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Product not found in order');
        });

        it('should reject excessive return quantity', function() {
            const order = app.getOrder(orderId);
            order.status = OrderStatus.DELIVERED;
            
            const result = app.processReturn(orderId, 'PROD001', 100);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Return quantity exceeds ordered quantity');
        });
    });

    describe('getLowStockAlerts()', function() {
        beforeEach(function() {
            app.initialize();
        });

        it('should return alerts with product info', function() {
            // Trigger low stock by setting reorder point high
            const item = app.inventoryManager.getInventoryItem('PROD003'); // stock: 75
            if (item) {
                item.reorderPoint = 100; // Set threshold above stock
            }
            
            const alerts = app.getLowStockAlerts();
            expect(alerts).to.be.an('array');
        });

        it('should return empty array when no alerts', function() {
            const alerts = app.getLowStockAlerts();
            expect(alerts).to.be.an('array');
        });
    });

    describe('restockProduct()', function() {
        beforeEach(function() {
            app.initialize();
        });

        it('should restock product', function() {
            const before = app.inventoryManager.getInventoryItem('PROD001').currentStock;
            
            const result = app.restockProduct('PROD001', 50, 'PO-123');
            expect(result.success).to.be.true;
            
            const after = app.inventoryManager.getInventoryItem('PROD001').currentStock;
            expect(after).to.equal(before + 50);
        });

        it('should reject non-existent product', function() {
            const result = app.restockProduct('NONEXISTENT', 50);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Product not found');
        });

        it('should update product stock', function() {
            const product = app.productCatalog.getProduct('PROD001');
            const before = product.stock;
            
            app.restockProduct('PROD001', 25);
            
            expect(product.stock).to.equal(before + 25);
        });
    });

    describe('_createSampleProducts()', function() {
        it('should create all sample products', function() {
            app.initialize();
            
            expect(app.productCatalog.getProduct('PROD001')).to.not.be.null;
            expect(app.productCatalog.getProduct('PROD002')).to.not.be.null;
            expect(app.productCatalog.getProduct('PROD003')).to.not.be.null;
            expect(app.productCatalog.getProduct('PROD004')).to.not.be.null;
            expect(app.productCatalog.getProduct('PROD005')).to.not.be.null;
            expect(app.productCatalog.getProduct('PROD006')).to.not.be.null;
            expect(app.productCatalog.getProduct('PROD007')).to.not.be.null;
            expect(app.productCatalog.getProduct('PROD008')).to.not.be.null;
            expect(app.productCatalog.getProduct('PROD009')).to.not.be.null;
            expect(app.productCatalog.getProduct('PROD010')).to.not.be.null;
        });

        it('should set correct categories', function() {
            app.initialize();
            
            expect(app.productCatalog.getProduct('PROD001').category).to.equal('Electronics');
            expect(app.productCatalog.getProduct('PROD004').category).to.equal('Clothing');
            expect(app.productCatalog.getProduct('PROD006').category).to.equal('Shoes');
        });
    });

    describe('_createSampleCoupons()', function() {
        it('should create all sample coupons', function() {
            app.initialize();
            
            expect(app.discountManager.getCoupon('SAVE10')).to.not.be.null;
            expect(app.discountManager.getCoupon('FLAT5')).to.not.be.null;
            expect(app.discountManager.getCoupon('FREESHIP')).to.not.be.null;
            expect(app.discountManager.getCoupon('PREMIUM20')).to.not.be.null;
        });

        it('should set correct coupon types', function() {
            app.initialize();
            
            expect(app.discountManager.getCoupon('SAVE10').discountType).to.equal(DiscountType.PERCENTAGE);
            expect(app.discountManager.getCoupon('FLAT5').discountType).to.equal(DiscountType.FIXED_AMOUNT);
            expect(app.discountManager.getCoupon('FREESHIP').discountType).to.equal(DiscountType.FREE_SHIPPING);
        });
    });

    describe('_createSamplePromotions()', function() {
        it('should create all sample promotions', function() {
            app.initialize();
            
            const promo1 = app.discountManager.getPromotion('PROMO001');
            const promo2 = app.discountManager.getPromotion('PROMO002');
            
            expect(promo1).to.not.be.null;
            expect(promo2).to.not.be.null;
        });

        it('should set correct promotion categories', function() {
            app.initialize();
            
            const promo1 = app.discountManager.getPromotion('PROMO001');
            expect(promo1.applicableCategories).to.include('Electronics');
        });
    });

    describe('Full E2E Shopping Flow', function() {
        it('should complete full shopping experience', function() {
            app.initialize();
            
            // Register and login
            const regResult = app.registerUser('shopper@test.com', 'SecurePass123', 'Test', 'Shopper');
            regResult.user.verifyAccount(regResult.verificationToken);
            const loginResult = app.login('shopper@test.com', 'SecurePass123');
            expect(loginResult.success).to.be.true;
            
            const userId = regResult.user.id;
            
            // Browse products
            const electronics = app.getProductsByCategory('Electronics');
            expect(electronics.length).to.be.greaterThan(0);
            
            // Add to cart
            const addResult = app.addToCart(userId, 'PROD001', 1);
            expect(addResult.success).to.be.true;
            
            // Apply coupon
            const couponResult = app.applyCoupon(userId, 'SAVE10');
            expect(couponResult.success).to.be.true;
            
            // Setup addresses
            const cart = app.getCart(userId);
            const address = { street: '456 Shop St', city: 'Boston', state: 'MA', zipCode: '02101', country: 'USA' };
            cart.setShippingAddress(address);
            cart.setBillingAddress(address);
            
            // Checkout
            const checkoutResult = app.checkout(userId, {
                method: PaymentMethod.CREDIT_CARD,
                cardNumber: '4532015112830366',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'Test Shopper'
            });
            expect(checkoutResult.success).to.be.true;
            
            // Verify order
            const orders = app.getUserOrders(userId);
            expect(orders.length).to.be.greaterThan(0);
            
            // Check dashboard stats
            const stats = app.getDashboardStats();
            expect(stats.orders.totalOrders).to.be.greaterThan(0);
            
            // Logout
            const logoutResult = app.logout(loginResult.session.sessionId);
            expect(logoutResult).to.be.true;
        });
    });
});

// Test module exports
describe('Module Exports', function() {
    it('should export ECommerceApp', function() {
        expect(ECommerceApp).to.be.a('function');
    });

    it('should export Product classes', function() {
        expect(Product).to.be.a('function');
        expect(ProductCatalog).to.be.a('function');
    });

    it('should export Cart classes', function() {
        expect(ShoppingCart).to.be.a('function');
        expect(CartManager).to.be.a('function');
    });

    it('should export Order classes', function() {
        expect(Order).to.be.a('function');
        expect(OrderStatus).to.be.an('object');
        expect(PaymentStatus).to.be.an('object');
        expect(PaymentMethod).to.be.an('object');
    });

    it('should export User classes', function() {
        expect(User).to.be.a('function');
        expect(UserRole).to.be.an('object');
        expect(AccountStatus).to.be.an('object');
    });

    it('should export Inventory classes', function() {
        expect(InventoryItem).to.be.a('function');
        expect(MovementType).to.be.an('object');
        expect(AlertType).to.be.an('object');
    });

    it('should export Discount classes', function() {
        expect(Coupon).to.be.a('function');
        expect(Promotion).to.be.a('function');
        expect(DiscountType).to.be.an('object');
        expect(CouponStatus).to.be.an('object');
    });
});
