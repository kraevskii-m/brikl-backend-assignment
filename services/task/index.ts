import { createGqlServer } from '../../libs/server'
import { resolvers } from './resolvers'
import { typeDefs } from './resolvers/schema'
import { startStandaloneServer } from '@apollo/server/standalone'
import { Context, createContext } from '../../libs/context'

export async function startServer(): Promise<void> {
  const server = await createGqlServer({
    typeDefs,
    resolvers,
  })

  const { url } = await startStandaloneServer<Context>(server, {
    listen: { port: Number(process.env.TASK_SERVICE_PORT),
    },
    context: createContext
  })

  console.log(`Task service running at ${url}`)
}
