import { 
  initializeFirestore,
  doc, 
  getDoc, 
  setDoc, 
  addDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  serverTimestamp, 
  getDocFromServer 
} from "firebase/firestore";
import { app } from "./firebaseAuthService";
import { auth } from "./firebaseAuthService";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firestore robustly with long polling for proxy/iframe-embedded environments
const DATABASE_ID = "ai-studio-aigeezkeyboard-dace50ee-1fa2-46b6-adbc-f0bf24ed5201";

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, DATABASE_ID);

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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate Connection to Firestore on startup
 */
export async function testConnection() {
  const path = 'test/connection';
  try {
    // Try to get a dummy doc from the server to verify Firestore connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("[Firestore] Connection verified successfully with server.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("[Firestore] Initial check: Client is offline. This is expected in a sandboxed/restricted environment or before terms are accepted.");
    } else {
      console.warn("[Firestore] Initial connectivity check (expected if test collection empty):", error);
    }
  }
}

interface UserMemoriesData {
  memories: string[];
  isEnabled: boolean;
}

/**
 * Load user memories from firestore
 */
export async function loadUserMemories(userId: string): Promise<UserMemoriesData | null> {
  const path = `users_memories/${userId}`;
  try {
    const docRef = doc(db, "users_memories", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        memories: data.memories || [],
        isEnabled: data.isEnabled !== false // Default to true if not explicitly defined
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Save user memories to firestore
 */
export async function saveUserMemories(userId: string, memories: string[], isEnabled: boolean): Promise<void> {
  const path = `users_memories/${userId}`;
  try {
    const docRef = doc(db, "users_memories", userId);
    await setDoc(docRef, {
      userId,
      memories,
      isEnabled,
      updatedAt: serverTimestamp()
    });
    console.log(`[Firestore] Saved ${memories.length} memories for user ${userId}. Enabled: ${isEnabled}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface Reminder {
  id?: string;
  userId: string;
  title: string;
  dueAt: any; // Timestamp
  createdAt?: any;
  status: 'pending' | 'sent' | 'cancelled';
}

/**
 * Load user reminders
 */
export async function loadReminders(userId: string): Promise<Reminder[]> {
  const path = `reminders`;
  try {
    const q = query(
      collection(db, "reminders"),
      where("userId", "==", userId),
      orderBy("dueAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reminder[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Add a new reminder
 */
export async function addReminder(reminder: Omit<Reminder, 'id'>): Promise<string | null> {
  const path = `reminders`;
  try {
    const docRef = await addDoc(collection(db, "reminders"), {
      ...reminder,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return null;
  }
}

/**
 * Delete a reminder
 */
export async function deleteReminder(reminderId: string): Promise<void> {
  const path = `reminders/${reminderId}`;
  try {
    await deleteDoc(doc(db, "reminders", reminderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
