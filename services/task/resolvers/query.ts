import { Resolvers } from 'generated/types'
import { Context } from '../../../libs/context'

export const query: Resolvers<Context>['Query'] = {
  taskList: async (_parent, { id }, ctx) =>
    ctx.prisma.taskList.findFirst(
      {
        where: { id }
      }
    ),
  taskLists: async (_parent, _args, ctx) =>
    ctx.prisma.taskList.findMany(),
  task: async (_parent, { id }, ctx) =>
    ctx.prisma.task.findFirst(
      {
        where: { id }
      }
    ),
  tasks: async (_parent, _args, ctx) =>
    ctx.prisma.task.findMany()
}
