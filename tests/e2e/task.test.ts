import { ApolloServer } from '@apollo/server'
import { Context } from '../../libs/context'
import { PrismaClient } from '@prisma/client'
import { cleanDB, createServer, getRandomString } from '../helpers'
import { typeDefs } from '../../services/task/resolvers/schema'
import { resolvers } from '../../services/task/resolvers'
import request from 'supertest'

describe('user service tests', () => {
  let server: ApolloServer<Context>
  let url: string
  let prismaClient: PrismaClient

  beforeAll(async () => {
    ({ server, url, prismaClient } = await createServer(
      typeDefs,
      resolvers,
      Number(process.env.TASK_SERVICE_PORT)
    ))
  })

  afterAll(async () => {
    await cleanDB(prismaClient)
    await server?.stop()
  })

  describe('query', () => {
    describe('Retrieve all lists and their tasks', () => {
      it('happy flow', async () => {
        expect(true).toBeTruthy()
      })
    })

    describe('mutation', () => {
      describe('create a new list', () => {
        it('happy flow', async () => {
          const createTaskListMutation = {
            query: `
              mutation CreateTaskList($title: String!) {
                  createTaskList(title: $title) {
                      title
                  }
              }
          `,
            variables: {
              'title': getRandomString()
            }
          }

          const rows_before = await prismaClient.taskList.count()

          const response = await request(url)
            .post('/')
            .send(createTaskListMutation)

          const rows_after = await prismaClient.taskList.count()

          expect(response.status).toBe(200)
          expect(response.body.errors).toBeUndefined()
          expect(response.body.data?.createTaskList.title)
            .toBe(createTaskListMutation.variables.title)
          expect(rows_before + 1).toBe(rows_after)
          const last_record = await prismaClient
            .taskList.findMany({
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            })
          expect(last_record[0].title).toBe(createTaskListMutation.variables.title)
        })
      })
    })

    it('no title should return error', async () => {
      const createTaskListMutation = {
        query: `
              mutation CreateTaskList($title: String!) {
                  createTaskList(title: $title) {
                      title
                  }
              }
          `,
        variables: {}
      }

      const rows_before = await prismaClient.taskList.count()

      const response = await request(url)
        .post('/')
        .send(createTaskListMutation)

      const rows_after = await prismaClient.taskList.count()

      expect(response.status).toBe(200)
      expect(response.body.errors.length).toBeGreaterThanOrEqual(1)
      expect(rows_before).toBe(rows_after)
    })

    describe('create a new task in list', () => {
      let taskListId: number

      beforeEach(async () => {
        await prismaClient.task.deleteMany()
        const { id } = await prismaClient.taskList.create(
          {
            data: {
              title: getRandomString()
            }
          })
        taskListId = id
      })

      it('single task has 0 order', async () => {
        const createTaskMutation = {
          query: `
              mutation CreateTask($input: CreateTaskInput!) {
                  createTask(input: $input) {
                      title
                      order
                  }
              }
          `,
          variables: {
            'input': {
              'title': getRandomString(),
              'taskListId': taskListId
            }
          }
        }

        const rows_before = await prismaClient.task.count()

        const response = await request(url)
          .post('/')
          .send(createTaskMutation)

        const rows_after = await prismaClient.task.count()

        expect(response.status).toBe(200)
        expect(response.body.errors).toBeUndefined()
        expect(response.body.data?.createTask.title)
          .toBe(createTaskMutation.variables.input.title)
        expect(rows_before + 1).toBe(rows_after)
        const last_record = await prismaClient
          .task.findMany({
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          })
        expect(last_record[0].order).toBe(0)
      })

      it('new task has order the greater order', async () => {
        const  task  = await prismaClient.task.create(
          {
            data: {
              title: getRandomString(),
              order: 0,
              taskListId: taskListId
            }
          })

        const createTaskMutation = {
          query: `
              mutation CreateTask($input: CreateTaskInput!) {
                  createTask(input: $input) {
                      title
                      order
                  }
              }
          `,
          variables: {
            'input': {
              'title': getRandomString(),
              'taskListId': taskListId
            }
          }
        }

        const rows_before = await prismaClient.task.count()

        const response = await request(url)
          .post('/')
          .send(createTaskMutation)

        const rows_after = await prismaClient.task.count()

        expect(response.status).toBe(200)
        expect(response.body.errors).toBeUndefined()
        expect(response.body.data?.createTask.title)
          .toBe(createTaskMutation.variables.input.title)
        expect(rows_before + 1).toBe(rows_after)
        const last_record = await prismaClient
          .task.findMany({
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          })
        expect(last_record[0].order).toBe(task.order + 1)
      })
    })

    describe('update a task', () => {
      it('happy flow', () => {
        expect(true).toBeTruthy()
      })
    })

    describe('move a task to a specific position in the list', () => {
      it('happy flow', () => {
        expect(true).toBeTruthy()
      })
    })
  })
})
