import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // Prisma 7 handles the live connection context directly here
    url: env('DATABASE_URL'), 
  },
});