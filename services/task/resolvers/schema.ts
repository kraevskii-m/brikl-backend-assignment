import gql from 'graphql-tag'

export const typeDefs = gql`
    enum Status {
        CREATED
        COMPLETED
    }

    type Task {
        id: Int!
        title: String!
        status: String!
        order: Float!
    }

    type TaskList {
        id: Int!
        title: String
        tasks: [Task!]
    }

    type MutationResult {
        success: Boolean!
    }

    input CreateTaskInput {
        title: String!
        taskListId: Int!
    }

    input UpdateTaskInput {
        title: String
        status: Status
    }

    type Query {
        retrieveLists: [TaskList!]!
    }

    type Mutation {
        createTaskList(title: String!): TaskList!,
        createTask(input: CreateTaskInput!): Task!
        updateTask(id: Int!, input: UpdateTaskInput!): Task!
        deleteTask(id: Int!): MutationResult!
        deleteTaskList(id: Int!): MutationResult!
    }
`
