import { cleanDB, createPrismaClient } from './helpers'
import dotenv from 'dotenv'

module.exports = async () => {
  const config = dotenv.config({ path: `.env.test` })

  process.env = {
    ...process.env,
    ...config.parsed
  }
  await cleanDB(createPrismaClient())
}
