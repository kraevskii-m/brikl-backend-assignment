import { createGqlServer } from '../../libs/server'
import { typeDefs } from '../../services/user/resolvers/schema'
import { resolvers } from '../../services/user/resolvers'
import { startStandaloneServer } from '@apollo/server/standalone'
import { Context } from '../../libs/context'
import { ApolloServer } from '@apollo/server'
import { PrismaClient } from '@prisma/client'
import { getRandomString } from '../helpers'

const request = require('supertest')

const createServer = async () => {
  const server = await createGqlServer({
    typeDefs,
    resolvers
  })

  const prismaClient = new PrismaClient()

  const { url } = await startStandaloneServer<Context>(server, {
    listen: {
      port: Number(process.env.USER_SERVICE_PORT)
    },
    context: async () => ({
      prisma: prismaClient
    })
  })

  return { server, url, prismaClient }
}

describe('user service tests', () => {
  let server: ApolloServer<Context>
  let url: string
  let prismaClient: PrismaClient

  beforeAll(async () => {
    ({ server, url, prismaClient } = await createServer())
  })

  afterAll(async () => {
    const deleteTask = prismaClient.task.deleteMany()
    const deleteTaskList = prismaClient.taskList.deleteMany()
    const deleteUser = prismaClient.user.deleteMany()

    await prismaClient.$transaction([
      deleteTask,
      deleteTaskList,
      deleteUser
    ])
    await server?.stop()
  })

  describe('create user', () => {
    it('happy scenario', async () => {
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

      const rows_before = await prismaClient.user.count()

      const response = await request(url)
        .post('/')
        .set('Content-Type', 'application/json')
        .send(createUserMutation)

      const rows_after = await prismaClient.user.count()

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data?.createUser.username).toBe(createUserMutation.variables.input.username)
      expect(rows_before + 1).toBe(rows_after)
      const last_record = await prismaClient
        .user.findMany({
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        })
      expect(last_record[0].username).toBe(createUserMutation.variables.input.username)
    })

    it('wrong request returns error', async () => {
      const wrongMutation = {
        query: `
          mutation CreateUserWrong($input: CreateUserInput!) {
              createUserWrong(input: $input) {
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

      const rows_before = await prismaClient.user.count()

      const response = await request(url)
        .post('/')
        .set('Content-Type', 'application/json')
        .send(wrongMutation)

      const rows_after = await prismaClient.user.count()

      expect(response.status).toBe(400)
      expect(rows_before).toBe(rows_after)
    })
  })

  describe('update user', () => {
    let id: string

    beforeEach(async () => {
      const userInput = {
        username: getRandomString(),
        password: getRandomString()
      };
      ({ id } = await prismaClient.user.create({ data: userInput }))
    })

    it('happy scenario', async () => {
      const updateUserMutation = {
        query: `
          mutation UpdateUser($updateUserId: ID!, $input: UpdateUserInput!) {
              updateUser(id: $updateUserId, input: $input) {
                  username
              }
          }
      `,
        variables: {
          'input': {
            'username': getRandomString()
          },
          'updateUserId': id
        }
      }

      const rows_before = await prismaClient.user.count()

      const response = await request(url)
        .post('/')
        .set('Content-Type', 'application/json')
        .send(updateUserMutation)

      const rows_after = await prismaClient.user.count()

      expect(response.status).toBe(200)
      expect(response.body.errors).toBeUndefined()
      expect(response.body.data?.updateUser.username).toBe(updateUserMutation.variables.input.username)
      expect(rows_before).toBe(rows_after)
      const record = await prismaClient.user.findUnique({ where: { id } })
      expect(record?.username).toBe(updateUserMutation.variables.input.username)
    })

    it('wrong id returns error', async () => {
      const updateUserMutationWrong = {
        query: `
          mutation UpdateUser($updateUserId: ID!, $input: UpdateUserInput!) {
              updateUser(id: $updateUserId, input: $input) {
                  username
              }
          }
      `,
        variables: {
          'input': {
            'username': getRandomString()
          },
          'updateUserId': id + 'a'
        }
      }

      const response = await request(url)
        .post('/')
        .set('Content-Type', 'application/json')
        .send(updateUserMutationWrong)

      expect(response.status).toBe(200)
      expect(response.body.errors.length).toBeGreaterThanOrEqual(1)
    })
  })
})
