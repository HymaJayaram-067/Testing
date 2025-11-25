/**
 * Product Module Tests
 * Comprehensive test suite for mutation testing
 */

const { expect } = require('chai');
const { Product, ProductCatalog } = require('../src/product');

describe('Product', function() {
    describe('Constructor', function() {
        it('should create a product with valid data', function() {
            const product = new Product('P001', 'Test Product', 29.99, 'Electronics', 100, 'Test description');
            expect(product.id).to.equal('P001');
            expect(product.name).to.equal('Test Product');
            expect(product.price).to.equal(29.99);
            expect(product.category).to.equal('Electronics');
            expect(product.stock).to.equal(100);
            expect(product.description).to.equal('Test description');
            expect(product.isActive).to.be.true;
            expect(product.discount).to.equal(0);
            expect(product.ratings).to.be.an('array').that.is.empty;
            expect(product.tags).to.be.an('array').that.is.empty;
        });

        it('should use default values for optional parameters', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.stock).to.equal(0);
            expect(product.description).to.equal('');
        });
    });

    describe('validate()', function() {
        it('should return valid for properly configured product', function() {
            const product = new Product('P001', 'Valid Product', 29.99, 'Electronics', 50);
            const result = product.validate();
            expect(result.isValid).to.be.true;
            expect(result.errors).to.be.an('array').that.is.empty;
        });

        it('should reject empty product ID', function() {
            const product = new Product('', 'Test', 10, 'Cat');
            const result = product.validate();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('Product ID is required and must be a non-empty string');
        });

        it('should reject null product ID', function() {
            const product = new Product(null, 'Test', 10, 'Cat');
            const result = product.validate();
            expect(result.isValid).to.be.false;
        });

        it('should reject whitespace-only product ID', function() {
            const product = new Product('   ', 'Test', 10, 'Cat');
            const result = product.validate();
            expect(result.isValid).to.be.false;
        });

        it('should reject empty product name', function() {
            const product = new Product('P001', '', 10, 'Cat');
            const result = product.validate();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('Product name is required and must be a non-empty string');
        });

        it('should reject too short product name', function() {
            const product = new Product('P001', 'A', 10, 'Cat');
            const result = product.validate();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('Product name must be between 2 and 200 characters');
        });

        it('should reject too long product name', function() {
            const product = new Product('P001', 'A'.repeat(201), 10, 'Cat');
            const result = product.validate();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('Product name must be between 2 and 200 characters');
        });

        it('should reject negative price', function() {
            const product = new Product('P001', 'Test', -10, 'Cat');
            const result = product.validate();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('Product price must be a non-negative number');
        });

        it('should accept zero price', function() {
            const product = new Product('P001', 'Test Product', 0, 'Cat', 10);
            const result = product.validate();
            expect(result.isValid).to.be.true;
        });

        it('should reject price over 1000000', function() {
            const product = new Product('P001', 'Test', 1000001, 'Cat');
            const result = product.validate();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('Product price cannot exceed 1,000,000');
        });

        it('should reject non-numeric price', function() {
            const product = new Product('P001', 'Test', 'abc', 'Cat');
            const result = product.validate();
            expect(result.isValid).to.be.false;
        });

        it('should reject missing category', function() {
            const product = new Product('P001', 'Test', 10, null);
            const result = product.validate();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('Product category is required');
        });

        it('should reject negative stock', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', -5);
            const result = product.validate();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('Product stock must be a non-negative integer');
        });

        it('should reject non-integer stock', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 5.5);
            const result = product.validate();
            expect(result.isValid).to.be.false;
        });

        it('should reject discount below 0', function() {
            const product = new Product('P001', 'Test Product', 10, 'Cat', 10);
            product.discount = -5;
            const result = product.validate();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('Product discount must be between 0 and 100');
        });

        it('should reject discount above 100', function() {
            const product = new Product('P001', 'Test Product', 10, 'Cat', 10);
            product.discount = 101;
            const result = product.validate();
            expect(result.isValid).to.be.false;
        });
    });

    describe('getDiscountedPrice()', function() {
        it('should return original price when no discount', function() {
            const product = new Product('P001', 'Test', 100, 'Cat');
            expect(product.getDiscountedPrice()).to.equal(100);
        });

        it('should calculate 10% discount correctly', function() {
            const product = new Product('P001', 'Test', 100, 'Cat');
            product.discount = 10;
            expect(product.getDiscountedPrice()).to.equal(90);
        });

        it('should calculate 50% discount correctly', function() {
            const product = new Product('P001', 'Test', 100, 'Cat');
            product.discount = 50;
            expect(product.getDiscountedPrice()).to.equal(50);
        });

        it('should return 0 for 100% discount', function() {
            const product = new Product('P001', 'Test', 100, 'Cat');
            product.discount = 100;
            expect(product.getDiscountedPrice()).to.equal(0);
        });

        it('should return original price for negative discount', function() {
            const product = new Product('P001', 'Test', 100, 'Cat');
            product.discount = -10;
            expect(product.getDiscountedPrice()).to.equal(100);
        });

        it('should handle decimal prices correctly', function() {
            const product = new Product('P001', 'Test', 29.99, 'Cat');
            product.discount = 25;
            expect(product.getDiscountedPrice()).to.equal(22.49);
        });

        it('should round to 2 decimal places', function() {
            const product = new Product('P001', 'Test', 33.33, 'Cat');
            product.discount = 15;
            const price = product.getDiscountedPrice();
            expect(price).to.be.closeTo(28.33, 0.01);
        });
    });

    describe('addRating()', function() {
        it('should add valid rating', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            const result = product.addRating(4, 'user1', 'Great product');
            expect(result).to.be.true;
            expect(product.ratings.length).to.equal(1);
            expect(product.ratings[0].rating).to.equal(4);
            expect(product.ratings[0].userId).to.equal('user1');
            expect(product.ratings[0].review).to.equal('Great product');
        });

        it('should reject rating below 1', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.addRating(0, 'user1')).to.be.false;
            expect(product.ratings.length).to.equal(0);
        });

        it('should reject rating above 5', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.addRating(6, 'user1')).to.be.false;
        });

        it('should reject non-numeric rating', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.addRating('good', 'user1')).to.be.false;
        });

        it('should reject invalid user ID', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.addRating(4, null)).to.be.false;
            expect(product.addRating(4, '')).to.be.false;
            expect(product.addRating(4, 123)).to.be.false;
        });

        it('should update existing rating from same user', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            product.addRating(3, 'user1', 'OK');
            product.addRating(5, 'user1', 'Actually great!');
            expect(product.ratings.length).to.equal(1);
            expect(product.ratings[0].rating).to.equal(5);
            expect(product.ratings[0].review).to.equal('Actually great!');
        });

        it('should allow multiple users to rate', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            product.addRating(5, 'user1');
            product.addRating(4, 'user2');
            product.addRating(3, 'user3');
            expect(product.ratings.length).to.equal(3);
        });

        it('should accept minimum rating of 1', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.addRating(1, 'user1')).to.be.true;
        });

        it('should accept maximum rating of 5', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.addRating(5, 'user1')).to.be.true;
        });
    });

    describe('getAverageRating()', function() {
        it('should return 0 for no ratings', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.getAverageRating()).to.equal(0);
        });

        it('should return single rating value', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            product.addRating(4, 'user1');
            expect(product.getAverageRating()).to.equal(4);
        });

        it('should calculate average correctly', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            product.addRating(5, 'user1');
            product.addRating(3, 'user2');
            expect(product.getAverageRating()).to.equal(4);
        });

        it('should round to one decimal place', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            product.addRating(5, 'user1');
            product.addRating(4, 'user2');
            product.addRating(3, 'user3');
            expect(product.getAverageRating()).to.equal(4);
        });
    });

    describe('updateStock()', function() {
        it('should add stock with positive quantity', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 50);
            expect(product.updateStock(25)).to.be.true;
            expect(product.stock).to.equal(75);
        });

        it('should remove stock with negative quantity', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 50);
            expect(product.updateStock(-25)).to.be.true;
            expect(product.stock).to.equal(25);
        });

        it('should not allow negative stock result', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 50);
            expect(product.updateStock(-60)).to.be.false;
            expect(product.stock).to.equal(50);
        });

        it('should reject non-integer quantity', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 50);
            expect(product.updateStock(2.5)).to.be.false;
        });

        it('should reject non-numeric quantity', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 50);
            expect(product.updateStock('ten')).to.be.false;
        });

        it('should allow zero quantity', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 50);
            expect(product.updateStock(0)).to.be.true;
            expect(product.stock).to.equal(50);
        });
    });

    describe('isInStock()', function() {
        it('should return true when enough stock', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 50);
            expect(product.isInStock(25)).to.be.true;
        });

        it('should return false when not enough stock', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 10);
            expect(product.isInStock(25)).to.be.false;
        });

        it('should return true when exact stock available', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 10);
            expect(product.isInStock(10)).to.be.true;
        });

        it('should return false when inactive', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 50);
            product.deactivate();
            expect(product.isInStock(1)).to.be.false;
        });

        it('should return true with default quantity of 1', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 50);
            expect(product.isInStock()).to.be.true;
        });

        it('should return false for zero or negative quantity', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 50);
            expect(product.isInStock(0)).to.be.false;
            expect(product.isInStock(-1)).to.be.false;
        });

        it('should return false for non-numeric quantity', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 50);
            expect(product.isInStock('five')).to.be.false;
        });
    });

    describe('addTags()', function() {
        it('should add valid tags', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            const added = product.addTags(['electronics', 'sale', 'featured']);
            expect(added).to.equal(3);
            expect(product.tags).to.include('electronics');
            expect(product.tags).to.include('sale');
            expect(product.tags).to.include('featured');
        });

        it('should not add duplicate tags', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            product.addTags(['electronics']);
            const added = product.addTags(['electronics', 'sale']);
            expect(added).to.equal(1);
            expect(product.tags.length).to.equal(2);
        });

        it('should convert tags to lowercase', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            product.addTags(['ELECTRONICS', 'Sale']);
            expect(product.tags).to.include('electronics');
            expect(product.tags).to.include('sale');
        });

        it('should reject non-array input', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.addTags('electronics')).to.equal(0);
        });

        it('should skip empty tags', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            const added = product.addTags(['', '  ', 'valid']);
            expect(added).to.equal(1);
        });
    });

    describe('removeTag()', function() {
        it('should remove existing tag', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            product.addTags(['electronics', 'sale']);
            expect(product.removeTag('electronics')).to.be.true;
            expect(product.tags).to.not.include('electronics');
            expect(product.tags).to.include('sale');
        });

        it('should return false for non-existent tag', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            product.addTags(['electronics']);
            expect(product.removeTag('sale')).to.be.false;
        });

        it('should handle case-insensitive removal', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            product.addTags(['electronics']);
            expect(product.removeTag('ELECTRONICS')).to.be.true;
        });

        it('should return false for non-string input', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.removeTag(123)).to.be.false;
        });
    });

    describe('setAttribute() / getAttribute()', function() {
        it('should set and get attribute', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.setAttribute('color', 'red')).to.be.true;
            expect(product.getAttribute('color')).to.equal('red');
        });

        it('should handle various value types', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            product.setAttribute('count', 5);
            product.setAttribute('available', true);
            product.setAttribute('specs', { weight: '1kg' });
            expect(product.getAttribute('count')).to.equal(5);
            expect(product.getAttribute('available')).to.be.true;
            expect(product.getAttribute('specs')).to.deep.equal({ weight: '1kg' });
        });

        it('should reject empty key', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.setAttribute('', 'value')).to.be.false;
            expect(product.setAttribute('   ', 'value')).to.be.false;
        });

        it('should reject non-string key', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.setAttribute(123, 'value')).to.be.false;
        });

        it('should return undefined for non-existent attribute', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.getAttribute('nonexistent')).to.be.undefined;
        });

        it('should return undefined for non-string key in getAttribute', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.getAttribute(123)).to.be.undefined;
        });
    });

    describe('setDiscount()', function() {
        it('should set valid discount', function() {
            const product = new Product('P001', 'Test', 100, 'Cat');
            expect(product.setDiscount(25)).to.be.true;
            expect(product.discount).to.equal(25);
        });

        it('should accept 0 discount', function() {
            const product = new Product('P001', 'Test', 100, 'Cat');
            product.discount = 50;
            expect(product.setDiscount(0)).to.be.true;
            expect(product.discount).to.equal(0);
        });

        it('should accept 100 discount', function() {
            const product = new Product('P001', 'Test', 100, 'Cat');
            expect(product.setDiscount(100)).to.be.true;
            expect(product.discount).to.equal(100);
        });

        it('should reject negative discount', function() {
            const product = new Product('P001', 'Test', 100, 'Cat');
            expect(product.setDiscount(-10)).to.be.false;
        });

        it('should reject discount over 100', function() {
            const product = new Product('P001', 'Test', 100, 'Cat');
            expect(product.setDiscount(101)).to.be.false;
        });

        it('should reject non-numeric discount', function() {
            const product = new Product('P001', 'Test', 100, 'Cat');
            expect(product.setDiscount('half')).to.be.false;
        });
    });

    describe('activate() / deactivate()', function() {
        it('should deactivate product', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.isActive).to.be.true;
            product.deactivate();
            expect(product.isActive).to.be.false;
        });

        it('should activate product', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            product.deactivate();
            product.activate();
            expect(product.isActive).to.be.true;
        });
    });

    describe('toJSON()', function() {
        it('should return complete product data', function() {
            const product = new Product('P001', 'Test Product', 100, 'Electronics', 50, 'Description');
            product.setDiscount(20);
            product.addTags(['sale']);
            product.addRating(5, 'user1');
            
            const json = product.toJSON();
            expect(json.id).to.equal('P001');
            expect(json.name).to.equal('Test Product');
            expect(json.price).to.equal(100);
            expect(json.discountedPrice).to.equal(80);
            expect(json.category).to.equal('Electronics');
            expect(json.stock).to.equal(50);
            expect(json.discount).to.equal(20);
            expect(json.averageRating).to.equal(5);
            expect(json.tags).to.include('sale');
        });
    });
});

