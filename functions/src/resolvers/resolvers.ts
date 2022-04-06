import { GraphQLDate, GraphQLJSON, GraphQLDateTime } from "graphql-scalars";

// Provide resolver functions for your schema fields
export const resolvers = {
  // custom scalar resolver from graphql-type-json (https://github.com/taion/graphql-type-json)
  JSON: GraphQLJSON,
  Date: GraphQLDate,
  DateTime: GraphQLDateTime,
  //----- Patient resolvers, for fields that are not default types
  Patient: {
    therapists: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return _source.therapists.map((thera: any) => dataSources.usersAPI.getTherapist(thera));
    },
    task: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.getTaskOfPatient(_source.id, args.taskId);
    },
    tasksNext: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.getTasksOfPatient(_source.id, { afterDocID: args.afterDocID, perPage: args.perPage }, args.type);
    },
    tasksPrevious: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.getTasksOfPatient(_source.id, { beforeDocID: args.beforeDocID, perPage: args.perPage }, args.type);
    },
    todo: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.getTodoOfPatient(_source.id, args.todoId);
    },
    todos: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.getTodosOfPatient(_source.id);
    },
  },
  Therapist: {
    patientsNext: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.getPatientsOfTherapist(_source.id, { afterDocID: args.afterDocID, perPage: args.perPage }, args.name)
    },
    patientsPrevious: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.getPatientsOfTherapist(_source.id, { beforeDocID: args.beforeDocID, perPage: args.perPage }, args.name)
    }
  },
  Query: {
    //----- Test endpoint
    hello: async(_source: any): Promise<string> => {
      return "hello world";
    },
    //----- Patients 
    getPatient: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.getPatient(args.id);
    },
    getPatientsOfTherapistNext: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.getPatientsOfTherapist(args.id, { afterDocID: args.afterDocID, perPage: args.perPage }, args.name);
    },
    getPatientsOfTherapistPrevious: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.getPatientsOfTherapist(args.id, { beforeDocID: args.beforeDocID, perPage: args.perPage }, args.name);
    },
    //----- Therapists
    getTherapist: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.getTherapist(args.id); 
    },
    getTherapistsOfPatient: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.getTherapistsOfPatient(args.id); 
    },
    //----- Tasks
    getTasksOfPatients: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      const patientIDs =  await dataSources.usersAPI.getPatientsIDs(args.nr_patients, { bd_lt: args.bd_lt, bd_gt: args.bd_gt }, args.condition, args.gender);
      return await dataSources.medAPI.getTasks(patientIDs, args.nr_tasks_per_patient, args.type);
    },
  },
  Mutation: {
    //---- Patients 
    createPatient: async(_source: any, args: any, context: any): Promise<string> => {
      const user = context.user;
      const dataSources = context.dataSources;
      return dataSources.usersAPI.createPatient(args.patientInfo, user);
    },
    updatePatient: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.updatePatient(args.patientInfo, args.id);
    },
    deletePatient: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.deletePatient(args.id);
    },
    //---- Therapists
    updateTherapist: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.updateTherapist(args.therapistInfo, args.id);
    },
    deleteTherapist: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.deleteTherapist(args.id);
    },
    //---- Tasks
    addTask: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.addTaskToPatient(args.id, args.taskInfo);
    },
    updateTask: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.updateTaskOfPatient(args.id, args.taskId, args.taskInfo); 
    },
    deleteTask: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.deleteTaskOfPatient(args.id, args.taskId);
    },
    //---- Todos
    addTodo: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.addTodoToPatient(args.id, args.todoInfo);
    },
    updateTodo: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.updateTodoOfPatient(args.id, args.todoId, args.todoInfo); 
    },
    deleteTodo: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.deleteTodoOfPatient(args.id, args.todoId);
    }
  }
  };