import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { EmailVerificationTokenEntity } from '../entities/email-verification-token.entity';
import { EmailVerificationTokenRepository } from '@data/protocols/repositories';
import { EmailVerificationTokenModel } from '@domain/models/email-verification-token.model';

@Injectable()
export class TypeormEmailVerificationTokenRepository
  implements EmailVerificationTokenRepository
{
  constructor(
    @InjectRepository(EmailVerificationTokenEntity)
    private readonly tokenRepository: Repository<EmailVerificationTokenEntity>,
  ) {}

  async create(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<EmailVerificationTokenModel> {
    const tokenEntity = this.tokenRepository.create({
      userId,
      token,
      expiresAt,
    });

    const savedToken = await this.tokenRepository.save(tokenEntity);

    return {
      id: savedToken.id,
      userId: savedToken.userId,
      token: savedToken.token,
      expiresAt: savedToken.expiresAt,
      usedAt: savedToken.usedAt,
      createdAt: savedToken.createdAt,
    };
  }

  async findByToken(
    token: string,
  ): Promise<EmailVerificationTokenModel | null> {
    const tokenEntity = await this.tokenRepository.findOne({
      where: { token },
    });

    if (!tokenEntity) {
      return null;
    }

    return {
      id: tokenEntity.id,
      userId: tokenEntity.userId,
      token: tokenEntity.token,
      expiresAt: tokenEntity.expiresAt,
      usedAt: tokenEntity.usedAt,
      createdAt: tokenEntity.createdAt,
    };
  }

  async findByUserId(
    userId: string,
  ): Promise<EmailVerificationTokenModel | null> {
    const tokenEntity = await this.tokenRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!tokenEntity) {
      return null;
    }

    return {
      id: tokenEntity.id,
      userId: tokenEntity.userId,
      token: tokenEntity.token,
      expiresAt: tokenEntity.expiresAt,
      usedAt: tokenEntity.usedAt,
      createdAt: tokenEntity.createdAt,
    };
  }

  async markAsUsed(tokenId: string): Promise<void> {
    await this.tokenRepository.update(tokenId, {
      usedAt: new Date(),
    });
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.tokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.tokenRepository
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId })
      .andWhere('used_at IS NULL')
      .execute();
  }
}
