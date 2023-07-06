import { Resolvers } from 'generated/types'
import { Context } from '../../../libs/context'

export const mutation: Resolvers<Context>['Mutation'] = {
  createTaskList: async (_parent, { title }, ctx) =>
    ctx.prisma.taskList.create({ data: { title } }),
  createTask: async (_parent, { input }, ctx) => {
    return ctx.prisma.task.create({
      data: {
        title: input.title,
        taskListId: input.taskListId,
        order: 0
      }
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
