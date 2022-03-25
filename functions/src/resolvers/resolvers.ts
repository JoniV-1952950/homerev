import { GraphQLJSON } from "graphql-type-json";

// Provide resolver functions for your schema fields
export const resolvers = {
  // custom scalar resolver from graphql-type-json (https://github.com/taion/graphql-type-json)
  JSON: GraphQLJSON,
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
    getPatientsOfTherapist: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.usersAPI.getPatientsOfTherapist(args.id);
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
    getTaskOfPatient: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.getTask(args.id, args.taskId);
    },
    getTasksOfPatient: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.getTasks(args.id);
    },
    //----- Todos
    getTodoOfPatient: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.getTodo(args.id, args.todoId);
    },
    getTodosOfPatient: async(_source: any, args: any, context: any): Promise<any> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.getTodos(args.id); 
    }
  },
  Mutation: {
    //---- Patients 
    createPatient: async(_source: any, args: any, context: any): Promise<string> => {
      const user = context.user;
      const dataSources = context.dataSources;
      return dataSources.usersAPI.createPatient(args, user);
    },
    //---- Tasks
    addTask: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.addTask(args.id, args.taskInfo);
    },
    updateTask: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.updateTask(args.id, args.taskId, args.taskInfo); 
    },
    deleteTask: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.deleteTask(args.id, args.taskId);
    },
    //---- Todos
    addTodo: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.addTodo(args.id, args.todoInfo);
    },
    updateTodo: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.updateTodo(args.id, args.todoId, args.todoInfo); 
    },
    deleteTodo: async(_source: any, args: any, context: any): Promise<string> => {
      const dataSources = context.dataSources;
      return dataSources.medAPI.deleteTodo(args.id, args.todoId);
    }
  }
  };