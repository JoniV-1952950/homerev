const { getAuth } = require("firebase-admin/auth");
const GraphQLJSON = require("graphql-type-json");

// Provide resolver functions for your schema fields
const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    //----- Test endpoint
    hello: async(_source, args, { user, dataSources }) => {
      return "hello world";
    }, 
    //----- Patients
    getPatient: async (_source, args, { user, dataSources }) => {
      return dataSources.usersAPI.getPatient(args); 
    },
    getPatientsOfTherapist: async(_source, args, { user, dataSources }) => {
      return dataSources.usersAPI.getPatientsOfTherapist(args);
    },
    //----- Therapist
    getTherapist: async(_source, args, { user, dataSources }) => {
      return dataSources.usersAPI.getTherapist(args); 
    },
    getTherapistsOfPatient: async(_source, args, { user, dataSources }) => {
      return dataSources.usersAPI.getTherapistsOfPatient(args); 
    },
    //----- Tasks
    getTaskOfPatient: async(_source, args, { user, dataSources }) => {
      return dataSources.medAPI.getTask(args);
    },
    getTasksOfPatient: async(_source, args, { user, dataSources }) => {
      return dataSources.medAPI.getTasks(args);
    },
    //----- Todos
    getTodoOfPatient: async(_source, args, { user, dataSources }) => {
      return dataSources.medAPI.getTodo(args);
    },
    getTodosOfPatient: async (_source, args, { user, dataSources }) => {
      return dataSources.medAPI.getTodos(args); 
    }
  },
  Mutation: {
    //---- Patients 
    createPatient: async (_source, args, { user, dataSources }) => {
      return dataSources.usersAPI.createPatient(args, user);
    },
    //---- Tasks
    addTask: async (_source, args, { user, dataSources }) => {
      return dataSources.medAPI.addTask(args);
    },
    updateTask: async (_source, args, { user, dataSources }) => {
      return dataSources.medAPI.updateTask(args); 
    },
    deleteTask: async (_source, args, {user, dataSources }) => {
      return dataSources.medAPI.deleteTask(args);
    },
    //---- Todos
    addTodo: async (_source, args, { user, dataSources }) => {
      return dataSources.medAPI.addTodo(args);
    },
    updateTodo: async (_source, args, { user, dataSources }) => {
      return dataSources.medAPI.updateTodo(args); 
    },
    deleteTodo: async (_source, args, {user, dataSources }) => {
      return dataSources.medAPI.deleteTodo(args);
    }
  }
  };

  exports.resolvers = resolvers;