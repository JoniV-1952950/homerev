const { gql } = require("apollo-server-cloud-functions");


// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  scalar JSON

  type Query {
    #### Patient #####
    getPatient(id: String!): Patient! @auth(requires: [therapist, patient])
    getPatientsOfTherapist(id: String!): [Patient]! @auth(requires: [therapist])

    #### Therapist #####
    getTherapist(id: String!): Therapist! @auth(requires: [therapist, patient]) ## TODO
    getTherapistsOfPatient(id: String!): [Therapist]! @auth(requires: [therapist, patient]) ## TODO

    #### TASKS #####
    getTaskOfPatient(id: String!, taskId: String!): Task! @auth(requires: [therapist, patient])
    getTasksOfPatient(id: String!): [Task]! @auth(requires: [therapist, patient])
    
    #### TODOS #####
    getTodoOfPatient(id: String!, ): Todo! @auth(requires: [therapist, patient])
    getTodosOfPatient(id: String!): [Todo]! @auth(requires: [therapist, patient])
    hello: String!
  }

  type Mutation {
    ##### Patients ####
    createPatient(patientInfo: PatientInput!): String @auth(requires: [therapist]) ##gives the id of the user just created
    updatePatient(id: String!, patientInfo: PatientInput!): String @auth(requires: [patient, therapist]) #### todo
    deletePatient(id: String!): String @auth(requires: [patient, therapist]) #### todo
    
    #### Tasks ####
    addTask(id: String!, taskInfo: TaskInput!): String @auth(requires: [patient]) 
    updateTask(id: String!, taskId: String!, taskInfo: TaskInput!): String @auth(requires: [patient])
    deleteTask(id: String!, taskId: String!): String @auth(requires: [patient, therapist])

    #### Todos ####
    addTodo(id: String!, todoInfo: TodoInput!): String @auth(requires: [therapist]) 
    updateTodo(id: String!, todoId: String!, todoInfo: TodoInput!): String @auth(requires: [therapist])
    deleteTodo(id: String!, todoId: String!): String @auth(requires: [patient, therapist])
  }

  input PatientInput {
    email: String!
    password: String!
    name: String!
    birthdate: String!
    address: String!
    condition: String!
    telephone: String!
  }

  input TaskInput {
    title: String!
    date: String!
    task: JSON!
  }

  input TodoInput {
    title: String!
    deadline: String!
    dateCreated: String!
    todo: JSON!
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
    therapist: [String]!
  }

  type Task @auth(requires: [patient, therapist]){
    id: String!
    title: String!
    date: String!
    task: JSON!
  }

  type Todo @auth(requires: [patient, therapist]){
    id: String!
    title: String!
    dateCreated: String!
    deadline: String!
    todo: JSON!
  }
`;

exports.types = typeDefs;