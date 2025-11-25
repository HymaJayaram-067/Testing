
## Mutation Testing Project - E-Commerce Shopping Cart System

**Course:**: Software Testing  
**Project Type:** Mutation Testing

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Team Members and Contributions](#team-members-and-contributions)
3. [Source Code Description](#source-code-description)
4. [Test Case Strategy](#test-case-strategy)
5. [Mutation Operators Used](#mutation-operators-used)
6. [Testing Tools](#testing-tools)
7. [Installation and Setup](#installation-and-setup)
8. [Running Tests](#running-tests)
9. [Mutation Testing Results](#mutation-testing-results)
10. [AI Tools Acknowledgment](#ai-tools-acknowledgment)

---

## Project Overview

This project implements **Mutation Testing** for an E-Commerce Shopping Cart System. The project demonstrates the application of mutation testing techniques at both unit level and integration level, using the Stryker mutation testing framework for JavaScript.

### Features Implemented
- Product Management (catalog, pricing, ratings, discounts)
- Shopping Cart Operations (add, remove, update items)
- Order Processing (checkout, payment, status management)
- User Authentication (registration, login, session management)
- Inventory Management (stock tracking, alerts, movements)
- Discount and Promotion System (coupons, bulk discounts)

### Code Statistics
- **Total Lines of Code:** ~1,500+ lines (excluding comments and tests)
- **Number of Modules:** 6 main modules
- **Number of Test Cases:** 552 unit and integration tests
- **Test Coverage:** Comprehensive coverage for mutation testing

---

## Team Members and Contributions

### Team Member 1
Name: Hymavathi Jayaramappa[MT2024067] 
Roll Number: Thouseef Ahmed Syed[MT2024]

**Contributions:**
- Designed and implemented Product and ProductCatalog modules
- Implemented Shopping Cart and CartManager modules
- Created unit tests for Product, Cart modules
- Configured Stryker mutation testing framework
- Documented mutation operators at unit level

### Team Member 2
**Name:** [Student Name 2]  
**Roll Number:** [Roll Number 2]

**Contributions:**
- Designed and implemented Order and OrderManager modules
- Implemented User and UserManager modules
- Created Inventory and Discount modules
- Created unit tests for Order, User, Inventory, Discount modules
- Documented mutation operators at integration level
- Prepared final documentation and README

---

## Source Code Description

### Module Architecture

```
src/
├── index.js        # Main application entry point and integration
├── product.js      # Product and ProductCatalog classes
├── cart.js         # CartItem, ShoppingCart, CartManager classes
├── order.js        # Order, OrderItem, OrderManager classes
├── user.js         # User, UserManager classes with authentication
├── inventory.js    # InventoryItem, InventoryManager, stock alerts
└── discount.js     # Coupon, Promotion, DiscountManager classes
```

### Key Features by Module

#### 1. Product Module (product.js)
- Product creation with validation
- Dynamic pricing with discounts
- Rating and review system
- Tag-based categorization
- Product catalog management

#### 2. Cart Module (cart.js)
- Shopping cart operations
- Quantity management
- Coupon application
- Tax and shipping calculations
- Cart validation for checkout

#### 3. Order Module (order.js)
- Order creation from cart
- Payment processing with validation
- Luhn algorithm for card validation
- Order status management
- Order history and tracking

#### 4. User Module (user.js)
- User registration and authentication
- Password hashing and validation
- Account locking after failed attempts
- Session management
- Address management

#### 5. Inventory Module (inventory.js)
- Stock tracking and management
- Stock reservation for orders
- Low stock alerts
- Inventory audit functionality
- Movement history tracking

#### 6. Discount Module (discount.js)
- Coupon creation and validation
- Multiple discount types (percentage, fixed, BOGO, bundle)
- Usage limits and expiry dates
- Promotional pricing
- Category-specific discounts

---

## Test Case Strategy

### Strategy: Mutation-Based Test Design

The test cases are designed to **strongly kill mutants** by ensuring:
1. **Boundary value testing** - Tests at exact boundaries (0, 1, max values)
2. **Equivalence partitioning** - Valid and invalid input classes
3. **Error guessing** - Common error scenarios (null, undefined, edge cases)
4. **Integration testing** - Tests for module interactions

### Test Organization

```
tests/
├── product.test.js     # 150+ tests for Product module
├── cart.test.js        # 100+ tests for Cart module
├── order.test.js       # 80+ tests for Order module
├── user.test.js        # 100+ tests for User module
├── inventory.test.js   # 70+ tests for Inventory module
└── discount.test.js    # 50+ tests for Discount module
```

### Test Categories

1. **Constructor Tests** - Verify object creation
2. **Validation Tests** - Verify input validation
3. **Boundary Tests** - Test edge cases
4. **State Transition Tests** - Test status changes
5. **Integration Tests** - Test module interactions
6. **Error Handling Tests** - Verify error responses

---

## Mutation Operators Used

### Unit Level Mutation Operators (3+)

1. **Arithmetic Operator Mutation (AOR)**
   - Replaces `+` with `-`, `*`, `/`, `%`
   - Example: `price * quantity` → `price + quantity`
   
2. **Relational Operator Mutation (ROR)**
   - Replaces `<`, `>`, `<=`, `>=`, `==`, `!=`
   - Example: `stock >= quantity` → `stock > quantity`

3. **Conditional Operator Mutation (COR)**
   - Replaces `&&` with `||` and vice versa
   - Example: `isActive && inStock` → `isActive || inStock`

4. **Boolean Literal Mutation (BLR)**
   - Replaces `true` with `false`
   - Example: `return true;` → `return false;`

5. **Statement Block Removal (SBR)**
   - Removes entire statement blocks
   - Tests if statements are necessary

### Integration Level Mutation Operators (3+)

1. **Method Call Mutation (MCM)**
   - Modifies method return values
   - Tests interface contracts between modules

2. **Parameter Value Mutation (PVM)**
   - Modifies values passed between modules
   - Tests data flow between components

3. **Object Property Mutation (OPM)**
   - Modifies object properties in inter-module communication
   - Tests object state management

---

## Testing Tools

### Primary Tools

1. **Stryker Mutator** (v9.4.0)
   - JavaScript mutation testing framework
   - Supports multiple mutation operators
   - Generates detailed HTML reports
   - URL: https://stryker-mutator.io/

2. **Mocha** (v11.1.0)
   - JavaScript test framework
   - Supports async testing
   - URL: https://mochajs.org/

3. **Chai** (v5.1.2)
   - BDD/TDD assertion library
   - Expressive assertion syntax
   - URL: https://www.chaijs.com/

### Configuration Files

- `stryker.config.js` - Stryker mutation testing configuration
- `package.json` - Project dependencies and scripts

---

## Installation and Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation Steps

```bash
# Clone the repository
git clone https://github.com/HymaJayaram-067/Testing.git
cd Testing

# Install dependencies
npm install
```

---

## Running Tests

### Run Unit Tests
```bash
npm test
```

### Run Mutation Testing
```bash
npm run stryker
```

### Run Dry Run (Test Configuration)
```bash
npm run stryker:dry-run
```

---

## Mutation Testing Results

### Expected Mutation Score

- **Killed Mutants:** Tests designed to strongly kill mutants
- **Equivalent Mutants:** Some mutants may be equivalent (no behavioral change)

### Report Location
After running mutation testing, reports are generated in:
- `mutation-report.html` - HTML report with detailed analysis
- `mutation-report.json` - JSON report for programmatic analysis

### Mutation Categories Tested

| Category | Description | Example |
|----------|-------------|---------|
| Arithmetic | Math operators | `a + b` → `a - b` |
| Relational | Comparison operators | `a < b` → `a <= b` |
| Conditional | Logic operators | `a && b` → `a \|\| b` |
| Boolean | Boolean literals | `true` → `false` |
| Block | Statement removal | Remove `if` block |

---

## AI Tools Acknowledgment

This project used AI tools for the following purposes:


3. **Documentation**
   - Tool: GitHub Copilot / Chatgpt
   - Purpose: Generating JSDoc comments and took scripting assistance to write test cases

---

## Repository Structure
Testing/
├── src/                    # Source code
│   ├── index.js           # Main entry point
│   ├── product.js         # Product management
│   ├── cart.js            # Shopping cart
│   ├── order.js           # Order processing
│   ├── user.js            # User authentication
│   ├── inventory.js       # Inventory management
│   └── discount.js        # Discounts and promotions
├── tests/                  # Test files
│   ├── product.test.js    # Product tests
│   ├── cart.test.js       # Cart tests
│   ├── order.test.js      # Order tests
│   ├── user.test.js       # User tests
│   ├── inventory.test.js  # Inventory tests
│   └── discount.test.js   # Discount tests
├── package.json           # Dependencies and scripts
├── stryker.config.js      # Mutation testing config
├── .gitignore            # Git ignore file
└── README.md             # This file

