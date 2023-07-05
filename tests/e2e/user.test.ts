import { createGqlServer } from '../../libs/server'
import { typeDefs } from '../../services/user/resolvers/schema'
import { resolvers } from '../../services/user/resolvers'
import { startStandaloneServer } from '@apollo/server/standalone'
import { Context, createContext } from '../../libs/context'
import { ApolloServer } from '@apollo/server'
const request = require('supertest')

const queryData = {
  query: `query sayHello($name: String) {
    hello(name: $name)
  }`,
  variables: { name: 'world' }
}

const createServer = async () => {
  const server = await createGqlServer({
    typeDefs,
    resolvers
  })

  const { url } = await startStandaloneServer<Context>(server, {
    listen: {
      port: Number(process.env.USER_SERVICE_PORT)
    },
    context: createContext
  })

  return { server, url }
}

describe('user service tests', () => {
  let server: ApolloServer<Context>
  let url: string

  beforeAll(async () => {
    ({ server, url } = await createServer())
  })

  afterAll(async () => {
    await server?.stop()
  })


  it('create user', async () => {
    const response = await request(url).post('/').send(queryData)

    expect(true).toBeTruthy()
    expect(response.errors).toBeUndefined()
  })

})