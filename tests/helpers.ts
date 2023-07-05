import { createGqlServer } from '../libs/server'
import { typeDefs } from '../services/user/resolvers/schema'
import { resolvers } from '../services/user/resolvers'
import { PrismaClient } from '@prisma/client'
import { startStandaloneServer } from '@apollo/server/standalone'
import { Context } from '../libs/context'

export const getRandomString = (): string => {
  return (Math.random() + 1).toString(36).substring(7)
}

export const createServer = async () => {
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

export const cleanDB = async (prismaClient: PrismaClient)  => {
  const deleteTask = prismaClient.task.deleteMany()
  const deleteTaskList = prismaClient.taskList.deleteMany()
  const deleteUser = prismaClient.user.deleteMany()

  await prismaClient.$transaction([
    deleteTask,
    deleteTaskList,
    deleteUser
  ])
}
