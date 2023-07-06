import gql from 'graphql-tag'

export const typeDefs = gql`
    enum Status {
        CREATED
        COMPLETED
    }

    type Task {
        title: String!
        status: String!
        order: Float!
    }

    type TaskList {
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
    }
`
