import { collection, doc, getDoc, getDocs, setDoc, QuerySnapshot, serverTimestamp } from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase';
import { FireStoreCollection, IUserInfo, UserProfileProps } from '../types';

/**
 * User service responsible for user document operations
 */
export class UserService {
  private static instance: UserService;
  private db;

  private constructor() {
    this.db = getFirebaseFirestore();
  }

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Check if a user document exists in Firestore
   * @param userId - The ID of the user to check
   * @returns Promise<boolean> - True if user exists, false otherwise
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(this.db, FireStoreCollection.users, userId));
      return userDoc.exists();
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  /**
   * Create a user document if it doesn't exist
   * @param userId - The ID of the user
   * @param userData - Optional user data to store
   * @returns Promise<void>
   */
  async createUserIfNotExists(
    userId: string,
    userData?: Partial<IUserInfo & Pick<UserProfileProps, 'status'>> & Record<string, unknown>
  ): Promise<void> {
    try {
      const exists = await this.userExists(userId);
      if (!exists) {
        await setDoc(doc(this.db, FireStoreCollection.users, userId), {
          id: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...userData,
        });
        console.log(`User document ${userId} created successfully.`);
      }
    } catch (error) {
      console.error('Error creating user document:', error);
      throw new Error('Failed to create user document');
    }
  }

  /**
   * Get a single user by ID
   */
  async getUserById(userId: string): Promise<IUserInfo | null> {
    try {
      const userDoc = await getDoc(doc(this.db, FireStoreCollection.users, userId));
      if (!userDoc.exists()) return null;
      const data = userDoc.data() as Partial<IUserInfo> | undefined;
      return { id: userDoc.id, name: data?.name || '', avatar: data?.avatar };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Get a list of all users in the users collection
   */
  async getAllUsers(): Promise<IUserInfo[]> {
    try {
      const snapshot: QuerySnapshot = await getDocs(collection(this.db, FireStoreCollection.users));
      const users: IUserInfo[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Partial<IUserInfo> | undefined;
        users.push({ id: docSnap.id, name: data?.name || '', avatar: data?.avatar });
      });
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }
}

export default UserService;


