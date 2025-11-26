/**
 * User Authentication and Management Module
 * Handles user registration, authentication, and profile management
 */

/**
 * User Roles Enum
 */
const UserRole = {
    CUSTOMER: 'customer',
    ADMIN: 'admin',
    MANAGER: 'manager',
    SUPPORT: 'support'
};

/**
 * Account Status Enum
 */
const AccountStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING_VERIFICATION: 'pending_verification'
};

/**
 * User class - represents a user account
 */
class User {
    constructor(id, email, password, firstName, lastName) {
        this.id = id;
        this.email = email;
        this.passwordHash = this._hashPassword(password);
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = UserRole.CUSTOMER;
        this.status = AccountStatus.PENDING_VERIFICATION;
        this.phoneNumber = null;
        this.addresses = [];
        this.defaultAddressIndex = -1;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.lastLoginAt = null;
        this.loginAttempts = 0;
        this.lockedUntil = null;
        this.verificationToken = null;
        this.resetPasswordToken = null;
        this.resetPasswordExpires = null;
        this.preferences = {
            newsletter: false,
            notifications: true,
            language: 'en',
            currency: 'USD'
        };
    }

    /**
     * Simple password hashing (for demonstration)
     * In production, use bcrypt or similar
     * @param {string} password - Plain text password
     * @returns {string} Hashed password
     * @private
     */
    _hashPassword(password) {
        // Simple hash for demonstration - NOT secure for production
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hashed_' + Math.abs(hash).toString(36);
    }

