const { gql } = require("apollo-server-cloud-functions");


// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  scalar JSON

  type Query {
    getPatient(id: String!): Patient! @auth(requires: [therapist, patient])
    getPatientsOfTherapist(id: String!): [Patient]! @auth(requires: [therapist])
    getTaskOfPatient(id: String!): [Task]! @auth(requires: [therapist, patient])
  }

  type Mutation {
      createPatient(
        email: String!, 
        password: String!, 
        name: String!, 
        birthdate: String!, 
        address: String!, 
        condition: String!, 
        telephone: String!,
        therapist: String!
      ): String @auth(requires: [therapist]) ##gives the id of the user just created
      addPatient(id: String!): String @auth(requires:[therapist])
  }

  type Therapist @auth(requires: [patient, therapist]){
    name: String!
    birthdate: String! 
    address: String!
    telephone: String!
  }

  type Patient @auth(requires: [patient, therapist]){
    name: String!
    birthdate: String! 
    address: String!
    condition: String!
    telephone: String!
    therapist: String!
  }

  type Task @auth(requires: [patient, therapist]){
    title: String!
    date: String!
    task: JSON!
  }
`;

exports.types = typeDefs;