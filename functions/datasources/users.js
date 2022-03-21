const { DataSource } = require('apollo-datasource');
// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth'); 
const { UserInputError } = require('apollo-server-core');
admin.initializeApp();
userDb = getFirestore();

class UsersAPI extends DataSource {
    constructor() {
      super()
    }
  
    //get patient with id specified in args
    async getPatient(args) {
      try {
        const patientRef = userDb.collection('patients').doc(args.id);
        const doc = await patientRef.get();
        if(doc == null) {
            throw new UserInputError("This user does not exist");
        }
        return doc.data();
      } catch(error) {
            throw new Error(error.errorInfo.message, error.errorInfo);
      }
    }

    async getPatientsOfTherapist(args) {
        const patientRef = userDb.collection('patients').where("therapist", "array-contains", args.id);
        const snapshot = await patientRef.get();
        let docData = snapshot.docs.map(doc => doc.data());
        return docData;
    }

    async createPatient(args) {
        try{
            const userRec = await getAuth().createUser({
                email: args.email,
                displayName: args.name,
                password: args.password
            });
            delete args.password;
            getAuth().setCustomUserClaims(userRec.uid, { role: "patient" }); 
            await userDb.collection('patients').doc(userRec.uid).set(args);
            return userRec.uid;
        } catch(error) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    async isTherapistOfPatient(therapistId, patientId) {
        try {
            const patientRef = await userDb.collection('patients').doc(patientId).get();
            const patientData = patientRef.data();
            if(patientData.therapist.includes(therapistId))
                return true;
            return false;
        } catch(error) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }
}

exports.UsersAPI = UsersAPI;