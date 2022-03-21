const { mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');
const { ForbiddenError } = require('apollo-server-core');
const { defaultFieldResolver } = require('graphql');

function authDirective(directiveName) {
    const typeDirectiveArgumentMaps = {};
    return {
        authDirectiveTypeDefs: `directive @${directiveName}(
        requires: [Role],
        ) on OBJECT | FIELD_DEFINITION

        enum Role {
            patient
            therapist
            admin
        }`,
        authDirectiveTransformer: (schema) =>
        mapSchema(schema, {
            [MapperKind.TYPE]: type => {
                const authDirective = getDirective(schema, type, directiveName)?.[0];
                if (authDirective)
                    typeDirectiveArgumentMaps[type.name] = authDirective;
                return undefined;
            },
            [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {
                const authDirective =
                    getDirective(schema, fieldConfig, directiveName)?.[0] ?? typeDirectiveArgumentMaps[typeName];
                if (authDirective) {
                    const { requires } = authDirective;
                    if (requires) {
                        const { resolve = defaultFieldResolver } = fieldConfig;
                        fieldConfig.resolve = async function (source, args, context, info) {
                            const user = context.user.token;
                            if (!requires.includes(user.role))
                                throw new ForbiddenError('This user is not authorized');
                            if (source == null) { //if source is undefined (=> no request was permitted earlier)
                                if (user.role == 'patient') { //if this user is a patient
                                    if (args.id && (args.id != user.uuid && !(await context.dataSources.usersAPI.isTherapistOfPatient(args.id, user.uuid)))) //check if request has a specified id
                                                                                                                                                   //if requested id != current user, and the id is not the current users therapist => deny
                                        throw new ForbiddenError('This user is not authorized');
                                }
                                else if (user.role == 'therapist') { //if this user is a therapist
                                    if (args.id && (args.id != user.uuid && !(await context.dataSources.usersAPI.isTherapistOfPatient(user.uuid, args.id)))) //check if request has a specified id
                                                                                                                                               //if requested id != current user, and the id is not the current users patient => deny
                                        throw new ForbiddenError('This user is not authorized');
                                }
                            }
                            return resolve(source, args, context, info);
                        }   
                        return fieldConfig;
                    }
                }
            }
        })
    }
}

exports.authDirective = authDirective;

