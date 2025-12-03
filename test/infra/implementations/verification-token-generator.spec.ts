import { CryptoVerificationTokenGenerator } from '@infra/implementations/verification-token-generator';

describe('CryptoVerificationTokenGenerator', () => {
  let sut: CryptoVerificationTokenGenerator;

  beforeEach(() => {
    sut = new CryptoVerificationTokenGenerator();
  });

  describe('generate', () => {
    it('should generate a token', () => {
      // Act
      const token = sut.generate();

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      // Act
      const token1 = sut.generate();
      const token2 = sut.generate();
      const token3 = sut.generate();

      // Assert
      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should generate URL-safe tokens', () => {
      // Act
      const token = sut.generate();

      // Assert
      // base64url encoding should not contain +, /, or = characters
      expect(token).not.toContain('+');
      expect(token).not.toContain('/');
      expect(token).not.toContain('=');
      // Should be URL-safe (can be used in query parameters)
      expect(encodeURIComponent(token)).toBe(token);
    });

    it('should generate tokens of sufficient length', () => {
      // Act
      const token = sut.generate();

      // Assert
      // base64url encoding of 32 bytes = 43 characters (without padding)
      expect(token.length).toBeGreaterThanOrEqual(40);
      expect(token.length).toBeLessThanOrEqual(44);
    });

    it('should generate tokens with sufficient entropy', () => {
      // Act
      const tokens = Array.from({ length: 100 }, () => sut.generate());

      // Assert
      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(100);
    });
  });
});
