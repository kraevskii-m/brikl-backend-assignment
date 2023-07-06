import { PrismaClient } from '@prisma/client'

export interface Context{
  prisma: PrismaClient
}

const prisma = new PrismaClient()

prisma.$use(async (params, next) => {
  if (params.model == 'Task' && params.action == 'create') {
    const taskMaxOrder = await prisma.task.findFirst(
      {
        orderBy: {
          order: 'desc'
        }
      }
    )

    params.args.data.order = taskMaxOrder? taskMaxOrder.order + 1 : 1
  }
  return next(params)
})

export const createContext = async () => ({
  prisma: prisma,
})
