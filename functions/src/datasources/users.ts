import { DataSource } from 'apollo-datasource';
import { getFirestore, Query, Timestamp } from 'firebase-admin/firestore';
import { UserInputError } from 'apollo-server-core';
import { firestore } from 'firebase-admin';
import { getAuth } from "firebase-admin/auth";

// get the firestore database connected to the default project
const userDb = getFirestore();

// get the medical database
import { medDb, hashID } from './med';

// gender enum used as filter
enum Gender {
    M = "M", 
    V = "V", 
    X = "X"
}


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
        // add id to object for easy client side processing
        docData.id = id; 
        // convert firestore timestamp to date object
        docData.birthdate = (docData.birthdate as Timestamp).toDate();
        return docData;
    }

    // get patients of therapist with id specified
    async getPatientsOfTherapist(id: string, pageDetails: {beforeDocID: string, afterDocID: string; perPage: number}, name: string): Promise<any> {
        // if given id is not a therapist throw error
        if(!(await userDb.collection('therapists').doc(id).get()).data())
            throw new UserInputError('The user with uid: ' + id + ' is not a therapist');
        // get the patients where the id is in the therapist array
        let patientQuery = userDb.collection('patients').where("therapists", "array-contains", id);
        // filter for name
        if(name) {
            // https://stackoverflow.com/questions/46568142/google-firestore-query-on-substring-of-a-property-value-text-search
            patientQuery = patientQuery
                                .where('name', '>=', name)
                                .where('name', '<=', name + '\uf8ff').orderBy("name");

            // pagination
            //order by documentID first
            patientQuery = patientQuery.orderBy(firestore.FieldPath.documentId());
            // if afterDocID is specified start after this document (need name and document ID to determine the document to start at)
            if(pageDetails.afterDocID)
                patientQuery = patientQuery.startAfter((await userDb.collection('patients').doc(pageDetails.afterDocID).get()).data()?.name, pageDetails.afterDocID);
            // else end before this document
            else if(pageDetails.beforeDocID)
                patientQuery = patientQuery.endBefore((await userDb.collection('patients').doc(pageDetails.beforeDocID).get()).data()?.name, pageDetails.beforeDocID);
        }
        else {
            // pagination
            // order by documentID first
            patientQuery = patientQuery.orderBy(firestore.FieldPath.documentId());
            // if afterDocID is specified start after this document (only document ID is needed)
            if(pageDetails.afterDocID)
                patientQuery = patientQuery.startAfter(pageDetails.afterDocID);
            // else end before this document
            else if(pageDetails.beforeDocID)
                patientQuery = patientQuery.endBefore(pageDetails.beforeDocID);
        }
        // limit the results to the amount requested
        patientQuery = patientQuery.limit(pageDetails.perPage);
        const snapshot = await patientQuery.get();
        const docData = snapshot.docs.map((doc: any) => {
                                                    let docData = doc.data();
                                                    docData.id = doc.id;
                                                    // convert firestore timestamp to date object
                                                    docData.birthdate = (docData.birthdate as Timestamp).toDate();
                                                    return docData;
                                                    });
        return docData;
    }

     // get patients with specified characteristics
     async getPatientsIDs(nr_patients: number, birthdateParams: {bd_lt: Date; bd_gt: Date}, condition: string, gender: Gender): Promise<string[]> {
        // get a reference to the patients collection
        let patientQuery = userDb.collection('patients') as Query;
        // if bd_lt is specified, filter
        if(birthdateParams.bd_lt)
            patientQuery = patientQuery.where("birthdate", "<=", birthdateParams.bd_lt);
        // if bd_gt is specified, filter
        if(birthdateParams.bd_gt)
            patientQuery = patientQuery.where("birthdate", ">=", birthdateParams.bd_gt);
        // if condition is specified, filter
        if(condition)
            patientQuery = patientQuery.where("condition", "==", condition);
        // if gender is specified, filter
        if(gender)
            patientQuery = patientQuery.where("gender", "==", gender);
        // limit the results to the amount requested
        patientQuery = patientQuery.limit(nr_patients);
        const snapshot = await patientQuery.get();
        const docData = snapshot.docs.map((doc: any) =>  doc.id);
        return docData;
    }

    // create a new patient with the fields specified in patientInfo, the current user will be the therapist of this new patient
    async createPatient(patientInfo: any, user: any): Promise<string> {
        try{
            // create the user
            const userRec = await getAuth().createUser({
                email: patientInfo.email,
                displayName: patientInfo.name,
                password: patientInfo.password
            });
            // delete the password from args object
            delete patientInfo.password;
            // add therapist to args object
            patientInfo.therapists = [user.uid];
            // add custom user claim for the patient (adds role claim to the idtokens retrieved from firebase)
            getAuth().setCustomUserClaims(userRec.uid, { role: "patient" }); 
            // create document with user data in the user database
            await userDb.collection('patients').doc(userRec.uid).set(patientInfo);
            // create empty document in the med database TODO hash
            await medDb.collection('patients').doc(hashID(userRec.uid)).set({});
            return userRec.uid;
        // if anything goes wrong throw error
        } catch(error: any) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    // update a patient with the fields specified in patientInfo
    async updatePatient(patientInfo: any, id: string): Promise<string> {
        try{
            // update the user
            const userRec = await getAuth().updateUser(id, {
                email: patientInfo.email,
                displayName: patientInfo.name,
                password: patientInfo.password
            });
            // delete the password from patientInfo object
            delete patientInfo.password;
            // update document with user data in the user database
            await userDb.collection('patients').doc(userRec.uid).update(patientInfo);
            return userRec.uid;
        // if anything goes wrong throw error
        } catch(error: any) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    // delete a patient with the fields specified in args
    async deletePatient(id: string): Promise<string> {
        try{
            // create the user
            await getAuth().deleteUser(id);
            // create document with user data in the user database
            await userDb.collection('patients').doc(id).delete();
            const medUser = medDb.collection('patients').doc(hashID(id));
            // get all subcollections for this user
            const collections = await medUser.listCollections();
            const batch = medDb.batch();
            // for each collection get all documents and delete them via a batch (transaction)
            for (const coll of collections) {
              // Get a new write batch
              const documents = await coll.listDocuments();
          
              for (const doc of documents) {
                batch.delete(doc);
              }
            }
            // execute batch
            await batch.commit();

            await medDb.collection('patients').doc(hashID(id)).delete();
            return id;
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
        // convert firestore timestamp to date object
        docData.birthdate = (docData.birthdate as Timestamp).toDate();
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
            // convert firestore timestamp to date object
            therapistData.birthdate = (therapistData.birthdate as Timestamp).toDate();
            docData.push(therapistData);
        }
        return docData;
    }

    // update a therapist with the fields specified in patientInfo
    async updateTherapist(therapistInfo: any, id: string): Promise<string> {
        try{
            // update the user
            const userRec = await getAuth().updateUser(id, {
                email: therapistInfo.email,
                displayName: therapistInfo.name,
                password: therapistInfo.password
            });
            // delete the password from therapistInfo object
            delete therapistInfo.password;
            // update document with user data in the user database
            await userDb.collection('therapists').doc(userRec.uid).update(therapistInfo);
            return userRec.uid;
        // if anything goes wrong throw error
        } catch(error: any) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
    }

    // delete a patient with the fields specified in args
    async deleteTherapist(id: string): Promise<string> {
        try{
            // create the user
            await getAuth().deleteUser(id);
            // create document with user data in the user database
            await userDb.collection('therapists').doc(id).delete();
            return id;
        // if anything goes wrong throw error
        } catch(error: any) {
            throw new UserInputError(error.errorInfo.message, error.errorInfo);
        }
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
