/**
 * Inventory Module Tests
 * Comprehensive test suite for mutation testing
 */

const { expect } = require('chai');
const { InventoryItem, InventoryManager, StockMovement, StockAlert, MovementType, AlertType } = require('../src/inventory');

describe('StockMovement', function() {
    it('should create movement record', function() {
        const movement = new StockMovement('P001', MovementType.PURCHASE, 50, 'PO-001', 'Initial stock');
        expect(movement.productId).to.equal('P001');
        expect(movement.type).to.equal(MovementType.PURCHASE);
        expect(movement.quantity).to.equal(50);
        expect(movement.reference).to.equal('PO-001');
        expect(movement.notes).to.equal('Initial stock');
        expect(movement.id).to.include('MOV-');
    });

    it('should set stock levels', function() {
        const movement = new StockMovement('P001', MovementType.SALE, 10);
        movement.setStockLevels(100, 90);
        expect(movement.previousStock).to.equal(100);
        expect(movement.newStock).to.equal(90);
    });

    it('should convert to JSON', function() {
        const movement = new StockMovement('P001', MovementType.SALE, 10);
        const json = movement.toJSON();
        expect(json.productId).to.equal('P001');
        expect(json.type).to.equal(MovementType.SALE);
    });
});

describe('StockAlert', function() {
    it('should create alert', function() {
        const alert = new StockAlert('P001', AlertType.LOW_STOCK, 5, 10, 'Stock is low');
        expect(alert.productId).to.equal('P001');
        expect(alert.alertType).to.equal(AlertType.LOW_STOCK);
        expect(alert.currentStock).to.equal(5);
        expect(alert.threshold).to.equal(10);
        expect(alert.isRead).to.be.false;
        expect(alert.isResolved).to.be.false;
    });

    it('should mark as read', function() {
        const alert = new StockAlert('P001', AlertType.LOW_STOCK, 5, 10);
        alert.markAsRead();
        expect(alert.isRead).to.be.true;
    });

    it('should resolve alert', function() {
        const alert = new StockAlert('P001', AlertType.LOW_STOCK, 5, 10);
        alert.resolve();
        expect(alert.isResolved).to.be.true;
        expect(alert.resolvedAt).to.be.instanceof(Date);
    });

    it('should convert to JSON', function() {
        const alert = new StockAlert('P001', AlertType.LOW_STOCK, 5, 10);
        const json = alert.toJSON();
        expect(json.productId).to.equal('P001');
        expect(json.alertType).to.equal(AlertType.LOW_STOCK);
    });
});

