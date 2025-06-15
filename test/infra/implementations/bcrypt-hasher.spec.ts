import * as bcrypt from 'bcrypt';
import { BcryptHasher } from '@infra/implementations/bcrypt-hasher';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('BcryptHasher', () => {
  let hasher: BcryptHasher;

  beforeEach(() => {
    hasher = new BcryptHasher();
    jest.clearAllMocks();
  });

  describe('hash', () => {
    it('should hash a value using bcrypt with correct salt rounds', async () => {
      // Arrange
      const value = 'password123';
      const expectedHash = 'hashed_password_123';
      mockedBcrypt.hash.mockResolvedValue(expectedHash as never);

      // Act
      const result = await hasher.hash(value);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(value, 12);
      expect(result).toBe(expectedHash);
    });

    it('should handle bcrypt hash errors', async () => {
      // Arrange
      const value = 'password123';
      const error = new Error('Bcrypt hash failed');
      (mockedBcrypt.hash as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(hasher.hash(value)).rejects.toThrow('Bcrypt hash failed');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(value, 12);
    });

    it('should hash empty string', async () => {
      // Arrange
      const value = '';
      const expectedHash = 'hashed_empty_string';
      mockedBcrypt.hash.mockResolvedValue(expectedHash as never);

      // Act
      const result = await hasher.hash(value);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(value, 12);
      expect(result).toBe(expectedHash);
    });

    it('should hash special characters', async () => {
      // Arrange
      const value = '!@#$%^&*()_+{}|:<>?[]\\;\'",./`~';
      const expectedHash = 'hashed_special_chars';
      mockedBcrypt.hash.mockResolvedValue(expectedHash as never);

      // Act
      const result = await hasher.hash(value);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(value, 12);
      expect(result).toBe(expectedHash);
    });
  });

  describe('compare', () => {
    it('should compare value with hash and return true for valid match', async () => {
      // Arrange
      const value = 'password123';
      const hash = 'hashed_password_123';
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await hasher.compare(value, hash);

      // Assert
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(value, hash);
      expect(result).toBe(true);
    });

    it('should compare value with hash and return false for invalid match', async () => {
      // Arrange
      const value = 'password123';
      const hash = 'different_hash';
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act
      const result = await hasher.compare(value, hash);

      // Assert
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(value, hash);
      expect(result).toBe(false);
    });

    it('should handle bcrypt compare errors', async () => {
      // Arrange
      const value = 'password123';
      const hash = 'hashed_password_123';
      const error = new Error('Bcrypt compare failed');
      (mockedBcrypt.compare as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(hasher.compare(value, hash)).rejects.toThrow(
        'Bcrypt compare failed',
      );
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(value, hash);
    });

    it('should compare empty strings', async () => {
      // Arrange
      const value = '';
      const hash = '';
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await hasher.compare(value, hash);

      // Assert
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(value, hash);
      expect(result).toBe(true);
    });

    it('should compare special characters', async () => {
      // Arrange
      const value = '!@#$%^&*()_+{}|:<>?[]\\;\'",./`~';
      const hash = 'hashed_special_chars';
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await hasher.compare(value, hash);

      // Assert
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(value, hash);
      expect(result).toBe(true);
    });
  });
});
