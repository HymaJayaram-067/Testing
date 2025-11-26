/**
 * Shopping Cart Module Tests
 * Comprehensive test suite for mutation testing
 */

const { expect } = require('chai');
const { CartItem, ShoppingCart, CartManager } = require('../src/cart');
const { Product } = require('../src/product');

describe('CartItem', function() {
    let product;

    beforeEach(function() {
        product = new Product('P001', 'Test Product', 29.99, 'Electronics', 100);
    });

    describe('Constructor', function() {
        it('should create cart item with product', function() {
            const item = new CartItem(product, 2);
            expect(item.productId).to.equal('P001');
            expect(item.productName).to.equal('Test Product');
            expect(item.unitPrice).to.equal(29.99);
            expect(item.quantity).to.equal(2);
        });

        it('should default quantity to 1', function() {
            const item = new CartItem(product);
            expect(item.quantity).to.equal(1);
        });

        it('should use discounted price', function() {
            product.setDiscount(10);
            const item = new CartItem(product, 1);
            expect(item.discountedPrice).to.be.lessThan(29.99);
        });
    });

    describe('getSubtotal()', function() {
        it('should calculate subtotal correctly', function() {
            const item = new CartItem(product, 3);
            expect(item.getSubtotal()).to.be.closeTo(89.97, 0.01);
        });

        it('should use discounted price', function() {
            product.setDiscount(50);
            const item = new CartItem(product, 2);
            // Discounted price is ~15 * 2 = ~30
            expect(item.getSubtotal()).to.be.closeTo(30, 0.5);
        });
    });

    describe('getSavings()', function() {
        it('should return 0 when no discount', function() {
            const item = new CartItem(product, 2);
            expect(item.getSavings()).to.equal(0);
        });

        it('should calculate savings with discount', function() {
            product.setDiscount(20);
            const item = new CartItem(product, 2);
            // 29.99 * 2 = 59.98, discounted = ~48, savings = ~12
            expect(item.getSavings()).to.be.greaterThan(0);
        });
    });

    describe('setQuantity()', function() {
        it('should set valid quantity', function() {
            const item = new CartItem(product, 1);
            expect(item.setQuantity(5)).to.be.true;
            expect(item.quantity).to.equal(5);
        });

        it('should reject zero quantity', function() {
            const item = new CartItem(product, 3);
            expect(item.setQuantity(0)).to.be.false;
            expect(item.quantity).to.equal(3);
        });

        it('should reject negative quantity', function() {
            const item = new CartItem(product, 3);
            expect(item.setQuantity(-1)).to.be.false;
        });

        it('should reject non-integer quantity', function() {
            const item = new CartItem(product, 3);
            expect(item.setQuantity(2.5)).to.be.false;
        });

        it('should reject non-numeric quantity', function() {
            const item = new CartItem(product, 3);
            expect(item.setQuantity('five')).to.be.false;
        });
    });

    describe('incrementQuantity()', function() {
        it('should increment by default of 1', function() {
            const item = new CartItem(product, 2);
            expect(item.incrementQuantity()).to.be.true;
            expect(item.quantity).to.equal(3);
        });

        it('should increment by specified amount', function() {
            const item = new CartItem(product, 2);
            expect(item.incrementQuantity(5)).to.be.true;
            expect(item.quantity).to.equal(7);
        });

        it('should reject negative amount', function() {
            const item = new CartItem(product, 2);
            expect(item.incrementQuantity(-1)).to.be.false;
        });

        it('should reject non-integer amount', function() {
            const item = new CartItem(product, 2);
            expect(item.incrementQuantity(1.5)).to.be.false;
        });
    });

    describe('decrementQuantity()', function() {
        it('should decrement by default of 1', function() {
            const item = new CartItem(product, 3);
            expect(item.decrementQuantity()).to.be.true;
            expect(item.quantity).to.equal(2);
        });

        it('should not allow decrement below 1', function() {
            const item = new CartItem(product, 2);
            expect(item.decrementQuantity(2)).to.be.false;
            expect(item.quantity).to.equal(2);
        });

        it('should reject invalid amounts', function() {
            const item = new CartItem(product, 5);
            expect(item.decrementQuantity(-1)).to.be.false;
            expect(item.decrementQuantity(0)).to.be.false;
            expect(item.decrementQuantity(1.5)).to.be.false;
        });
    });

    describe('toJSON()', function() {
        it('should return complete item data', function() {
            const item = new CartItem(product, 2);
            const json = item.toJSON();
            expect(json.productId).to.equal('P001');
            expect(json.quantity).to.equal(2);
            expect(json.subtotal).to.be.closeTo(59.98, 0.01);
            expect(json).to.have.property('savings');
            expect(json).to.have.property('addedAt');
        });
    });
});

