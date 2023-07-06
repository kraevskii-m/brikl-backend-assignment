import gql from 'graphql-tag'

export const typeDefs = gql`
    type Task {
        title: String
    }
    
    type TaskList {
        title: String
        tasks: [Task!]
    }
    
    type MutationResult {
        success: Boolean!
    }

    input CreateTaskInput {
        title: String
    }

    type Query {
        retrieveLists: [TaskList!]!
    }

    type Mutation {
        createTaskList(title: String!): TaskList!,
        createTask(input: CreateTaskInput!): MutationResult!
    }
`
