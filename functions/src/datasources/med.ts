import { DataSource } from 'apollo-datasource';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { UserInputError } from 'apollo-server-core';
import { ServiceAccount } from 'firebase-admin';

import * as crypto from 'crypto';
// HASH
function hashID(id: string): string {
    return crypto.createHash('sha256').update(id).digest('hex');
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

export class MedAPI extends DataSource {
    constructor() {
      super()
    }

    // get the project types that exist
    async getProjectTypes(): Promise<string[]> {
        const projectTypeRefs = medDb.collection("utils").doc("projectTypes");
        const projectTypes = await projectTypeRefs.get();
        const data = projectTypes?.data();
        if(data?.projectTypes)
            return data.projectTypes as string[];
        throw new Error('Something went wrong connecting to the db');
    }

    // check if patient exists, throws error if patient does not exist
    async patientExists(patientId: string): Promise<void> {
        const patientRef = medDb.collection("patients").doc(patientId);
        if(!(await patientRef.get()).exists)
            throw new UserInputError('The patient with uid: ' + patientId + ' does not exist');
    }

    //======== TASKS ==========
    // get the task with taskId for patient with patientId
    async getTaskOfPatient(patientId: string, taskId: string): Promise<any> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.patientExists(patientId);
        const taskRef = medDb.collection("patients").doc(patientId).collection('tasks').doc(taskId);
        const task = await taskRef.get();
        let data = task.data();
        if(data) {
            // set the taskId as a value in the return for easy processing client side
            data.id = taskId;
            data.dateCreated = task.createTime?.toDate();
            return data; 
        }
        throw new UserInputError('There does not exist a task with id: ' + taskId + ' for the patient with uid: ' + patientId);
    }

    // get the tasks for the patient with patientId
    async getTasksOfPatient(patientId: string): Promise<any> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.patientExists(patientId);
        const tasksRef = medDb.collection("patients").doc(patientId).collection('tasks');
        const snapshot = await tasksRef.get();
        let docData = snapshot.docs.map((doc: any) => {
                                            // set the taskId as a value in the return for easy processing client side
                                            const id = doc.id;
                                            let data = doc.data();
                                            data.id = id;
                                            data.dateCreated = doc.createTime?.toDate();
                                            return data;
                                        });
        return docData; 
    }

    // get the tasks for every patient id in the array
    async getTasks(patientIDs: string[], nr_tasks_per_patient: number): Promise<any> {
        // hash the patientId
        let docData = [];
        for(let patientId of patientIDs){
            patientId = hashID(patientId);
            //throws error if user does not exist
            await this.patientExists(patientId);
            const tasksRef = medDb.collection("patients").doc(patientId).collection('tasks');
            const snapshot = await tasksRef.limit(nr_tasks_per_patient).get();
            let data = snapshot.docs.map((doc: any) => {
                                                // set the taskId as a value in the return for easy processing client side
                                                const id = doc.id;
                                                let data = doc.data();
                                                data.id = id;
                                                data.dateCreated = doc.createTime?.toDate();
                                                return data;
                                            });
            docData.push(data);
        }
        return docData; 
    }

    // add a new task for the patient specified with patientId
    async addTaskToPatient(patientId: string, taskInfo: any): Promise<string> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.patientExists(patientId);
        const taskRef = medDb.collection("patients").doc(patientId).collection('tasks');
        const task = await taskRef.add(taskInfo);
        return task.id; 
    }

    // update task from patientId with taskId
    async updateTaskOfPatient(patientId: string, taskId: string, taskInfo: any): Promise<string> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.patientExists(patientId);
        const taskRef = medDb.collection("patients").doc(patientId).collection('tasks').doc(taskId);
        // check if task exists for this user
        if(!(await taskRef.get()).exists)
            throw new UserInputError('There does not exist a task with id: ' + taskId + ' for the patient with uid: ' + patientId);
        await taskRef.set(taskInfo);
        return taskRef.id; 
    }

    // delete task from patientId with taskId
    async deleteTaskOfPatient(patientId: string, taskId: string): Promise<string> {
        // hash the patientId
        patientId = hashID(patientId);        
        //throws error if user does not exist
        await this.patientExists(patientId);
        const taskRef = medDb.collection("patients").doc(patientId).collection('tasks').doc(taskId);
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
        await this.patientExists(patientId);
        const todoRef = medDb.collection("patients").doc(patientId).collection('todos').doc(todoId);
        const todo = await todoRef.get();
        let data = todo.data();
        if(data) {
            // set the todoId as a value in the return for easy processing client side
            data.id = todoId;
            data.dateCreated = todo.createTime?.toDate();
            return data; 
        }
        throw new UserInputError('There does not exist a todo with id: ' + todoId + ' for the patient with uid: ' + patientId);
    }

    // get the todos for the patient with patientId
    async getTodosOfPatient(patientId: string): Promise<any> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.patientExists(patientId);
        const todosRef = medDb.collection("patients").doc(patientId).collection('todos');
        const snapshot = await todosRef.get();
        let docData = snapshot.docs.map((doc: any) => {
                                            // set the todoId as a value in the return for easy processing client side
                                            const id = doc.id;
                                            let data = doc.data();
                                            data.id = id;
                                            data.dateCreated = doc.createTime?.toDate();
                                            return data;
                                        });
        return docData; 
    }

    // add a new todo for the patient specified with patientId
    async addTodoToPatient(patientId: string, todoInfo: any): Promise<string> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.patientExists(patientId);
        const todoRef = medDb.collection("patients").doc(patientId).collection('todos');
        const todo = await todoRef.add(todoInfo);
        return todo.id; 
    }

    // update todo from patientId with todoId
    async updateTodoOfPatient(patientId: string, todoId: string, todoInfo: any): Promise<string> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.patientExists(patientId);
        const todoRef = medDb.collection("patients").doc(patientId).collection('todos').doc(todoId);
        // check if todo exists for this user
        if(!(await todoRef.get()).exists)
            throw new UserInputError('There does not exist a todo with id: ' + todoId + ' for the patient with uid: ' + patientId);
        await todoRef.set(todoInfo);
        return todoRef.id; 
    }

    // delete todo from patientId with todoId
    async deleteTodoOfPatient(patientId: string, todoId: string): Promise<string> {
        // hash the patientId
        patientId = hashID(patientId);
        //throws error if user does not exist
        await this.patientExists(patientId);
        const todoRef = medDb.collection("patients").doc(patientId).collection('todos').doc(todoId);
        // check if todo exists for this user
        if(!(await todoRef.get()).exists)
            throw new UserInputError('There does not exist a todo with id: ' + todoId + ' for the patient with uid: ' + patientId);
        await todoRef.delete();
        return todoRef.id; 
    }
}