describe('ShoppingCart', function() {
    let cart;
    let product1, product2;

    beforeEach(function() {
        cart = new ShoppingCart('user123');
        product1 = new Product('P001', 'Product One', 29.99, 'Electronics', 100);
        product2 = new Product('P002', 'Product Two', 49.99, 'Electronics', 50);
    });

    describe('Constructor', function() {
        it('should create cart with user ID', function() {
            expect(cart.userId).to.equal('user123');
            expect(cart.cartId).to.be.a('string');
            expect(cart.status).to.equal('active');
        });

        it('should use provided cart ID', function() {
            const customCart = new ShoppingCart('user1', 'CUSTOM-ID');
            expect(customCart.cartId).to.equal('CUSTOM-ID');
        });
    });

    describe('addItem()', function() {
        it('should add product to cart', function() {
            const result = cart.addItem(product1, 2);
            expect(result.success).to.be.true;
            expect(cart.getItemCount()).to.equal(2);
        });

        it('should reject non-Product object', function() {
            const result = cart.addItem({ id: 'P001' }, 1);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Invalid product');
        });

        it('should reject inactive product', function() {
            product1.deactivate();
            const result = cart.addItem(product1, 1);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Product is not available');
        });

        it('should reject invalid quantity', function() {
            expect(cart.addItem(product1, 0).success).to.be.false;
            expect(cart.addItem(product1, -1).success).to.be.false;
            expect(cart.addItem(product1, 1.5).success).to.be.false;
            expect(cart.addItem(product1, 'one').success).to.be.false;
        });

        it('should reject when insufficient stock', function() {
            const result = cart.addItem(product1, 150);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Insufficient stock');
        });

        it('should increment quantity for existing item', function() {
            cart.addItem(product1, 2);
            cart.addItem(product1, 3);
            expect(cart.getItemCount()).to.equal(5);
            expect(cart.getUniqueItemCount()).to.equal(1);
        });

        it('should check combined quantity against stock', function() {
            cart.addItem(product1, 90);
            const result = cart.addItem(product1, 20); // Total would be 110, stock is 100
            expect(result.success).to.be.false;
            expect(result.message).to.include('Insufficient stock');
        });

        it('should reject when cart is not active', function() {
            cart.markAsCheckedOut();
            const result = cart.addItem(product1, 1);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Cart is not active');
        });
    });

    describe('removeItem()', function() {
        it('should remove existing item', function() {
            cart.addItem(product1, 2);
            expect(cart.removeItem('P001')).to.be.true;
            expect(cart.getItemCount()).to.equal(0);
        });

        it('should return false for non-existent item', function() {
            expect(cart.removeItem('NONEXISTENT')).to.be.false;
        });

        it('should return false when cart not active', function() {
            cart.addItem(product1, 1);
            cart.markAsCheckedOut();
            expect(cart.removeItem('P001')).to.be.false;
        });
    });

    describe('updateItemQuantity()', function() {
        beforeEach(function() {
            cart.addItem(product1, 3);
        });

        it('should update quantity', function() {
            const result = cart.updateItemQuantity('P001', 5, product1);
            expect(result.success).to.be.true;
            expect(cart.getItemCount()).to.equal(5);
        });

        it('should remove item when quantity is 0', function() {
            const result = cart.updateItemQuantity('P001', 0);
            expect(result.success).to.be.true;
            expect(result.message).to.equal('Item removed from cart');
            expect(cart.getItemCount()).to.equal(0);
        });

        it('should check stock when product provided', function() {
            const result = cart.updateItemQuantity('P001', 150, product1);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Insufficient stock');
        });

        it('should return error for non-existent item', function() {
            const result = cart.updateItemQuantity('NONEXISTENT', 5);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Item not found in cart');
        });

        it('should return error when cart not active', function() {
            cart.markAsCheckedOut();
            const result = cart.updateItemQuantity('P001', 5);
            expect(result.success).to.be.false;
        });
    });

    describe('getItem()', function() {
        it('should return existing item', function() {
            cart.addItem(product1, 2);
            const item = cart.getItem('P001');
            expect(item).to.not.be.null;
            expect(item.productId).to.equal('P001');
        });

        it('should return null for non-existent item', function() {
            expect(cart.getItem('NONEXISTENT')).to.be.null;
        });
    });

    describe('getSubtotal()', function() {
        it('should calculate total of all items', function() {
            cart.addItem(product1, 2); // 29.99 * 2 = 59.98
            cart.addItem(product2, 1); // 49.99
            expect(cart.getSubtotal()).to.be.closeTo(109.97, 0.01);
        });

        it('should return 0 for empty cart', function() {
            expect(cart.getSubtotal()).to.equal(0);
        });
    });

    describe('calculateTax()', function() {
        it('should calculate tax correctly', function() {
            cart.addItem(product1, 1); // 29.99
            const tax = cart.calculateTax(10);
            expect(tax).to.be.closeTo(3.00, 0.01);
        });

        it('should return 0 for invalid tax rate', function() {
            cart.addItem(product1, 1);
            expect(cart.calculateTax(-5)).to.equal(0);
            expect(cart.calculateTax(150)).to.equal(0);
            expect(cart.calculateTax('ten')).to.equal(0);
        });
    });

    describe('calculateShipping()', function() {
        it('should return base rate for small orders', function() {
            cart.addItem(product1, 1); // 29.99
            const shipping = cart.calculateShipping({ baseRate: 5.99, freeShippingThreshold: 50 });
            expect(shipping).to.equal(5.99);
        });

        it('should return 0 for orders above free shipping threshold', function() {
            cart.addItem(product1, 2); // 59.98
            const shipping = cart.calculateShipping({ freeShippingThreshold: 50 });
            expect(shipping).to.equal(0);
        });

        it('should add per-item rate', function() {
            cart.addItem(product1, 2);
            const shipping = cart.calculateShipping({ 
                baseRate: 5, 
                perItemRate: 1, 
                freeShippingThreshold: 100 
            });
            expect(shipping).to.equal(7); // 5 + 2*1
        });
    });

    describe('getTotal()', function() {
        it('should calculate total with tax and shipping', function() {
            cart.addItem(product1, 2); // 59.98
            const total = cart.getTotal(10, { baseRate: 5, freeShippingThreshold: 100 });
            // 59.98 + 5.998 tax + 5 shipping = ~71
            expect(total).to.be.closeTo(71, 1);
        });
    });

    describe('applyCoupon()', function() {
        const couponDatabase = {
            'SAVE10': { discount: 10, minPurchase: 25, expiresAt: new Date(Date.now() + 86400000) },
            'EXPIRED': { discount: 20, expiresAt: new Date(Date.now() - 86400000) }
        };

        beforeEach(function() {
            cart.addItem(product1, 2); // 59.98
        });

        it('should apply valid coupon', function() {
            const result = cart.applyCoupon('SAVE10', couponDatabase);
            expect(result.success).to.be.true;
            expect(cart.couponCode).to.equal('SAVE10');
            expect(cart.couponDiscount).to.equal(10);
        });

        it('should reject non-existent coupon', function() {
            const result = cart.applyCoupon('INVALID', couponDatabase);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Coupon not found');
        });

        it('should reject expired coupon', function() {
            const result = cart.applyCoupon('EXPIRED', couponDatabase);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Coupon has expired');
        });

        it('should reject when below minimum purchase', function() {
            const lowValueCoupon = { 'HIGH': { discount: 10, minPurchase: 100 } };
            const result = cart.applyCoupon('HIGH', lowValueCoupon);
            expect(result.success).to.be.false;
            expect(result.message).to.include('Minimum purchase');
        });

        it('should reject invalid coupon code', function() {
            expect(cart.applyCoupon('', couponDatabase).success).to.be.false;
            expect(cart.applyCoupon(null, couponDatabase).success).to.be.false;
        });

        it('should convert code to uppercase', function() {
            const result = cart.applyCoupon('save10', couponDatabase);
            expect(result.success).to.be.true;
        });
    });

    describe('removeCoupon()', function() {
        it('should remove applied coupon', function() {
            cart.couponCode = 'TEST';
            cart.couponDiscount = 10;
            expect(cart.removeCoupon()).to.be.true;
            expect(cart.couponCode).to.be.null;
            expect(cart.couponDiscount).to.equal(0);
        });

        it('should return false when no coupon applied', function() {
            expect(cart.removeCoupon()).to.be.false;
        });
    });

    describe('setShippingAddress() / setBillingAddress()', function() {
        const validAddress = {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
        };

        it('should set valid shipping address', function() {
            const result = cart.setShippingAddress(validAddress);
            expect(result.success).to.be.true;
            expect(cart.shippingAddress.street).to.equal('123 Main St');
        });

        it('should reject invalid address', function() {
            expect(cart.setShippingAddress(null).success).to.be.false;
            expect(cart.setShippingAddress({ street: '123 Main' }).success).to.be.false;
        });

        it('should set billing address same as shipping', function() {
            cart.setShippingAddress(validAddress);
            const result = cart.setBillingAddress(null, true);
            expect(result.success).to.be.true;
            expect(cart.billingAddress.street).to.equal('123 Main St');
        });

        it('should set separate billing address', function() {
            const result = cart.setBillingAddress(validAddress);
            expect(result.success).to.be.true;
        });
    });

    describe('setNotes()', function() {
        it('should set notes', function() {
            expect(cart.setNotes('Gift wrap please')).to.be.true;
            expect(cart.notes).to.equal('Gift wrap please');
        });

        it('should truncate long notes', function() {
            const longNote = 'A'.repeat(600);
            cart.setNotes(longNote);
            expect(cart.notes.length).to.equal(500);
        });

        it('should reject non-string', function() {
            expect(cart.setNotes(123)).to.be.false;
        });
    });

    describe('clear()', function() {
        it('should clear all cart data', function() {
            cart.addItem(product1, 2);
            cart.setNotes('Test');
            cart.clear();
            expect(cart.isEmpty()).to.be.true;
            expect(cart.notes).to.equal('');
            expect(cart.couponCode).to.be.null;
        });
    });

    describe('isEmpty()', function() {
        it('should return true for empty cart', function() {
            expect(cart.isEmpty()).to.be.true;
        });

        it('should return false when cart has items', function() {
            cart.addItem(product1, 1);
            expect(cart.isEmpty()).to.be.false;
        });
    });

    describe('validateForCheckout()', function() {
        const validAddress = {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
        };

        it('should pass validation for complete cart', function() {
            cart.addItem(product1, 1);
            cart.setShippingAddress(validAddress);
            cart.setBillingAddress(validAddress);
            const result = cart.validateForCheckout();
            expect(result.isValid).to.be.true;
        });

        it('should fail for empty cart', function() {
            cart.setShippingAddress(validAddress);
            cart.setBillingAddress(validAddress);
            const result = cart.validateForCheckout();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('Cart is empty');
        });

        it('should fail without shipping address', function() {
            cart.addItem(product1, 1);
            cart.setBillingAddress(validAddress);
            const result = cart.validateForCheckout();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('Shipping address is required');
        });

        it('should fail without billing address', function() {
            cart.addItem(product1, 1);
            cart.setShippingAddress(validAddress);
            const result = cart.validateForCheckout();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('Billing address is required');
        });

        it('should fail for inactive cart', function() {
            cart.addItem(product1, 1);
            cart.setShippingAddress(validAddress);
            cart.setBillingAddress(validAddress);
            cart.markAsCheckedOut();
            const result = cart.validateForCheckout();
            expect(result.isValid).to.be.false;
        });
    });

    describe('markAsCheckedOut() / abandon()', function() {
        it('should mark cart as checked out', function() {
            cart.markAsCheckedOut();
            expect(cart.status).to.equal('checked_out');
        });

        it('should mark cart as abandoned', function() {
            cart.abandon();
            expect(cart.status).to.equal('abandoned');
        });
    });

    describe('getTotalSavings()', function() {
        it('should calculate product discount savings', function() {
            product1.setDiscount(20);
            cart.addItem(product1, 2);
            const savings = cart.getTotalSavings();
            expect(savings).to.be.greaterThan(0);
        });

        it('should include coupon discount', function() {
            cart.addItem(product1, 2); // ~60
            cart.couponDiscount = 10; // 10% off = ~6
            const savings = cart.getTotalSavings();
            expect(savings).to.be.greaterThan(5);
        });
    });

    describe('getSubtotalAfterCoupon()', function() {
        it('should return subtotal when no coupon', function() {
            cart.addItem(product1, 2); // ~60
            expect(cart.getSubtotalAfterCoupon()).to.equal(cart.getSubtotal());
        });

        it('should apply coupon discount', function() {
            cart.addItem(product1, 2); // ~60
            cart.couponDiscount = 10; // 10% off
            const afterCoupon = cart.getSubtotalAfterCoupon();
            expect(afterCoupon).to.be.lessThan(cart.getSubtotal());
        });
    });

    describe('toJSON()', function() {
        it('should return complete cart data', function() {
            cart.addItem(product1, 2);
            const json = cart.toJSON();
            expect(json.cartId).to.equal(cart.cartId);
            expect(json.userId).to.equal('user123');
            expect(json.items.length).to.equal(1);
            expect(json.itemCount).to.equal(2);
        });
    });
});

