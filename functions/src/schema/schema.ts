import { gql } from "apollo-server-cloud-functions";

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  # custom scalar to define a JSON object
  scalar JSON
  # custom scalar to define a Date
  scalar Date
  scalar DateTime

  type Query {
    #### Patient #####
    getPatient(id: String!): Patient! @auth(requires: [therapist, patient])
    getPatientsOfTherapistNext(afterDocID: String, perPage: Int!, id: String!, name: String): [Patient]! @auth(requires: [therapist])
    getPatientsOfTherapistPrevious(beforeDocID: String, perPage: Int!, id: String!, name: String): [Patient]! @auth(requires: [therapist])
    
    #### Therapist #####
    getTherapist(id: String!): Therapist! @auth(requires: [therapist, patient])
    getTherapistsOfPatient(id: String!): [Therapist]! @auth(requires: [therapist, patient])

    #### TASKS #####
    getTasksOfPatients(nr_patients: Int!, nr_tasks_per_patient: Int!, gender: Gender, bd_gt: Date, bd_lt: Date, condition: String): [[Task]!]! @auth(requires: [therapist, student])
    
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
    birthdate: Date!
    address: String!
    condition: String!
    telephone: String!
    gender: Gender!
  }

  input TherapistInput {
    name: String!
    birthdate: Date!
    address: String!
    telephone: String!
  }

  input TaskInput {
    type: ProjectType!
    task: JSON!
  }

  input TodoInput {
    type: ProjectType!
    deadline: DateTime!
    todo: JSON!
  }

  #### TYPES ####
  type Therapist @auth(requires: [patient, therapist]){
    id: String!
    name: String!
    birthdate: Date! 
    address: String!
    telephone: String!
  }

  type Patient @auth(requires: [patient, therapist]){
    id: String!
    name: String!
    birthdate: Date! 
    address: String!
    condition: String!
    telephone: String!
    gender: Gender!
    therapists: [Therapist]!
    tasks: [Task]!
    task(taskId: String!): Task!
    todos: [Todo]!
    todo(todoId: String!): Todo!
  }

  type Task @auth(requires: [patient, therapist, student]){
    id: String!
    type: ProjectType!
    dateCreated: DateTime!
    task: JSON!
  }

  type Todo @auth(requires: [patient, therapist]){
    id: String!
    type: ProjectType!
    dateCreated: DateTime!
    deadline: DateTime!
    todo: JSON!
  }

  enum Gender {
    M
    V
    X
  }
`;

export { typeDefs as types };