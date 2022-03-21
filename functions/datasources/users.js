const { DataSource } = require('apollo-datasource');
// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth'); 
const { UserInputError } = require('apollo-server-core');
admin.initializeApp();
db = getFirestore();

class UsersAPI extends DataSource {
    constructor() {
      super()
    }
  
    async getPatient(args) {
      const patientRef = db.collection('patients').doc(args.id);
      const doc = await patientRef.get();
      return doc.data();
    }

    async getPatients(args) {
        const patientRef = db.collection('patients');
        const snapshot = await patientRef.get();
        let docData = snapshot.docs.map(doc => doc.data());
        return docData;
    }

    async addPatient(args) {
        try{
            const userRec = await getAuth().createUser({
                email: args.email,
                displayName: args.name,
                password: args.password
            });
            delete args.password;
            getAuth().setCustomUserClaims(userRec.uid, { role: "patient" }); 
            await db.collection('patients').doc(userRec.uid).set(args);
            return userRec.uid;
        } catch(error) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    async isTherapistOfPatient(therapistId, patientId) {
        const patientRef = await db.collection('patients').doc(patientId).get();
        const patientData = patientRef.data();
        if(patientData.therapist == therapistId)
            return true;
        return false;
    }
}

exports.UsersAPI = UsersAPI;