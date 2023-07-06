import { createGqlServer } from '../libs/server'
import { PrismaClient } from '@prisma/client'
import { startStandaloneServer } from '@apollo/server/standalone'
import { Context } from '../libs/context'
import { DocumentNode } from 'graphql/index'
import { IResolvers } from '@graphql-tools/utils'
import request from 'supertest'

export const getRandomString = (): string => {
  return (Math.random() + 1).toString(36).substring(7)
}

export const createPrismaClient = () => {
  const prismaClient = new PrismaClient()

  prismaClient.$use(async (params, next) => {
    if (params.model == 'Task' && params.action == 'create') {
      const taskMaxOrder = await prismaClient.task.findFirst(
        {
          orderBy: {
            order: 'desc'
          }
        }
      )

      params.args.data.order = taskMaxOrder ? taskMaxOrder.order + 1 : 1
    }
    return next(params)
  })
  return prismaClient
}
export const createServer = async (typeDefs: DocumentNode,
                                   resolvers: IResolvers,
                                   port: number) => {
  const server = await createGqlServer({
    typeDefs,
    resolvers
  })

  const prismaClient = createPrismaClient()

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

export const createClient = (url: string) => {
  return async (requestData: {}): Promise<any> => await request(url)
    .post('/')
    .send(requestData)
}
