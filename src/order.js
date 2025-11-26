/**
 * Order Processing Module
 * Handles order creation, status management, and payment processing
 */

const { ShoppingCart } = require('./cart');

/**
 * Order Status Enum
 */
const OrderStatus = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
};

/**
 * Payment Status Enum
 */
const PaymentStatus = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

/**
 * Payment Method Enum
 */
const PaymentMethod = {
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    PAYPAL: 'paypal',
    BANK_TRANSFER: 'bank_transfer',
    CASH_ON_DELIVERY: 'cash_on_delivery'
};

/**
 * Order Item class
 */
class OrderItem {
    constructor(cartItem) {
        this.productId = cartItem.productId;
        this.productName = cartItem.productName;
        this.unitPrice = cartItem.unitPrice;
        this.discountedPrice = cartItem.discountedPrice;
        this.quantity = cartItem.quantity;
        this.subtotal = cartItem.getSubtotal();
    }

    /**
     * Converts to JSON
     * @returns {Object} Order item data
     */
    toJSON() {
        return {
            productId: this.productId,
            productName: this.productName,
            unitPrice: this.unitPrice,
            discountedPrice: this.discountedPrice,
            quantity: this.quantity,
            subtotal: this.subtotal
        };
    }
}

/**
 * Order class - represents a complete order
 */
class Order {
    constructor(cart, taxRate = 0, shippingOptions = {}) {
        this.orderId = this._generateOrderId();
        this.userId = cart.userId;
        this.items = cart.getAllItems().map(item => new OrderItem(item));
        this.subtotal = cart.getSubtotal();
        this.couponCode = cart.couponCode;
        this.couponDiscount = cart.couponDiscount;
        this.subtotalAfterCoupon = cart.getSubtotalAfterCoupon();
        this.taxRate = taxRate;
        this.tax = cart.calculateTax(taxRate);
        this.shipping = cart.calculateShipping(shippingOptions);
        this.total = cart.getTotal(taxRate, shippingOptions);
        this.totalSavings = cart.getTotalSavings();
        this.shippingAddress = { ...cart.shippingAddress };
        this.billingAddress = { ...cart.billingAddress };
        this.notes = cart.notes;
        this.status = OrderStatus.PENDING;
        this.paymentStatus = PaymentStatus.PENDING;
        this.paymentMethod = null;
        this.paymentDetails = null;
        this.trackingNumber = null;
        this.carrier = null;
        this.estimatedDelivery = null;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.statusHistory = [{
            status: OrderStatus.PENDING,
            timestamp: new Date(),
            note: 'Order created'
        }];
    }

