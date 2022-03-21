const { DataSource } = require('apollo-datasource');
// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { UserInputError } = require('apollo-server-core');

//get service account for this database
var serviceAccount = require("../../serviceAccountKey.json");

const medAdmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
}, "medAdmin");
medDb = getFirestore(medAdmin);

class MedAPI extends DataSource {
    constructor() {
      super()
    }
    //======== TASKS ==========
    async getTask(args) {
        try {
            //args.hash
            const taskRef = medDb.collection("patients").doc(args.id).collection('tasks').doc(args.taskId);
            const task = await taskRef.get();
            let data = task.data();
            data.id = args.taskId;
            return data; 
        } catch(error) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    async getTasks(args) {
        try {
            //args.hash
            const tasksRef = medDb.collection("patients").doc(args.id).collection('tasks');
            const snapshot = await tasksRef.get();
            let docData = snapshot.docs.map((doc) => {
                                                const id = doc.id;
                                                let data = doc.data();
                                                data.id = id;
                                                return data;
                                            });
            return docData; 
        } catch(error) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    async addTask(args) {
        try {
            //args.hash
            const taskRef = medDb.collection("patients").doc(args.id).collection('tasks');
            const task = await taskRef.add(args.taskInfo);
            return task.id; 
        } catch(error) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    async updateTask(args) {
        try {
            const taskRef = medDb.collection("patients").doc(args.id).collection('tasks').doc(args.taskId);
            delete args.id;
            const task = await taskRef.set(args.taskInfo);
            return taskRef.id; 
        } catch(error) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    async deleteTask(args) {
        try {
            const taskRef = medDb.collection("patients").doc(args.id).collection('tasks').doc(args.taskId);
            const task = await taskRef.delete();
            return taskRef.id; 
        } catch(error) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    //========== TODOS ==========
    async getTodo(args) {
        try {
            //args.hash
            const todoRef = medDb.collection("patients").doc(args.id).collection('todos').doc(args.todoId);
            const todo = await taskRef.get();
            let data = todo.data();
            data.id = args.todoId;
            return data; 
        } catch(error) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    async getTodos(args) {
        try {
            //args.hash
            const todosRef = medDb.collection("patients").doc(args.id).collection('todos');
            const snapshot = await todosRef.get();
            let docData = snapshot.docs.map((doc) => {
                                                const id = doc.id;
                                                let data = doc.data();
                                                data.id = id;
                                                return data;
                                            });
            return docData; 
        } catch(error) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    async addTodo(args) {
        try {
            //args.hash
            const todoRef = medDb.collection("patients").doc(args.id).collection('todos');
            delete args.id;
            const todo = await todoRef.add(args.todoInfo);
            return todo.id; 
        } catch(error) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    async updateTodo(args) {
        try {
            const todoRef = medDb.collection("patients").doc(args.id).collection('todos').doc(args.todoId);
            delete args.id;
            const todo = await todoRef.set(args.todoInfo);
            return todoRef.id; 
        } catch(error) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    async deleteTodo(args) {
        try {
            const todoRef = medDb.collection("patients").doc(args.id).collection('todos').doc(args.todoId);
            const todo = await todoRef.delete();
            return todoRef.id; 
        } catch(error) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }
}

exports.MedAPI = MedAPI;