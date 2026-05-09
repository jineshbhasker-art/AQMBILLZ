/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  Product, 
  Customer, 
  Supplier, 
  Sale, 
  Voucher, 
  PromoVoucher,
  PurchaseInvoice,
  Transaction,
  BusinessProfile,
  Expense,
  Repair,
  ExpenseCategory
} from '../types';

// Generic CRUD helper
const createCRUD = <T extends { id?: string }>(collectionPath: string) => {
  return {
    getAll: async () => {
      try {
        const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    },
    
    getById: async (id: string) => {
      try {
        const docRef = doc(db, collectionPath, id);
        const snapshot = await getDoc(docRef);
        return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, collectionPath);
      }
    },

    add: async (data: Omit<T, 'id'>) => {
      try {
        const docRef = await addDoc(collection(db, collectionPath), {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return docRef.id;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, collectionPath);
      }
    },

    update: async (id: string, data: Partial<T>) => {
      try {
        const docRef = doc(db, collectionPath, id);
        await updateDoc(docRef, {
          ...data,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, collectionPath);
      }
    },

    delete: async (id: string) => {
      try {
        const docRef = doc(db, collectionPath, id);
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, collectionPath);
      }
    },
    
    subscribe: (callback: (data: T[]) => void) => {
      const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
         const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
         callback(items);
      }, (error) => {
         handleFirestoreError(error, OperationType.LIST, collectionPath);
      });
    }
  };
};

export const productsService = createCRUD<Product>('products');
export const customersService = createCRUD<Customer>('customers');
export const suppliersService = createCRUD<Supplier>('suppliers');
export const salesService = createCRUD<Sale>('sales');
export const vouchersService = createCRUD<Voucher>('vouchers');
export const promoVouchersService = createCRUD<PromoVoucher>('promo_vouchers');
export const purchasesService = createCRUD<PurchaseInvoice>('purchases');
export const transactionsService = createCRUD<Transaction>('transactions');
export const expensesService = createCRUD<Expense>('expenses');
export const expenseCategoriesService = createCRUD<ExpenseCategory>('expense_categories');
export const repairsService = createCRUD<Repair>('repairs');

export interface AppUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const usersService = createCRUD<AppUser>('users');

export const businessProfileService = {
  get: async () => {
    try {
      const docRef = doc(db, 'settings', 'businessProfile');
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? (snapshot.data() as BusinessProfile) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'settings/businessProfile');
      return null;
    }
  },
  save: async (data: Partial<BusinessProfile>) => {
    try {
      const docRef = doc(db, 'settings', 'businessProfile');
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/businessProfile');
    }
  },
  subscribe: (callback: (data: BusinessProfile | null) => void) => {
    const docRef = doc(db, 'settings', 'businessProfile');
    return onSnapshot(docRef, (snapshot) => {
      callback(snapshot.exists() ? (snapshot.data() as BusinessProfile) : null);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/businessProfile');
    });
  }
};

// Special helpers
export const getActiveProducts = async () => {
  try {
    const q = query(collection(db, 'products'), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
  }
};
