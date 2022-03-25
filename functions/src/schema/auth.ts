import { GraphQLSchema } from "graphql";
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { ForbiddenError } from 'apollo-server-core';
import { defaultFieldResolver } from 'graphql';

// https://www.graphql-tools.com/docs/schema-directives#enforcing-access-permissions
export function authDirective(directiveName: string) {
    const typeDirectiveArgumentMaps: Record<string, any> = {};
    return {
        authDirectiveTypeDefs: `directive @${directiveName}(
        requires: [Role],
        ) on OBJECT | FIELD_DEFINITION
        
        ## defined roles:
        enum Role {
            patient
            therapist
            admin
        }`,
        authDirectiveTransformer: (schema: GraphQLSchema) =>
        mapSchema(schema, {
            [MapperKind.TYPE]: (type: any) => {
                const authDirective = getDirective(schema, type, directiveName)?.[0];
                if (authDirective)
                    typeDirectiveArgumentMaps[type.name] = authDirective;
                return undefined;
            },
            [MapperKind.OBJECT_FIELD]: (fieldConfig: any, _fieldName: any, typeName: any) => {
                const authDirective =
                    getDirective(schema, fieldConfig, directiveName)?.[0] ?? typeDirectiveArgumentMaps[typeName];
                if (authDirective) {
                    const { requires } = authDirective;
                    if (requires) {
                        const { resolve = defaultFieldResolver } = fieldConfig;
                        // start of custom auth logic
                        fieldConfig.resolve = async function (source: any, args: any, context: any, info: any) {
                            // get the current user from the context
                            const user = context.user;
                            // if this users role is not in the required throw forbiddenerror
                            if (!requires.includes(user.role))
                                throw new ForbiddenError('This user is not authorized');
                            //if source is undefined (=> no request was permitted earlier), so check permissions
                            if (source == null) { 
                                //if this user is a patient 
                                if (user.role == 'patient') { 
                                    //check if request has a specified id, if requested id != current user, and the id is not the current users therapist => deny
                                    if (args.id && (args.id != user.uid && !(await context.dataSources.usersAPI.isTherapistOfPatient(args.id, user.uid)))) 
                                        throw new ForbiddenError('This user is not authorized');
                                }
                                //if this user is a therapist
                                else if (user.role == 'therapist') { 
                                    //check if request has a specified id, if requested id != current user, and the id is not the current users patient => deny
                                    if (args.id && (args.id != user.uid && !(await context.dataSources.usersAPI.isTherapistOfPatient(user.uid, args.id)))) 
                                        throw new ForbiddenError('This user is not authorized');
                                }
                            }
                            // return the default resolve function defined in resolvers
                            return resolve(source, args, context, info);
                        }   
                        return fieldConfig;
                    }
                }
            }
        })
    }
}