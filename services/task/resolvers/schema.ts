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
        taskListId: Int!
    }

    type TaskList {
        id: Int!
        title: String!
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

    input UpdateTaskListInput {
        title: String
    }

    type Query {
        taskList(id: Int!): TaskList
        taskLists: [TaskList!]!
        task(id: Int!): Task
        tasks: [Task!]!
    }

    type Mutation {
        createTaskList(title: String!): TaskList!,
        createTask(input: CreateTaskInput!): Task!
        updateTask(id: Int!, input: UpdateTaskInput!): Task!
        updateTaskList(id: Int!, input: UpdateTaskListInput!): TaskList!
        deleteTask(id: Int!): MutationResult!
        deleteTaskList(id: Int!): MutationResult!
        moveTask(id: Int!, position: Int!): Task!
    }
`
