import { ApolloServer } from '@apollo/server'
import { Context } from '../../libs/context'
import { PrismaClient } from '@prisma/client'
import { createClient, createPrismaClient, createServer, getRandomString } from '../helpers'
import { typeDefs as taskTypeDefs } from '../../services/task/resolvers/schema'
import { resolvers as taskResolvers } from '../../services/task/resolvers'
import { typeDefs as userTypeDefs } from '../../services/user/resolvers/schema'
import { resolvers as userResolvers } from '../../services/user/resolvers'
import { startStandaloneServer } from '@apollo/server/standalone'
import { getStitchedSchemas } from '../../gateway'

describe('integration tests', () => {
  let taskServer: ApolloServer<Context>
  let userServer: ApolloServer<Context>
  let gatewayServer: ApolloServer

  let prismaClient: PrismaClient
  let client: ({}) => Promise<any>

  beforeAll(async () => {
    const taskConfig = await createServer(
      taskTypeDefs,
      taskResolvers,
      Number(process.env.TASK_SERVICE_PORT)
    )
    taskServer = taskConfig.server

    const userConfig = await createServer(
      userTypeDefs,
      userResolvers,
      Number(process.env.USER_SERVICE_PORT)
    )
    userServer = userConfig.server

    const schema = await getStitchedSchemas()
    gatewayServer = new ApolloServer({ schema })
    const { url } = await startStandaloneServer(gatewayServer, {
      listen: { port: Number(process.env.GATEWAY_PORT) }
    })

    prismaClient = createPrismaClient()

    client = createClient(url)
  })

  afterAll(async () => {
    await taskServer.stop()
    await userServer.stop()
    await gatewayServer.stop()
  })

  it('retrieve user, create task list, create task', async () => {
    const userInput = {
      username: getRandomString(),
      password: getRandomString()
    }
    const { id, username } = await prismaClient.user.create({ data: userInput })

    const getUserQuery = {
      query: `
              query User($id: ID!) {
                  user(id: $id) {
                      username
                  }
              }
          `,
      variables: {
        'id': id
      }
    }

    const response = await client(getUserQuery)

    expect(response.status).toBe(200)
    expect(response.body.data?.user.username).toBe(username)

    const createTaskListMutation = {
      query: `
              mutation CreateTaskList($title: String!) {
                  createTaskList(title: $title) {
                      id
                  }
              }
          `,
      variables: {
        'title': getRandomString()
      }
    }

    const responseTaskList = await client(createTaskListMutation)

    expect(responseTaskList.status).toBe(200)
    expect(responseTaskList.body.errors).toBeUndefined()

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
          'taskListId': responseTaskList.body.data.createTaskList.id
        }
      }
    }

    const responseTask = await client(createTaskMutation)

    expect(responseTask.status).toBe(200)
    expect(responseTask.body.errors).toBeUndefined()
    expect(responseTask.body.data?.createTask.title)
      .toBe(createTaskMutation.variables.input.title)
  })

  it('create task, create user, retrieve task list', async () => {
    const taskList = await prismaClient.taskList.create(
      {
        data: {
          title: getRandomString()
        }
      }
    )

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
          'taskListId': taskList.id
        }
      }
    }

    const response = await client(createTaskMutation)

    expect(response.status).toBe(200)
    expect(response.body.errors).toBeUndefined()
    expect(response.body.data?.createTask.title)
      .toBe(createTaskMutation.variables.input.title)

    const createUserMutation = {
      query: `
              mutation CreateUser($input: CreateUserInput!) {
                  createUser(input: $input) {
                      username
                  }
              }
          `,
      variables: {
        'input': {
          'username': getRandomString(),
          'password': getRandomString()
        }
      }
    }

    const responseUser = await client(createUserMutation)

    expect(responseUser.status).toBe(200)
    expect(responseUser.body.errors).toBeUndefined()
    expect(responseUser.body.data?.createUser.username).toBe(createUserMutation.variables.input.username)

    const getTaskListQuery = {
      query: `
              query TaskList($id: Int!) {
                  taskList(id: $id) {
                      id
                  }
              }
          `,
      variables: {
        'id': taskList.id
      }
    }

    const responseTaskList = await client(getTaskListQuery)

    expect(responseTaskList.status).toBe(200)
    expect(responseTaskList.body.data?.taskList.id).toBe(getTaskListQuery.variables.id)
  })
})