describe('CartManager', function() {
    let manager;

    beforeEach(function() {
        manager = new CartManager();
    });

    describe('createCart()', function() {
        it('should create cart for user', function() {
            const cart = manager.createCart('user1');
            expect(cart).to.not.be.null;
            expect(cart.userId).to.equal('user1');
        });

        it('should return null for invalid user ID', function() {
            expect(manager.createCart('')).to.be.null;
            expect(manager.createCart(null)).to.be.null;
        });
    });

    describe('getCart()', function() {
        it('should return cart by ID', function() {
            const cart = manager.createCart('user1');
            expect(manager.getCart(cart.cartId)).to.equal(cart);
        });

        it('should return null for non-existent cart', function() {
            expect(manager.getCart('NONEXISTENT')).to.be.null;
        });
    });

    describe('getActiveCartForUser()', function() {
        it('should return most recent active cart', function() {
            const cart1 = manager.createCart('user1');
            cart1.markAsCheckedOut();
            const cart2 = manager.createCart('user1');
            expect(manager.getActiveCartForUser('user1')).to.equal(cart2);
        });

        it('should return null when no active cart', function() {
            expect(manager.getActiveCartForUser('nonexistent')).to.be.null;
        });
    });

    describe('getOrCreateCart()', function() {
        it('should return existing active cart', function() {
            const existing = manager.createCart('user1');
            const returned = manager.getOrCreateCart('user1');
            expect(returned).to.equal(existing);
        });

        it('should create new cart if none exists', function() {
            const cart = manager.getOrCreateCart('newuser');
            expect(cart).to.not.be.null;
            expect(cart.userId).to.equal('newuser');
        });
    });

    describe('removeCart()', function() {
        it('should remove existing cart', function() {
            const cart = manager.createCart('user1');
            expect(manager.removeCart(cart.cartId)).to.be.true;
            expect(manager.getCart(cart.cartId)).to.be.null;
        });

        it('should return false for non-existent cart', function() {
            expect(manager.removeCart('NONEXISTENT')).to.be.false;
        });
    });

    describe('getAllCartsForUser()', function() {
        it('should return all user carts', function() {
            manager.createCart('user1');
            manager.createCart('user1');
            const carts = manager.getAllCartsForUser('user1');
            expect(carts.length).to.equal(2);
        });

        it('should return empty array for user without carts', function() {
            expect(manager.getAllCartsForUser('noone')).to.be.an('array').that.is.empty;
        });
    });

    describe('getAbandonedCarts()', function() {
        it('should return inactive carts with items', function() {
            const cart = manager.createCart('user1');
            const product = new Product('P001', 'Test', 10, 'Cat', 100);
            cart.addItem(product, 1);
            // Manually set old date
            cart.updatedAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
            const abandoned = manager.getAbandonedCarts(24);
            expect(abandoned.length).to.equal(1);
        });

        it('should not return empty carts', function() {
            const cart = manager.createCart('user1');
            cart.updatedAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
            const abandoned = manager.getAbandonedCarts(24);
            expect(abandoned.length).to.equal(0);
        });
    });

    describe('cleanupOldCarts()', function() {
        it('should remove old non-active carts', function() {
            const cart = manager.createCart('user1');
            cart.markAsCheckedOut();
            cart.updatedAt = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
            const removed = manager.cleanupOldCarts(30);
            expect(removed).to.equal(1);
        });
    });

    describe('getStatistics()', function() {
        it('should return correct statistics', function() {
            const product = new Product('P001', 'Test', 50, 'Cat', 100);
            
            const cart1 = manager.createCart('user1');
            cart1.addItem(product, 2);
            
            const cart2 = manager.createCart('user2');
            cart2.addItem(product, 1);
            cart2.markAsCheckedOut();

            const stats = manager.getStatistics();
            expect(stats.totalCarts).to.equal(2);
            expect(stats.activeCarts).to.equal(1);
            expect(stats.checkedOutCarts).to.equal(1);
            expect(stats.totalItems).to.equal(3);
        });
    });
});
