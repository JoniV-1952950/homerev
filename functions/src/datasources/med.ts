import { DataSource } from 'apollo-datasource';
import { getFirestore } from 'firebase-admin/firestore';
import admin = require('firebase-admin');
import { UserInputError } from 'apollo-server-core';
import { ServiceAccount } from 'firebase-admin';

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

    // check if patient exists, throws error if patient does not exist
    async patientExists(patientId: string): Promise<void> {
        const patientRef = medDb.collection("patients").doc(patientId);
        if(!(await patientRef.get()).exists)
            throw new UserInputError('The patient with uid: ' + patientId + ' does not exist');
    }

    //======== TASKS ==========
    // get the task with taskId for patient with patientId
    async getTask(patientId: string, taskId: string): Promise<any> {
        //throws error if user does not exist
        await this.patientExists(patientId);
        const taskRef = medDb.collection("patients").doc(patientId).collection('tasks').doc(taskId);
        const task = await taskRef.get();
        let data = task.data();
        if(data) {
            // set the taskId as a value in the return for easy processing client side
            data.id = taskId;
            data.dateCreated = task.createTime?.toDate().getTime().toString();
            return data; 
        }
        throw new UserInputError('There does not exist a task with id: ' + taskId + ' for the patient with uid: ' + patientId);
    }

    // get the tasks for the patient with patientId
    async getTasks(patientId: string): Promise<any> {
        // TODO patientId.hash
        //throws error if user does not exist
        await this.patientExists(patientId);
        const tasksRef = medDb.collection("patients").doc(patientId).collection('tasks');
        const snapshot = await tasksRef.get();
        let docData = snapshot.docs.map((doc: any) => {
                                            // set the taskId as a value in the return for easy processing client side
                                            const id = doc.id;
                                            let data = doc.data();
                                            data.id = id;
                                            data.dateCreated = doc.createTime?.toDate().getTime().toString();
                                            return data;
                                        });
        return docData; 
    }

    // add a new task for the patient specified with patientId
    async addTask(patientId: string, taskInfo: any): Promise<string> {
        // TODO args.id.hash
        //throws error if user does not exist
        await this.patientExists(patientId);
        const taskRef = medDb.collection("patients").doc(patientId).collection('tasks');
        const task = await taskRef.add(taskInfo);
        return task.id; 
    }

    // update task from patientId with taskId
    async updateTask(patientId: string, taskId: string, taskInfo: any): Promise<string> {
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
    async deleteTask(patientId: string, taskId: string): Promise<string> {
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
    async getTodo(patientId: string, todoId: string): Promise<any> {
        //throws error if user does not exist
        await this.patientExists(patientId);
        const todoRef = medDb.collection("patients").doc(patientId).collection('todos').doc(todoId);
        const todo = await todoRef.get();
        let data = todo.data();
        if(data) {
            // set the todoId as a value in the return for easy processing client side
            data.id = todoId;
            data.dateCreated = todo.createTime?.toDate().getTime().toString();
            return data; 
        }
        throw new UserInputError('There does not exist a todo with id: ' + todoId + ' for the patient with uid: ' + patientId);
    }

    // get the todos for the patient with patientId
    async getTodos(patientId: string): Promise<any> {
        // TODO patientId.hash
        //throws error if user does not exist
        await this.patientExists(patientId);
        const todosRef = medDb.collection("patients").doc(patientId).collection('todos');
        const snapshot = await todosRef.get();
        let docData = snapshot.docs.map((doc: any) => {
                                            // set the todoId as a value in the return for easy processing client side
                                            const id = doc.id;
                                            let data = doc.data();
                                            data.id = id;
                                            data.dateCreated = doc.createTime?.toDate().getTime().toString();
                                            return data;
                                        });
        return docData; 
    }

    // add a new todo for the patient specified with patientId
    async addTodo(patientId: string, todoInfo: any): Promise<string> {
        // TODO args.id.hash
        //throws error if user does not exist
        await this.patientExists(patientId);
        const todoRef = medDb.collection("patients").doc(patientId).collection('todos');
        const todo = await todoRef.add(todoInfo);
        return todo.id; 
    }

    // update todo from patientId with todoId
    async updateTodo(patientId: string, todoId: string, todoInfo: any): Promise<string> {
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
    async deleteTodo(patientId: string, todoId: string): Promise<string> {
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
