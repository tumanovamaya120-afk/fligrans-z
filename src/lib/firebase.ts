import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ExtractedVideo } from '../types';

// 1. Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 2. Initialize Firestore with specific database ID (CRITICAL per guidelines)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// 3. Initialize Auth & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// 4. Validate connection to Firestore on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: the client is offline or network is limited.');
    }
  }
}
testConnection();

// 5. Standard Error Handling as required by Firestore ABAC Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 6. Firestore Database Operations for Users and Downloads History

/**
 * Creates or updates the user profile document upon sign-in
 */
export async function syncUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}) {
  const userPath = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

/**
 * Adds or updates a downloaded video in the user's personal cloud history
 */
export async function saveDownloadToFirestore(userId: string, video: ExtractedVideo) {
  // Sanitize document ID to match isValidId regex
  const cleanDocId = (video.id || `dl_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${userId}/downloads/${cleanDocId}`;

  try {
    const docRef = doc(db, 'users', userId, 'downloads', cleanDocId);
    await setDoc(
      docRef,
      {
        id: cleanDocId,
        userId: userId,
        platform: video.platform,
        title: (video.title || 'Video').slice(0, 500),
        author: (video.author || '').slice(0, 150),
        thumbnail: (video.thumbnail || '').slice(0, 2048),
        originalUrl: video.originalUrl.slice(0, 2048),
        timestamp: video.timestamp || Date.now(),
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a single download record from user's history
 */
export async function deleteDownloadFromFirestore(userId: string, downloadId: string) {
  const cleanDocId = downloadId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `users/${userId}/downloads/${cleanDocId}`;
  try {
    const docRef = doc(db, 'users', userId, 'downloads', cleanDocId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to real-time updates of the user's download history
 */
export function subscribeToUserDownloads(
  userId: string,
  onUpdate: (videos: ExtractedVideo[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/downloads`;
  const downloadsRef = collection(db, 'users', userId, 'downloads');
  const q = query(downloadsRef, orderBy('timestamp', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ExtractedVideo[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: data.id || d.id,
          platform: data.platform || 'instagram',
          title: data.title || 'İndirilen Video',
          author: data.author || '',
          thumbnail: data.thumbnail || '',
          originalUrl: data.originalUrl || '',
          downloads: [], // Options are re-extractable or stored in metadata
          timestamp: data.timestamp || Date.now(),
        });
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
