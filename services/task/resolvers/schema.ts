import gql from 'graphql-tag'

export const typeDefs = gql`
    type TaskList {
        title: String
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
        createTask(input: CreateTaskInput!): MutationResult!
    }
`
//   type Task {
//   }
//
//   type MutationResult {
//     success: Boolean!
//   }
//
//   type Query {
//   }
//
//   type Mutation {
//   }
// `
