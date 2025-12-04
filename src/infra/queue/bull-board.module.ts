import { Module, INestApplication } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '@domain/constants';
import { QueueClientModule } from './queue-client.module';

@Module({
  imports: [QueueClientModule],
})
export class BullBoardModule {
  static setup(app: INestApplication) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    try {
      let emailQueue: Queue;
      let tokenCleanupQueue: Queue;

      try {
        emailQueue = app.get<Queue>(getQueueToken(QUEUE_NAMES.EMAIL));
      } catch (error) {
        throw new Error(
          `Failed to get email queue: ${error.message}. Make sure QueueClientModule is imported in AppModule.`,
        );
      }

      try {
        tokenCleanupQueue = app.get<Queue>(
          getQueueToken(QUEUE_NAMES.TOKEN_CLEANUP),
        );
      } catch (error) {
        throw new Error(
          `Failed to get token cleanup queue: ${error.message}. Make sure QueueClientModule is imported in AppModule.`,
        );
      }

      createBullBoard({
        queues: [
          new BullMQAdapter(emailQueue),
          new BullMQAdapter(tokenCleanupQueue),
        ],
        serverAdapter,
      });

      const expressApp = app.getHttpAdapter().getInstance();
      expressApp.use('/admin/queues', serverAdapter.getRouter());

      console.log(
        '✅ Bull Board dashboard setup successfully at /admin/queues',
      );
    } catch (error) {
      console.error(
        '❌ Failed to setup Bull Board dashboard:',
        error.message,
        error.stack,
      );
      // Don't throw - allow app to continue without dashboard
    }
  }
}
