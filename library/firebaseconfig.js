// Import the functions you need from the SDKs you need
import {initializeApp} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcJ_BmmgTA5qim0Ss8whImWLx97QH8_mI",
  authDomain: "library-ee92b.firebaseapp.com",
  projectId: "library-ee92b",
  storageBucket: "library-ee92b.appspot.com",
  messagingSenderId: "175925752924",
  appId: "1:175925752924:web:b0b8551b4e448884642299"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);
export const storage = getStorage(app);

  export {db, auth};