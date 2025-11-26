/**
 * Discount Module Tests
 * Comprehensive test suite for mutation testing
 */

const { expect } = require('chai');
const { Coupon, Promotion, DiscountManager, DiscountType, CouponStatus } = require('../src/discount');

describe('Coupon', function() {
    describe('Constructor', function() {
        it('should create coupon with valid data', function() {
            const coupon = new Coupon('SAVE10', DiscountType.PERCENTAGE, 10);
            expect(coupon.code).to.equal('SAVE10');
            expect(coupon.discountType).to.equal(DiscountType.PERCENTAGE);
            expect(coupon.discountValue).to.equal(10);
            expect(coupon.status).to.equal(CouponStatus.ACTIVE);
        });

        it('should convert code to uppercase', function() {
            const coupon = new Coupon('save10', DiscountType.PERCENTAGE, 10);
            expect(coupon.code).to.equal('SAVE10');
        });
    });

    describe('validate()', function() {
        it('should pass for valid percentage coupon', function() {
            const coupon = new Coupon('SAVE10', DiscountType.PERCENTAGE, 10);
            const result = coupon.validate();
            expect(result.isValid).to.be.true;
        });

        it('should fail for short code', function() {
            const coupon = new Coupon('AB', DiscountType.PERCENTAGE, 10);
            const result = coupon.validate();
            expect(result.isValid).to.be.false;
        });

        it('should fail for percentage over 100', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 150);
            const result = coupon.validate();
            expect(result.isValid).to.be.false;
        });

        it('should fail for negative percentage', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, -10);
            const result = coupon.validate();
            expect(result.isValid).to.be.false;
        });

        it('should fail for negative fixed amount', function() {
            const coupon = new Coupon('TEST', DiscountType.FIXED_AMOUNT, -5);
            const result = coupon.validate();
            expect(result.isValid).to.be.false;
        });

        it('should fail for negative min purchase', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.minPurchase = -10;
            const result = coupon.validate();
            expect(result.isValid).to.be.false;
        });

        it('should fail for invalid max discount', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.maxDiscount = -5;
            const result = coupon.validate();
            expect(result.isValid).to.be.false;
        });
    });

    describe('isValid()', function() {
        it('should return true for active coupon', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            expect(coupon.isValid()).to.be.true;
        });

        it('should return false for disabled coupon', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.status = CouponStatus.DISABLED;
            expect(coupon.isValid()).to.be.false;
        });

        it('should return false before start date', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.startDate = new Date(Date.now() + 86400000);
            expect(coupon.isValid()).to.be.false;
        });

        it('should return false after expiry date', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.expiryDate = new Date(Date.now() - 86400000);
            expect(coupon.isValid()).to.be.false;
        });

        it('should return false when usage limit reached', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.usageLimit = 5;
            coupon.usageCount = 5;
            expect(coupon.isValid()).to.be.false;
        });
    });

    describe('canBeUsedByUser()', function() {
        it('should allow use by any user without limit', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            const result = coupon.canBeUsedByUser('user1');
            expect(result.canUse).to.be.true;
        });

        it('should reject when user reached limit', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.perUserLimit = 1;
            coupon.userUsage.set('user1', 1);
            const result = coupon.canBeUsedByUser('user1');
            expect(result.canUse).to.be.false;
        });

        it('should reject when coupon not valid', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.status = CouponStatus.DISABLED;
            const result = coupon.canBeUsedByUser('user1');
            expect(result.canUse).to.be.false;
        });
    });

    describe('appliesToOrder()', function() {
        const orderDetails = {
            subtotal: 100,
            items: [
                { productId: 'P001', category: 'Electronics' },
                { productId: 'P002', category: 'Clothing' }
            ]
        };

        it('should apply to valid order', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            const result = coupon.appliesToOrder(orderDetails);
            expect(result.applies).to.be.true;
        });

        it('should reject invalid order details', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            expect(coupon.appliesToOrder(null).applies).to.be.false;
        });

        it('should reject when below min purchase', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.minPurchase = 200;
            const result = coupon.appliesToOrder(orderDetails);
            expect(result.applies).to.be.false;
        });

        it('should check category restrictions', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.applicableCategories = ['Electronics'];
            expect(coupon.appliesToOrder(orderDetails).applies).to.be.true;
            
            coupon.applicableCategories = ['Sports'];
            expect(coupon.appliesToOrder(orderDetails).applies).to.be.false;
        });

        it('should check product restrictions', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.applicableProducts = ['P001'];
            expect(coupon.appliesToOrder(orderDetails).applies).to.be.true;
            
            coupon.applicableProducts = ['P999'];
            expect(coupon.appliesToOrder(orderDetails).applies).to.be.false;
        });

        it('should check excluded products', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.excludedProducts = ['P001', 'P002'];
            expect(coupon.appliesToOrder(orderDetails).applies).to.be.false;
        });
    });

    describe('calculateDiscount()', function() {
        it('should calculate percentage discount', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 20);
            expect(coupon.calculateDiscount(100)).to.equal(20);
        });

        it('should calculate fixed amount discount', function() {
            const coupon = new Coupon('TEST', DiscountType.FIXED_AMOUNT, 15);
            expect(coupon.calculateDiscount(100)).to.equal(15);
        });

        it('should respect max discount cap', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 50);
            coupon.maxDiscount = 30;
            expect(coupon.calculateDiscount(100)).to.equal(30);
        });

        it('should not exceed subtotal', function() {
            const coupon = new Coupon('TEST', DiscountType.FIXED_AMOUNT, 200);
            expect(coupon.calculateDiscount(100)).to.equal(100);
        });

        it('should return 0 for invalid coupon', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.status = CouponStatus.DISABLED;
            expect(coupon.calculateDiscount(100)).to.equal(0);
        });

        it('should return 0 for free shipping type', function() {
            const coupon = new Coupon('TEST', DiscountType.FREE_SHIPPING, 0);
            expect(coupon.calculateDiscount(100)).to.equal(0);
        });

        it('should calculate BOGO discount', function() {
            const coupon = new Coupon('TEST', DiscountType.BUY_ONE_GET_ONE, 0);
            const items = [
                { quantity: 4, discountedPrice: 10 }
            ];
            const discount = coupon.calculateDiscount(40, items);
            expect(discount).to.equal(20); // 2 free items at $10 each
        });

        it('should calculate bundle discount', function() {
            const coupon = new Coupon('TEST', DiscountType.BUNDLE, 10);
            const items = [
                { productId: 'P001', discountedPrice: 30, quantity: 1 },
                { productId: 'P002', discountedPrice: 40, quantity: 1 },
                { productId: 'P003', discountedPrice: 30, quantity: 1 }
            ];
            const discount = coupon.calculateDiscount(100, items);
            expect(discount).to.equal(10); // 10% of 100
        });

        it('should not apply bundle discount with fewer than 3 items', function() {
            const coupon = new Coupon('TEST', DiscountType.BUNDLE, 10);
            const items = [
                { productId: 'P001', discountedPrice: 50, quantity: 1 }
            ];
            expect(coupon.calculateDiscount(50, items)).to.equal(0);
        });
    });

    describe('recordUsage()', function() {
        it('should record usage', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.recordUsage('user1');
            expect(coupon.usageCount).to.equal(1);
            expect(coupon.userUsage.get('user1')).to.equal(1);
        });

        it('should deplete coupon when limit reached', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.usageLimit = 2;
            coupon.recordUsage('user1');
            coupon.recordUsage('user2');
            expect(coupon.status).to.equal(CouponStatus.DEPLETED);
        });
    });

    describe('setExpiryDate()', function() {
        it('should set expiry date', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            const date = new Date();
            expect(coupon.setExpiryDate(date)).to.be.true;
            expect(coupon.expiryDate).to.equal(date);
        });

        it('should reject invalid date', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            expect(coupon.setExpiryDate('2024-01-01')).to.be.false;
        });
    });

    describe('setUsageLimits()', function() {
        it('should set usage limits', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            expect(coupon.setUsageLimits(100, 2)).to.be.true;
            expect(coupon.usageLimit).to.equal(100);
            expect(coupon.perUserLimit).to.equal(2);
        });

        it('should reject invalid limits', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            expect(coupon.setUsageLimits(0, 2)).to.be.false;
            expect(coupon.setUsageLimits(100, 0)).to.be.false;
        });

        it('should allow null limits', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            expect(coupon.setUsageLimits(null, null)).to.be.true;
        });
    });

    describe('setMinPurchase()', function() {
        it('should set min purchase', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            expect(coupon.setMinPurchase(50)).to.be.true;
            expect(coupon.minPurchase).to.equal(50);
        });

        it('should reject invalid amount', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            expect(coupon.setMinPurchase(-10)).to.be.false;
        });
    });

    describe('disable() / enable()', function() {
        it('should disable coupon', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.disable();
            expect(coupon.status).to.equal(CouponStatus.DISABLED);
        });

        it('should enable coupon', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.disable();
            expect(coupon.enable()).to.be.true;
            expect(coupon.status).to.equal(CouponStatus.ACTIVE);
        });

        it('should not enable depleted coupon', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.status = CouponStatus.DEPLETED;
            expect(coupon.enable()).to.be.false;
        });

        it('should not enable expired coupon', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            coupon.expiryDate = new Date(Date.now() - 86400000);
            expect(coupon.enable()).to.be.false;
        });
    });

    describe('toJSON()', function() {
        it('should return complete coupon data', function() {
            const coupon = new Coupon('TEST', DiscountType.PERCENTAGE, 10);
            const json = coupon.toJSON();
            expect(json.code).to.equal('TEST');
            expect(json.discountType).to.equal(DiscountType.PERCENTAGE);
            expect(json.discountValue).to.equal(10);
            expect(json.isValid).to.be.true;
        });
    });
});

