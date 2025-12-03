import * as crypto from 'crypto';
import { VerificationTokenGenerator } from '@data/protocols';

export class CryptoVerificationTokenGenerator
  implements VerificationTokenGenerator
{
  generate(): string {
    const randomBytes = crypto.randomBytes(32);
    return randomBytes.toString('base64url');
  }
}
