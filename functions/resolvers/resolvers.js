const GraphQLJSON = require("graphql-type-json");

// Provide resolver functions for your schema fields
const resolvers = {
  JSON: GraphQLJSON,
  Query: {
      getPatient: async (_source, args, { dataSources }) => {
        return dataSources.usersAPI.getPatient(args); 
      },
      getPatientsOfTherapist: async(_source, args, { dataSources }) => {
        return dataSources.usersAPI.getPatients(args);
      }
    },
    Mutation: {
      createPatient: async (_source, args, { dataSources }) => {
          return dataSources.usersAPI.addPatient(args);
      }
    }
  };

  exports.resolvers = resolvers;