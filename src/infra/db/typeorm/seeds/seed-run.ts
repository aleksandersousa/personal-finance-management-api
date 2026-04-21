import { AppDataSource } from '../config/data-source';
import { seedRecurrences } from './seed-recurrences';

type SeedTask = {
  name: string;
  run: () => Promise<void>;
};

const seeds: SeedTask[] = [
  { name: 'recurrences', run: seedRecurrences },
];

async function runAllSeeds(): Promise<void> {
  await AppDataSource.initialize();

  try {
    for (const seed of seeds) {
      await seed.run();
    }
  } finally {
    await AppDataSource.destroy();
  }
}

runAllSeeds().catch(error => {
  console.error(error);
  process.exit(1);
});