    /**
     * Validates user data
     * @returns {Object} Validation result
     */
    validate() {
        const errors = [];

        if (!this.id || typeof this.id !== 'string') {
            errors.push('User ID is required');
        }

        if (!this.email || typeof this.email !== 'string') {
            errors.push('Email is required');
        } else if (!this._isValidEmail(this.email)) {
            errors.push('Invalid email format');
        }

        if (!this.firstName || typeof this.firstName !== 'string' || this.firstName.trim().length < 1) {
            errors.push('First name is required');
        } else if (this.firstName.length > 50) {
            errors.push('First name must be less than 50 characters');
        }

        if (!this.lastName || typeof this.lastName !== 'string' || this.lastName.trim().length < 1) {
            errors.push('Last name is required');
        } else if (this.lastName.length > 50) {
            errors.push('Last name must be less than 50 characters');
        }

        if (this.phoneNumber && !this._isValidPhone(this.phoneNumber)) {
            errors.push('Invalid phone number format');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validates email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     * @private
     */
    _isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validates phone number format
     * @param {string} phone - Phone number to validate
     * @returns {boolean} True if valid
     * @private
     */
    _isValidPhone(phone) {
        const phoneRegex = /^\+?[\d\s-]{10,20}$/;
        return phoneRegex.test(phone);
    }

    /**
     * Gets full name
     * @returns {string} Full name
     */
    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }

    /**
     * Verifies password
     * @param {string} password - Password to verify
     * @returns {boolean} True if password matches
     */
    verifyPassword(password) {
        if (!password || typeof password !== 'string') {
            return false;
        }
        return this._hashPassword(password) === this.passwordHash;
    }

    /**
     * Changes password
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Object} Result with success flag
     */
    changePassword(oldPassword, newPassword) {
        if (!this.verifyPassword(oldPassword)) {
            return { success: false, message: 'Current password is incorrect' };
        }

        const validation = this._validatePassword(newPassword);
        if (!validation.isValid) {
            return { success: false, message: validation.message };
        }

        this.passwordHash = this._hashPassword(newPassword);
        this.resetPasswordToken = null;
        this.resetPasswordExpires = null;
        this.updatedAt = new Date();

        return { success: true, message: 'Password changed successfully' };
    }

    /**
     * Validates password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result
     * @private
     */
    _validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { isValid: false, message: 'Password is required' };
        }
        if (password.length < 8) {
            return { isValid: false, message: 'Password must be at least 8 characters' };
        }
        if (password.length > 100) {
            return { isValid: false, message: 'Password must be less than 100 characters' };
        }
        if (!/[A-Z]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one uppercase letter' };
        }
        if (!/[a-z]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one lowercase letter' };
        }
        if (!/[0-9]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one number' };
        }
        return { isValid: true, message: 'Password is valid' };
    }

    /**
     * Resets password using token
     * @param {string} token - Reset token
     * @param {string} newPassword - New password
     * @returns {Object} Result with success flag
     */
    resetPassword(token, newPassword) {
        if (!this.resetPasswordToken || this.resetPasswordToken !== token) {
            return { success: false, message: 'Invalid reset token' };
        }

        if (this.resetPasswordExpires && new Date() > this.resetPasswordExpires) {
            return { success: false, message: 'Reset token has expired' };
        }

        const validation = this._validatePassword(newPassword);
        if (!validation.isValid) {
            return { success: false, message: validation.message };
        }

        this.passwordHash = this._hashPassword(newPassword);
        this.resetPasswordToken = null;
        this.resetPasswordExpires = null;
        this.updatedAt = new Date();

        return { success: true, message: 'Password reset successfully' };
    }

    /**
     * Generates password reset token
     * @param {number} expiryHours - Hours until token expires
     * @returns {string} Reset token
     */
    generateResetToken(expiryHours = 24) {
        const token = 'RESET-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2);
        this.resetPasswordToken = token;
        this.resetPasswordExpires = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
        this.updatedAt = new Date();
        return token;
    }

    /**
     * Generates verification token
     * @returns {string} Verification token
     */
    generateVerificationToken() {
        const token = 'VERIFY-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2);
        this.verificationToken = token;
        this.updatedAt = new Date();
        return token;
    }

    /**
     * Verifies account with token
     * @param {string} token - Verification token
     * @returns {Object} Result with success flag
     */
    verifyAccount(token) {
        if (!this.verificationToken || this.verificationToken !== token) {
            return { success: false, message: 'Invalid verification token' };
        }

        this.status = AccountStatus.ACTIVE;
        this.verificationToken = null;
        this.updatedAt = new Date();

        return { success: true, message: 'Account verified successfully' };
    }

    /**
     * Records a login attempt
     * @param {boolean} successful - Whether login was successful
     * @returns {Object} Result with success flag
     */
    recordLoginAttempt(successful) {
        if (this.isLocked()) {
            return { success: false, message: 'Account is locked' };
        }

        if (successful) {
            this.loginAttempts = 0;
            this.lastLoginAt = new Date();
            this.updatedAt = new Date();
            return { success: true, message: 'Login recorded' };
        } else {
            this.loginAttempts++;
            if (this.loginAttempts >= 5) {
                // Lock account for 30 minutes
                this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
            }
            this.updatedAt = new Date();
            return { 
                success: false, 
                message: `Invalid login attempt (${this.loginAttempts}/5)`,
                attemptsRemaining: Math.max(0, 5 - this.loginAttempts)
            };
        }
    }

    /**
     * Checks if account is locked
     * @returns {boolean} True if account is locked
     */
    isLocked() {
        if (!this.lockedUntil) {
            return false;
        }
        if (new Date() > this.lockedUntil) {
            this.lockedUntil = null;
            this.loginAttempts = 0;
            return false;
        }
        return true;
    }

    /**
     * Unlocks the account
     */
    unlock() {
        this.lockedUntil = null;
        this.loginAttempts = 0;
        this.updatedAt = new Date();
    }

    /**
     * Suspends the account
     * @param {string} reason - Suspension reason
     */
    suspend(reason = '') {
        this.status = AccountStatus.SUSPENDED;
        this.updatedAt = new Date();
    }

    /**
     * Activates the account
     */
    activate() {
        this.status = AccountStatus.ACTIVE;
        this.updatedAt = new Date();
    }

    /**
     * Deactivates the account
     */
    deactivate() {
        this.status = AccountStatus.INACTIVE;
        this.updatedAt = new Date();
    }

    /**
     * Adds an address
     * @param {Object} address - Address object
     * @returns {Object} Result with success flag
     */
    addAddress(address) {
        if (!address || typeof address !== 'object') {
            return { success: false, message: 'Invalid address' };
        }

        const requiredFields = ['street', 'city', 'state', 'zipCode', 'country'];
        for (const field of requiredFields) {
            if (!address[field] || typeof address[field] !== 'string') {
                return { success: false, message: `Missing required field: ${field}` };
            }
        }

        const newAddress = {
            id: 'ADDR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            label: address.label || 'Home',
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
            isDefault: this.addresses.length === 0
        };

        this.addresses.push(newAddress);
        if (newAddress.isDefault) {
            this.defaultAddressIndex = this.addresses.length - 1;
        }
        this.updatedAt = new Date();

        return { success: true, message: 'Address added', addressId: newAddress.id };
    }

    /**
     * Removes an address
     * @param {string} addressId - Address ID
     * @returns {boolean} True if address was removed
     */
    removeAddress(addressId) {
        const index = this.addresses.findIndex(a => a.id === addressId);
        if (index === -1) {
            return false;
        }

        this.addresses.splice(index, 1);
        
        // Update default address index
        if (this.defaultAddressIndex === index) {
            this.defaultAddressIndex = this.addresses.length > 0 ? 0 : -1;
        } else if (this.defaultAddressIndex > index) {
            this.defaultAddressIndex--;
        }

        this.updatedAt = new Date();
        return true;
    }

    /**
     * Sets default address
     * @param {string} addressId - Address ID
     * @returns {boolean} True if default was set
     */
    setDefaultAddress(addressId) {
        const index = this.addresses.findIndex(a => a.id === addressId);
        if (index === -1) {
            return false;
        }

        // Remove old default
        if (this.defaultAddressIndex >= 0 && this.defaultAddressIndex < this.addresses.length) {
            this.addresses[this.defaultAddressIndex].isDefault = false;
        }

        // Set new default
        this.addresses[index].isDefault = true;
        this.defaultAddressIndex = index;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Gets default address
     * @returns {Object|null} Default address or null
     */
    getDefaultAddress() {
        if (this.defaultAddressIndex >= 0 && this.defaultAddressIndex < this.addresses.length) {
            return this.addresses[this.defaultAddressIndex];
        }
        return null;
    }

    /**
     * Updates user profile
     * @param {Object} updates - Fields to update
     * @returns {Object} Result with success flag
     */
    updateProfile(updates) {
        if (!updates || typeof updates !== 'object') {
            return { success: false, message: 'Invalid updates' };
        }

        const allowedFields = ['firstName', 'lastName', 'phoneNumber'];
        for (const field of allowedFields) {
            if (updates.hasOwnProperty(field)) {
                this[field] = updates[field];
            }
        }

        const validation = this.validate();
        if (!validation.isValid) {
            return { success: false, message: validation.errors.join(', ') };
        }

        this.updatedAt = new Date();
        return { success: true, message: 'Profile updated' };
    }

    /**
     * Updates preferences
     * @param {Object} prefs - Preferences to update
     * @returns {boolean} True if preferences were updated
     */
    updatePreferences(prefs) {
        if (!prefs || typeof prefs !== 'object') {
            return false;
        }

        const allowedPrefs = ['newsletter', 'notifications', 'language', 'currency'];
        for (const pref of allowedPrefs) {
            if (prefs.hasOwnProperty(pref)) {
                this.preferences[pref] = prefs[pref];
            }
        }

        this.updatedAt = new Date();
        return true;
    }

    /**
     * Converts user to JSON (excluding sensitive data)
     * @returns {Object} User data
     */
    toJSON() {
        return {
            id: this.id,
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
            fullName: this.getFullName(),
            role: this.role,
            status: this.status,
            phoneNumber: this.phoneNumber,
            addresses: this.addresses,
            defaultAddress: this.getDefaultAddress(),
            preferences: this.preferences,
            createdAt: this.createdAt,
            lastLoginAt: this.lastLoginAt
        };
    }
}

