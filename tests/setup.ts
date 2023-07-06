import { cleanDB } from './helpers'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

module.exports = async () => {
  const config = dotenv.config({ path: `.env.test` })

  process.env = {
    ...process.env,
    ...config.parsed,
  };
  await cleanDB(new PrismaClient())
}
