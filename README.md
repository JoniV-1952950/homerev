# Homerev-API
This repository contains the database-interfacing API for my bachelor's thesis.

The functions directory contains the code for the Firebase Functions platform.

#
The publicly available API can be found at https://europe-west1-homerev-users.cloudfunctions.net/v1. To be able to use this API it is necessary to retrieve an ID token from Firebase and use that in the Authorization header of the request. An ID token can be retrieved using this command in a terminal/command prompt (should have curl installed). The API key for this Firebase project is `AIzaSyAYzvi0vJVGvD-ISNpoWj8iGlTjdkcCiXw`.
```bash
curl 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=[API-key here]' -H 'Content-Type: application/json' --data-binary '{"email":"[email here]","password":"[password here]","returnSecureToken":true}'
```
It is also possible to login to the frontend application and copy the token from the console output (open the developer tools) (https://homerev-frontend.web.app/) The repository for this application can be found here: https://github.com/JoniV-1952950/Homerev-frontend.

#
To run this application locally, you can run these commands in the root directory of the project:
```bash
firebase login ## make sure you are logged in to your firebase account

cd functions

npm run serve ## run locally
npm run deploy ## deploy to firebase functions 
```
The application is also automatically deployed on a push to the main branch of the repository.