/**
 * User Manager - manages all users
 */
class UserManager {
    constructor() {
        this.users = new Map();
        this.emailIndex = new Map();
        this.sessions = new Map();
    }

    /**
     * Registers a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} firstName - First name
     * @param {string} lastName - Last name
     * @returns {Object} Result with user or error
     */
    register(email, password, firstName, lastName) {
        if (!email || typeof email !== 'string') {
            return { success: false, message: 'Email is required' };
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (this.emailIndex.has(normalizedEmail)) {
            return { success: false, message: 'Email already registered' };
        }

        // Validate password
        const passwordValidation = this._validatePassword(password);
        if (!passwordValidation.isValid) {
            return { success: false, message: passwordValidation.message };
        }

        const userId = 'USER-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
        const user = new User(userId, normalizedEmail, password, firstName, lastName);

        const validation = user.validate();
        if (!validation.isValid) {
            return { success: false, message: validation.errors.join(', ') };
        }

        this.users.set(userId, user);
        this.emailIndex.set(normalizedEmail, userId);

        // Generate verification token
        const verificationToken = user.generateVerificationToken();

        return { success: true, user: user, verificationToken: verificationToken };
    }

    /**
     * Validates password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result
     * @private
     */
    _validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { isValid: false, message: 'Password is required' };
        }
        if (password.length < 8) {
            return { isValid: false, message: 'Password must be at least 8 characters' };
        }
        if (password.length > 100) {
            return { isValid: false, message: 'Password must be less than 100 characters' };
        }
        if (!/[A-Z]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one uppercase letter' };
        }
        if (!/[a-z]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one lowercase letter' };
        }
        if (!/[0-9]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one number' };
        }
        return { isValid: true, message: 'Password is valid' };
    }

    /**
     * Authenticates a user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Result with session or error
     */
    authenticate(email, password) {
        if (!email || !password) {
            return { success: false, message: 'Email and password are required' };
        }

        const normalizedEmail = email.toLowerCase().trim();
        const userId = this.emailIndex.get(normalizedEmail);

        if (!userId) {
            return { success: false, message: 'Invalid credentials' };
        }

        const user = this.users.get(userId);
        if (!user) {
            return { success: false, message: 'Invalid credentials' };
        }

        if (user.status === AccountStatus.SUSPENDED) {
            return { success: false, message: 'Account is suspended' };
        }

        if (user.status === AccountStatus.INACTIVE) {
            return { success: false, message: 'Account is inactive' };
        }

        if (user.isLocked()) {
            const remaining = Math.ceil((user.lockedUntil - new Date()) / 60000);
            return { success: false, message: `Account is locked. Try again in ${remaining} minutes` };
        }

        if (!user.verifyPassword(password)) {
            user.recordLoginAttempt(false);
            return { success: false, message: 'Invalid credentials' };
        }

        if (user.status === AccountStatus.PENDING_VERIFICATION) {
            return { success: false, message: 'Please verify your email before logging in' };
        }

        user.recordLoginAttempt(true);

        // Create session
        const sessionId = 'SESSION-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2);
        const session = {
            sessionId: sessionId,
            userId: userId,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            isActive: true
        };
        this.sessions.set(sessionId, session);

        return { success: true, session: session, user: user.toJSON() };
    }

    /**
     * Validates a session
     * @param {string} sessionId - Session ID
     * @returns {Object} Result with user or error
     */
    validateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            return { success: false, message: 'Invalid session' };
        }

        if (!session.isActive) {
            return { success: false, message: 'Session has been invalidated' };
        }

        if (new Date() > session.expiresAt) {
            session.isActive = false;
            return { success: false, message: 'Session has expired' };
        }

        const user = this.users.get(session.userId);
        if (!user || user.status !== AccountStatus.ACTIVE) {
            return { success: false, message: 'User not found or inactive' };
        }

        return { success: true, user: user.toJSON(), session: session };
    }

    /**
     * Logs out a user
     * @param {string} sessionId - Session ID
     * @returns {boolean} True if logged out
     */
    logout(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        session.isActive = false;
        return true;
    }

    /**
     * Gets a user by ID
     * @param {string} userId - User ID
     * @returns {User|null} User or null
     */
    getUser(userId) {
        return this.users.get(userId) || null;
    }

    /**
     * Gets a user by email
     * @param {string} email - User email
     * @returns {User|null} User or null
     */
    getUserByEmail(email) {
        const normalizedEmail = email.toLowerCase().trim();
        const userId = this.emailIndex.get(normalizedEmail);
        return userId ? this.users.get(userId) : null;
    }

    /**
     * Deletes a user
     * @param {string} userId - User ID
     * @returns {boolean} True if deleted
     */
    deleteUser(userId) {
        const user = this.users.get(userId);
        if (!user) {
            return false;
        }

        // Remove from email index
        this.emailIndex.delete(user.email);
        
        // Invalidate all sessions
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.userId === userId) {
                session.isActive = false;
            }
        }

        return this.users.delete(userId);
    }

    /**
     * Gets all users
     * @param {Object} filters - Optional filters
     * @returns {User[]} Array of users
     */
    getAllUsers(filters = {}) {
        let users = Array.from(this.users.values());

        if (filters.role) {
            users = users.filter(u => u.role === filters.role);
        }

        if (filters.status) {
            users = users.filter(u => u.status === filters.status);
        }

        return users;
    }

    /**
     * Initiates password reset
     * @param {string} email - User email
     * @returns {Object} Result with reset token
     */
    initiatePasswordReset(email) {
        const user = this.getUserByEmail(email);
        if (!user) {
            // Return success to prevent email enumeration
            return { success: true, message: 'If the email exists, a reset link will be sent' };
        }

        const token = user.generateResetToken();
        return { success: true, message: 'Password reset initiated', token: token };
    }

    /**
     * Gets user statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        let total = 0;
        let active = 0;
        let suspended = 0;
        let pending = 0;
        let inactive = 0;

        for (const user of this.users.values()) {
            total++;
            switch (user.status) {
                case AccountStatus.ACTIVE:
                    active++;
                    break;
                case AccountStatus.SUSPENDED:
                    suspended++;
                    break;
                case AccountStatus.PENDING_VERIFICATION:
                    pending++;
                    break;
                case AccountStatus.INACTIVE:
                    inactive++;
                    break;
            }
        }

        return {
            totalUsers: total,
            activeUsers: active,
            suspendedUsers: suspended,
            pendingUsers: pending,
            inactiveUsers: inactive,
            activeSessions: Array.from(this.sessions.values()).filter(s => s.isActive).length
        };
    }
}

module.exports = {
    User,
    UserManager,
    UserRole,
    AccountStatus
};
