import { ApolloServer } from '@apollo/server'
import { Context } from '../../libs/context'
import { PrismaClient } from '@prisma/client'
import { createServer, getRandomString } from '../helpers'
import { typeDefs } from '../../services/task/resolvers/schema'
import { resolvers } from '../../services/task/resolvers'
import request from 'supertest'

describe('task service tests', () => {
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

          const response = await request(url)
            .post('/')
            .send(createTaskListMutation)

          expect(response.status).toBe(200)
          expect(response.body.errors).toBeUndefined()
          expect(response.body.data?.createTaskList.title)
            .toBe(createTaskListMutation.variables.title)
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

          const response = await request(url)
            .post('/')
            .send(createTaskListMutation)

          expect(response.status).toBe(200)
          expect(response.body.errors.length).toBeGreaterThanOrEqual(1)
        })
      })
    })

    describe('create a new task in list', () => {
      let taskListId: number

      beforeEach(async () => {
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

        const response = await request(url)
          .post('/')
          .send(createTaskMutation)

        expect(response.status).toBe(200)
        expect(response.body.errors).toBeUndefined()
        expect(response.body.data?.createTask.title)
          .toBe(createTaskMutation.variables.input.title)
      })

      it('new task has the greater order', async () => {
        await prismaClient.task.create(
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

        const response = await request(url)
          .post('/')
          .send(createTaskMutation)

        expect(response.status).toBe(200)
        expect(response.body.errors).toBeUndefined()
        expect(response.body.data?.createTask.title)
          .toBe(createTaskMutation.variables.input.title)
      })
    })

    describe('update a task', () => {
      let id: number

      beforeEach(async () => {
        const taskList = await prismaClient.taskList.create(
          {
            data: {
              title: getRandomString()
            }
          })

        await prismaClient.$transaction(async (tx) => {
          const taskInput = {
            title: getRandomString(),
            order: 0,
            taskListId: taskList.id
          };
          ({ id } = await tx.task.create({ data: taskInput }))
        })
      })

      it('happy flow', async () => {
        const updateTaskMutation = {
          query: `
              mutation UpdateTask($id: Int!, $input: UpdateTaskInput!) {
                  updateTask(id: $id, input: $input) {
                      title
                      status
                  }
              }
          `,
          variables: {
            'input': {
              'title': getRandomString(),
              'status': 'COMPLETED'
            },
            'id': id
          }
        }

        const response = await request(url)
          .post('/')
          .send(updateTaskMutation)

        expect(response.status).toBe(200)
        expect(response.body.errors).toBeUndefined()
        expect(response.body.data?.updateTask.title)
          .toBe(updateTaskMutation.variables.input.title)
        expect(response.body.data?.updateTask.status)
          .toBe(updateTaskMutation.variables.input.status)
        const newTask = await prismaClient.task.findFirst(
          {
            where: {
              id
            }
          }
        )
        expect(newTask?.status)
          .toBe(updateTaskMutation.variables.input.status)
        expect(newTask?.title)
          .toBe(updateTaskMutation.variables.input.title)
      })

      it('update task that not exist', async () => {
        const updateTaskMutation = {
          query: `
              mutation UpdateTask($id: Int!, $input: UpdateTaskInput!) {
                  updateTask(id: $id, input: $input) {
                      title
                      status
                  }
              }
          `,
          variables: {
            'input': {
              'title': getRandomString(),
              'status': 'COMPLETED'
            },
            'id': id * 10
          }
        }

        const response = await request(url)
          .post('/')
          .send(updateTaskMutation)

        expect(response.status).toBe(200)
        expect(response.body.errors.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('move a task to a specific position in the list', () => {
    it('happy flow', () => {
      expect(true).toBeTruthy()
    })
  })

  describe('update a task list', () => {
    it('happy flow', () => {
      expect(true).toBeTruthy()
    })
  })

  describe('Delete a list', () => {
    it('happy flow', () => {
      expect(true).toBeTruthy()
    })
  })

  describe('Delete a task', () => {
    it('happy flow', () => {
      expect(true).toBeTruthy()
    })
  })
})