describe('InventoryItem', function() {
    let item;

    beforeEach(function() {
        item = new InventoryItem('P001', 100);
    });

    describe('Constructor', function() {
        it('should create with initial stock', function() {
            expect(item.productId).to.equal('P001');
            expect(item.currentStock).to.equal(100);
            expect(item.reservedStock).to.equal(0);
            expect(item.reorderPoint).to.equal(10);
        });

        it('should use default stock of 0', function() {
            const newItem = new InventoryItem('P002');
            expect(newItem.currentStock).to.equal(0);
        });
    });

    describe('getAvailableStock()', function() {
        it('should return current minus reserved', function() {
            item.reservedStock = 30;
            expect(item.getAvailableStock()).to.equal(70);
        });

        it('should not return negative', function() {
            item.reservedStock = 150;
            expect(item.getAvailableStock()).to.equal(0);
        });
    });

    describe('needsReorder()', function() {
        it('should return true when stock at or below reorder point', function() {
            item.currentStock = 10;
            expect(item.needsReorder()).to.be.true;
            item.currentStock = 5;
            expect(item.needsReorder()).to.be.true;
        });

        it('should return false when stock above reorder point', function() {
            item.currentStock = 50;
            expect(item.needsReorder()).to.be.false;
        });
    });

    describe('isOverstocked()', function() {
        it('should return true when stock exceeds max', function() {
            item.currentStock = 1500;
            expect(item.isOverstocked()).to.be.true;
        });

        it('should return false when stock within limit', function() {
            item.currentStock = 500;
            expect(item.isOverstocked()).to.be.false;
        });
    });

    describe('isOutOfStock()', function() {
        it('should return true when no available stock', function() {
            item.currentStock = 0;
            expect(item.isOutOfStock()).to.be.true;
        });

        it('should return true when all stock reserved', function() {
            item.currentStock = 100;
            item.reservedStock = 100;
            expect(item.isOutOfStock()).to.be.true;
        });

        it('should return false when stock available', function() {
            expect(item.isOutOfStock()).to.be.false;
        });
    });

    describe('reserveStock()', function() {
        it('should reserve available stock', function() {
            expect(item.reserveStock(30)).to.be.true;
            expect(item.reservedStock).to.equal(30);
        });

        it('should reject if insufficient available', function() {
            expect(item.reserveStock(150)).to.be.false;
            expect(item.reservedStock).to.equal(0);
        });

        it('should reject invalid quantity', function() {
            expect(item.reserveStock(0)).to.be.false;
            expect(item.reserveStock(-10)).to.be.false;
            expect(item.reserveStock('ten')).to.be.false;
        });
    });

    describe('releaseReservedStock()', function() {
        beforeEach(function() {
            item.reserveStock(50);
        });

        it('should release reserved stock', function() {
            expect(item.releaseReservedStock(30)).to.be.true;
            expect(item.reservedStock).to.equal(20);
        });

        it('should not release more than reserved', function() {
            expect(item.releaseReservedStock(100)).to.be.true;
            expect(item.reservedStock).to.equal(0);
        });

        it('should reject invalid quantity', function() {
            expect(item.releaseReservedStock(0)).to.be.false;
            expect(item.releaseReservedStock(-10)).to.be.false;
        });
    });

    describe('confirmSale()', function() {
        beforeEach(function() {
            item.reserveStock(50);
        });

        it('should confirm reserved sale', function() {
            expect(item.confirmSale(30)).to.be.true;
            expect(item.reservedStock).to.equal(20);
            expect(item.currentStock).to.equal(70);
        });

        it('should reject if more than reserved', function() {
            expect(item.confirmSale(60)).to.be.false;
        });

        it('should reject invalid quantity', function() {
            expect(item.confirmSale(0)).to.be.false;
            expect(item.confirmSale(-10)).to.be.false;
        });
    });

    describe('addStock()', function() {
        it('should add stock', function() {
            expect(item.addStock(50)).to.be.true;
            expect(item.currentStock).to.equal(150);
            expect(item.lastRestockedAt).to.be.instanceof(Date);
        });

        it('should reject invalid quantity', function() {
            expect(item.addStock(0)).to.be.false;
            expect(item.addStock(-10)).to.be.false;
            expect(item.addStock('fifty')).to.be.false;
        });
    });

    describe('removeStock()', function() {
        it('should remove stock', function() {
            expect(item.removeStock(30)).to.be.true;
            expect(item.currentStock).to.equal(70);
        });

        it('should reject if insufficient stock', function() {
            expect(item.removeStock(150)).to.be.false;
            expect(item.currentStock).to.equal(100);
        });

        it('should reject invalid quantity', function() {
            expect(item.removeStock(0)).to.be.false;
            expect(item.removeStock(-10)).to.be.false;
        });
    });

    describe('setReorderParameters()', function() {
        it('should set valid parameters', function() {
            expect(item.setReorderParameters(20, 100)).to.be.true;
            expect(item.reorderPoint).to.equal(20);
            expect(item.reorderQuantity).to.equal(100);
        });

        it('should reject invalid reorder point', function() {
            expect(item.setReorderParameters(-5, 100)).to.be.false;
        });

        it('should reject invalid reorder quantity', function() {
            expect(item.setReorderParameters(20, 0)).to.be.false;
            expect(item.setReorderParameters(20, -50)).to.be.false;
        });
    });

    describe('setStockLimits()', function() {
        it('should set valid limits', function() {
            expect(item.setStockLimits(5, 500)).to.be.true;
            expect(item.minStock).to.equal(5);
            expect(item.maxStock).to.equal(500);
        });

        it('should reject invalid min stock', function() {
            expect(item.setStockLimits(-5, 500)).to.be.false;
        });

        it('should reject max less than min', function() {
            expect(item.setStockLimits(100, 50)).to.be.false;
        });
    });

    describe('recordMovement() / getMovementHistory()', function() {
        it('should record movements', function() {
            const movement = new StockMovement('P001', MovementType.SALE, 10);
            item.recordMovement(movement);
            expect(item.movements.length).to.equal(1);
        });

        it('should get movement history', function() {
            for (let i = 0; i < 15; i++) {
                item.recordMovement(new StockMovement('P001', MovementType.SALE, i));
            }
            const history = item.getMovementHistory(10);
            expect(history.length).to.equal(10);
        });

        it('should limit stored movements to 100', function() {
            for (let i = 0; i < 110; i++) {
                item.recordMovement(new StockMovement('P001', MovementType.SALE, i));
            }
            expect(item.movements.length).to.equal(100);
        });
    });

    describe('toJSON()', function() {
        it('should return complete data', function() {
            const json = item.toJSON();
            expect(json.productId).to.equal('P001');
            expect(json.currentStock).to.equal(100);
            expect(json.availableStock).to.equal(100);
            expect(json.needsReorder).to.be.false;
            expect(json.isOutOfStock).to.be.false;
        });
    });
});

