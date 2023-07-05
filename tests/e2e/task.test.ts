import { ApolloServer } from '@apollo/server'
import { Context } from '../../libs/context'
import { PrismaClient } from '@prisma/client'
import { cleanDB, createServer } from '../helpers'

describe('user service tests', () => {
  let server: ApolloServer<Context>
  let url: string
  let prismaClient: PrismaClient

  beforeAll(async () => {
    ({ server, url, prismaClient } = await createServer())
  })

  afterAll(async () => {
    await cleanDB(prismaClient)
    await server?.stop()
  })

  describe('query', () => {

  })

  describe('mutation', () => {

  })
})