describe('Promotion', function() {
    describe('Constructor', function() {
        it('should create promotion', function() {
            const promo = new Promotion('PROMO1', 'Summer Sale', DiscountType.PERCENTAGE, 20);
            expect(promo.id).to.equal('PROMO1');
            expect(promo.name).to.equal('Summer Sale');
            expect(promo.discountValue).to.equal(20);
            expect(promo.isActive).to.be.true;
        });
    });

    describe('isCurrentlyActive()', function() {
        it('should return true for active promotion', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            expect(promo.isCurrentlyActive()).to.be.true;
        });

        it('should return false for inactive promotion', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            promo.isActive = false;
            expect(promo.isCurrentlyActive()).to.be.false;
        });

        it('should return false before start date', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            promo.startDate = new Date(Date.now() + 86400000);
            expect(promo.isCurrentlyActive()).to.be.false;
        });

        it('should return false after end date', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            promo.endDate = new Date(Date.now() - 86400000);
            expect(promo.isCurrentlyActive()).to.be.false;
        });
    });

    describe('appliesToProduct()', function() {
        const product = { id: 'P001', category: 'Electronics' };

        it('should apply to any product without restrictions', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            expect(promo.appliesToProduct(product)).to.be.true;
        });

        it('should apply to product in applicable products', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            promo.applicableProducts = ['P001'];
            expect(promo.appliesToProduct(product)).to.be.true;
        });

        it('should apply to product in applicable category', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            promo.applicableCategories = ['Electronics'];
            expect(promo.appliesToProduct(product)).to.be.true;
        });

        it('should not apply to product not in list', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            promo.applicableProducts = ['P002'];
            expect(promo.appliesToProduct(product)).to.be.false;
        });

        it('should not apply when inactive', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            promo.isActive = false;
            expect(promo.appliesToProduct(product)).to.be.false;
        });
    });

    describe('calculatePromotionalPrice()', function() {
        it('should calculate percentage discount', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            expect(promo.calculatePromotionalPrice(100)).to.equal(80);
        });

        it('should calculate fixed amount discount', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.FIXED_AMOUNT, 25);
            expect(promo.calculatePromotionalPrice(100)).to.equal(75);
        });

        it('should not go below 0', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.FIXED_AMOUNT, 150);
            expect(promo.calculatePromotionalPrice(100)).to.equal(0);
        });
    });

    describe('addRule()', function() {
        it('should add valid rule', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            expect(promo.addRule({ minQuantity: 3 })).to.be.true;
            expect(promo.rules.length).to.equal(1);
        });

        it('should reject invalid rule', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            expect(promo.addRule(null)).to.be.false;
        });
    });

    describe('activate() / deactivate()', function() {
        it('should activate promotion', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            promo.isActive = false;
            promo.activate();
            expect(promo.isActive).to.be.true;
        });

        it('should deactivate promotion', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            promo.deactivate();
            expect(promo.isActive).to.be.false;
        });
    });

    describe('toJSON()', function() {
        it('should return complete promotion data', function() {
            const promo = new Promotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            const json = promo.toJSON();
            expect(json.id).to.equal('PROMO1');
            expect(json.name).to.equal('Sale');
            expect(json.isCurrentlyActive).to.be.true;
        });
    });
});

