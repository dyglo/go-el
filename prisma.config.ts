import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // @ts-ignore - prisma config typing currently omits seed command
  seed: 'node prisma/seed.js',
  // @ts-ignore - prisma config typing currently omits envFile option
  envFile: '.env',
});