describe('InventoryManager', function() {
    let manager;

    beforeEach(function() {
        manager = new InventoryManager();
    });

    describe('addInventoryItem()', function() {
        it('should add inventory item', function() {
            const item = manager.addInventoryItem('P001', 100);
            expect(item).to.not.be.null;
            expect(item.productId).to.equal('P001');
            expect(item.currentStock).to.equal(100);
        });

        it('should return existing item if already exists', function() {
            const item1 = manager.addInventoryItem('P001', 100);
            const item2 = manager.addInventoryItem('P001', 200);
            expect(item1).to.equal(item2);
            expect(item1.currentStock).to.equal(100);
        });

        it('should return null for invalid product ID', function() {
            expect(manager.addInventoryItem('')).to.be.null;
            expect(manager.addInventoryItem(null)).to.be.null;
        });

        it('should record initial stock movement', function() {
            manager.addInventoryItem('P001', 100);
            expect(manager.movements.length).to.equal(1);
        });

        it('should not record movement for zero initial stock', function() {
            manager.addInventoryItem('P001', 0);
            expect(manager.movements.length).to.equal(0);
        });
    });

    describe('getInventoryItem()', function() {
        it('should return item by ID', function() {
            manager.addInventoryItem('P001', 100);
            const item = manager.getInventoryItem('P001');
            expect(item).to.not.be.null;
            expect(item.productId).to.equal('P001');
        });

        it('should return null for non-existent item', function() {
            expect(manager.getInventoryItem('NONEXISTENT')).to.be.null;
        });
    });

    describe('removeInventoryItem()', function() {
        it('should remove item', function() {
            manager.addInventoryItem('P001', 100);
            expect(manager.removeInventoryItem('P001')).to.be.true;
            expect(manager.getInventoryItem('P001')).to.be.null;
        });

        it('should return false for non-existent item', function() {
            expect(manager.removeInventoryItem('NONEXISTENT')).to.be.false;
        });
    });

    describe('recordMovement()', function() {
        beforeEach(function() {
            manager.addInventoryItem('P001', 100);
        });

        it('should record purchase movement', function() {
            const result = manager.recordMovement('P001', MovementType.PURCHASE, 50, 'PO-001');
            expect(result.success).to.be.true;
            expect(manager.getInventoryItem('P001').currentStock).to.equal(150);
        });

        it('should record sale movement', function() {
            const result = manager.recordMovement('P001', MovementType.SALE, 30, 'ORD-001');
            expect(result.success).to.be.true;
            expect(manager.getInventoryItem('P001').currentStock).to.equal(70);
        });

        it('should record adjustment (positive)', function() {
            const result = manager.recordMovement('P001', MovementType.ADJUSTMENT, 25);
            expect(result.success).to.be.true;
            expect(manager.getInventoryItem('P001').currentStock).to.equal(125);
        });

        it('should record adjustment (negative)', function() {
            const result = manager.recordMovement('P001', MovementType.ADJUSTMENT, -25);
            expect(result.success).to.be.true;
            expect(manager.getInventoryItem('P001').currentStock).to.equal(75);
        });

        it('should record return movement', function() {
            const result = manager.recordMovement('P001', MovementType.RETURN, 10);
            expect(result.success).to.be.true;
            expect(manager.getInventoryItem('P001').currentStock).to.equal(110);
        });

        it('should record damage movement', function() {
            const result = manager.recordMovement('P001', MovementType.DAMAGE, 5);
            expect(result.success).to.be.true;
            expect(manager.getInventoryItem('P001').currentStock).to.equal(95);
        });

        it('should fail for non-existent item', function() {
            const result = manager.recordMovement('NONEXISTENT', MovementType.SALE, 10);
            expect(result.success).to.be.false;
        });

        it('should fail for invalid movement type', function() {
            const result = manager.recordMovement('P001', 'invalid', 10);
            expect(result.success).to.be.false;
        });

        it('should fail when insufficient stock for deduction', function() {
            const result = manager.recordMovement('P001', MovementType.SALE, 150);
            expect(result.success).to.be.false;
        });

        it('should handle zero quantity adjustment', function() {
            const result = manager.recordMovement('P001', MovementType.ADJUSTMENT, 0);
            expect(result.success).to.be.true;
        });
    });

    describe('processSale()', function() {
        beforeEach(function() {
            manager.addInventoryItem('P001', 100);
        });

        it('should process valid sale', function() {
            const result = manager.processSale('P001', 30, 'ORD-001');
            expect(result.success).to.be.true;
            expect(result.remainingStock).to.equal(70);
        });

        it('should fail for insufficient stock', function() {
            const result = manager.processSale('P001', 150);
            expect(result.success).to.be.false;
        });

        it('should fail for non-existent product', function() {
            const result = manager.processSale('NONEXISTENT', 10);
            expect(result.success).to.be.false;
        });
    });

    describe('restock()', function() {
        beforeEach(function() {
            manager.addInventoryItem('P001', 5);
        });

        it('should restock product', function() {
            const result = manager.restock('P001', 100, 'PO-001');
            expect(result.success).to.be.true;
            expect(result.newStock).to.equal(105);
        });

        it('should resolve low stock alerts', function() {
            // Trigger low stock alert
            manager.getInventoryItem('P001').reorderPoint = 10;
            manager.recordMovement('P001', MovementType.ADJUSTMENT, 0);
            
            const initialAlerts = manager.getActiveAlerts().length;
            manager.restock('P001', 100);
            // Alert should be resolved
            expect(manager.getActiveAlerts().length).to.be.lessThanOrEqual(initialAlerts);
        });

        it('should fail for invalid quantity', function() {
            expect(manager.restock('P001', 0).success).to.be.false;
            expect(manager.restock('P001', -10).success).to.be.false;
        });

        it('should fail for non-existent product', function() {
            expect(manager.restock('NONEXISTENT', 100).success).to.be.false;
        });
    });

    describe('processReturn()', function() {
        beforeEach(function() {
            manager.addInventoryItem('P001', 100);
        });

        it('should process return', function() {
            const result = manager.processReturn('P001', 10, 'ORD-001');
            expect(result.success).to.be.true;
        });
    });

    describe('reserveStock() / releaseReservedStock()', function() {
        beforeEach(function() {
            manager.addInventoryItem('P001', 100);
        });

        it('should reserve stock', function() {
            const result = manager.reserveStock('P001', 30);
            expect(result.success).to.be.true;
            expect(result.availableStock).to.equal(70);
        });

        it('should release reserved stock', function() {
            manager.reserveStock('P001', 30);
            const result = manager.releaseReservedStock('P001', 30);
            expect(result.success).to.be.true;
            expect(result.availableStock).to.equal(100);
        });

        it('should fail for insufficient stock', function() {
            const result = manager.reserveStock('P001', 150);
            expect(result.success).to.be.false;
        });

        it('should fail for non-existent product', function() {
            expect(manager.reserveStock('NONEXISTENT', 10).success).to.be.false;
            expect(manager.releaseReservedStock('NONEXISTENT', 10).success).to.be.false;
        });
    });

    describe('Alert Management', function() {
        beforeEach(function() {
            manager.addInventoryItem('P001', 5);
            manager.getInventoryItem('P001').reorderPoint = 10;
            manager.getInventoryItem('P001').minStock = 8;
            manager.recordMovement('P001', MovementType.ADJUSTMENT, 0); // Trigger alert check
        });

        it('should create low stock alert', function() {
            const alerts = manager.getActiveAlerts();
            expect(alerts.length).to.be.greaterThan(0);
        });

        it('should get unread alerts only', function() {
            const allAlerts = manager.getActiveAlerts();
            allAlerts[0].markAsRead();
            const unreadAlerts = manager.getActiveAlerts(true);
            expect(unreadAlerts.length).to.be.lessThan(allAlerts.length);
        });

        it('should get alerts for specific product', function() {
            const alerts = manager.getAlertsForProduct('P001');
            expect(alerts.length).to.be.greaterThan(0);
        });

        it('should mark alert as read', function() {
            const alerts = manager.getActiveAlerts();
            expect(manager.markAlertAsRead(alerts[0].id)).to.be.true;
            expect(alerts[0].isRead).to.be.true;
        });

        it('should return false for non-existent alert', function() {
            expect(manager.markAlertAsRead('NONEXISTENT')).to.be.false;
        });

        it('should create out of stock alert', function() {
            manager.addInventoryItem('P002', 0);
            manager.recordMovement('P002', MovementType.ADJUSTMENT, 0);
            const alerts = manager.getAlertsForProduct('P002');
            expect(alerts.some(a => a.alertType === AlertType.OUT_OF_STOCK)).to.be.true;
        });

        it('should create overstock alert', function() {
            manager.addInventoryItem('P003', 2000);
            manager.getInventoryItem('P003').maxStock = 1000;
            manager.recordMovement('P003', MovementType.ADJUSTMENT, 0);
            const alerts = manager.getAlertsForProduct('P003');
            expect(alerts.some(a => a.alertType === AlertType.OVERSTOCK)).to.be.true;
        });
    });

    describe('getItemsNeedingReorder()', function() {
        it('should return items below reorder point', function() {
            manager.addInventoryItem('P001', 5);
            manager.addInventoryItem('P002', 100);
            manager.getInventoryItem('P001').reorderPoint = 10;
            manager.getInventoryItem('P002').reorderPoint = 10;
            
            const items = manager.getItemsNeedingReorder();
            expect(items.length).to.equal(1);
            expect(items[0].productId).to.equal('P001');
        });
    });

    describe('getOutOfStockItems()', function() {
        it('should return out of stock items', function() {
            manager.addInventoryItem('P001', 0);
            manager.addInventoryItem('P002', 100);
            
            const items = manager.getOutOfStockItems();
            expect(items.length).to.equal(1);
            expect(items[0].productId).to.equal('P001');
        });
    });

    describe('getOverstockedItems()', function() {
        it('should return overstocked items', function() {
            manager.addInventoryItem('P001', 2000);
            manager.getInventoryItem('P001').maxStock = 1000;
            manager.addInventoryItem('P002', 100);
            
            const items = manager.getOverstockedItems();
            expect(items.length).to.equal(1);
            expect(items[0].productId).to.equal('P001');
        });
    });

    describe('getMovementHistory()', function() {
        beforeEach(function() {
            manager.addInventoryItem('P001', 100);
            manager.addInventoryItem('P002', 50);
            manager.recordMovement('P001', MovementType.SALE, 10);
            manager.recordMovement('P002', MovementType.SALE, 5);
        });

        it('should return all movements', function() {
            const history = manager.getMovementHistory();
            expect(history.length).to.be.greaterThan(0);
        });

        it('should filter by product ID', function() {
            const history = manager.getMovementHistory({ productId: 'P001' });
            expect(history.every(m => m.productId === 'P001')).to.be.true;
        });

        it('should filter by type', function() {
            const history = manager.getMovementHistory({ type: MovementType.SALE });
            expect(history.every(m => m.type === MovementType.SALE)).to.be.true;
        });

        it('should limit results', function() {
            const history = manager.getMovementHistory({ limit: 2 });
            expect(history.length).to.be.lessThanOrEqual(2);
        });
    });

    describe('getStatistics()', function() {
        it('should return correct statistics', function() {
            manager.addInventoryItem('P001', 100);
            manager.addInventoryItem('P002', 0);
            manager.addInventoryItem('P003', 2000);
            manager.getInventoryItem('P003').maxStock = 1000;
            manager.reserveStock('P001', 30);

            const stats = manager.getStatistics();
            expect(stats.totalProducts).to.equal(3);
            expect(stats.totalStock).to.equal(2100);
            expect(stats.totalReserved).to.equal(30);
            expect(stats.outOfStockCount).to.equal(1);
            expect(stats.overStockCount).to.equal(1);
        });
    });

    describe('performAudit()', function() {
        beforeEach(function() {
            manager.addInventoryItem('P001', 100);
        });

        it('should adjust stock when discrepancy found', function() {
            const result = manager.performAudit('P001', 95, 'Annual audit');
            expect(result.success).to.be.true;
            expect(result.difference).to.equal(-5);
            expect(result.newStock).to.equal(95);
        });

        it('should not adjust when no discrepancy', function() {
            const result = manager.performAudit('P001', 100);
            expect(result.success).to.be.true;
            expect(result.difference).to.equal(0);
        });

        it('should fail for invalid stock value', function() {
            expect(manager.performAudit('P001', -10).success).to.be.false;
            expect(manager.performAudit('P001', 'hundred').success).to.be.false;
        });

        it('should fail for non-existent product', function() {
            expect(manager.performAudit('NONEXISTENT', 100).success).to.be.false;
        });
    });

    describe('getAllItems()', function() {
        it('should return all inventory items', function() {
            manager.addInventoryItem('P001', 100);
            manager.addInventoryItem('P002', 50);
            const items = manager.getAllItems();
            expect(items.length).to.equal(2);
        });
    });

    describe('getTotalInventoryValue()', function() {
        it('should calculate total value', function() {
            manager.addInventoryItem('P001', 10);
            manager.addInventoryItem('P002', 5);
            
            const catalog = {
                getProduct: (id) => {
                    if (id === 'P001') return { price: 100 };
                    if (id === 'P002') return { price: 50 };
                    return null;
                }
            };

            const value = manager.getTotalInventoryValue(catalog);
            expect(value).to.equal(1250); // 10*100 + 5*50
        });

        it('should handle missing products', function() {
            manager.addInventoryItem('P001', 10);
            const value = manager.getTotalInventoryValue(null);
            expect(value).to.equal(0);
        });
    });
});
