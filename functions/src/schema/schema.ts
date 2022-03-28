import { gql } from "apollo-server-cloud-functions";

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  # custom scalar to define a JSON object
  scalar JSON

  type Query {
    #### Patient #####
    getPatient(id: String!): Patient! @auth(requires: [therapist, patient])
    getPatientsOfTherapist(id: String!): [Patient]! @auth(requires: [therapist])

    #### Therapist #####
    getTherapist(id: String!): Therapist! @auth(requires: [therapist, patient])
    getTherapistsOfPatient(id: String!): [Therapist]! @auth(requires: [therapist, patient])

    #### TASKS #####
    getTaskOfPatient(id: String!, taskId: String!): Task! @auth(requires: [therapist, patient])
    getTasksOfPatient(id: String!): [Task]! @auth(requires: [therapist, patient])
    
    #### TODOS #####
    getTodoOfPatient(id: String!, todoId: String!): Todo! @auth(requires: [therapist, patient])
    getTodosOfPatient(id: String!): [Todo]! @auth(requires: [therapist, patient])
    hello: String!
  }

  type Mutation {
    #### Patients ####
    createPatient(patientInfo: PatientInput!): String @auth(requires: [therapist]) ##gives the id of the user just created
    updatePatient(id: String!, patientInfo: PatientInput!): String @auth(requires: [patient, therapist])
    deletePatient(id: String!): String @auth(requires: [patient, therapist])
    
    #### Therapist ####
    updateTherapist(id: String!, therapistInfo: TherapistInput!): String @auth(requires: [therapist])
    deleteTherapist(id: String!): String @auth(requires: [therapist])

    #### Tasks ####
    addTask(id: String!, taskInfo: TaskInput!): String @auth(requires: [patient]) 
    updateTask(id: String!, taskId: String!, taskInfo: TaskInput!): String @auth(requires: [patient])
    deleteTask(id: String!, taskId: String!): String @auth(requires: [patient, therapist])

    #### Todos ####
    addTodo(id: String!, todoInfo: TodoInput!): String @auth(requires: [therapist]) 
    updateTodo(id: String!, todoId: String!, todoInfo: TodoInput!): String @auth(requires: [therapist])
    deleteTodo(id: String!, todoId: String!): String @auth(requires: [patient, therapist])
  }

  #### INPUTS ####
  input PatientInput {
    email: String!
    password: String!
    name: String!
    birthdate: String!
    address: String!
    condition: String!
    telephone: String!
  }

  input TherapistInput {
    name: String!
    birthdate: String!
    address: String!
    telephone: String!
  }

  input TaskInput {
    title: String!
    task: JSON!
  }

  input TodoInput {
    title: String!
    deadline: String!
    todo: JSON!
  }

  #### TYPES ####
  type Therapist @auth(requires: [patient, therapist]){
    id: String!
    name: String!
    birthdate: String! 
    address: String!
    telephone: String!
  }

  type Patient @auth(requires: [patient, therapist]){
    id: String!
    name: String!
    birthdate: String! 
    address: String!
    condition: String!
    telephone: String!
    therapists: [Therapist]!
    tasks: [Task]!
    task(taskId: String!): Task!
    todos: [Todo]!
    todo(todoId: String!): Todo!
  }

  type Task @auth(requires: [patient, therapist]){
    id: String!
    title: String!
    dateCreated: String!
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

export { typeDefs as types };