import { createGqlServer } from '../../libs/server'
import { typeDefs } from '../../services/user/resolvers/schema'
import { resolvers } from '../../services/user/resolvers'
import { startStandaloneServer } from '@apollo/server/standalone'
import { Context } from '../../libs/context'
import { ApolloServer } from '@apollo/server'
import { PrismaClient } from '@prisma/client'
import { getRandomString } from '../helpers'

const request = require('supertest')

const createServer = async () => {
  const server = await createGqlServer({
    typeDefs,
    resolvers
  })

  const prismaClient = new PrismaClient()

  const { url } = await startStandaloneServer<Context>(server, {
    listen: {
      port: Number(process.env.USER_SERVICE_PORT)
    },
    context: async () => ({
      prisma: prismaClient
    })
  })

  return { server, url, prismaClient }
}

describe('user service tests', () => {
  let server: ApolloServer<Context>
  let url: string
  let prismaClient: PrismaClient

  beforeAll(async () => {
    ({ server, url, prismaClient } = await createServer())
  })

  afterAll(async () => {
    await server?.stop()
  })


  it('create user', async () => {
    const mutation = {
      query: `
          mutation CreateUser($input: CreateUserInput!) {
              createUser(input: $input) {
                  username
              }
          }
      `,
      variables: {
        'input': {
          'username': getRandomString(),
          'password': getRandomString()
        }
      }
    }

    const rows_before = await prismaClient.user.count()

    const response = await request(url)
      .post('/')
      .set('Content-Type', 'application/json')
      .send(mutation)

    const rows_after = await prismaClient.user.count()

    expect(response.status).toBe(200)
    expect(response.errors).toBeUndefined()
    expect(response.body.data?.createUser.username).toBe(mutation.variables.input.username)
    expect(rows_before + 1).toBe(rows_after)
    const last_record = await prismaClient
      .user.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      })
    expect(last_record[0].username).toBe(mutation.variables.input.username)
  })
})
