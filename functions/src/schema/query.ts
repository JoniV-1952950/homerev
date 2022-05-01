import { gql } from "apollo-server-cloud-functions";

export const queries = gql`
  # custom scalar to define a JSON object
  scalar JSON
  # custom scalars to define a Date(Time)
  scalar Date
  scalar DateTime
  
  "Input element for pagination"
  input Pagination {
    "Specifies whether to search for the next page or the previous one. Only use when pagination is possible => when not dealing with a list of items in a list of items"
    next: Boolean
    """
    The document ID from where to start. Is only used when next is true. Only use when pagination is possible => when not dealing with a list of items in a list of items
    """
    afterDocID: String, 
    """
    The document ID where to end at. Is only used when next is false. Only use when pagination is possible => when not dealing with a list of items in a list of items
    """
    beforeDocID: String,
    "Specifies the number of elements to get per page"
    perPage: Int!,
  }

  "All types of operators to do queries with"
  enum Operator {
    "Less than"
    lt
    "Greater than"
    gt
    "Less than or equal to"
    lte
    "Greater than or equal to"
    gte
    "Equal to"
    eq
    "Not equal to"
    neq
    "Returns only the elements that contain this in an array"
    arr_contains
    "Returns only the elements that are in the given array"
    in
    "Returns only the elements that are not in the given array"
    not_in
  }

  "All types scalars a query can be done with"
  enum FilterType {
    "String type"
    String
    "Int type"
    Int
    "Float type"
    Float
    "Boolean"
    Boolean
    "Date"
    Date
    "DateTime"
    DateTime
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

  "Input type for a filter"
  input Filter{
    """
    Contains the name of the field you want to filter. Must be in the format: "object.field". e.g. "task.score" 
    """
    field: String!,
    "Can be any of type Operator. These determine the comparison made. For more info on these check https://firebase.google.com/docs/firestore/query-data/queries"
    operator: Operator!,
    "The value to compare to. If this is supposed to be an array, separate the elements by a ','. Boolean is 'true' or 'false'"
    value: String!,
    "The type of the given value"
    type: FilterType!,
    "Defines if the the given value is an array of values or not"
    array: Boolean!
  }

  """
  The Query type is a special type that defines the entry point of every GraphQL Query.
  NOTE about the roles: 
    - the therapist role can only access their own patients information, and their own information
    - the patient role can only access their own information, and the information of their therapist
    - the student role can only access the medical data, but not the personal information
  """
  type Query {
    #### Patient #####
    "Gets a patient, requires role: therapist or patient"
    patient(
      "The uid of the patient you are looking for"
      id: String!
    ): Patient! @auth(requires: [therapist, patient])
    "Gets all the patients of a therapist, requires role: therapist"
    patientsOfTherapist(
      "Pagination input, can be for a next pagina or a previous one"
      pagination: Pagination!,
      "The uid of the therapist"
      id: String!, 
      "The name of the patient you are looking for (can be a prefix)"
      name: String
    ): [Patient]! @auth(requires: [therapist])    
    #### Therapist #####
    "Gets a therapist, requires role: therapist or patient"
    therapist(
      "The uid of the therapist"
      id: String!
    ): Therapist! @auth(requires: [therapist, patient])
    "Gets all the therapists of a patient"
    therapistsOfPatient(
      "The uid of the patient"
      id: String!
    ): [Therapist]! @auth(requires: [therapist, patient])

    #### TASKS #####
    "Gets all the tasks of all the patients that satisfy the constraints, requires role: therapist or student"
    tasksOfPatients(
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
    "The email address of the therapist"
    email: String!
    "The telephone number of the therapist"
    telephone: String!
    "Gets all the patients of a therapist (equals next page request)"
    patients(
      "Pagination input, can be for a next pagina or a previous one"
      pagination: Pagination!,
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
    "The email address of the patient"
    email: String!
    "The gender of the patient"
    gender: Gender!
    "The therapists of the patient"
    therapists: [Therapist]!
    "The tasks of a patient"
    tasks(
      "Pagination input, can be for a next pagina or a previous one"
      pagination: Pagination!,
      "The type of the task you are looking for"
      type: ProjectType,
      "This filters the data using fields in the task object"
      filter: Filter
    ): [Task]!
    "A task with a specific id of a patient"
    task(
      "The id of the task"
      taskId: String!
    ): Task!
    "The todos of the patient"
    todos(
      "Pagination input, can be for a next pagina or a previous one"
      pagination: Pagination!,
      "The type of the todo you are looking for"
      type: ProjectType,
      "This filters the data using fields in the todo object"
      filter: Filter
    ): [Todo]!
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
  `;