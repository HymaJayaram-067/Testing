/**
 * User Module Tests
 * Comprehensive test suite for mutation testing
 */

const { expect } = require('chai');
const { User, UserManager, UserRole, AccountStatus } = require('../src/user');

describe('User', function() {
    describe('Constructor', function() {
        it('should create user with valid data', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
            expect(user.id).to.equal('U001');
            expect(user.email).to.equal('test@example.com');
            expect(user.firstName).to.equal('John');
            expect(user.lastName).to.equal('Doe');
            expect(user.role).to.equal(UserRole.CUSTOMER);
            expect(user.status).to.equal(AccountStatus.PENDING_VERIFICATION);
        });

        it('should hash password', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
            expect(user.passwordHash).to.not.equal('Password123');
            expect(user.passwordHash).to.include('hashed_');
        });
    });

    describe('validate()', function() {
        it('should pass for valid user', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
            const result = user.validate();
            expect(result.isValid).to.be.true;
        });

        it('should fail for missing ID', function() {
            const user = new User(null, 'test@example.com', 'Password123', 'John', 'Doe');
            const result = user.validate();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('User ID is required');
        });

        it('should fail for invalid email', function() {
            const user = new User('U001', 'invalid-email', 'Password123', 'John', 'Doe');
            const result = user.validate();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('Invalid email format');
        });

        it('should fail for missing email', function() {
            const user = new User('U001', null, 'Password123', 'John', 'Doe');
            const result = user.validate();
            expect(result.isValid).to.be.false;
        });

        it('should fail for too long first name', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'J'.repeat(51), 'Doe');
            const result = user.validate();
            expect(result.isValid).to.be.false;
        });

        it('should fail for missing first name', function() {
            const user = new User('U001', 'test@example.com', 'Password123', '', 'Doe');
            const result = user.validate();
            expect(result.isValid).to.be.false;
        });

        it('should fail for invalid phone number', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
            user.phoneNumber = '123';
            const result = user.validate();
            expect(result.isValid).to.be.false;
            expect(result.errors).to.include('Invalid phone number format');
        });

        it('should accept valid phone number', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
            user.phoneNumber = '+1-555-123-4567';
            const result = user.validate();
            expect(result.isValid).to.be.true;
        });
    });

    describe('getFullName()', function() {
        it('should return full name', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
            expect(user.getFullName()).to.equal('John Doe');
        });
    });

    describe('verifyPassword()', function() {
        it('should verify correct password', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
            expect(user.verifyPassword('Password123')).to.be.true;
        });

        it('should reject incorrect password', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
            expect(user.verifyPassword('WrongPassword')).to.be.false;
        });

        it('should reject null password', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
            expect(user.verifyPassword(null)).to.be.false;
        });

        it('should reject non-string password', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
            expect(user.verifyPassword(12345)).to.be.false;
        });
    });

    describe('changePassword()', function() {
        let user;

        beforeEach(function() {
            user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
        });

        it('should change password with correct old password', function() {
            const result = user.changePassword('Password123', 'NewPassword456');
            expect(result.success).to.be.true;
            expect(user.verifyPassword('NewPassword456')).to.be.true;
        });

        it('should reject incorrect old password', function() {
            const result = user.changePassword('WrongPassword', 'NewPassword456');
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Current password is incorrect');
        });

        it('should validate new password strength', function() {
            const result = user.changePassword('Password123', 'weak');
            expect(result.success).to.be.false;
            expect(result.message).to.include('at least 8 characters');
        });

        it('should require uppercase letter', function() {
            const result = user.changePassword('Password123', 'newpassword123');
            expect(result.success).to.be.false;
            expect(result.message).to.include('uppercase');
        });

        it('should require lowercase letter', function() {
            const result = user.changePassword('Password123', 'NEWPASSWORD123');
            expect(result.success).to.be.false;
            expect(result.message).to.include('lowercase');
        });

        it('should require number', function() {
            const result = user.changePassword('Password123', 'NewPasswordABC');
            expect(result.success).to.be.false;
            expect(result.message).to.include('number');
        });

        it('should reject too long password', function() {
            const result = user.changePassword('Password123', 'P'.repeat(101));
            expect(result.success).to.be.false;
        });
    });

    describe('generateResetToken() / resetPassword()', function() {
        let user;

        beforeEach(function() {
            user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
        });

        it('should generate reset token', function() {
            const token = user.generateResetToken();
            expect(token).to.include('RESET-');
            expect(user.resetPasswordToken).to.equal(token);
            expect(user.resetPasswordExpires).to.be.instanceof(Date);
        });

        it('should reset password with valid token', function() {
            const token = user.generateResetToken();
            const result = user.resetPassword(token, 'NewPassword456');
            expect(result.success).to.be.true;
            expect(user.verifyPassword('NewPassword456')).to.be.true;
        });

        it('should reject invalid token', function() {
            user.generateResetToken();
            const result = user.resetPassword('invalid-token', 'NewPassword456');
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Invalid reset token');
        });

        it('should reject expired token', function() {
            const token = user.generateResetToken();
            user.resetPasswordExpires = new Date(Date.now() - 1000);
            const result = user.resetPassword(token, 'NewPassword456');
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Reset token has expired');
        });

        it('should validate new password', function() {
            const token = user.generateResetToken();
            const result = user.resetPassword(token, 'weak');
            expect(result.success).to.be.false;
        });
    });

    describe('generateVerificationToken() / verifyAccount()', function() {
        it('should generate verification token', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
            const token = user.generateVerificationToken();
            expect(token).to.include('VERIFY-');
            expect(user.verificationToken).to.equal(token);
        });

        it('should verify account with valid token', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
            const token = user.generateVerificationToken();
            const result = user.verifyAccount(token);
            expect(result.success).to.be.true;
            expect(user.status).to.equal(AccountStatus.ACTIVE);
        });

        it('should reject invalid verification token', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
            user.generateVerificationToken();
            const result = user.verifyAccount('invalid-token');
            expect(result.success).to.be.false;
        });
    });

    describe('recordLoginAttempt()', function() {
        let user;

        beforeEach(function() {
            user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
        });

        it('should record successful login', function() {
            const result = user.recordLoginAttempt(true);
            expect(result.success).to.be.true;
            expect(user.loginAttempts).to.equal(0);
            expect(user.lastLoginAt).to.be.instanceof(Date);
        });

        it('should record failed login', function() {
            const result = user.recordLoginAttempt(false);
            expect(result.success).to.be.false;
            expect(user.loginAttempts).to.equal(1);
        });

        it('should lock account after 5 failed attempts', function() {
            for (let i = 0; i < 5; i++) {
                user.recordLoginAttempt(false);
            }
            expect(user.isLocked()).to.be.true;
        });

        it('should reject when account is locked', function() {
            for (let i = 0; i < 5; i++) {
                user.recordLoginAttempt(false);
            }
            const result = user.recordLoginAttempt(true);
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Account is locked');
        });
    });

    describe('isLocked() / unlock()', function() {
        let user;

        beforeEach(function() {
            user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
        });

        it('should return false when not locked', function() {
            expect(user.isLocked()).to.be.false;
        });

        it('should return true when locked', function() {
            user.lockedUntil = new Date(Date.now() + 60000);
            expect(user.isLocked()).to.be.true;
        });

        it('should auto-unlock after lock period', function() {
            user.lockedUntil = new Date(Date.now() - 1000);
            user.loginAttempts = 5;
            expect(user.isLocked()).to.be.false;
            expect(user.loginAttempts).to.equal(0);
        });

        it('should unlock account', function() {
            user.lockedUntil = new Date(Date.now() + 60000);
            user.loginAttempts = 5;
            user.unlock();
            expect(user.isLocked()).to.be.false;
            expect(user.loginAttempts).to.equal(0);
        });
    });

    describe('suspend() / activate() / deactivate()', function() {
        let user;

        beforeEach(function() {
            user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
        });

        it('should suspend account', function() {
            user.suspend();
            expect(user.status).to.equal(AccountStatus.SUSPENDED);
        });

        it('should activate account', function() {
            user.suspend();
            user.activate();
            expect(user.status).to.equal(AccountStatus.ACTIVE);
        });

        it('should deactivate account', function() {
            user.deactivate();
            expect(user.status).to.equal(AccountStatus.INACTIVE);
        });
    });

    describe('addAddress() / removeAddress() / setDefaultAddress()', function() {
        let user;
        const validAddress = {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
        };

        beforeEach(function() {
            user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
        });

        it('should add valid address', function() {
            const result = user.addAddress(validAddress);
            expect(result.success).to.be.true;
            expect(user.addresses.length).to.equal(1);
            expect(user.addresses[0].isDefault).to.be.true;
        });

        it('should reject invalid address', function() {
            expect(user.addAddress(null).success).to.be.false;
            expect(user.addAddress({ street: '123' }).success).to.be.false;
        });

        it('should make first address default', function() {
            user.addAddress(validAddress);
            expect(user.defaultAddressIndex).to.equal(0);
        });

        it('should remove address', function() {
            const result = user.addAddress(validAddress);
            expect(user.removeAddress(result.addressId)).to.be.true;
            expect(user.addresses.length).to.equal(0);
        });

        it('should return false for non-existent address', function() {
            expect(user.removeAddress('NONEXISTENT')).to.be.false;
        });

        it('should update default when removing default', function() {
            user.addAddress(validAddress);
            user.addAddress({ ...validAddress, street: '456 Oak Ave' });
            const firstId = user.addresses[0].id;
            user.removeAddress(firstId);
            expect(user.defaultAddressIndex).to.equal(0);
        });

        it('should set default address', function() {
            user.addAddress(validAddress);
            user.addAddress({ ...validAddress, street: '456 Oak Ave' });
            const secondId = user.addresses[1].id;
            expect(user.setDefaultAddress(secondId)).to.be.true;
            expect(user.defaultAddressIndex).to.equal(1);
        });

        it('should return false for non-existent address in setDefault', function() {
            expect(user.setDefaultAddress('NONEXISTENT')).to.be.false;
        });

        it('should get default address', function() {
            user.addAddress(validAddress);
            const defaultAddr = user.getDefaultAddress();
            expect(defaultAddr.street).to.equal('123 Main St');
        });

        it('should return null when no default address', function() {
            expect(user.getDefaultAddress()).to.be.null;
        });
    });

    describe('updateProfile()', function() {
        let user;

        beforeEach(function() {
            user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
        });

        it('should update allowed fields', function() {
            const result = user.updateProfile({ firstName: 'Jane', lastName: 'Smith' });
            expect(result.success).to.be.true;
            expect(user.firstName).to.equal('Jane');
            expect(user.lastName).to.equal('Smith');
        });

        it('should reject invalid updates', function() {
            expect(user.updateProfile(null).success).to.be.false;
        });

        it('should validate after update', function() {
            const result = user.updateProfile({ firstName: '' });
            expect(result.success).to.be.false;
        });
    });

    describe('updatePreferences()', function() {
        let user;

        beforeEach(function() {
            user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
        });

        it('should update preferences', function() {
            expect(user.updatePreferences({ newsletter: true, language: 'es' })).to.be.true;
            expect(user.preferences.newsletter).to.be.true;
            expect(user.preferences.language).to.equal('es');
        });

        it('should reject invalid input', function() {
            expect(user.updatePreferences(null)).to.be.false;
        });
    });

    describe('toJSON()', function() {
        it('should return user data without password', function() {
            const user = new User('U001', 'test@example.com', 'Password123', 'John', 'Doe');
            const json = user.toJSON();
            expect(json.id).to.equal('U001');
            expect(json.email).to.equal('test@example.com');
            expect(json.fullName).to.equal('John Doe');
            expect(json).to.not.have.property('passwordHash');
        });
    });
});