    /**
     * Generates a unique order ID
     * @returns {string} Unique order ID
     * @private
     */
    _generateOrderId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substr(2, 5).toUpperCase();
        return `ORD-${timestamp}-${random}`;
    }

    /**
     * Gets item count
     * @returns {number} Total item count
     */
    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    /**
     * Updates order status
     * @param {string} newStatus - New status from OrderStatus
     * @param {string} note - Optional note for the status change
     * @returns {Object} Result with success flag
     */
    updateStatus(newStatus, note = '') {
        const validStatuses = Object.values(OrderStatus);
        if (!validStatuses.includes(newStatus)) {
            return { success: false, message: 'Invalid status' };
        }

        // Validate status transitions
        const allowedTransitions = {
            [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
            [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
            [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
            [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
            [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
            [OrderStatus.CANCELLED]: [],
            [OrderStatus.REFUNDED]: []
        };

        if (!allowedTransitions[this.status].includes(newStatus)) {
            return { success: false, message: `Cannot transition from ${this.status} to ${newStatus}` };
        }

        this.status = newStatus;
        this.statusHistory.push({
            status: newStatus,
            timestamp: new Date(),
            note: note || `Status changed to ${newStatus}`
        });
        this.updatedAt = new Date();

        return { success: true, message: `Status updated to ${newStatus}` };
    }

    /**
     * Sets payment method
     * @param {string} method - Payment method from PaymentMethod
     * @returns {boolean} True if method was set
     */
    setPaymentMethod(method) {
        const validMethods = Object.values(PaymentMethod);
        if (!validMethods.includes(method)) {
            return false;
        }
        this.paymentMethod = method;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Processes payment
     * @param {Object} paymentDetails - Payment details
     * @returns {Object} Result with success flag
     */
    processPayment(paymentDetails) {
        if (!this.paymentMethod) {
            return { success: false, message: 'Payment method not set' };
        }

        if (this.paymentStatus === PaymentStatus.COMPLETED) {
            return { success: false, message: 'Payment already completed' };
        }

        if (this.status === OrderStatus.CANCELLED) {
            return { success: false, message: 'Cannot process payment for cancelled order' };
        }

        // Validate payment details based on method
        if (!this._validatePaymentDetails(paymentDetails)) {
            this.paymentStatus = PaymentStatus.FAILED;
            this.updatedAt = new Date();
            return { success: false, message: 'Invalid payment details' };
        }

        this.paymentStatus = PaymentStatus.PROCESSING;
        
        // Simulate payment processing
        const isSuccessful = this._simulatePaymentProcessing(paymentDetails);

        if (isSuccessful) {
            this.paymentStatus = PaymentStatus.COMPLETED;
            this.paymentDetails = {
                method: this.paymentMethod,
                amount: this.total,
                processedAt: new Date(),
                transactionId: 'TXN-' + Date.now()
            };
            this.updateStatus(OrderStatus.CONFIRMED, 'Payment confirmed');
            return { success: true, message: 'Payment processed successfully', transactionId: this.paymentDetails.transactionId };
        } else {
            this.paymentStatus = PaymentStatus.FAILED;
            this.updatedAt = new Date();
            return { success: false, message: 'Payment processing failed' };
        }
    }

    /**
     * Validates payment details
     * @param {Object} details - Payment details
     * @returns {boolean} True if valid
     * @private
     */
    _validatePaymentDetails(details) {
        if (!details || typeof details !== 'object') {
            return false;
        }

        switch (this.paymentMethod) {
            case PaymentMethod.CREDIT_CARD:
            case PaymentMethod.DEBIT_CARD:
                return this._validateCardDetails(details);
            case PaymentMethod.PAYPAL:
                return this._validatePayPalDetails(details);
            case PaymentMethod.BANK_TRANSFER:
                return this._validateBankDetails(details);
            case PaymentMethod.CASH_ON_DELIVERY:
                return true; // No details needed
            default:
                return false;
        }
    }

    /**
     * Validates credit/debit card details
     * @param {Object} details - Card details
     * @returns {boolean} True if valid
     * @private
     */
    _validateCardDetails(details) {
        if (!details.cardNumber || typeof details.cardNumber !== 'string') {
            return false;
        }
        // Remove spaces and dashes
        const cardNumber = details.cardNumber.replace(/[\s-]/g, '');
        if (!/^\d{13,19}$/.test(cardNumber)) {
            return false;
        }
        if (!this._validateLuhn(cardNumber)) {
            return false;
        }

        if (!details.expiryMonth || !details.expiryYear) {
            return false;
        }
        const month = parseInt(details.expiryMonth);
        const year = parseInt(details.expiryYear);
        if (month < 1 || month > 12) {
            return false;
        }
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
            return false;
        }

        if (!details.cvv || !/^\d{3,4}$/.test(details.cvv)) {
            return false;
        }

        if (!details.cardholderName || details.cardholderName.trim().length < 2) {
            return false;
        }

        return true;
    }

    /**
     * Validates card number using Luhn algorithm
     * @param {string} cardNumber - Card number
     * @returns {boolean} True if valid
     * @private
     */
    _validateLuhn(cardNumber) {
        let sum = 0;
        let isEven = false;
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.charAt(i));
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            isEven = !isEven;
        }
        return sum % 10 === 0;
    }

    /**
     * Validates PayPal details
     * @param {Object} details - PayPal details
     * @returns {boolean} True if valid
     * @private
     */
    _validatePayPalDetails(details) {
        if (!details.email || typeof details.email !== 'string') {
            return false;
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(details.email);
    }

    /**
     * Validates bank transfer details
     * @param {Object} details - Bank details
     * @returns {boolean} True if valid
     * @private
     */
    _validateBankDetails(details) {
        if (!details.accountNumber || typeof details.accountNumber !== 'string') {
            return false;
        }
        if (!details.routingNumber || typeof details.routingNumber !== 'string') {
            return false;
        }
        return details.accountNumber.length >= 8 && details.routingNumber.length >= 8;
    }

    /**
     * Simulates payment processing
     * @param {Object} details - Payment details
     * @returns {boolean} True if successful
     * @private
     */
    _simulatePaymentProcessing(details) {
        // Simulate random failure for testing
        // In production, this would call actual payment gateway
        if (details.simulateFail) {
            return false;
        }
        return true;
    }

    /**
     * Sets tracking information
     * @param {string} trackingNumber - Tracking number
     * @param {string} carrier - Shipping carrier
     * @param {Date} estimatedDelivery - Estimated delivery date
     * @returns {Object} Result with success flag
     */
    setTrackingInfo(trackingNumber, carrier, estimatedDelivery = null) {
        if (this.status === OrderStatus.CANCELLED || this.status === OrderStatus.REFUNDED) {
            return { success: false, message: 'Cannot set tracking for cancelled/refunded orders' };
        }

        if (!trackingNumber || typeof trackingNumber !== 'string') {
            return { success: false, message: 'Invalid tracking number' };
        }

        if (!carrier || typeof carrier !== 'string') {
            return { success: false, message: 'Invalid carrier' };
        }

        this.trackingNumber = trackingNumber;
        this.carrier = carrier;
        if (estimatedDelivery instanceof Date) {
            this.estimatedDelivery = estimatedDelivery;
        }
        this.updatedAt = new Date();

        return { success: true, message: 'Tracking information set' };
    }

    /**
     * Cancels the order
     * @param {string} reason - Cancellation reason
     * @returns {Object} Result with success flag
     */
    cancel(reason = '') {
        const cancelable = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING];
        if (!cancelable.includes(this.status)) {
            return { success: false, message: `Cannot cancel order with status ${this.status}` };
        }

        this.updateStatus(OrderStatus.CANCELLED, reason || 'Order cancelled by user');
        
        if (this.paymentStatus === PaymentStatus.COMPLETED) {
            this.paymentStatus = PaymentStatus.REFUNDED;
        }

        return { success: true, message: 'Order cancelled' };
    }

    /**
     * Processes refund for delivered order
     * @param {string} reason - Refund reason
     * @returns {Object} Result with success flag
     */
    refund(reason = '') {
        if (this.status !== OrderStatus.DELIVERED) {
            return { success: false, message: 'Can only refund delivered orders' };
        }

        if (this.paymentStatus !== PaymentStatus.COMPLETED) {
            return { success: false, message: 'No payment to refund' };
        }

        this.paymentStatus = PaymentStatus.REFUNDED;
        this.updateStatus(OrderStatus.REFUNDED, reason || 'Order refunded');

        return { success: true, message: 'Order refunded', amount: this.total };
    }

    /**
     * Checks if order can be modified
     * @returns {boolean} True if order can be modified
     */
    canBeModified() {
        return this.status === OrderStatus.PENDING || this.status === OrderStatus.CONFIRMED;
    }

    /**
     * Converts order to JSON
     * @returns {Object} Order data
     */
    toJSON() {
        return {
            orderId: this.orderId,
            userId: this.userId,
            items: this.items.map(item => item.toJSON()),
            itemCount: this.getItemCount(),
            subtotal: this.subtotal,
            couponCode: this.couponCode,
            couponDiscount: this.couponDiscount,
            subtotalAfterCoupon: this.subtotalAfterCoupon,
            taxRate: this.taxRate,
            tax: this.tax,
            shipping: this.shipping,
            total: this.total,
            totalSavings: this.totalSavings,
            shippingAddress: this.shippingAddress,
            billingAddress: this.billingAddress,
            notes: this.notes,
            status: this.status,
            paymentStatus: this.paymentStatus,
            paymentMethod: this.paymentMethod,
            paymentDetails: this.paymentDetails,
            trackingNumber: this.trackingNumber,
            carrier: this.carrier,
            estimatedDelivery: this.estimatedDelivery,
            statusHistory: this.statusHistory,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * Order Manager - manages all orders
 */
class OrderManager {
    constructor() {
        this.orders = new Map();
        this.userOrders = new Map();
    }

    /**
     * Creates an order from a cart
     * @param {ShoppingCart} cart - Shopping cart
     * @param {Object} productCatalog - Product catalog for validation
     * @param {number} taxRate - Tax rate
     * @param {Object} shippingOptions - Shipping options
     * @returns {Object} Result with order or error
     */
    createOrder(cart, productCatalog, taxRate = 0, shippingOptions = {}) {
        if (!(cart instanceof ShoppingCart)) {
            return { success: false, message: 'Invalid cart' };
        }

        const validation = cart.validateForCheckout(productCatalog);
        if (!validation.isValid) {
            return { success: false, message: validation.errors.join(', ') };
        }

        const order = new Order(cart, taxRate, shippingOptions);
        this.orders.set(order.orderId, order);

        // Track user's orders
        if (!this.userOrders.has(cart.userId)) {
            this.userOrders.set(cart.userId, []);
        }
        this.userOrders.get(cart.userId).push(order.orderId);

        // Mark cart as checked out
        cart.markAsCheckedOut();

        return { success: true, order: order };
    }

    /**
     * Gets an order by ID
     * @param {string} orderId - Order ID
     * @returns {Order|null} Order or null
     */
    getOrder(orderId) {
        return this.orders.get(orderId) || null;
    }

    /**
     * Gets all orders for a user
     * @param {string} userId - User ID
     * @returns {Order[]} Array of orders
     */
    getOrdersForUser(userId) {
        const orderIds = this.userOrders.get(userId);
        if (!orderIds) {
            return [];
        }
        return orderIds
            .map(id => this.orders.get(id))
            .filter(order => order !== undefined);
    }

    /**
     * Gets orders by status
     * @param {string} status - Order status
     * @returns {Order[]} Array of orders
     */
    getOrdersByStatus(status) {
        const results = [];
        for (const order of this.orders.values()) {
            if (order.status === status) {
                results.push(order);
            }
        }
        return results;
    }

    /**
     * Gets orders in date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Order[]} Array of orders
     */
    getOrdersInDateRange(startDate, endDate) {
        if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
            return [];
        }
        const results = [];
        for (const order of this.orders.values()) {
            if (order.createdAt >= startDate && order.createdAt <= endDate) {
                results.push(order);
            }
        }
        return results.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Gets recent orders
     * @param {number} count - Number of orders to return
     * @returns {Order[]} Array of orders
     */
    getRecentOrders(count = 10) {
        if (typeof count !== 'number' || count < 1) {
            count = 10;
        }
        const allOrders = Array.from(this.orders.values());
        return allOrders
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, count);
    }

    /**
     * Gets order statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        let totalOrders = 0;
        let totalRevenue = 0;
        let pendingOrders = 0;
        let completedOrders = 0;
        let cancelledOrders = 0;
        let totalItems = 0;

        for (const order of this.orders.values()) {
            totalOrders++;
            totalItems += order.getItemCount();

            switch (order.status) {
                case OrderStatus.PENDING:
                case OrderStatus.CONFIRMED:
                case OrderStatus.PROCESSING:
                case OrderStatus.SHIPPED:
                    pendingOrders++;
                    if (order.paymentStatus === PaymentStatus.COMPLETED) {
                        totalRevenue += order.total;
                    }
                    break;
                case OrderStatus.DELIVERED:
                    completedOrders++;
                    totalRevenue += order.total;
                    break;
                case OrderStatus.CANCELLED:
                    cancelledOrders++;
                    break;
                case OrderStatus.REFUNDED:
                    // Don't count refunded in revenue
                    break;
            }
        }

        return {
            totalOrders,
            pendingOrders,
            completedOrders,
            cancelledOrders,
            totalItems,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            averageOrderValue: totalOrders > 0 ? Math.round((totalRevenue / (completedOrders + pendingOrders)) * 100) / 100 : 0
        };
    }

    /**
     * Searches orders
     * @param {Object} criteria - Search criteria
     * @returns {Order[]} Matching orders
     */
    searchOrders(criteria) {
        if (!criteria || typeof criteria !== 'object') {
            return [];
        }

        let results = Array.from(this.orders.values());

        if (criteria.userId) {
            results = results.filter(o => o.userId === criteria.userId);
        }

        if (criteria.status) {
            results = results.filter(o => o.status === criteria.status);
        }

        if (criteria.paymentStatus) {
            results = results.filter(o => o.paymentStatus === criteria.paymentStatus);
        }

        if (criteria.minTotal !== undefined) {
            results = results.filter(o => o.total >= criteria.minTotal);
        }

        if (criteria.maxTotal !== undefined) {
            results = results.filter(o => o.total <= criteria.maxTotal);
        }

        if (criteria.startDate) {
            results = results.filter(o => o.createdAt >= criteria.startDate);
        }

        if (criteria.endDate) {
            results = results.filter(o => o.createdAt <= criteria.endDate);
        }

        return results.sort((a, b) => b.createdAt - a.createdAt);
    }
}

module.exports = {
    Order,
    OrderItem,
    OrderManager,
    OrderStatus,
    PaymentStatus,
    PaymentMethod
};
