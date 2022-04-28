import { gql } from "apollo-server-cloud-functions";

// Construct a schema, using GraphQL schema language
export const mutations = gql`
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
`;
