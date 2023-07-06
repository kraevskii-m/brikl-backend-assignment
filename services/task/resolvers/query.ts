import { Resolvers } from 'generated/types'
import { Context } from '../../../libs/context'

export const query: Resolvers<Context>['Query'] = {
  retrieveTaskList: async (_parent, { id }, ctx) =>
    ctx.prisma.taskList.findFirst(
      {
        where: { id }
      }
    ),
  retrieveTaskLists: async (_parent, _args, ctx) =>
    ctx.prisma.taskList.findMany(),
  retrieveTask: async (_parent, { id }, ctx) =>
    ctx.prisma.task.findFirst(
      {
        where: { id }
      }
    ),
  retrieveTasks: async (_parent, _args, ctx) =>
    ctx.prisma.task.findMany()
}
