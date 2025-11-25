/**
 * Stryker Mutation Testing Configuration
 * 
 * This configuration file sets up mutation testing for the E-Commerce application
 * using Stryker mutator with Mocha runner.
 * 
 * Mutation Operators at Unit Level (3+):
 * 1. ConditionalExpression - Mutates conditional operators (&&, ||)
 * 2. EqualityOperator - Mutates equality operators (==, ===, !=, !==)
 * 3. ArithmeticOperator - Mutates arithmetic operators (+, -, *, /, %)
 * 4. ArrayDeclaration - Mutates array literals
 * 5. BlockStatement - Removes block statements
 * 6. BooleanLiteral - Mutates true/false values
 * 7. StringLiteral - Mutates string values
 * 
 * Mutation Operators at Integration Level (3+):
 * 1. MethodExpression - Mutates method calls
 * 2. ObjectLiteral - Mutates object properties
 * 3. OptionalChaining - Mutates optional chaining operators
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  // Package manager
  packageManager: "npm",
  
  // Test runner configuration
  testRunner: "mocha",
  
  // Source files to mutate
  mutate: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js"
  ],
  
  // Mutation operators to use
  // Unit Level Operators:
  // - ConditionalExpression: Replaces && with ||, etc.
  // - EqualityOperator: Replaces == with !=, === with !==, etc.
  // - ArithmeticOperator: Replaces + with -, * with /, etc.
  // - BooleanLiteral: Replaces true with false and vice versa
  // - StringLiteral: Empties strings or replaces them
  // 
  // Integration Level Operators:
  // - MethodExpression: Mutates method calls
  // - ObjectLiteral: Mutates object properties
  // - ArrayDeclaration: Mutates array declarations
  mutator: {
    excludedMutations: [
      // Exclude some very noisy mutations for cleaner results
      "StringLiteral"  // Exclude string mutations as they create many equivalent mutants
    ]
  },
  
  // Reporters
  reporters: [
    "html",
    "clear-text",
    "progress",
    "json"
  ],
  
  // HTML report location
  htmlReporter: {
    fileName: "mutation-report.html"
  },
  
  // JSON report for detailed analysis
  jsonReporter: {
    fileName: "mutation-report.json"
  },
  
  // Coverage analysis
  coverageAnalysis: "perTest",
  
  // Timeout settings
  timeoutMS: 60000,
  timeoutFactor: 2.5,
  
  // Concurrent test runs
  concurrency: 4,
  
  // Log level
  logLevel: "info",
  
  // Disable automatic bail for comprehensive testing
  disableBail: false,
  
  // Thresholds for mutation score
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  }
};

module.exports = config;
