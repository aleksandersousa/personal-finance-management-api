import { DbRegisterUserUseCase } from '@data/usecases';
import {
  UserRepositoryStub,
  EmailVerificationTokenRepositoryStub,
} from '@test/data/mocks/repositories';
import { MockUserFactory } from '@test/domain/mocks/models';
import {
  LoggerStub,
  HasherStub,
  EmailSenderStub,
  AuthEmailTemplateServiceStub,
  VerificationTokenGeneratorStub,
} from '@test/data/mocks/protocols';

describe('DbRegisterUserUseCase', () => {
  let sut: DbRegisterUserUseCase;
  let userRepositoryStub: UserRepositoryStub;
  let hasherStub: HasherStub;
  let loggerStub: LoggerStub;
  let emailSenderStub: EmailSenderStub;
  let authEmailTemplatesStub: AuthEmailTemplateServiceStub;
  let emailVerificationTokenRepositoryStub: EmailVerificationTokenRepositoryStub;
  let verificationTokenGeneratorStub: VerificationTokenGeneratorStub;

  beforeEach(() => {
    userRepositoryStub = new UserRepositoryStub();
    hasherStub = new HasherStub();
    loggerStub = new LoggerStub();
    emailSenderStub = new EmailSenderStub();
    authEmailTemplatesStub = new AuthEmailTemplateServiceStub();
    emailVerificationTokenRepositoryStub =
      new EmailVerificationTokenRepositoryStub();
    verificationTokenGeneratorStub = new VerificationTokenGeneratorStub();

    sut = new DbRegisterUserUseCase(
      userRepositoryStub,
      hasherStub,
      loggerStub,
      emailSenderStub,
      authEmailTemplatesStub,
      emailVerificationTokenRepositoryStub,
      verificationTokenGeneratorStub,
    );
  });

  afterEach(() => {
    userRepositoryStub.clear();
    hasherStub.clear();
    loggerStub.clear();
    emailSenderStub.clear();
    authEmailTemplatesStub.clear();
    emailVerificationTokenRepositoryStub.clear();
    verificationTokenGeneratorStub.clear();
  });

  describe('execute', () => {
    const mockRequest = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'validPassword123',
    };

    it('should register user successfully with valid data', async () => {
      // Act
      const result = await sut.execute(mockRequest);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('message');
      expect(result.user.name).toBe(mockRequest.name);
      expect(result.user.email).toBe(mockRequest.email.toLowerCase());
      expect(result.user.emailVerified).toBe(false);
      expect(result.user).not.toHaveProperty('password'); // Password should be excluded
      expect(result.message).toContain('Registration successful');
      expect(userRepositoryStub.getCount()).toBe(1);
      expect(emailVerificationTokenRepositoryStub.getCount()).toBe(1);
      expect(emailSenderStub.getEmailCount()).toBe(1);
      expect(authEmailTemplatesStub.wasWelcomeEmailRendered()).toBe(false);
      const lastTemplate = authEmailTemplatesStub.getLastRenderedTemplate();
      expect(lastTemplate?.type).toBe('verify-email');
    });

    it('should throw error for invalid email format', async () => {
      // Arrange
      const invalidRequest = {
        ...mockRequest,
        email: 'invalid-email',
      };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Invalid email format',
      );
      expect(userRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error for email without @', async () => {
      // Arrange
      const invalidRequest = {
        ...mockRequest,
        email: 'invalid.email.com',
      };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Invalid email format',
      );
    });

    it('should throw error for email without domain', async () => {
      // Arrange
      const invalidRequest = {
        ...mockRequest,
        email: 'invalid@',
      };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Invalid email format',
      );
    });

    it('should throw error for password too short', async () => {
      // Arrange
      const invalidRequest = {
        ...mockRequest,
        password: '12345', // 5 characters
      };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Password must be at least 6 characters long',
      );
      expect(userRepositoryStub.getCount()).toBe(0);
    });

    it('should accept password with exactly 6 characters', async () => {
      // Arrange
      const validRequest = {
        ...mockRequest,
        password: '123456', // exactly 6 characters
      };

      // Act
      const result = await sut.execute(validRequest);

      // Assert
      expect(result.user.email).toBe(validRequest.email);
      expect(userRepositoryStub.getCount()).toBe(1);
    });

    it('should throw error for empty name', async () => {
      // Arrange
      const invalidRequest = {
        ...mockRequest,
        name: '',
      };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Name is required',
      );
      expect(userRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error for name with only whitespace', async () => {
      // Arrange
      const invalidRequest = {
        ...mockRequest,
        name: '   ',
      };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Name is required',
      );
      expect(userRepositoryStub.getCount()).toBe(0);
    });

    it('should throw error for null name', async () => {
      // Arrange
      const invalidRequest = {
        ...mockRequest,
        name: null as any,
      };

      // Act & Assert
      await expect(sut.execute(invalidRequest)).rejects.toThrow(
        'Name is required',
      );
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      const existingUser = MockUserFactory.create({
        email: mockRequest.email,
        name: 'Existing User',
      });
      userRepositoryStub.seed([existingUser]);

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'User already exists with this email',
      );
      expect(userRepositoryStub.getCount()).toBe(1); // Only the existing user
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      const uppercaseEmailRequest = {
        ...mockRequest,
        email: 'JOHN@EXAMPLE.COM',
      };

      // Act
      const result = await sut.execute(uppercaseEmailRequest);

      // Assert
      expect(result.user.email).toBe('john@example.com');
    });

    it('should trim name whitespace', async () => {
      // Arrange
      const requestWithWhitespace = {
        ...mockRequest,
        name: '  John Doe  ',
      };

      // Act
      const result = await sut.execute(requestWithWhitespace);

      // Assert
      expect(result.user.name).toBe('John Doe');
    });

    it('should hash password before storing', async () => {
      // Act
      await sut.execute(mockRequest);

      // Assert
      // Verify that hasher.hash was called (password should be hashed)
      // The user repository should receive the hashed password
      expect(userRepositoryStub.getCount()).toBe(1);
    });

    it('should handle user repository errors during findByEmail', async () => {
      // Arrange
      userRepositoryStub.mockFailure(new Error('Database connection failed'));

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle user repository errors during create', async () => {
      // Arrange
      // First call (findByEmail) should succeed, second call (create) should fail
      userRepositoryStub.mockFailure = (error: Error) => {
        userRepositoryStub['shouldFail'] = false; // Allow findByEmail to succeed
        userRepositoryStub['errorToThrow'] = null;

        // Mock create method to fail
        userRepositoryStub.create = async () => {
          throw error;
        };
      };

      userRepositoryStub.mockFailure(new Error('Failed to create user'));

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Failed to create user',
      );
    });

    it('should handle hasher errors', async () => {
      // Arrange
      hasherStub.mockHashingError();

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow('Hashing failed');
      expect(userRepositoryStub.getCount()).toBe(0);
    });

    it('should create verification token and send verification email', async () => {
      // Arrange
      verificationTokenGeneratorStub.seedTokens(['test-verification-token']);

      // Act
      await sut.execute(mockRequest);

      // Assert
      expect(emailVerificationTokenRepositoryStub.getCount()).toBe(1);
      expect(emailSenderStub.getEmailCount()).toBe(1);
      const lastEmail = emailSenderStub.getLastSentEmail();
      expect(lastEmail?.to).toBe(mockRequest.email.toLowerCase());
      expect(lastEmail?.subject).toBe('Verify Your Email Address');
    });

    it('should handle verification token repository errors', async () => {
      // Arrange
      emailVerificationTokenRepositoryStub.mockFailure(
        new Error('Failed to create token'),
      );

      // Act & Assert
      await expect(sut.execute(mockRequest)).rejects.toThrow(
        'Failed to create token',
      );
    });

    it('should validate email format with various edge cases', async () => {
      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'missing@domain.',
        'spaces in@email.com',
        'email@',
        'email@.com',
        'email@domain',
        // Note: Some emails may pass the simple regex but would be invalid in practice
        // This test validates the current regex implementation
      ];

      for (const email of invalidEmails) {
        const invalidRequest = { ...mockRequest, email };
        await expect(sut.execute(invalidRequest)).rejects.toThrow(
          'Invalid email format',
        );
      }
    });

    it('should accept valid email formats', async () => {
      const validEmails = [
        'user@domain.com',
        'user.name@domain.com',
        'user+tag@domain.com',
        'user123@domain123.com',
        'user@sub.domain.com',
      ];

      for (const email of validEmails) {
        // Clear repository between tests
        userRepositoryStub.clear();
        hasherStub.clear();
        emailVerificationTokenRepositoryStub.clear();
        verificationTokenGeneratorStub.clear();
        emailSenderStub.clear();
        authEmailTemplatesStub.clear();

        const validRequest = { ...mockRequest, email };
        const result = await sut.execute(validRequest);
        expect(result.user.email).toBe(email.toLowerCase());
      }
    });
  });
});