describe('ProductCatalog', function() {
    let catalog;

    beforeEach(function() {
        catalog = new ProductCatalog();
    });

    describe('addProduct()', function() {
        it('should add valid product', function() {
            const product = new Product('P001', 'Test Product', 29.99, 'Electronics', 50);
            const result = catalog.addProduct(product);
            expect(result.success).to.be.true;
            expect(catalog.products.size).to.equal(1);
        });

        it('should reject non-Product object', function() {
            const result = catalog.addProduct({ id: 'P001', name: 'Test' });
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Invalid product object');
        });

        it('should reject invalid product', function() {
            const product = new Product('', 'Test', 10, 'Cat');
            const result = catalog.addProduct(product);
            expect(result.success).to.be.false;
        });

        it('should reject duplicate product ID', function() {
            const product1 = new Product('P001', 'Product One', 10, 'Cat', 10);
            const product2 = new Product('P001', 'Product Two', 20, 'Cat', 20);
            catalog.addProduct(product1);
            const result = catalog.addProduct(product2);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Product with this ID already exists');
        });

        it('should track categories', function() {
            catalog.addProduct(new Product('P001', 'Test One', 10, 'Electronics', 10));
            catalog.addProduct(new Product('P002', 'Test Two', 10, 'Clothing', 10));
            const categories = catalog.getAllCategories();
            expect(categories).to.include('Electronics');
            expect(categories).to.include('Clothing');
        });
    });

    describe('getProduct()', function() {
        it('should return product by ID', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 10);
            catalog.addProduct(product);
            const found = catalog.getProduct('P001');
            expect(found).to.equal(product);
        });

        it('should return null for non-existent product', function() {
            expect(catalog.getProduct('NONEXISTENT')).to.be.null;
        });

        it('should return null for non-string ID', function() {
            expect(catalog.getProduct(123)).to.be.null;
        });
    });

    describe('updateProduct()', function() {
        it('should update product fields', function() {
            const product = new Product('P001', 'Old Name', 10, 'Cat', 10);
            catalog.addProduct(product);
            const result = catalog.updateProduct('P001', { name: 'New Name', price: 25 });
            expect(result.success).to.be.true;
            expect(product.name).to.equal('New Name');
            expect(product.price).to.equal(25);
        });

        it('should return error for non-existent product', function() {
            const result = catalog.updateProduct('NONEXISTENT', { name: 'New' });
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Product not found');
        });

        it('should reject invalid updates object', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 10);
            catalog.addProduct(product);
            const result = catalog.updateProduct('P001', null);
            expect(result.success).to.be.false;
        });

        it('should reject updates that make product invalid', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 10);
            catalog.addProduct(product);
            const result = catalog.updateProduct('P001', { price: -50 });
            expect(result.success).to.be.false;
        });
    });

    describe('removeProduct()', function() {
        it('should remove existing product', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 10);
            catalog.addProduct(product);
            expect(catalog.removeProduct('P001')).to.be.true;
            expect(catalog.getProduct('P001')).to.be.null;
        });

        it('should return false for non-existent product', function() {
            expect(catalog.removeProduct('NONEXISTENT')).to.be.false;
        });
    });

    describe('getProductsByCategory()', function() {
        beforeEach(function() {
            catalog.addProduct(new Product('P001', 'Electronics Item 1', 100, 'Electronics', 50));
            catalog.addProduct(new Product('P002', 'Electronics Item 2', 200, 'Electronics', 30));
            catalog.addProduct(new Product('P003', 'Clothing Item', 50, 'Clothing', 100));
            const inactive = new Product('P004', 'Inactive Electronics', 75, 'Electronics', 20);
            inactive.deactivate();
            catalog.addProduct(inactive);
        });

        it('should return products in category', function() {
            const products = catalog.getProductsByCategory('Electronics');
            expect(products.length).to.equal(2);
        });

        it('should return empty array for non-existent category', function() {
            const products = catalog.getProductsByCategory('NonExistent');
            expect(products).to.be.an('array').that.is.empty;
        });

        it('should include inactive products when activeOnly is false', function() {
            const products = catalog.getProductsByCategory('Electronics', false);
            expect(products.length).to.equal(3);
        });

        it('should return empty for non-string category', function() {
            expect(catalog.getProductsByCategory(123)).to.be.an('array').that.is.empty;
        });
    });

    describe('searchProducts()', function() {
        beforeEach(function() {
            const p1 = new Product('P001', 'Wireless Headphones', 100, 'Electronics', 50, 'Bluetooth wireless headphones');
            const p2 = new Product('P002', 'USB Cable', 20, 'Electronics', 200, 'High speed USB cable');
            const p3 = new Product('P003', 'Running Shoes', 80, 'Shoes', 100, 'Comfortable running shoes');
            p1.addTags(['wireless', 'audio']);
            p3.addTags(['sports', 'running']);
            catalog.addProduct(p1);
            catalog.addProduct(p2);
            catalog.addProduct(p3);
        });

        it('should find products by name', function() {
            const results = catalog.searchProducts('Headphones');
            expect(results.length).to.equal(1);
            expect(results[0].name).to.include('Headphones');
        });

        it('should find products by description', function() {
            const results = catalog.searchProducts('Bluetooth');
            expect(results.length).to.equal(1);
        });

        it('should find products by tag', function() {
            const results = catalog.searchProducts('wireless');
            expect(results.length).to.equal(1);
        });

        it('should be case-insensitive', function() {
            const results = catalog.searchProducts('HEADPHONES');
            expect(results.length).to.equal(1);
        });

        it('should return empty for empty query', function() {
            expect(catalog.searchProducts('')).to.be.an('array').that.is.empty;
            expect(catalog.searchProducts('   ')).to.be.an('array').that.is.empty;
        });

        it('should return empty for no matches', function() {
            const results = catalog.searchProducts('nonexistent');
            expect(results).to.be.an('array').that.is.empty;
        });
    });

    describe('getLowStockProducts()', function() {
        it('should return products below threshold', function() {
            catalog.addProduct(new Product('P001', 'Low Stock', 10, 'Cat', 5));
            catalog.addProduct(new Product('P002', 'High Stock', 10, 'Cat', 100));
            const lowStock = catalog.getLowStockProducts(10);
            expect(lowStock.length).to.equal(1);
            expect(lowStock[0].id).to.equal('P001');
        });

        it('should use default threshold of 10', function() {
            catalog.addProduct(new Product('P001', 'Low', 10, 'Cat', 8));
            const lowStock = catalog.getLowStockProducts();
            expect(lowStock.length).to.equal(1);
        });

        it('should handle invalid threshold', function() {
            catalog.addProduct(new Product('P001', 'Test', 10, 'Cat', 8));
            const lowStock = catalog.getLowStockProducts(-5);
            expect(lowStock.length).to.equal(1); // Uses default 10
        });
    });

    describe('getProductsSortedByPrice()', function() {
        beforeEach(function() {
            catalog.addProduct(new Product('P001', 'Mid Price', 50, 'Cat', 10));
            catalog.addProduct(new Product('P002', 'Low Price', 25, 'Cat', 10));
            catalog.addProduct(new Product('P003', 'High Price', 100, 'Cat', 10));
        });

        it('should sort ascending by default', function() {
            const sorted = catalog.getProductsSortedByPrice('asc');
            expect(sorted[0].price).to.equal(25);
            expect(sorted[2].price).to.equal(100);
        });

        it('should sort descending when specified', function() {
            const sorted = catalog.getProductsSortedByPrice('desc');
            expect(sorted[0].price).to.equal(100);
            expect(sorted[2].price).to.equal(25);
        });
    });

    describe('getProductsSortedByRating()', function() {
        it('should sort by average rating descending', function() {
            const p1 = new Product('P001', 'Low Rated', 50, 'Cat', 10);
            const p2 = new Product('P002', 'High Rated', 50, 'Cat', 10);
            p1.addRating(2, 'user1');
            p2.addRating(5, 'user1');
            catalog.addProduct(p1);
            catalog.addProduct(p2);

            const sorted = catalog.getProductsSortedByRating();
            expect(sorted[0].getAverageRating()).to.equal(5);
        });
    });

    describe('getProductCount()', function() {
        it('should return total count', function() {
            catalog.addProduct(new Product('P001', 'Active', 10, 'Cat', 10));
            const inactive = new Product('P002', 'Inactive', 10, 'Cat', 10);
            inactive.deactivate();
            catalog.addProduct(inactive);
            expect(catalog.getProductCount()).to.equal(2);
        });

        it('should return active count only', function() {
            catalog.addProduct(new Product('P001', 'Active', 10, 'Cat', 10));
            const inactive = new Product('P002', 'Inactive', 10, 'Cat', 10);
            inactive.deactivate();
            catalog.addProduct(inactive);
            expect(catalog.getProductCount(true)).to.equal(1);
        });
    });

    describe('applyBulkDiscount()', function() {
        it('should apply discount to category', function() {
            catalog.addProduct(new Product('P001', 'Electronics 1', 100, 'Electronics', 10));
            catalog.addProduct(new Product('P002', 'Electronics 2', 200, 'Electronics', 10));
            catalog.addProduct(new Product('P003', 'Clothing', 50, 'Clothing', 10));

            const updated = catalog.applyBulkDiscount('Electronics', 15);
            expect(updated).to.equal(2);
            expect(catalog.getProduct('P001').discount).to.equal(15);
            expect(catalog.getProduct('P003').discount).to.equal(0);
        });

        it('should return 0 for invalid inputs', function() {
            expect(catalog.applyBulkDiscount(null, 10)).to.equal(0);
            expect(catalog.applyBulkDiscount('Cat', -5)).to.equal(0);
            expect(catalog.applyBulkDiscount('Cat', 'ten')).to.equal(0);
        });
    });

    describe('getProductsByTags()', function() {
        beforeEach(function() {
            const p1 = new Product('P001', 'Product 1', 100, 'Cat', 10);
            const p2 = new Product('P002', 'Product 2', 100, 'Cat', 10);
            const p3 = new Product('P003', 'Product 3', 100, 'Cat', 10);
            p1.addTags(['sale', 'featured']);
            p2.addTags(['sale']);
            p3.addTags(['new']);
            catalog.addProduct(p1);
            catalog.addProduct(p2);
            catalog.addProduct(p3);
        });

        it('should find products with any matching tag', function() {
            const results = catalog.getProductsByTags(['sale']);
            expect(results.length).to.equal(2);
        });

        it('should find products with all matching tags when matchAll is true', function() {
            const results = catalog.getProductsByTags(['sale', 'featured'], true);
            expect(results.length).to.equal(1);
        });

        it('should return empty for non-array input', function() {
            expect(catalog.getProductsByTags('sale')).to.be.an('array').that.is.empty;
        });

        it('should return empty for empty array', function() {
            expect(catalog.getProductsByTags([])).to.be.an('array').that.is.empty;
        });
    });
});
