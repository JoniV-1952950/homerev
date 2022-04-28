import { DataSource } from 'apollo-datasource';
import { CollectionReference, getFirestore, Query } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { UserInputError } from 'apollo-server-core';
import { firestore, ServiceAccount } from 'firebase-admin';
import { Filter } from "../utils/types";
import type { PageDetails } from '../utils/types';
import * as crypto from 'crypto';
import { FilterType, Operator } from '../utils/enums';
import { Variables } from '../utils/variables';

// HASH
function hashID(id: string): string {
    return crypto.createHash(Variables.HASH_ALGORITHM).update(id).digest('hex');
}
export { hashID };

// initialize second app (homerev-med) to have access to medical database
let medAdmin;
if(process.env.MED_FIREBASE_SERVICE_ACCOUNT) {
    let serviceAccount = JSON.parse(process.env.MED_FIREBASE_SERVICE_ACCOUNT);

    medAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as ServiceAccount)
    }, "medAdmin"); 
}
// get the medical database ref
const medDb = getFirestore(medAdmin);
export { medDb }; 


// This class is the interface to the medical database which contains the tasks and todos of patients
export class MedAPI extends DataSource {
    
    // the collection containing all the patients
    #patientsRef = medDb.collection(Variables.PATIENT_COLLECTION);
    
    // the collection containing all the utilities
    #utilsRef = medDb.collection(Variables.UTILS_COLLECTION);
    constructor() {
      super();
    }

    // get the project types that exist
    async getProjectTypes(): Promise<string[]> {
        const projectTypeRefs = this.#utilsRef.doc(Variables.PROJECT_TYPES_DOC);
        const projectTypes = await projectTypeRefs.get();
        const data = projectTypes?.data();
        if(data?.projectTypes)
            return data.projectTypes as string[];
        throw new Error('Something went wrong connecting to the db');
    }

