/**
 * Inventory Management Module
 * Handles stock tracking, alerts, and inventory operations
 */

/**
 * Stock Movement Types
 */
const MovementType = {
    PURCHASE: 'purchase',
    SALE: 'sale',
    ADJUSTMENT: 'adjustment',
    RETURN: 'return',
    TRANSFER: 'transfer',
    DAMAGE: 'damage',
    EXPIRY: 'expiry'
};

/**
 * Stock Alert Types
 */
const AlertType = {
    LOW_STOCK: 'low_stock',
    OUT_OF_STOCK: 'out_of_stock',
    OVERSTOCK: 'overstock',
    REORDER_POINT: 'reorder_point'
};

/**
 * Stock Movement record
 */
class StockMovement {
    constructor(productId, type, quantity, reference = '', notes = '') {
        this.id = this._generateId();
        this.productId = productId;
        this.type = type;
        this.quantity = quantity;
        this.reference = reference;
        this.notes = notes;
        this.timestamp = new Date();
        this.previousStock = 0;
        this.newStock = 0;
    }

    /**
     * Generates unique movement ID
     * @returns {string} Movement ID
     * @private
     */
    _generateId() {
        return 'MOV-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Sets stock levels for audit trail
     * @param {number} previousStock - Stock before movement
     * @param {number} newStock - Stock after movement
     */
    setStockLevels(previousStock, newStock) {
        this.previousStock = previousStock;
        this.newStock = newStock;
    }

    /**
     * Converts to JSON
     * @returns {Object} Movement data
     */
    toJSON() {
        return {
            id: this.id,
            productId: this.productId,
            type: this.type,
            quantity: this.quantity,
            reference: this.reference,
            notes: this.notes,
            previousStock: this.previousStock,
            newStock: this.newStock,
            timestamp: this.timestamp
        };
    }
}

/**
 * Stock Alert record
 */
class StockAlert {
    constructor(productId, alertType, currentStock, threshold, message = '') {
        this.id = 'ALERT-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
        this.productId = productId;
        this.alertType = alertType;
        this.currentStock = currentStock;
        this.threshold = threshold;
        this.message = message;
        this.createdAt = new Date();
        this.isRead = false;
        this.isResolved = false;
        this.resolvedAt = null;
    }

    /**
     * Marks alert as read
     */
    markAsRead() {
        this.isRead = true;
    }

    /**
     * Resolves the alert
     */
    resolve() {
        this.isResolved = true;
        this.resolvedAt = new Date();
    }

    /**
     * Converts to JSON
     * @returns {Object} Alert data
     */
    toJSON() {
        return {
            id: this.id,
            productId: this.productId,
            alertType: this.alertType,
            currentStock: this.currentStock,
            threshold: this.threshold,
            message: this.message,
            createdAt: this.createdAt,
            isRead: this.isRead,
            isResolved: this.isResolved,
            resolvedAt: this.resolvedAt
        };
    }
}

/**
 * Inventory Item - tracks stock for a product
 */
class InventoryItem {
    constructor(productId, initialStock = 0) {
        this.productId = productId;
        this.currentStock = initialStock;
        this.reservedStock = 0;
        this.reorderPoint = 10;
        this.reorderQuantity = 50;
        this.maxStock = 1000;
        this.minStock = 0;
        this.location = 'MAIN';
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.lastRestockedAt = null;
        this.movements = [];
    }

    /**
     * Gets available stock (current - reserved)
     * @returns {number} Available stock
     */
    getAvailableStock() {
        return Math.max(0, this.currentStock - this.reservedStock);
    }

    /**
     * Checks if product needs reorder
     * @returns {boolean} True if reorder needed
     */
    needsReorder() {
        return this.currentStock <= this.reorderPoint;
    }

    /**
     * Checks if product is overstocked
     * @returns {boolean} True if overstocked
     */
    isOverstocked() {
        return this.currentStock > this.maxStock;
    }

    /**
     * Checks if product is out of stock
     * @returns {boolean} True if out of stock
     */
    isOutOfStock() {
        return this.getAvailableStock() <= 0;
    }

