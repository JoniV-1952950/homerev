import { DataSource } from 'apollo-datasource';
import { getFirestore } from 'firebase-admin/firestore';
import { UserInputError } from 'apollo-server-core';
import { getAuth } from "firebase-admin/auth";

// get the firestore database connected to the default project
const userDb = getFirestore();

// get the medical database
import { medDb } from './med';

// database interactions for userdata
export class UsersAPI extends DataSource {
    constructor() {
      super()
    }
    //====== Patient ======
    // get patient with id specified
    async getPatient(id: string): Promise<any> {
        const patientRef = userDb.collection('patients').doc(id);
        const doc = await patientRef.get();
        let docData = doc.data();
        if(docData == null)
            throw new UserInputError('The patient with uid: ' + id + ' does not exist');
        docData.id = id; 
        return docData;
    }

    // get patients of therapist with id specified
    async getPatientsOfTherapist(id: string): Promise<any> {
        // if given id is not a therapist throw error
        if(!(await userDb.collection('therapists').doc(id).get()).data())
            throw new UserInputError('The user with uid: ' + id + ' is not a therapist');
        // get the patients where the id is in the therapist array
        const patientRef = userDb.collection('patients').where("therapists", "array-contains", id);
        const snapshot = await patientRef.get();
        let docData = snapshot.docs.map((doc: any) => {
                                                    let docData = doc.data();
                                                    docData.id = doc.id;
                                                    return docData;
                                                    });
        return docData;
    }

    // create a new patient with the fields specified in args, the current user will be the therapist of this new patient
    async createPatient(args: any, user: any): Promise<string> {
        try{
            // create the user
            const userRec = await getAuth().createUser({
                email: args.patientInfo.email,
                displayName: args.patientInfo.name,
                password: args.patientInfo.password
            });
            // delete the password from args object
            delete args.patientInfo.password;
            // add therapist to args object
            args.patientInfo.therapists = [user.uid];
            // add custom user claim for the patient (adds role claim to the idtokens retrieved from firebase)
            getAuth().setCustomUserClaims(userRec.uid, { role: "patient" }); 
            // create document with user data in the user database
            await userDb.collection('patients').doc(userRec.uid).set(args.patientInfo);
            // create empty document in the med database TODO hash
            await medDb.collection('patients').doc(userRec.uid).set({});
            return userRec.uid;
        // if anything goes wrong throw error
        } catch(error: any) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    //====== Therapist ======
    // get therapist with the id specified
    async getTherapist(id: string): Promise<any> {
        const theraRef = userDb.collection('therapists').doc(id);
        const doc = await theraRef.get();
        let docData = doc.data();
        if(docData == null)
            throw new UserInputError("The therapist with uid: " + id + " does not exist");
        docData.id = id;
        return docData;
    }

    // get the therapists of a patient with id specified in args
    async getTherapistsOfPatient(id: string): Promise<any> {
        // get the patient data
        const patientData = await this.getPatient(id);
        // get therapist ids
        const therapists = patientData.therapists; 
        const theraRef = userDb.collection('therapists');
        // create an empty array which will contain the data
        let docData = [];
        // for every therapist of the patient add the data to docData
        for(let i = 0; i < therapists.length; i++) {
            const therapist = await theraRef.doc(therapists[i]).get();
            let therapistData = therapist.data();
            if(therapistData == null)
                throw new UserInputError('One of the therapists of this user does not exist');
            therapistData.id = therapists[i];
            docData.push(therapistData);
        }
        return docData;
    }

    // checks whether a user is the therapist of a patient
    async isTherapistOfPatient(therapistId: string, patientId: string): Promise<boolean> {
        const patientData = await this.getPatient(patientId);
        // the patients therapist fields contains the therapistId, return true
        if(patientData.therapists.includes(therapistId))
            return true;
        return false;
    }
}