describe('UserManager', function() {
    let manager;

    beforeEach(function() {
        manager = new UserManager();
    });

    describe('register()', function() {
        it('should register valid user', function() {
            const result = manager.register('test@example.com', 'Password123', 'John', 'Doe');
            expect(result.success).to.be.true;
            expect(result.user).to.not.be.null;
            expect(result.verificationToken).to.include('VERIFY-');
        });

        it('should reject invalid email', function() {
            const result = manager.register(null, 'Password123', 'John', 'Doe');
            expect(result.success).to.be.false;
        });

        it('should reject duplicate email', function() {
            manager.register('test@example.com', 'Password123', 'John', 'Doe');
            const result = manager.register('test@example.com', 'Password456', 'Jane', 'Smith');
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Email already registered');
        });

        it('should normalize email to lowercase', function() {
            manager.register('Test@Example.COM', 'Password123', 'John', 'Doe');
            const result = manager.register('test@example.com', 'Password456', 'Jane', 'Smith');
            expect(result.success).to.be.false;
        });

        it('should reject weak password', function() {
            const result = manager.register('test@example.com', 'weak', 'John', 'Doe');
            expect(result.success).to.be.false;
        });

        it('should reject invalid user data', function() {
            const result = manager.register('test@example.com', 'Password123', '', 'Doe');
            expect(result.success).to.be.false;
        });
    });

    describe('authenticate()', function() {
        beforeEach(function() {
            const result = manager.register('test@example.com', 'Password123', 'John', 'Doe');
            const user = result.user;
            user.verifyAccount(result.verificationToken);
        });

        it('should authenticate valid credentials', function() {
            const result = manager.authenticate('test@example.com', 'Password123');
            expect(result.success).to.be.true;
            expect(result.session).to.not.be.null;
            expect(result.user).to.not.be.null;
        });

        it('should reject invalid email', function() {
            const result = manager.authenticate('wrong@example.com', 'Password123');
            expect(result.success).to.be.false;
        });

        it('should reject invalid password', function() {
            const result = manager.authenticate('test@example.com', 'WrongPassword');
            expect(result.success).to.be.false;
        });

        it('should reject missing credentials', function() {
            expect(manager.authenticate(null, 'Password123').success).to.be.false;
            expect(manager.authenticate('test@example.com', null).success).to.be.false;
        });

        it('should reject suspended account', function() {
            const user = manager.getUserByEmail('test@example.com');
            user.suspend();
            const result = manager.authenticate('test@example.com', 'Password123');
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Account is suspended');
        });

        it('should reject inactive account', function() {
            const user = manager.getUserByEmail('test@example.com');
            user.deactivate();
            const result = manager.authenticate('test@example.com', 'Password123');
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Account is inactive');
        });

        it('should reject locked account', function() {
            const user = manager.getUserByEmail('test@example.com');
            user.lockedUntil = new Date(Date.now() + 60000);
            const result = manager.authenticate('test@example.com', 'Password123');
            expect(result.success).to.be.false;
            expect(result.message).to.include('locked');
        });

        it('should reject unverified account', function() {
            manager.register('new@example.com', 'Password123', 'Jane', 'Smith');
            const result = manager.authenticate('new@example.com', 'Password123');
            expect(result.success).to.be.false;
            expect(result.message).to.include('verify');
        });
    });

    describe('validateSession()', function() {
        let sessionId;

        beforeEach(function() {
            const regResult = manager.register('test@example.com', 'Password123', 'John', 'Doe');
            regResult.user.verifyAccount(regResult.verificationToken);
            const authResult = manager.authenticate('test@example.com', 'Password123');
            sessionId = authResult.session.sessionId;
        });

        it('should validate valid session', function() {
            const result = manager.validateSession(sessionId);
            expect(result.success).to.be.true;
            expect(result.user).to.not.be.null;
        });

        it('should reject invalid session', function() {
            const result = manager.validateSession('INVALID');
            expect(result.success).to.be.false;
        });

        it('should reject expired session', function() {
            const session = manager.sessions.get(sessionId);
            session.expiresAt = new Date(Date.now() - 1000);
            const result = manager.validateSession(sessionId);
            expect(result.success).to.be.false;
        });

        it('should reject invalidated session', function() {
            const session = manager.sessions.get(sessionId);
            session.isActive = false;
            const result = manager.validateSession(sessionId);
            expect(result.success).to.be.false;
        });
    });

    describe('logout()', function() {
        it('should invalidate session', function() {
            const regResult = manager.register('test@example.com', 'Password123', 'John', 'Doe');
            regResult.user.verifyAccount(regResult.verificationToken);
            const authResult = manager.authenticate('test@example.com', 'Password123');
            
            expect(manager.logout(authResult.session.sessionId)).to.be.true;
            expect(manager.validateSession(authResult.session.sessionId).success).to.be.false;
        });

        it('should return false for non-existent session', function() {
            expect(manager.logout('NONEXISTENT')).to.be.false;
        });
    });

    describe('getUser() / getUserByEmail()', function() {
        it('should get user by ID', function() {
            const result = manager.register('test@example.com', 'Password123', 'John', 'Doe');
            const user = manager.getUser(result.user.id);
            expect(user).to.equal(result.user);
        });

        it('should get user by email', function() {
            const result = manager.register('test@example.com', 'Password123', 'John', 'Doe');
            const user = manager.getUserByEmail('test@example.com');
            expect(user).to.equal(result.user);
        });

        it('should return null for non-existent user', function() {
            expect(manager.getUser('NONEXISTENT')).to.be.null;
            expect(manager.getUserByEmail('no@one.com')).to.be.null;
        });
    });

    describe('deleteUser()', function() {
        it('should delete user', function() {
            const result = manager.register('test@example.com', 'Password123', 'John', 'Doe');
            expect(manager.deleteUser(result.user.id)).to.be.true;
            expect(manager.getUser(result.user.id)).to.be.null;
        });

        it('should return false for non-existent user', function() {
            expect(manager.deleteUser('NONEXISTENT')).to.be.false;
        });

        it('should invalidate sessions on delete', function() {
            const regResult = manager.register('test@example.com', 'Password123', 'John', 'Doe');
            regResult.user.verifyAccount(regResult.verificationToken);
            const authResult = manager.authenticate('test@example.com', 'Password123');
            
            manager.deleteUser(regResult.user.id);
            expect(manager.validateSession(authResult.session.sessionId).success).to.be.false;
        });
    });

    describe('getAllUsers()', function() {
        it('should return all users', function() {
            manager.register('user1@example.com', 'Password123', 'John', 'Doe');
            manager.register('user2@example.com', 'Password123', 'Jane', 'Smith');
            const users = manager.getAllUsers();
            expect(users.length).to.equal(2);
        });

        it('should filter by role', function() {
            const result = manager.register('admin@example.com', 'Password123', 'Admin', 'User');
            result.user.role = UserRole.ADMIN;
            manager.register('user@example.com', 'Password123', 'Normal', 'User');
            
            const admins = manager.getAllUsers({ role: UserRole.ADMIN });
            expect(admins.length).to.equal(1);
        });

        it('should filter by status', function() {
            const result = manager.register('test@example.com', 'Password123', 'John', 'Doe');
            result.user.verifyAccount(result.verificationToken);
            manager.register('pending@example.com', 'Password123', 'Jane', 'Smith');
            
            const active = manager.getAllUsers({ status: AccountStatus.ACTIVE });
            expect(active.length).to.equal(1);
        });
    });

    describe('initiatePasswordReset()', function() {
        it('should initiate password reset', function() {
            manager.register('test@example.com', 'Password123', 'John', 'Doe');
            const result = manager.initiatePasswordReset('test@example.com');
            expect(result.success).to.be.true;
            expect(result.token).to.include('RESET-');
        });

        it('should return success for non-existent email', function() {
            const result = manager.initiatePasswordReset('nobody@example.com');
            expect(result.success).to.be.true;
            expect(result.token).to.be.undefined;
        });
    });

    describe('getStatistics()', function() {
        it('should return correct statistics', function() {
            const result = manager.register('test@example.com', 'Password123', 'John', 'Doe');
            result.user.verifyAccount(result.verificationToken);
            manager.register('pending@example.com', 'Password123', 'Jane', 'Smith');
            
            const stats = manager.getStatistics();
            expect(stats.totalUsers).to.equal(2);
            expect(stats.activeUsers).to.equal(1);
            expect(stats.pendingUsers).to.equal(1);
        });
    });
});
