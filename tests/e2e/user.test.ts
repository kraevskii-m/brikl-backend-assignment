import { Context } from '../../libs/context'
import { ApolloServer } from '@apollo/server'
import { PrismaClient } from '@prisma/client'
import { createClient, createServer, getRandomString } from '../helpers'
import { typeDefs } from '../../services/user/resolvers/schema'
import { resolvers } from '../../services/user/resolvers'

describe('user service tests', () => {
  let server: ApolloServer<Context>
  let url: string
  let prismaClient: PrismaClient
  let client: ({}) => Promise<any>

  const CreateRandomUser = async () => {
    const userInput = {
      username: getRandomString(),
      password: getRandomString()
    }
    const { id, username } = await prismaClient.user.create({ data: userInput })

    return { id, username }
  }

  beforeAll(async () => {
    ({ server, url, prismaClient } = await createServer(
      typeDefs,
      resolvers,
      Number(process.env.USER_SERVICE_PORT)
    ))
    client = createClient(url)
  })

  afterAll(async () => {
    await server?.stop()
  })

  describe('query', () => {
    describe('get single user', () => {
      it('happy flow', async () => {
        const { id, username } = await CreateRandomUser()

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
      })

      it('user not exist', async () => {
        const { id } = await CreateRandomUser()

        const getUserQuery = {
          query: `
              query User($id: ID!) {
                  user(id: $id) {
                      username
                  }
              }
          `,
          variables: {
            'id': id + 'a'
          }
        }

        const response = await client(getUserQuery)

        expect(response.status).toBe(200)
        expect(response.body.data?.user).toBeNull()
      })
    })

    describe('get all users', () => {
      it('returns exact number of users', async () => {
        await CreateRandomUser()

        const getUserQuery = {
          query: `
              query Users {
                  users {
                      username
                  }
              }
          `
        }

        const response = await client(getUserQuery)

        const rows = await prismaClient.user.count()

        expect(response.status).toBe(200)
        expect(response.body.data?.users.length).toBe(rows)
      })
    })
  })

  describe('mutation', () => {
    describe('create user', () => {
      it('happy flow', async () => {
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

        const response = await client(createUserMutation)

        expect(response.status).toBe(200)
        expect(response.body.errors).toBeUndefined()
        expect(response.body.data?.createUser.username).toBe(createUserMutation.variables.input.username)
      })

      it('wrong input returns error', async () => {
        const wrongMutation = {
          query: `
              mutation CreateUser($input: CreateUserInput!) {
                  createUser(input: $input) {
                      username
                  }
              }
          `,
          variables: {
            'input': {
              'username': getRandomString()
            }
          }
        }

        const response = await client(wrongMutation)

        expect(response.status).toBe(200)
        expect(response.body.errors.length).toBeGreaterThanOrEqual(1)
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

      it('happy flow', async () => {
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

        const response = await client(updateUserMutation)

        expect(response.status).toBe(200)
        expect(response.body.errors).toBeUndefined()
        expect(response.body.data?.updateUser.username).toBe(updateUserMutation.variables.input.username)
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

        const response = await client(updateUserMutationWrong)

        expect(response.status).toBe(200)
        expect(response.body.errors.length).toBeGreaterThanOrEqual(1)
      })
    })

    describe('delete user', () => {
      let id: string

      beforeEach(async () => {
        ({ id } = await CreateRandomUser())
      })

      it('happy flow', async () => {

        const deleteUserMutation = {
          query: `
              mutation DeleteUser($deleteUserId: ID!) {
                  deleteUser(id: $deleteUserId) {
                      success
                  }
              }
          `,
          variables: {
            'deleteUserId': id
          }
        }

        const response = await client(deleteUserMutation)

        expect(response.status).toBe(200)
        expect(response.body.errors).toBeUndefined()
        expect(response.body.data?.deleteUser.success).toBe(true)
        const record = await prismaClient.user.findUnique({ where: { id } })
        expect(record).toBeNull()
      })

      it('wrong id returns error', async () => {

        const deleteUserMutationWrong = {
          query: `
              mutation DeleteUser($deleteUserId: ID!) {
                  deleteUser(id: $deleteUserId) {
                      success
                  }
              }
          `,
          variables: {
            'deleteUserId': id + 'a'
          }
        }

        const response = await client(deleteUserMutationWrong)

        expect(response.status).toBe(200)
        expect(response.body.errors).toBeUndefined()
        expect(response.body.data?.deleteUser.success).toBe(false)
        const record = await prismaClient.user.findUnique({ where: { id } })
        expect(record).not.toBeNull()
      })
    })
  })
})
