import { gql } from "apollo-server-cloud-functions";

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  # custom scalar to define a JSON object
  scalar JSON
  # custom scalars to define a Date(Time)
  scalar Date
  scalar DateTime

  """
  The Query type is a special type that defines the entry point of every GraphQL Query.
  NOTE about the roles: 
    - the therapist role can only access there own patients information, and their own information
    - the patient role can only access there own information, and the information of their therapist
    - the student role can only access the medical data, but not the personal information
  """
  type Query {
    #### Patient #####
    "Gets a patient, requires role: therapist or patient"
    getPatient(
      "The uid of the patient you are looking for"
      id: String!
    ): Patient! @auth(requires: [therapist, patient])
    "Gets all the patients of a therapist (equals next page request), requires role: therapist"
    getPatientsOfTherapistNext(
      """
      The document ID from where to start (the last document from the previous page)
      If not specified, the results start at the beginning. 
      """
      afterDocID: String, 
      "Specifies the number of patients to get per page"
      perPage: Int!, 
      "The uid of the therapist"
      id: String!, 
      "The name of the patient you are looking for (can be a prefix)"
      name: String
    ): [Patient]! @auth(requires: [therapist])
    "Gets all the patients of a therapist (equals previous page request), requires role: therapist"
    getPatientsOfTherapistPrevious(
      """
      The document ID from the document where to end (the first document from the next page)
      If not specified, the results start at the beginning. 
      """
      beforeDocID: String, 
      "Specifies the number of patients to get per page"
      perPage: Int!, 
      "The uid of the therapist"
      id: String!, 
      "The name of the patient you are looking for (can be a prefix)"
      name: String
      ): [Patient]! @auth(requires: [therapist])
    
    #### Therapist #####
    "Gets a therapist, requires role: therapist or patient"
    getTherapist(
      "The uid of the therapist"
      id: String!
    ): Therapist! @auth(requires: [therapist, patient])
    "Gets all the therapists of a patient"
    getTherapistsOfPatient(
      "The uid of the patient"
      id: String!
    ): [Therapist]! @auth(requires: [therapist, patient])

    #### TASKS #####
    "Gets all the tasks of all the patients that satisfy the constraints, requires role: therapist or student"
    getTasksOfPatients(
      "The number of patients to retrieve"
      nr_patients: Int!, 
      "The number of tasks to retrieve per patient"
      nr_tasks_per_patient: Int!, 
      "The gender of the patients you are looking for"
      gender: Gender, 
      "The minimum birthdate of the patients you are looking for"
      bd_gt: Date, 
      "The maximum birthdate of the patients you are looking for"
      bd_lt: Date, 
      "The condition of the patients you are looking for"
      condition: String,
      "The type of the tasks you are looking for"
      type: ProjectType
    ): [[Task]!]! @auth(requires: [therapist, student])
    
    hello: String!
  }

  type Mutation {
    #### Patients ####
    """
    Create a new patient, the new patients therapist will be the therapist creating the patient.
    Returns the uid of the new patient
    Requires role: therapist
    """
    createPatient(
      "The information of the new patient"
      patientInfo: PatientInput!
    ): String @auth(requires: [therapist])
    """
    Update a patients personal information.
    Returns the uid of the patient
    Requires role: therapist or patient
    """
    updatePatient(
      "The uid of the patient to update"
      id: String!, 
      "The information of the patient"
      patientInfo: PatientInput!
    ): String @auth(requires: [patient, therapist])
    """
    Delete a patient.
    Returns the uid of the patient
    Requires role: therapist or patient
    """
    deletePatient(
      "The uid of the patient to delete"
      id: String!
    ): String @auth(requires: [patient, therapist])
    
    #### Therapist ####
    """
    Update a therapists personal information.
    Returns the uid of the therapist
    Requires role: therapist
    """
    updateTherapist(
      "The uid of the therapist to update"
      id: String!, 
      "The therapist information"
      therapistInfo: TherapistInput!
    ): String @auth(requires: [therapist])
    """
    Delete a therapist.
    Returns the uid of the therapist
    Requires role: therapist
    """
    deleteTherapist(
      "The uid of the therapist to delete"
      id: String!
    ): String @auth(requires: [therapist])

    #### Tasks ####
    """
    Add a task to a patient.
    Returns the id of the task just created
    Requires role: patient
    """
    addTask(
      "The uid of the patient to add a task to"
      id: String!, 
      "The task information"
      taskInfo: TaskInput!
    ): String @auth(requires: [patient]) 
    
    """
    Update a task of a patient.
    Returns the id of the task
    Requires role: patient
    """
    updateTask(
      "The uid of the patient"
      id: String!, 
      "The id of the task"
      taskId: String!, 
      "The task information"
      taskInfo: TaskInput!
    ): String @auth(requires: [patient])
    """
    Delete a task of a patient.
    Returns the id of the task
    Requires role: therapist or patient
    """
    deleteTask(
      "The uid of the patient"
      id: String!, 
      "The id of the task"
      taskId: String!
    ): String @auth(requires: [patient, therapist])

    #### Todos ####
    """
    Add a todo to a patient.
    Returns the id of the todo
    Requires role: therapist
    """
    addTodo(
      "The uid of the patient"
      id: String!, 
      "The todo information"
      todoInfo: TodoInput!
    ): String @auth(requires: [therapist]) 
    """
    Update a todo of a patient.
    Returns the id of the todo
    Requires role: therapist
    """
    updateTodo(
      "The uid of the patient"
      id: String!, 
      "The id of the todo"
      todoId: String!, 
      "The todo information"
      todoInfo: TodoInput!
    ): String @auth(requires: [therapist])
    """
    Delete a todo. 
    Returns the id of the todo
    Requires role: therapist or patient
    """
    deleteTodo(
      "The uid of the patient"
      id: String!, 
      "The id of the todo"
      todoId: String!
    ): String @auth(requires: [patient, therapist])
  }

  #### INPUTS ####
  "The input object to create/update a patient"
  input PatientInput {
    "The email of the patient"
    email: String!
    "The password of the patient"
    password: String!
    "The name of the patient"
    name: String!
    "The birthdate of the patient (YYYY-MM-dd)"
    birthdate: Date!
    "The address of the patient"
    address: String!
    "The condition of the patient"
    condition: String!
    "The telephone number of the patient"
    telephone: String!
    "The gender of the patient"
    gender: Gender!
  }

  "The input object to update a patient"
  input TherapistInput {
    "The name of the therapist"
    name: String!
    "The birthdate of the therapist (YYYY-MM-dd)"
    birthdate: Date!
    "The address of the therapist"
    address: String!
    "The telephone number of the therapist"
    telephone: String!
  }

  "The input object to create/update a task"
  input TaskInput {
    "The type of the task"
    type: ProjectType!
    "The task information"
    task: JSON!
  }

  "The input object to create/update a todo"
  input TodoInput {
    "The type of the todo"
    type: ProjectType!
    "The deadline of the todo (YYYY-MM-DDTHH:mm:SSZ)"
    deadline: DateTime!
    "The todo information"
    todo: JSON!
  }

  #### TYPES ####
  "The therapist type, requires role: patient or therapist to read"
  type Therapist @auth(requires: [patient, therapist]){
    "The uid of the therapist"
    id: String!
    "The name of the therapist"
    name: String!
    "The birthdate of the therapist (YYYY-MM-DD)"
    birthdate: Date! 
    "The address of the therapist"
    address: String!
    "The telephone number of the therapist"
    telephone: String!
    "Gets all the patients of a therapist (equals next page request)"
    patientsNext(
      """
      The document ID from where to start (the last document from the previous page)
      If not specified, the results start at the beginning. 
      """
      afterDocID: String, 
      "Specifies the number of patients to get per page"
      perPage: Int!, 
      "The name of the patient you are looking for (can be a prefix)"
      name: String
    ): [Patient]!
    "Gets all the patients of a therapist (equals previous page request)"
    patientsPrevious(
      """
      The document ID from the document where to end (the first document from the next page)
      If not specified, the results start at the beginning. 
      """
      beforeDocID: String, 
      "Specifies the number of patients to get per page"
      perPage: Int!, 
      "The name of the patient you are looking for (can be a prefix)"
      name: String
    ): [Patient]!
  }

  "The patient type, requires role: patient or therapist to read"
  type Patient @auth(requires: [patient, therapist]){
    "The uid of the patient"
    id: String!
    "The name of the patient"
    name: String!
    "The birthdate of the patient"
    birthdate: Date! 
    "The address of the patient"
    address: String!
    "The condition of the patient"
    condition: String!
    "The telephone number of the patient"
    telephone: String!
    "The gender of the patient"
    gender: Gender!
    "The therapists of the patient"
    therapists: [Therapist]!
    "The tasks of a patient"
    tasksPrevious(
      """
      The document ID from the document where to end (the first document from the next page)
      If not specified, the results start at the beginning. 
      """
      beforeDocID: String, 
      "The amount of tasks to get"
      perPage: Int!,
      "The type of the task you are looking for"
      type: ProjectType
    ): [Task]!
    "The tasks of a patient"
    tasksNext(
      """
      The document ID from the document where to start (the last document from the previous page)
      If not specified, the results start at the beginning. 
      """
      afterDocID: String, 
      "The amount of tasks to get"
      perPage: Int!,
      "The type of the task you are looking for"
      type: ProjectType
    ): [Task]!
    "A task with a specific id of a patient"
    task(
      "The id of the task"
      taskId: String!
    ): Task!
    "The todos of the patient"
    todos: [Todo]!
    "A todo with a specific id of a patient"
    todo(todoId: String!): Todo!
  }

  "The task type, requires role: patient, therapist or student"
  type Task @auth(requires: [patient, therapist, student]){
    "The id of the task"
    id: String!
    "The type of the task"
    type: ProjectType!
    "The time and date the task was created (YYYY-MM-DDTHH:mm:SSZ)"
    dateCreated: DateTime!
    "The task information"
    task: JSON!
  }

  "The todo type, requires role: patient or therapist"
  type Todo @auth(requires: [patient, therapist]){
    "The id of the todo"
    id: String!
    "The type of the todo"
    type: ProjectType!
    "The time and date the todo was created (YYYY-MM-DDTHH:mm:SSZ)"
    dateCreated: DateTime!
    "The deadline for the todo (YYYY-MM-DDTHH:mm:SSZ)"
    deadline: DateTime!
    "The todo information"
    todo: JSON!
  }

  "Gender enum"
  enum Gender {
    "Male"
    M
    "Female"
    V
    "Unspecified"
    X
  }
`;

export { typeDefs as types };