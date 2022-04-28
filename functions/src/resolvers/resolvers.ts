import { GraphQLDate, GraphQLJSON, GraphQLDateTime } from "graphql-scalars";
import { Gender } from "../utils/enums";
import type { Context, Filter, PageDetails } from "../utils/types";

// The resolvers object is a chain that is traversed for each query starting at the query/mutation object
// The following (not working) query is processed like this
//     query patient {
//       name
//       tasks
//     }
// Resolver chain:
//    Query.patient
//    Patient.tasks
// For the name field there is no extra resolver is defined so the default is used ( => use the value available in the current object else return null)
// The args argument in each function corresponds to the arguments given in the schema for this object
// The _source argument in each function contains the elements that were retrieved earlier in the resolver chain
 
// Provide resolver functions for your schema fields
export const resolvers = {
  // custom scalar resolver from graphql-type-json (https://github.com/taion/graphql-type-json)
  JSON: GraphQLJSON,
  Date: GraphQLDate,
  DateTime: GraphQLDateTime,
  //----- Patient resolvers, for fields that are not default types
  Patient: {
    therapists: async(_source: any, args: any, context: Context): Promise<any> => {
      const dataSources = context.dataSources;
      return _source.therapists.map((thera: any) => dataSources.usersAPI.getTherapist(thera));
    },
    task: async(_source: any, args: { taskId: string; }, context: Context): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.getTaskOfPatient(_source.id, args.taskId);
    },
    tasks: async(_source: any, args: { pagination: PageDetails; type: string; filter: Filter; }, context: Context): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.getTasksOfPatient(_source.id, args.pagination, args.type, args.filter);
    },
    todo: async(_source: any, args: { todoId: string; }, context: Context): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.getTodoOfPatient(_source.id, args.todoId);
    },
    todos: async(_source: any, args: { pagination: PageDetails; type: string; filter: Filter; }, context: Context): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.getTodosOfPatient(_source.id, args.pagination, args.type, args.filter);
    },
  },
  Therapist: {
    patients: async(_source: any, args: { pagination: PageDetails; name: string; }, context: Context): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.getPatientsOfTherapist(_source.id, args.pagination, args.name)
    },
  },
  Query: {
    //----- Patients 
    patient: async(_source: any, args: { id: string; }, context: Context): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.getPatient(args.id);
    },
    patientsOfTherapist: async(_source: any, args: { id: string; pagination: PageDetails; name: string; }, context: Context): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.getPatientsOfTherapist(args.id, args.pagination, args.name);
    },
    //----- Therapists
    therapist: async(_source: any, args: { id: string; }, context: Context): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.getTherapist(args.id); 
    },
    therapistsOfPatient: async(_source: any, args: { id: string; }, context: Context): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.getTherapistsOfPatient(args.id); 
    },
    //----- Tasks
    tasksOfPatients: async(_source: any, args: { nr_patients: number; bd_lt: any; bd_gt: any; condition: string; gender: Gender; nr_tasks_per_patient: number; type: string; }, context: Context): Promise<any> => {
      const dataSources = context.dataSources;
      const patientIDs =  await dataSources.usersAPI.getPatientsIDs(args.nr_patients, { bd_lt: args.bd_lt, bd_gt: args.bd_gt }, args.condition, args.gender);
      return await dataSources.medAPI.getTasks(patientIDs, args.nr_tasks_per_patient, args.type);
    },
  },
  Mutation: {
    //---- Patients 
    createPatient: async(_source: any, args: { patientInfo: any; }, context: Context): Promise<string> => {
      const user = context.user;
      const dataSources = context.dataSources;
      return dataSources.usersAPI.createPatient(args.patientInfo, user);
    },
    updatePatient: async(_source: any, args: { patientInfo: any; id: string; }, context: Context): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.updatePatient(args.patientInfo, args.id);
    },
    deletePatient: async(_source: any, args: { id: string; }, context: Context): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.deletePatient(args.id);
    },
    //---- Therapists
    updateTherapist: async(_source: any, args: { therapistInfo: any; id: string; }, context: Context): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.updateTherapist(args.therapistInfo, args.id);
    },
    deleteTherapist: async(_source: any, args: { id: string; }, context: Context): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.deleteTherapist(args.id);
    },
    //---- Tasks
    addTask: async(_source: any, args: { id: string; taskInfo: any; }, context: Context): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.addTaskToPatient(args.id, args.taskInfo);
    },
    updateTask: async(_source: any, args: { id: string; taskId: string; taskInfo: any; }, context: Context): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.updateTaskOfPatient(args.id, args.taskId, args.taskInfo); 
    },
    deleteTask: async(_source: any, args: { id: string; taskId: string; }, context: Context): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.deleteTaskOfPatient(args.id, args.taskId);
    },
    //---- Todos
    addTodo: async(_source: any, args: { id: string; todoInfo: any; }, context: Context): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.addTodoToPatient(args.id, args.todoInfo);
    },
    updateTodo: async(_source: any, args: { id: string; todoId: string; todoInfo: any; }, context: Context): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.updateTodoOfPatient(args.id, args.todoId, args.todoInfo); 
    },
    deleteTodo: async(_source: any, args: { id: string; todoId: string; }, context: Context): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.deleteTodoOfPatient(args.id, args.todoId);
    }
  }
  };