import { Resolvers } from 'generated/types'
import { Context } from '../../../libs/context'
import { GraphQLError } from 'graphql/error'

export const mutation: Resolvers<Context>['Mutation'] = {
  createTaskList: async (_parent, { title }, ctx) =>
    ctx.prisma.taskList.create({ data: { title } }),
  createTask: async (_parent, { input }, ctx) =>
    ctx.prisma.task.create({
      data: {
        title: input.title,
        taskListId: input.taskListId,
        order: 1
      }
    }),
  updateTask: async (parent, { id, input }, ctx) =>
    ctx.prisma.task.update({
      where: { id },
      data: {
        title: input.title ?? undefined,
        status: input.status ?? undefined
      }
    }),
  updateTaskList: async (parent, { id, input }, ctx) =>
    ctx.prisma.taskList.update({
      where: { id },
      data: {
        title: input.title ?? undefined
      }
    }),
  deleteTask: async (parent, { id }, ctx) => {
    try {
      await ctx.prisma.task.delete({
        where: { id }
      })
    } catch (e) {
      return { success: false }
    }
    return { success: true }
  },
  deleteTaskList: async (parent, { id }, ctx) => {
    try {
      await ctx.prisma.taskList.delete({
        where: { id }
      })
    } catch (e) {
      return { success: false }
    }
    return { success: true }
  },
  moveTask: async (parent, { id, position }, ctx) => {
    return await ctx.prisma.$transaction(async () => {
      const count_all = await ctx.prisma.task.count()
      if (count_all == 0) {
        throw new GraphQLError('"Empty task list', {
          extensions: {
            code: 'EMPTY_TASK_LIST'
          }
        })
      }

      if (position < 1 || position > count_all) {
        throw new GraphQLError('"Wrong position', {
          extensions: {
            code: 'WRONG_POSITION'
          }
        })
      }

      let newOrder
      if (position == 1 || position == count_all) {
        const firstTask = await ctx.prisma.task.findFirst({
          orderBy: { order: position == 1 ? 'asc' : 'desc' }
        })
        newOrder = position == 1 ? firstTask!.order / 2 : firstTask!.order + 1
      } else {
        const tasks = await ctx.prisma.task.findMany({
          orderBy: { order: 'asc' },
          skip: position - 1,
          take: 2
        })

        newOrder = (tasks[0].order + tasks[1].order) / 2
      }

      return await ctx.prisma.task.update(
        {
          where: { id },
          data: {
            order: newOrder
          }
        }
      )
    })
  }
}
