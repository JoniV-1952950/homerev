// import firebase dependencies
import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import { getAuth } from "firebase-admin/auth";

// init firebase default app (homerev-users)
admin.initializeApp(); 

// import apollo dependencies
import { ApolloServer } from 'apollo-server-cloud-functions';
import { ApolloServerPluginLandingPageGraphQLPlayground, AuthenticationError } from 'apollo-server-core';
import { makeExecutableSchema } from '@graphql-tools/schema';

// import own modules
import { UsersAPI } from './datasources/users';
import { MedAPI } from './datasources/med';
import { mutations } from './schema/mutation';
import { queries } from './schema/query';
import { resolvers } from './resolvers/resolvers';
import { authDirective } from './schema/auth'; 
import { Variables } from "./utils/variables";

// javascript immediately invoked function to not have the need for top level await
(async function() {

  // get the authdirective to merge it with the schema soon
  const { authDirectiveTypeDefs, authDirectiveTransformer } = authDirective();

  // create dataSources object
  const dataSources = () => ({
      usersAPI: new UsersAPI(),
      medAPI: new MedAPI()
  });
  
  // get the project types
  const projectTypesArr = ["bimanueel", "VR"] // await dataSources().medAPI.getProjectTypes(); // still doesn't work, no errors but the function does not get deployed by firebase
  let projectTypes = `enum ProjectType {`;
  for(const projectType of projectTypesArr) {
    projectTypes += projectType + `,`;
  }
  projectTypes += `}`; 

  // create schema, using type definitions in schema.ts, auth directive declaration from auth.ts, projectTypes enum and the resolvers
  let schema = makeExecutableSchema({
    typeDefs: [
      authDirectiveTypeDefs,
      queries,
      mutations,
      projectTypes
    ],
    resolvers,
  });
  // transform the schema so that the auth directive is implemented
  schema = authDirectiveTransformer(schema);

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
        if(req.body.operationName != Variables.INTRO_QUERY)
          functions.logger.info("Access by " + userVerified.uid + ' (role: ' + userVerified.role +')', req.body);
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

  // creates the firebase function, runWith sets the secret from google secret manager to process.env.??. it contains the service account for the second database
  exports.v1 = functions.runWith({ secrets: [Variables.FIREBASE_SERVICE_ACCOUNT_GSM] }).region(Variables.REGION_GRAPHQL).https.onRequest(server.createHandler() as any);
})()

// On sign up.
exports.processSignUp = functions.region(Variables.REGION_SIGNUP_PROCESS).auth.user().onCreate(async (user) => {
  // Check if user meets role criteria.
  if (user.providerData[0].providerId == 'password')
    return;
  if (
    user.email &&
    user.email.endsWith(Variables.STUDENT_EMAIL_SUFFIX) &&
    user.emailVerified 
  ) {
    const customClaims = {
      role: Variables.STUDENT_ROLE
    };
  try {
    // Set custom user claims on this newly created user.
    await getAuth().setCustomUserClaims(user.uid, customClaims);

    } catch (error) {
      console.log(error);
    }
  }
  else {
    try {
      // delete the user
      await getAuth().deleteUser(user.uid);
  
      } catch (error) {
        console.log(error);
      }
    }
  });
