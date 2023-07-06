import { createGqlServer } from '../libs/server'
import { PrismaClient } from '@prisma/client'
import { startStandaloneServer } from '@apollo/server/standalone'
import { Context } from '../libs/context'
import { DocumentNode } from 'graphql/index'
import { IResolvers } from '@graphql-tools/utils'

export const getRandomString = (): string => {
  return (Math.random() + 1).toString(36).substring(7)
}

export const createServer = async (typeDefs: DocumentNode,
                                   resolvers: IResolvers,
                                   port: number) => {
  const server = await createGqlServer({
    typeDefs,
    resolvers
  })

  const prismaClient = new PrismaClient()

  const { url } = await startStandaloneServer<Context>(server, {
    listen: {
      port
    },
    context: async () => ({
      prisma: prismaClient
    })
  })

  return { server, url, prismaClient }
}

export const cleanDB = async (prismaClient: PrismaClient) => {
  const deleteTask = prismaClient.task.deleteMany()
  const deleteTaskList = prismaClient.taskList.deleteMany()
  const deleteUser = prismaClient.user.deleteMany()

  await prismaClient.$transaction([
    deleteTask,
    deleteTaskList,
    deleteUser
  ])
}
