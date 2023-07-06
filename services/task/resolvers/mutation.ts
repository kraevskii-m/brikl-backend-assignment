import { Resolvers } from 'generated/types'
import { Context } from '../../../libs/context'

export const mutation: Resolvers<Context>['Mutation'] = {
  createTaskList: async (_parent, { title }, ctx) =>
    ctx.prisma.taskList.create({ data: { title } }),
  createTask: async (_parent, { input }, ctx) => {
    return await ctx.prisma.$transaction(async (tx) => {
      let order
      const lastRecord = await tx.task.findFirst({
        orderBy: {
          order: 'desc'
        }
      })
      order = !lastRecord ? 0 : lastRecord.order + 1
      return tx.task.create({
        data: {
          title: input.title,
          taskListId: input.taskListId,
          order
        }
      })
    })
  },
  updateTask: async (parent, { id, input }, ctx) =>
    ctx.prisma.task.update({
      where: { id },
      data: {
        title: input.title ?? undefined,
        status: input.status ?? undefined
      }
    })
}
