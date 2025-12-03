import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual } from 'typeorm';
import { PasswordResetTokenEntity } from '../entities/password-reset-token.entity';
import { PasswordResetTokenRepository } from '@data/protocols/repositories/password-reset-token-repository';
import { PasswordResetTokenModel } from '@domain/models/password-reset-token.model';

@Injectable()
export class TypeormPasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  constructor(
    @InjectRepository(PasswordResetTokenEntity)
    private readonly tokenRepository: Repository<PasswordResetTokenEntity>,
  ) {}

  async create(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<PasswordResetTokenModel> {
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

  async findByToken(token: string): Promise<PasswordResetTokenModel | null> {
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

  async findByUserId(userId: string): Promise<PasswordResetTokenModel | null> {
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

  async findRecentByUserId(
    userId: string,
    hours: number,
  ): Promise<PasswordResetTokenModel[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    const tokenEntities = await this.tokenRepository.find({
      where: {
        userId,
        createdAt: MoreThanOrEqual(cutoffDate),
      },
      order: { createdAt: 'DESC' },
    });

    return tokenEntities.map(token => ({
      id: token.id,
      userId: token.userId,
      token: token.token,
      expiresAt: token.expiresAt,
      usedAt: token.usedAt,
      createdAt: token.createdAt,
    }));
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