describe('DiscountManager', function() {
    let manager;

    beforeEach(function() {
        manager = new DiscountManager();
    });

    describe('createCoupon()', function() {
        it('should create valid coupon', function() {
            const result = manager.createCoupon('TEST10', DiscountType.PERCENTAGE, 10);
            expect(result.success).to.be.true;
            expect(result.coupon.code).to.equal('TEST10');
        });

        it('should reject duplicate code', function() {
            manager.createCoupon('TEST10', DiscountType.PERCENTAGE, 10);
            const result = manager.createCoupon('TEST10', DiscountType.PERCENTAGE, 20);
            expect(result.success).to.be.false;
        });

        it('should reject invalid code', function() {
            const result = manager.createCoupon(null, DiscountType.PERCENTAGE, 10);
            expect(result.success).to.be.false;
        });

        it('should reject invalid coupon', function() {
            const result = manager.createCoupon('AB', DiscountType.PERCENTAGE, 10);
            expect(result.success).to.be.false;
        });
    });

    describe('getCoupon()', function() {
        it('should return coupon by code', function() {
            manager.createCoupon('TEST10', DiscountType.PERCENTAGE, 10);
            const coupon = manager.getCoupon('TEST10');
            expect(coupon).to.not.be.null;
            expect(coupon.code).to.equal('TEST10');
        });

        it('should be case-insensitive', function() {
            manager.createCoupon('TEST10', DiscountType.PERCENTAGE, 10);
            expect(manager.getCoupon('test10')).to.not.be.null;
        });

        it('should return null for non-existent coupon', function() {
            expect(manager.getCoupon('NONEXISTENT')).to.be.null;
        });

        it('should return null for null code', function() {
            expect(manager.getCoupon(null)).to.be.null;
        });
    });

    describe('deleteCoupon()', function() {
        it('should delete existing coupon', function() {
            manager.createCoupon('TEST10', DiscountType.PERCENTAGE, 10);
            expect(manager.deleteCoupon('TEST10')).to.be.true;
            expect(manager.getCoupon('TEST10')).to.be.null;
        });

        it('should return false for non-existent coupon', function() {
            expect(manager.deleteCoupon('NONEXISTENT')).to.be.false;
        });

        it('should return false for null code', function() {
            expect(manager.deleteCoupon(null)).to.be.false;
        });
    });

    describe('validateAndApplyCoupon()', function() {
        beforeEach(function() {
            manager.createCoupon('SAVE10', DiscountType.PERCENTAGE, 10);
        });

        const orderDetails = {
            subtotal: 100,
            items: [{ productId: 'P001', category: 'Electronics', discountedPrice: 50, quantity: 2 }]
        };

        it('should validate and return discount', function() {
            const result = manager.validateAndApplyCoupon('SAVE10', 'user1', orderDetails);
            expect(result.success).to.be.true;
            expect(result.calculatedDiscount).to.equal(10);
        });

        it('should fail for non-existent coupon', function() {
            const result = manager.validateAndApplyCoupon('INVALID', 'user1', orderDetails);
            expect(result.success).to.be.false;
        });

        it('should check user usage', function() {
            const coupon = manager.getCoupon('SAVE10');
            coupon.perUserLimit = 1;
            coupon.userUsage.set('user1', 1);
            const result = manager.validateAndApplyCoupon('SAVE10', 'user1', orderDetails);
            expect(result.success).to.be.false;
        });

        it('should check order eligibility', function() {
            const coupon = manager.getCoupon('SAVE10');
            coupon.minPurchase = 200;
            const result = manager.validateAndApplyCoupon('SAVE10', 'user1', orderDetails);
            expect(result.success).to.be.false;
        });

        it('should indicate free shipping', function() {
            manager.createCoupon('FREESHIP', DiscountType.FREE_SHIPPING, 0);
            const result = manager.validateAndApplyCoupon('FREESHIP', 'user1', orderDetails);
            expect(result.success).to.be.true;
            expect(result.freeShipping).to.be.true;
        });
    });

    describe('recordCouponUsage()', function() {
        it('should record usage', function() {
            manager.createCoupon('TEST', DiscountType.PERCENTAGE, 10);
            expect(manager.recordCouponUsage('TEST', 'user1')).to.be.true;
        });

        it('should return false for non-existent coupon', function() {
            expect(manager.recordCouponUsage('INVALID', 'user1')).to.be.false;
        });
    });

    describe('createPromotion()', function() {
        it('should create promotion', function() {
            const result = manager.createPromotion('PROMO1', 'Summer Sale', DiscountType.PERCENTAGE, 20);
            expect(result.success).to.be.true;
            expect(result.promotion.name).to.equal('Summer Sale');
        });

        it('should reject duplicate ID', function() {
            manager.createPromotion('PROMO1', 'Sale 1', DiscountType.PERCENTAGE, 20);
            const result = manager.createPromotion('PROMO1', 'Sale 2', DiscountType.PERCENTAGE, 30);
            expect(result.success).to.be.false;
        });

        it('should reject invalid ID', function() {
            const result = manager.createPromotion(null, 'Sale', DiscountType.PERCENTAGE, 20);
            expect(result.success).to.be.false;
        });
    });

    describe('getPromotion() / deletePromotion()', function() {
        it('should return promotion by ID', function() {
            manager.createPromotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            const promo = manager.getPromotion('PROMO1');
            expect(promo).to.not.be.null;
        });

        it('should return null for non-existent', function() {
            expect(manager.getPromotion('INVALID')).to.be.null;
        });

        it('should delete promotion', function() {
            manager.createPromotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 20);
            expect(manager.deletePromotion('PROMO1')).to.be.true;
            expect(manager.getPromotion('PROMO1')).to.be.null;
        });
    });

    describe('getActivePromotionsForProduct()', function() {
        const product = { id: 'P001', category: 'Electronics' };

        it('should return applicable promotions', function() {
            manager.createPromotion('PROMO1', 'All Products', DiscountType.PERCENTAGE, 10);
            const promos = manager.getActivePromotionsForProduct(product);
            expect(promos.length).to.equal(1);
        });

        it('should filter by category', function() {
            const result = manager.createPromotion('PROMO1', 'Electronics', DiscountType.PERCENTAGE, 10);
            result.promotion.applicableCategories = ['Electronics'];
            
            const result2 = manager.createPromotion('PROMO2', 'Clothing', DiscountType.PERCENTAGE, 20);
            result2.promotion.applicableCategories = ['Clothing'];

            const promos = manager.getActivePromotionsForProduct(product);
            expect(promos.length).to.equal(1);
            expect(promos[0].name).to.equal('Electronics');
        });

        it('should sort by priority', function() {
            const result1 = manager.createPromotion('PROMO1', 'Low', DiscountType.PERCENTAGE, 10);
            result1.promotion.priority = 1;
            
            const result2 = manager.createPromotion('PROMO2', 'High', DiscountType.PERCENTAGE, 20);
            result2.promotion.priority = 10;

            const promos = manager.getActivePromotionsForProduct(product);
            expect(promos[0].name).to.equal('High');
        });
    });

    describe('getBestPromotionForProduct()', function() {
        it('should return highest priority promotion', function() {
            const result1 = manager.createPromotion('PROMO1', 'Low', DiscountType.PERCENTAGE, 10);
            result1.promotion.priority = 1;
            
            const result2 = manager.createPromotion('PROMO2', 'High', DiscountType.PERCENTAGE, 20);
            result2.promotion.priority = 10;

            const product = { id: 'P001', category: 'Electronics' };
            const best = manager.getBestPromotionForProduct(product);
            expect(best.name).to.equal('High');
        });

        it('should return null when no promotions', function() {
            const product = { id: 'P001', category: 'Electronics' };
            expect(manager.getBestPromotionForProduct(product)).to.be.null;
        });
    });

    describe('calculateBestPrice()', function() {
        it('should use product discount when no promotion', function() {
            const product = { 
                id: 'P001', 
                category: 'Electronics', 
                price: 100, 
                discount: 10,
                getDiscountedPrice: () => 90
            };
            
            const result = manager.calculateBestPrice(product);
            expect(result.finalPrice).to.equal(90);
            expect(result.savings).to.equal(10);
        });

        it('should use promotion when better', function() {
            manager.createPromotion('PROMO1', 'Sale', DiscountType.PERCENTAGE, 30);
            
            const product = { 
                id: 'P001', 
                category: 'Electronics', 
                price: 100, 
                discount: 10,
                getDiscountedPrice: () => 90
            };
            
            const result = manager.calculateBestPrice(product);
            expect(result.finalPrice).to.equal(70);
            expect(result.appliedPromotion).to.not.be.null;
        });
    });

    describe('getActiveCoupons() / getActivePromotions()', function() {
        it('should return active coupons', function() {
            manager.createCoupon('ACTIVE', DiscountType.PERCENTAGE, 10);
            const result = manager.createCoupon('DISABLED', DiscountType.PERCENTAGE, 20);
            result.coupon.disable();
            
            const active = manager.getActiveCoupons();
            expect(active.length).to.equal(1);
        });

        it('should return active promotions', function() {
            manager.createPromotion('ACTIVE', 'Sale', DiscountType.PERCENTAGE, 10);
            const result = manager.createPromotion('INACTIVE', 'Old', DiscountType.PERCENTAGE, 20);
            result.promotion.deactivate();
            
            const active = manager.getActivePromotions();
            expect(active.length).to.equal(1);
        });
    });

    describe('getStatistics()', function() {
        it('should return correct statistics', function() {
            manager.createCoupon('CODE1', DiscountType.PERCENTAGE, 10);
            manager.createCoupon('CODE2', DiscountType.PERCENTAGE, 20);
            manager.createPromotion('P1', 'Sale', DiscountType.PERCENTAGE, 10);
            
            manager.recordCouponUsage('CODE1', 'user1');
            manager.recordCouponUsage('CODE1', 'user2');
            
            const stats = manager.getStatistics();
            expect(stats.totalCoupons).to.equal(2);
            expect(stats.activeCoupons).to.equal(2);
            expect(stats.totalCouponUsage).to.equal(2);
            expect(stats.totalPromotions).to.equal(1);
        });
    });

    describe('getCouponDatabase()', function() {
        it('should return database for cart compatibility', function() {
            const result = manager.createCoupon('TEST', DiscountType.PERCENTAGE, 10);
            result.coupon.setMinPurchase(25);
            result.coupon.setExpiryDate(new Date(Date.now() + 86400000));
            
            const db = manager.getCouponDatabase();
            expect(db.TEST).to.exist;
            expect(db.TEST.discount).to.equal(10);
            expect(db.TEST.minPurchase).to.equal(25);
        });

        it('should not include invalid coupons', function() {
            const result = manager.createCoupon('DISABLED', DiscountType.PERCENTAGE, 10);
            result.coupon.disable();
            
            const db = manager.getCouponDatabase();
            expect(db.DISABLED).to.be.undefined;
        });
    });
});
