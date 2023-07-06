import { Resolvers } from 'generated/types'
import { Context } from '../../../libs/context'

export const mutation: Resolvers<Context>['Mutation'] = {
  createTaskList: async (_parent, { title }, ctx) =>
    ctx.prisma.taskList.create({ data: { title } })
}
