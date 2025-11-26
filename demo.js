/**
 * Demo Script for E-Commerce Shopping Cart System
 * 
 * This script demonstrates the functionality of the E-Commerce system
 * Run with: node demo.js
 */

const { ECommerceApp } = require('./src/index');

console.log('='.repeat(60));
console.log('   E-Commerce Shopping Cart System - Demo');
console.log('='.repeat(60));
console.log();

// Initialize the application
const app = new ECommerceApp();
app.initialize();
console.log('✅ Application initialized with sample data\n');

// 1. Register a new user
console.log('-'.repeat(60));
console.log('1. USER REGISTRATION');
console.log('-'.repeat(60));
const registerResult = app.registerUser('john@example.com', 'SecurePass123!', 'John', 'Doe');
if (registerResult.success) {
    console.log(`✅ User registered successfully!`);
    console.log(`   Name: ${registerResult.user.firstName} ${registerResult.user.lastName}`);
    console.log(`   Email: ${registerResult.user.email}`);
    console.log(`   User ID: ${registerResult.user.id}`);
} else {
    console.log(`❌ Registration failed: ${registerResult.error}`);
}
console.log();

// 2. User login
console.log('-'.repeat(60));
console.log('2. USER LOGIN');
console.log('-'.repeat(60));
const loginResult = app.login('john@example.com', 'SecurePass123!');
if (loginResult.success) {
    console.log(`✅ Login successful!`);
    console.log(`   Session ID: ${loginResult.session.id.substring(0, 20)}...`);
} else {
    console.log(`❌ Login failed: ${loginResult.message || loginResult.error}`);
}
console.log();

// 3. Browse products
console.log('-'.repeat(60));
console.log('3. PRODUCT CATALOG');
console.log('-'.repeat(60));
const products = app.searchProducts('');
console.log(`📦 Available Products (${products.length} items):\n`);
products.forEach((p, i) => {
    if (p) {
        console.log(`   ${i + 1}. ${p.name}`);
        console.log(`      Price: $${p.price?.toFixed(2) || p.pricing?.originalPrice?.toFixed(2)} | Category: ${p.category} | Stock: ${p.availableStock}`);
    }
});
console.log();

// 4. Search by category
console.log('-'.repeat(60));
console.log('4. SEARCH BY CATEGORY (Electronics)');
console.log('-'.repeat(60));
const electronics = app.getProductsByCategory('Electronics');
console.log(`🔌 Electronics Products (${electronics.length} items):\n`);
electronics.forEach((p, i) => {
    if (p) {
        console.log(`   ${i + 1}. ${p.name} - $${p.price?.toFixed(2) || p.pricing?.originalPrice?.toFixed(2)}`);
    }
});
console.log();

// 5. Add items to cart
console.log('-'.repeat(60));
console.log('5. SHOPPING CART');
console.log('-'.repeat(60));
const userId = registerResult.user.id;

// Add multiple items
const cartResults = [
    app.addToCart(userId, 'PROD001', 2),  // 2x Headphones
    app.addToCart(userId, 'PROD004', 3),  // 3x T-Shirts
    app.addToCart(userId, 'PROD008', 1)   // 1x Coffee
];

console.log('🛒 Adding items to cart:');
cartResults.forEach((result, i) => {
    if (result.success) {
        console.log(`   ✅ Added item ${i + 1} successfully`);
    } else {
        console.log(`   ❌ Failed to add item ${i + 1}: ${result.message}`);
    }
});

// Get cart summary
const cart = app.getCart(userId);
if (cart) {
    const summary = cart.toJSON();
    console.log(`\n📋 Cart Summary:`);
    console.log(`   Total Items: ${summary.itemCount}`);
    console.log(`   Subtotal: $${summary.subtotal.toFixed(2)}`);
    console.log(`   Unique Products: ${summary.uniqueItemCount}`);
}
console.log();