    // check if patient exists, throws error if patient does not exist
    async #patientExists(patientId: string): Promise<void> {
        const patientRef = this.#patientsRef.doc(patientId);
        if(!(await patientRef.get()).exists)
            throw new UserInputError('The patient with uid: ' + patientId + ' does not exist');
    }

    // convert the value from a string to the given type
    #getParsedValue(type: FilterType, value: string) {
        if(type == FilterType.String) return value;
        else if(type == FilterType.Int) return parseInt(value);
        else if(type == FilterType.Float) return parseFloat(value);
        else if(type == FilterType.Boolean) return (value === 'true');
        else if(type == FilterType.Date) return new Date(value);
        else if(type == FilterType.DateTime) return new Date(value);
        return null;
    }

    // this function assumes the query's first order clause is equal to the field provided (firebase needs this to function)
    async #addPaginationToQuery(collectionRef: CollectionReference, query: Query, pageDetails: PageDetails, field: string) {
        // pagination
        query = query.orderBy(firestore.FieldPath.documentId());

        // throws error if the user tries to do pagination within a list of lists of items e.g. tasks of multiple patients
        try {
            // if afterDocID is specified start after this document (only document ID is needed)
            if(pageDetails.next && pageDetails.afterDocID){
                let prevValue;
                if(!field.includes('.')) prevValue = ((await collectionRef.doc(pageDetails.afterDocID).get()).data() as unknown as any)[field];
                else {
                    const fields = field.split('.');
                    prevValue = ((await collectionRef.doc(pageDetails.afterDocID).get()).data() as unknown as any)[fields[0]][fields[1]];
                }
                query = query.startAfter(prevValue, pageDetails.afterDocID);
            }
            // else end before this document
            else if(!pageDetails.next && pageDetails.beforeDocID) {
                let prevValue;
                if(!field.includes('.')) prevValue = ((await collectionRef.doc(pageDetails.beforeDocID).get()).data() as unknown as any)[field];
                else {
                    const fields = field.split('.');
                    prevValue = ((await collectionRef.doc(pageDetails.beforeDocID).get()).data() as unknown as any)[fields[0]][fields[1]];
                }
                query = query.endBefore(prevValue, pageDetails.beforeDocID);
            }
        } catch (error: any) {
            throw new UserInputError("Can not perform query. Make sure you are not doing pagination within a list of lists of items.")
        }
        return query;
    }

    async #getData(query: Query, perPage: number) {
        // limit the results to the amount requested
        query = query.limit(perPage);
        const snapshot = await query.get();
        let docData = snapshot.docs.map((doc: any) => {
                                            // set the taskId as a value in the return for easy processing client side
                                            const id = doc.id;
                                            let data = doc.data();
                                            data.id = id;
                                            data.dateCreated = data.dateCreated.toDate();
                                            if(data.deadline) data.deadline = data.deadline.toDate();
                                            return data;
                                        });
        return docData;
    }

    //======== TASKS ==========
    // get the task with taskId for patient with patientId
    async getTaskOfPatient(patientId: string, taskId: string): Promise<any> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.#patientExists(patientId);
        const taskRef = this.#patientsRef.doc(patientId).collection(Variables.TASKS_COLLECTION).doc(taskId);
        const task = await taskRef.get();
        let data = task.data();
        if(data) {
            // set the taskId as a value in the return for easy processing client side
            data.id = taskId;
            data.dateCreated = data.dateCreated.toDate();
            return data; 
        }
        throw new UserInputError('There does not exist a task with id: ' + taskId + ' for the patient with uid: ' + patientId);
    }

    // get the tasks for the patient with patientId
    async getTasksOfPatient(patientId: string, pageDetails: PageDetails, type: string, filter: Filter): Promise<any> {
        // only one filter can be applied (because of firebase)
        if(filter && type)
            throw new UserInputError("Can only filter on one field."); 

        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.#patientExists(patientId);
        let tasksQuery = this.#patientsRef.doc(patientId).collection(Variables.TASKS_COLLECTION) as Query;

        if(type)
            tasksQuery = tasksQuery.where("type", "==", type);

        // use the filter
        if(filter) {
            let value;
            // if the given filter does not have an array as value just parse this value based on the type
            if(!filter.array)
                value = this.#getParsedValue(filter.type, filter.value)
            // else create an array and parse each value of this array
            else {
                let valueArray = filter.value.split(",");
                value = [];
                for(let val of valueArray)
                    value.push(this.#getParsedValue(filter.type, val));
            }
            // get the operator string firebase knows
            const operator = Object.entries(Operator).filter((pair) => pair[0] == filter.operator)[0][1];
            // perform the query
            tasksQuery = tasksQuery.where(filter.field, operator , value);
            // if necessary, sort the data
            if(operator == Operator.gt as Operator || operator == Operator.gte || operator == Operator.lt || operator == Operator.lte || operator == Operator.not_in || operator == Operator.neq)
                tasksQuery = tasksQuery.orderBy(filter.field);
        }
        
        // the field to paginate with (meaning this is the field that was filtered with)
        let field: string;
        if(!filter) {
            field = Variables.DEFAULT_ORDERBY_FIELD;
            tasksQuery = tasksQuery.orderBy(Variables.DEFAULT_ORDERBY_FIELD);
        }
        else field = filter.field;
        // add pagination to the query
        tasksQuery = await this.#addPaginationToQuery(this.#patientsRef.doc(patientId).collection(Variables.TASKS_COLLECTION), tasksQuery, pageDetails, field);

        // return the data retrieved with this query
        return await this.#getData(tasksQuery, pageDetails.perPage); 
    }

    // get the tasks for every patient id in the array
    async getTasks(patientIDs: string[], nr_tasks_per_patient: number, type: string): Promise<any> {
        // hash the patientId
        let docData = [];
        for(let patientId of patientIDs){
            patientId = hashID(patientId);
            //throws error if user does not exist
            await this.#patientExists(patientId);
            let tasksQuery = this.#patientsRef.doc(patientId).collection(Variables.TASKS_COLLECTION) as Query;
            if(type)
                tasksQuery = tasksQuery.where("type", "==", type);

            docData.push(await (this.#getData(tasksQuery, nr_tasks_per_patient)));
        }
        return docData; 
    }

    // add a new task for the patient specified with patientId
    async addTaskToPatient(patientId: string, taskInfo: any): Promise<string> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.#patientExists(patientId);
        const taskRef = this.#patientsRef.doc(patientId).collection(Variables.TASKS_COLLECTION);
        taskInfo.dateCreated = new Date();
        const task = await taskRef.add(taskInfo);
        return task.id; 
    }

    // update task from patientId with taskId
    async updateTaskOfPatient(patientId: string, taskId: string, taskInfo: any): Promise<string> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.#patientExists(patientId);
        const taskRef = this.#patientsRef.doc(patientId).collection(Variables.TASKS_COLLECTION).doc(taskId);
        // check if task exists for this user
        if(!(await taskRef.get()).exists)
            throw new UserInputError('There does not exist a task with id: ' + taskId + ' for the patient with uid: ' + patientId);
        await taskRef.update(taskInfo);
        return taskRef.id; 
    }

    // delete task from patientId with taskId
    async deleteTaskOfPatient(patientId: string, taskId: string): Promise<string> {
        // hash the patientId
        patientId = hashID(patientId);        
        //throws error if user does not exist
        await this.#patientExists(patientId);
        const taskRef = this.#patientsRef.doc(patientId).collection(Variables.TASKS_COLLECTION).doc(taskId);
        // check if task exists for this user
        if(!(await taskRef.get()).exists)
            throw new UserInputError('There does not exist a task with id: ' + taskId + ' for the patient with uid: ' + patientId);
        await taskRef.delete();
        return taskRef.id; 
    }

    //========== TODOS ==========
    // get the todo with todoId for patient with patientId
    async getTodoOfPatient(patientId: string, todoId: string): Promise<any> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.#patientExists(patientId);
        const todoRef = this.#patientsRef.doc(patientId).collection(Variables.TODOS_COLLECTION).doc(todoId);
        const todo = await todoRef.get();
        let data = todo.data();
        if(data) {
            // set the todoId as a value in the return for easy processing client side
            data.id = todoId;
            data.dateCreated = data.dateCreated.toDate();
            return data; 
        }
        throw new UserInputError('There does not exist a todo with id: ' + todoId + ' for the patient with uid: ' + patientId);
    }

    // get the todos for the patient with patientId
    async getTodosOfPatient(patientId: string, pageDetails: PageDetails, type: string, filter: Filter): Promise<any> {
        // only one filter can be applied (because of firebase)
        if(filter && type)
            throw new UserInputError("Can only filter on one field."); 

        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.#patientExists(patientId);
        let todosQuery = this.#patientsRef.doc(patientId).collection(Variables.TODOS_COLLECTION) as Query;

        if(type)
            todosQuery = todosQuery.where("type", "==", type);

        // use the filter
        if(filter) {
            let value;
            // if the given filter does not have an array as value just parse this value based on the type
            if(!filter.array)
                value = this.#getParsedValue(filter.type, filter.value)
            // else create an array and parse each value of this array, the elements are separated by a comma ','
            else {
                let valueArray = filter.value.split(",");
                value = [];
                for(let val of valueArray)
                    value.push(this.#getParsedValue(filter.type, val));
            }
            // get the operator string firebase knows
            const operator = Object.entries(Operator).filter((pair) => pair[0] == filter.operator)[0][1];
            // perform the query
            todosQuery = todosQuery.where(filter.field, operator , value);
            // if acquired, sort the data
            if(operator == Operator.gt as Operator || operator == Operator.gte || operator == Operator.lt || operator == Operator.lte || operator == Operator.not_in || operator == Operator.neq)
                todosQuery = todosQuery.orderBy(filter.field);
        }
        
        // the field to paginate with (meaning this is the field that was filtered with)
        let field: string;
        if(!filter) {
            field = Variables.DEFAULT_ORDERBY_FIELD;
            todosQuery = todosQuery.orderBy(Variables.DEFAULT_ORDERBY_FIELD);
        }
        else field = filter.field;
        // add pagination to the query
        todosQuery = await this.#addPaginationToQuery(this.#patientsRef.doc(patientId).collection(Variables.TODOS_COLLECTION), todosQuery, pageDetails, field);

        // return the data retrieved with this query
        return await this.#getData(todosQuery, pageDetails.perPage); 
    }

    // add a new todo for the patient specified with patientId
    async addTodoToPatient(patientId: string, todoInfo: any): Promise<string> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.#patientExists(patientId);
        const todoRef = this.#patientsRef.doc(patientId).collection(Variables.TODOS_COLLECTION);
        todoInfo.dateCreated = new Date();
        const todo = await todoRef.add(todoInfo);
        return todo.id; 
    }

    // update todo from patientId with todoId
    async updateTodoOfPatient(patientId: string, todoId: string, todoInfo: any): Promise<string> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.#patientExists(patientId);
        const todoRef = this.#patientsRef.doc(patientId).collection(Variables.TODOS_COLLECTION).doc(todoId);
        // check if todo exists for this user
        if(!(await todoRef.get()).exists)
            throw new UserInputError('There does not exist a todo with id: ' + todoId + ' for the patient with uid: ' + patientId);
        await todoRef.update(todoInfo);
        return todoRef.id; 
    }

    // delete todo from patientId with todoId
    async deleteTodoOfPatient(patientId: string, todoId: string): Promise<string> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.#patientExists(patientId);
        const todoRef = this.#patientsRef.doc(patientId).collection(Variables.TODOS_COLLECTION).doc(todoId);
        // check if todo exists for this user
        if(!(await todoRef.get()).exists)
            throw new UserInputError('There does not exist a todo with id: ' + todoId + ' for the patient with uid: ' + patientId);
        await todoRef.delete();
        return todoRef.id; 
    }
}
