const { DataSource } = require('apollo-datasource');
// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin')
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth'); 
const { UserInputError } = require('apollo-server-core');

userDb = getFirestore();

class UsersAPI extends DataSource {
    constructor() {
      super()
    }
    //====== Patient ======
    //get patient with id specified in args
    async getPatient(args) {
      try {
        const patientRef = userDb.collection('patients').doc(args.id);
        const doc = await patientRef.get();
        const docData = doc.data();
        if(docData == null) {
            throw new UserInputError("This user does not exist");
        }
        return docData;
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

    async createPatient(args, user) {
        try{
            const userRec = await getAuth().createUser({
                email: args.patientInfo.email,
                displayName: args.patientInfo.name,
                password: args.patientInfo.password
            });
            delete args.patientInfo.password;
            args.patientInfo.therapist = [user.uid];
            getAuth().setCustomUserClaims(userRec.uid, { role: "patient" }); 
            await userDb.collection('patients').doc(userRec.uid).set(args.patientInfo);
            return userRec.uid;
        } catch(error) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    //====== Therapist ======
    async getTherapist(args) {
        try {
            const theraRef = userDb.collection('therapists').doc(args.id);
            const doc = await theraRef.get();
            const docData = doc.data()
            if(docData == null) {
                throw new UserInputError("This user does not exist");
            }
            return docData;
          } catch(error) {
                throw new Error(error.errorInfo.message, error.errorInfo);
          }
    }

    async getTherapistsOfPatient(args) {
        const patientRef = userDb.collection('patients').doc(args.id);
        const patient = await patientRef.get();
        const therapists = patient.data().therapist; 
        const theraRef = userDb.collection('therapists');
        let docData = [];
        for(let i = 0; i < therapists.length; i++) {
            const therapist = await theraRef.doc(therapists[i]).get();
            const therapistData = therapist.data();
            if(therapistData == null)
                throw new UserInputError('This user does not exist');
            docData.push(therapistData);
        }
        return docData;
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