// 6. Apply coupon
console.log('-'.repeat(60));
console.log('6. APPLY COUPON CODE');
console.log('-'.repeat(60));
const couponResult = app.applyCoupon(userId, 'SAVE10');
if (couponResult.success) {
    console.log(`🎫 Coupon "SAVE10" applied successfully!`);
    console.log(`   Discount: -$${couponResult.discount?.toFixed(2) || '0.00'}`);
    console.log(`   New Total: $${couponResult.newTotal?.toFixed(2) || cart.getTotal().toFixed(2)}`);
} else {
    console.log(`❌ Coupon failed: ${couponResult.message}`);
}
console.log();

// 7. Checkout with credit card
console.log('-'.repeat(60));
console.log('7. CHECKOUT & PAYMENT');
console.log('-'.repeat(60));

// First, set shipping and billing address on the cart
if (cart) {
    cart.setShippingAddress({
        name: 'John Doe',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
    });
    cart.setBillingAddress({
        name: 'John Doe',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
    });
}

const orderResult = app.checkout(userId, {
    method: 'credit_card',
    cardNumber: '4532015112830366',  // Valid test card number (passes Luhn)
    cardHolder: 'John Doe',
    expiryDate: '12/26',
    cvv: '123'
});

if (orderResult.success) {
    console.log(`✅ Order placed successfully!`);
    console.log(`   Order ID: ${orderResult.order.orderId || orderResult.order.id}`);
    console.log(`   Status: ${orderResult.order.status}`);
    console.log(`   Total: $${orderResult.order.totalAmount?.toFixed(2) || orderResult.order.total?.toFixed(2)}`);
    console.log(`   Payment: ${orderResult.order.paymentMethod}`);
} else {
    console.log(`❌ Checkout failed: ${orderResult.message}`);
}
console.log();

// 8. Check order history
console.log('-'.repeat(60));
console.log('8. ORDER HISTORY');
console.log('-'.repeat(60));
const orders = app.getUserOrders(userId);
console.log(`📜 Order History (${orders.length} orders):\n`);
orders.forEach((order, i) => {
    console.log(`   Order ${i + 1}:`);
    console.log(`   - ID: ${order.orderId || order.id}`);
    console.log(`   - Date: ${order.createdAt?.toLocaleDateString() || 'N/A'}`);
    console.log(`   - Status: ${order.status}`);
    console.log(`   - Total: $${order.totalAmount?.toFixed(2) || order.total?.toFixed(2)}`);
});
console.log();

// 9. Check inventory after order
console.log('-'.repeat(60));
console.log('9. INVENTORY STATUS');
console.log('-'.repeat(60));
console.log('📊 Inventory levels after order:\n');
['PROD001', 'PROD004', 'PROD008'].forEach(productId => {
    const item = app.inventoryManager.getInventoryItem(productId);
    if (item) {
        const product = app.productCatalog.getProduct(productId);
        console.log(`   ${product?.name || productId}:`);
        console.log(`   - Available: ${item.getAvailableStock?.() || item.availableQuantity || item.quantity}`);
        console.log(`   - Reserved: ${item.reservedQuantity || 0}`);
    }
});
console.log();

// 10. Dashboard statistics
console.log('-'.repeat(60));
console.log('10. DASHBOARD STATISTICS');
console.log('-'.repeat(60));
const stats = app.getDashboardStats();
console.log('📈 System Statistics:\n');
console.log(`   Products: ${stats.products.total} total`);
console.log(`   Users: ${stats.users.total} total, ${stats.users.active} active`);
console.log(`   Orders: ${stats.orders.total} total`);
console.log(`   Revenue: $${(stats.orders.totalRevenue || 0).toFixed(2)}`);
console.log(`   Active Coupons: ${stats.discounts.activeCoupons}`);
console.log();

console.log('='.repeat(60));
console.log('   Demo completed successfully!');
console.log('='.repeat(60));
console.log();
console.log('💡 Available Commands:');
console.log('   npm test        - Run all tests');
console.log('   npm run stryker - Run mutation testing');
console.log();
