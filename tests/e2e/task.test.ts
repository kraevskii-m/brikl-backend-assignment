import { ApolloServer } from '@apollo/server'
import { Context } from '../../libs/context'
import { PrismaClient } from '@prisma/client'
import { createServer, getRandomString } from '../helpers'
import { typeDefs } from '../../services/task/resolvers/schema'
import { resolvers } from '../../services/task/resolvers'
import request from 'supertest'
import { Task } from '../../generated/types'

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

      it('single task', async () => {
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
    let taskListId: number
    let task1: Task
    let task2: Task
    let task3: Task

    beforeAll(async () => {
      const { id } = await prismaClient.taskList.create(
        {
          data: {
            title: getRandomString()
          }
        })
      taskListId = id

      task1 = await prismaClient.task.create(
        {
          data: {
            title: getRandomString(),
            taskListId,
            order: 1
          }
        }
      )
      task2 = await prismaClient.task.create(
        {
          data: {
            title: getRandomString(),
            taskListId,
            order: 2
          }
        }
      )
      task3 = await prismaClient.task.create(
        {
          data: {
            title: getRandomString(),
            taskListId,
            order: 3
          }
        }
      )
    })

    it('move task3 to the 1 position', async () => {
      const moveTaskMutation = {
        query: `
              mutation MoveTask($id: Int!, $position: Int!) {
                  moveTask(id: $id, position: $position) {
                      order
                  }
              }
          `,
        variables: {
          'id': task3.id,
          'position': 1
        }
      }

      const response = await request(url)
        .post('/')
        .send(moveTaskMutation)

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data?.moveTask.order).toBeLessThan(task3.order)
    })

    it('move task1 to the third position', async () => {
      const count_all = await prismaClient.task.count()

      const moveTaskMutation = {
        query: `
              mutation MoveTask($id: Int!, $position: Int!) {
                  moveTask(id: $id, position: $position) {
                      order
                  }
              }
          `,
        variables: {
          'id': task1.id,
          'position': count_all
        }
      }

      const response = await request(url)
        .post('/')
        .send(moveTaskMutation)

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data?.moveTask.order).toBeGreaterThan(task1.order)
    })
  })

  describe('update a task list', () => {
    let id: number

    beforeEach(async () => {
      ({ id } = await prismaClient.taskList.create(
        {
          data: {
            title: getRandomString()
          }
        }))
    })

    it('happy flow', async () => {
      const updateTaskListMutation = {
        query: `
              mutation UpdateTaskList($id: Int!, $input: UpdateTaskListInput!) {
                  updateTaskList(id: $id, input: $input) {
                      title
                  }
              }
          `,
        variables: {
          'input': {
            'title': getRandomString()
          },
          'id': id
        }
      }

      const response = await request(url)
        .post('/')
        .send(updateTaskListMutation)

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data?.updateTaskList.title)
        .toBe(updateTaskListMutation.variables.input.title)
    })

    it('update task list that not exist', async () => {
      const updateTaskList = {
        query: `
              mutation UpdateTaskList($id: Int!, $input: UpdateTaskListInput!) {
                  updateTaskList(id: $id, input: $input) {
                      title
                  }
              }
          `,
        variables: {
          'input': {
            'title': getRandomString()
          },
          'id': id * 10
        }
      }

      const response = await request(url)
        .post('/')
        .send(updateTaskList)

      expect(response.status).toBe(200)
      expect(response.body.errors.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Delete a task', () => {
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

      const deleteTaskMutation = {
        query: `
              mutation DeleteTask($deleteTaskId: Int!) {
                  deleteTask(id: $deleteTaskId) {
                      success
                  }
              }
          `,
        variables: {
          'deleteTaskId': id
        }
      }

      const response = await request(url)
        .post('/')
        .send(deleteTaskMutation)

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data?.deleteTask.success).toBe(true)
      const record = await prismaClient.task.findUnique({ where: { id } })
      expect(record).toBeNull()
    })

    it('wrong id returns error', async () => {

      const deleteTaskMutation = {
        query: `
              mutation DeleteTask($deleteTaskId: Int!) {
                  deleteTask(id: $deleteTaskId) {
                      success
                  }
              }
          `,
        variables: {
          'deleteTaskId': id * 10
        }
      }

      const response = await request(url)
        .post('/')
        .send(deleteTaskMutation)

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data?.deleteTask.success).toBe(false)
      const record = await prismaClient.task.findUnique({ where: { id } })
      expect(record).not.toBeNull()
    })
  })

  describe('Delete a task list', () => {
    let id: number

    beforeEach(async () => {
      ({ id } = await prismaClient.taskList.create(
        {
          data: {
            title: getRandomString()
          }
        }))
    })

    it('happy flow', async () => {

      const deleteTaskListMutation = {
        query: `
              mutation DeleteTaskList($deleteTaskListId: Int!) {
                  deleteTaskList(id: $deleteTaskListId) {
                      success
                  }
              }
          `,
        variables: {
          'deleteTaskListId': id
        }
      }

      const response = await request(url)
        .post('/')
        .send(deleteTaskListMutation)

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data?.deleteTaskList.success).toBe(true)
      const record = await prismaClient.taskList.findUnique({ where: { id } })
      expect(record).toBeNull()
    })

    it('wrong id returns error', async () => {
      const deleteTaskListMutation = {
        query: `
              mutation DeleteTaskList($deleteTaskListId: Int!) {
                  deleteTaskList(id: $deleteTaskListId) {
                      success
                  }
              }
          `,
        variables: {
          'deleteTaskListId': id * 10
        }
      }

      const response = await request(url)
        .post('/')
        .send(deleteTaskListMutation)

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data?.deleteTaskList.success).toBe(false)
      const record = await prismaClient.taskList.findUnique({ where: { id } })
      expect(record).not.toBeNull()
    })
  })
})
