// import firebase dependencies
import functions = require("firebase-functions");
import admin = require('firebase-admin');
import { getAuth } from "firebase-admin/auth";

// init firebase default app (homerev-users)
admin.initializeApp(); 

// init logger

// import apollo dependencies
import { ApolloServer } from 'apollo-server-cloud-functions';
import { ApolloServerPluginLandingPageGraphQLPlayground, AuthenticationError } from 'apollo-server-core';
import { makeExecutableSchema } from '@graphql-tools/schema';

// import own modules
import { UsersAPI } from './datasources/users';
import { MedAPI } from './datasources/med';
import { types } from './schema/schema';
import { resolvers } from './resolvers/resolvers';
import { authDirective } from './schema/auth'; 
const { authDirectiveTypeDefs, authDirectiveTransformer } = authDirective('auth');

// create dataSources object
const dataSources = () => ({
    usersAPI: new UsersAPI(),
    medAPI: new MedAPI()
});

// create schema, using type definitions in schema.ts, auth directive declaration from auth.ts, and the resolvers
let schema = makeExecutableSchema({
  typeDefs: [
    authDirectiveTypeDefs,
    types
  ],
  resolvers,
});
// transform the schema so that the auth directive is implemented
schema = authDirectiveTransformer(schema)

// create the server with the schema, dataSources and the context
const server = new ApolloServer({
  schema,
  context: async ({ req }) => {
    
    // get the token from the authorization header, or return an empty string
    const token = req.headers.authorization || '';
    // if no token throw authentication error
    if(token == "") 
      throw new AuthenticationError("No token provided");
    // try to verify the token, and return a user object
    try {
      const userVerified = await getAuth().verifyIdToken(token);
      
      // create log if this is not an introspectionquery
      if(req.body.operationName != "IntrospectionQuery")
        functions.logger.info("Access by " + userVerified.uid, req.body);
      return { 
            user: {
                uid: userVerified.uid,
                role: userVerified.role
            } 
        };
    } catch(error) {
      throw new AuthenticationError("Invalid token");
    }
  },
  // query for the schema? 
  introspection: true, 
  // apollo playground plugin
  plugins: [
    ApolloServerPluginLandingPageGraphQLPlayground(),
  ],
  dataSources, 
});

// creates the firebase function
exports.graphql = functions.runWith({ secrets: ["MED_FIREBASE_SERVICE_ACCOUNT"] }).region('europe-west1').https.onRequest(server.createHandler() as any);