    /**
     * Reserves stock
     * @param {number} quantity - Quantity to reserve
     * @returns {boolean} True if successful
     */
    reserveStock(quantity) {
        if (typeof quantity !== 'number' || quantity <= 0) {
            return false;
        }
        if (this.getAvailableStock() < quantity) {
            return false;
        }
        this.reservedStock += quantity;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Releases reserved stock
     * @param {number} quantity - Quantity to release
     * @returns {boolean} True if successful
     */
    releaseReservedStock(quantity) {
        if (typeof quantity !== 'number' || quantity <= 0) {
            return false;
        }
        if (this.reservedStock < quantity) {
            quantity = this.reservedStock;
        }
        this.reservedStock -= quantity;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Converts reserved stock to actual sale
     * @param {number} quantity - Quantity sold
     * @returns {boolean} True if successful
     */
    confirmSale(quantity) {
        if (typeof quantity !== 'number' || quantity <= 0) {
            return false;
        }
        if (this.reservedStock < quantity || this.currentStock < quantity) {
            return false;
        }
        this.reservedStock -= quantity;
        this.currentStock -= quantity;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Adds stock
     * @param {number} quantity - Quantity to add
     * @returns {boolean} True if successful
     */
    addStock(quantity) {
        if (typeof quantity !== 'number' || quantity <= 0) {
            return false;
        }
        this.currentStock += quantity;
        this.lastRestockedAt = new Date();
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Removes stock
     * @param {number} quantity - Quantity to remove
     * @returns {boolean} True if successful
     */
    removeStock(quantity) {
        if (typeof quantity !== 'number' || quantity <= 0) {
            return false;
        }
        if (this.currentStock < quantity) {
            return false;
        }
        this.currentStock -= quantity;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Sets reorder parameters
     * @param {number} reorderPoint - Stock level to trigger reorder
     * @param {number} reorderQuantity - Quantity to order
     * @returns {boolean} True if successful
     */
    setReorderParameters(reorderPoint, reorderQuantity) {
        if (typeof reorderPoint !== 'number' || reorderPoint < 0) {
            return false;
        }
        if (typeof reorderQuantity !== 'number' || reorderQuantity <= 0) {
            return false;
        }
        this.reorderPoint = reorderPoint;
        this.reorderQuantity = reorderQuantity;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Sets stock limits
     * @param {number} minStock - Minimum stock level
     * @param {number} maxStock - Maximum stock level
     * @returns {boolean} True if successful
     */
    setStockLimits(minStock, maxStock) {
        if (typeof minStock !== 'number' || minStock < 0) {
            return false;
        }
        if (typeof maxStock !== 'number' || maxStock <= minStock) {
            return false;
        }
        this.minStock = minStock;
        this.maxStock = maxStock;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Records a stock movement
     * @param {StockMovement} movement - Movement record
     */
    recordMovement(movement) {
        this.movements.push(movement);
        // Keep only last 100 movements
        if (this.movements.length > 100) {
            this.movements = this.movements.slice(-100);
        }
    }

    /**
     * Gets movement history
     * @param {number} limit - Number of records to return
     * @returns {StockMovement[]} Movement history
     */
    getMovementHistory(limit = 10) {
        return this.movements.slice(-limit).reverse();
    }

    /**
     * Converts to JSON
     * @returns {Object} Inventory item data
     */
    toJSON() {
        return {
            productId: this.productId,
            currentStock: this.currentStock,
            reservedStock: this.reservedStock,
            availableStock: this.getAvailableStock(),
            reorderPoint: this.reorderPoint,
            reorderQuantity: this.reorderQuantity,
            maxStock: this.maxStock,
            minStock: this.minStock,
            location: this.location,
            needsReorder: this.needsReorder(),
            isOverstocked: this.isOverstocked(),
            isOutOfStock: this.isOutOfStock(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastRestockedAt: this.lastRestockedAt
        };
    }
}

/**
 * Inventory Manager - manages all inventory
 */
class InventoryManager {
    constructor() {
        this.inventory = new Map();
        this.alerts = [];
        this.movements = [];
    }

    /**
     * Adds an inventory item
     * @param {string} productId - Product ID
     * @param {number} initialStock - Initial stock level
     * @returns {InventoryItem} Created inventory item
     */
    addInventoryItem(productId, initialStock = 0) {
        if (typeof productId !== 'string' || !productId) {
            return null;
        }
        if (this.inventory.has(productId)) {
            return this.inventory.get(productId);
        }
        const item = new InventoryItem(productId, initialStock);
        this.inventory.set(productId, item);
        
        // Record initial stock as a movement for audit trail (doesn't add stock again)
        if (initialStock > 0) {
            const movement = new StockMovement(productId, MovementType.ADJUSTMENT, initialStock, '', 'Initial stock');
            movement.setStockLevels(0, initialStock);
            item.recordMovement(movement);
            this.movements.push(movement);
        }
        
        return item;
    }

    /**
     * Gets an inventory item
     * @param {string} productId - Product ID
     * @returns {InventoryItem|null} Inventory item or null
     */
    getInventoryItem(productId) {
        return this.inventory.get(productId) || null;
    }

    /**
     * Removes an inventory item
     * @param {string} productId - Product ID
     * @returns {boolean} True if removed
     */
    removeInventoryItem(productId) {
        return this.inventory.delete(productId);
    }

    /**
     * Records a stock movement
     * @param {string} productId - Product ID
     * @param {string} type - Movement type
     * @param {number} quantity - Quantity (positive for additions, negative for deductions)
     * @param {string} reference - Reference ID (e.g., order ID)
     * @param {string} notes - Additional notes
     * @returns {Object} Result with movement or error
     */
    recordMovement(productId, type, quantity, reference = '', notes = '') {
        const item = this.inventory.get(productId);
        if (!item) {
            return { success: false, message: 'Inventory item not found' };
        }

        if (!Object.values(MovementType).includes(type)) {
            return { success: false, message: 'Invalid movement type' };
        }

        const previousStock = item.currentStock;
        let success = false;

        switch (type) {
            case MovementType.PURCHASE:
            case MovementType.RETURN:
            case MovementType.ADJUSTMENT:
                if (quantity > 0) {
                    success = item.addStock(Math.abs(quantity));
                } else if (quantity < 0) {
                    success = item.removeStock(Math.abs(quantity));
                } else {
                    success = true;
                }
                break;
            case MovementType.SALE:
            case MovementType.DAMAGE:
            case MovementType.EXPIRY:
            case MovementType.TRANSFER:
                success = item.removeStock(Math.abs(quantity));
                break;
        }

        if (!success) {
            return { success: false, message: 'Failed to update stock' };
        }

        const movement = new StockMovement(productId, type, quantity, reference, notes);
        movement.setStockLevels(previousStock, item.currentStock);
        item.recordMovement(movement);
        this.movements.push(movement);

        // Check for alerts
        this._checkStockAlerts(item);

        return { success: true, movement: movement };
    }

    /**
     * Processes a sale
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity sold
     * @param {string} orderId - Order reference
     * @returns {Object} Result with success flag
     */
    processSale(productId, quantity, orderId = '') {
        const item = this.inventory.get(productId);
        if (!item) {
            return { success: false, message: 'Product not found in inventory' };
        }

        if (item.getAvailableStock() < quantity) {
            return { success: false, message: 'Insufficient stock' };
        }

        const result = this.recordMovement(productId, MovementType.SALE, quantity, orderId, 'Sale');
        if (result.success) {
            return { success: true, message: 'Sale processed', remainingStock: item.currentStock };
        }
        return result;
    }

    /**
     * Restocks a product
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity to add
     * @param {string} purchaseOrder - PO reference
     * @returns {Object} Result with success flag
     */
    restock(productId, quantity, purchaseOrder = '') {
        const item = this.inventory.get(productId);
        if (!item) {
            return { success: false, message: 'Product not found in inventory' };
        }

        if (typeof quantity !== 'number' || quantity <= 0) {
            return { success: false, message: 'Invalid quantity' };
        }

        const result = this.recordMovement(productId, MovementType.PURCHASE, quantity, purchaseOrder, 'Restock');
        if (result.success) {
            // Resolve low stock alerts
            this._resolveAlerts(productId, [AlertType.LOW_STOCK, AlertType.OUT_OF_STOCK, AlertType.REORDER_POINT]);
            return { success: true, message: 'Stock added', newStock: item.currentStock };
        }
        return result;
    }

    /**
     * Processes a return
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity returned
     * @param {string} orderId - Order reference
     * @returns {Object} Result with success flag
     */
    processReturn(productId, quantity, orderId = '') {
        return this.recordMovement(productId, MovementType.RETURN, quantity, orderId, 'Customer return');
    }

    /**
     * Reserves stock for an order
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity to reserve
     * @returns {Object} Result with success flag
     */
    reserveStock(productId, quantity) {
        const item = this.inventory.get(productId);
        if (!item) {
            return { success: false, message: 'Product not found in inventory' };
        }

        if (item.reserveStock(quantity)) {
            return { success: true, message: 'Stock reserved', availableStock: item.getAvailableStock() };
        }
        return { success: false, message: 'Insufficient stock to reserve' };
    }

    /**
     * Releases reserved stock
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity to release
     * @returns {Object} Result with success flag
     */
    releaseReservedStock(productId, quantity) {
        const item = this.inventory.get(productId);
        if (!item) {
            return { success: false, message: 'Product not found in inventory' };
        }

        if (item.releaseReservedStock(quantity)) {
            return { success: true, message: 'Stock released', availableStock: item.getAvailableStock() };
        }
        return { success: false, message: 'Failed to release stock' };
    }

    /**
     * Checks and generates stock alerts
     * @param {InventoryItem} item - Inventory item to check
     * @private
     */
    _checkStockAlerts(item) {
        if (item.isOutOfStock()) {
            this._createAlert(item.productId, AlertType.OUT_OF_STOCK, item.currentStock, 0, 'Product is out of stock');
        } else if (item.needsReorder()) {
            this._createAlert(item.productId, AlertType.REORDER_POINT, item.currentStock, item.reorderPoint, 'Stock below reorder point');
        } else if (item.currentStock <= item.minStock) {
            this._createAlert(item.productId, AlertType.LOW_STOCK, item.currentStock, item.minStock, 'Stock below minimum level');
        }

        if (item.isOverstocked()) {
            this._createAlert(item.productId, AlertType.OVERSTOCK, item.currentStock, item.maxStock, 'Stock exceeds maximum level');
        }
    }

    /**
     * Creates a stock alert
     * @param {string} productId - Product ID
     * @param {string} alertType - Alert type
     * @param {number} currentStock - Current stock level
     * @param {number} threshold - Threshold that triggered alert
     * @param {string} message - Alert message
     * @private
     */
    _createAlert(productId, alertType, currentStock, threshold, message) {
        // Check if similar alert already exists and is unresolved
        const existingAlert = this.alerts.find(a => 
            a.productId === productId && 
            a.alertType === alertType && 
            !a.isResolved
        );

        if (!existingAlert) {
            const alert = new StockAlert(productId, alertType, currentStock, threshold, message);
            this.alerts.push(alert);
        }
    }

    /**
     * Resolves alerts for a product
     * @param {string} productId - Product ID
     * @param {string[]} alertTypes - Alert types to resolve
     * @private
     */
    _resolveAlerts(productId, alertTypes) {
        for (const alert of this.alerts) {
            if (alert.productId === productId && alertTypes.includes(alert.alertType) && !alert.isResolved) {
                alert.resolve();
            }
        }
    }

    /**
     * Gets active alerts
     * @param {boolean} unreadOnly - Only return unread alerts
     * @returns {StockAlert[]} Array of alerts
     */
    getActiveAlerts(unreadOnly = false) {
        let alerts = this.alerts.filter(a => !a.isResolved);
        if (unreadOnly) {
            alerts = alerts.filter(a => !a.isRead);
        }
        return alerts.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Gets alerts for a product
     * @param {string} productId - Product ID
     * @returns {StockAlert[]} Array of alerts
     */
    getAlertsForProduct(productId) {
        return this.alerts.filter(a => a.productId === productId).sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Marks alert as read
     * @param {string} alertId - Alert ID
     * @returns {boolean} True if marked
     */
    markAlertAsRead(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.markAsRead();
            return true;
        }
        return false;
    }

    /**
     * Gets products that need reorder
     * @returns {InventoryItem[]} Items needing reorder
     */
    getItemsNeedingReorder() {
        return Array.from(this.inventory.values()).filter(item => item.needsReorder());
    }

    /**
     * Gets out of stock products
     * @returns {InventoryItem[]} Out of stock items
     */
    getOutOfStockItems() {
        return Array.from(this.inventory.values()).filter(item => item.isOutOfStock());
    }

    /**
     * Gets overstocked products
     * @returns {InventoryItem[]} Overstocked items
     */
    getOverstockedItems() {
        return Array.from(this.inventory.values()).filter(item => item.isOverstocked());
    }

    /**
     * Gets movement history
     * @param {Object} filters - Optional filters
     * @returns {StockMovement[]} Movement history
     */
    getMovementHistory(filters = {}) {
        let movements = [...this.movements];

        if (filters.productId) {
            movements = movements.filter(m => m.productId === filters.productId);
        }

        if (filters.type) {
            movements = movements.filter(m => m.type === filters.type);
        }

        if (filters.startDate) {
            movements = movements.filter(m => m.timestamp >= filters.startDate);
        }

        if (filters.endDate) {
            movements = movements.filter(m => m.timestamp <= filters.endDate);
        }

        const limit = filters.limit || 100;
        return movements.slice(-limit).reverse();
    }

    /**
     * Gets inventory statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        let totalProducts = 0;
        let totalStock = 0;
        let totalReserved = 0;
        let outOfStock = 0;
        let lowStock = 0;
        let overStock = 0;

        for (const item of this.inventory.values()) {
            totalProducts++;
            totalStock += item.currentStock;
            totalReserved += item.reservedStock;

            if (item.isOutOfStock()) {
                outOfStock++;
            } else if (item.needsReorder()) {
                lowStock++;
            }

            if (item.isOverstocked()) {
                overStock++;
            }
        }

        return {
            totalProducts,
            totalStock,
            totalReserved,
            availableStock: totalStock - totalReserved,
            outOfStockCount: outOfStock,
            lowStockCount: lowStock,
            overStockCount: overStock,
            activeAlerts: this.alerts.filter(a => !a.isResolved).length,
            unreadAlerts: this.alerts.filter(a => !a.isResolved && !a.isRead).length
        };
    }

    /**
     * Performs inventory audit
     * @param {string} productId - Product ID
     * @param {number} actualStock - Actual counted stock
     * @param {string} notes - Audit notes
     * @returns {Object} Result with adjustment
     */
    performAudit(productId, actualStock, notes = '') {
        const item = this.inventory.get(productId);
        if (!item) {
            return { success: false, message: 'Product not found in inventory' };
        }

        if (typeof actualStock !== 'number' || actualStock < 0) {
            return { success: false, message: 'Invalid actual stock value' };
        }

        const difference = actualStock - item.currentStock;
        if (difference === 0) {
            return { success: true, message: 'No adjustment needed', difference: 0 };
        }

        const result = this.recordMovement(
            productId, 
            MovementType.ADJUSTMENT, 
            difference, 
            'AUDIT-' + Date.now(),
            notes || `Inventory audit adjustment: ${difference > 0 ? '+' : ''}${difference}`
        );

        if (result.success) {
            return { 
                success: true, 
                message: 'Inventory adjusted', 
                difference: difference,
                previousStock: item.currentStock - difference,
                newStock: item.currentStock
            };
        }

        return result;
    }

    /**
     * Gets all inventory items
     * @returns {InventoryItem[]} All inventory items
     */
    getAllItems() {
        return Array.from(this.inventory.values());
    }

    /**
     * Gets total inventory value
     * @param {Object} productCatalog - Product catalog with prices
     * @returns {number} Total inventory value
     */
    getTotalInventoryValue(productCatalog) {
        let totalValue = 0;
        for (const item of this.inventory.values()) {
            const product = productCatalog ? productCatalog.getProduct(item.productId) : null;
            if (product) {
                totalValue += item.currentStock * product.price;
            }
        }
        return Math.round(totalValue * 100) / 100;
    }
}

module.exports = {
    InventoryItem,
    InventoryManager,
    StockMovement,
    StockAlert,
    MovementType,
    AlertType
};
