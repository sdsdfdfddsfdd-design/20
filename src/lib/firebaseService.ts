import { collection, getDocs, doc, setDoc, onSnapshot, query, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { GiftItem, DeliveryItem, EmployeeUser } from '../types';
import { INITIAL_GIFTS } from '../data/initialGifts';
import { INITIAL_EMPLOYEES } from '../data/initialEmployees';
import { handleFirestoreError } from './firebaseErrors';

export const collections = {
  gifts: collection(db, 'gifts'),
  deliveries: collection(db, 'deliveries'),
  employees: collection(db, 'employees'),
};

export async function seedDatabase() {
  try {
    const giftsSnapshot = await getDocs(collections.gifts);
    if (giftsSnapshot.empty) {
      console.log('Seeding gifts...');
      for (const gift of INITIAL_GIFTS) {
        await setDoc(doc(db, 'gifts', gift.id), gift);
      }
    }

    const employeesSnapshot = await getDocs(collections.employees);
    if (employeesSnapshot.empty) {
      console.log('Seeding employees...');
      for (const emp of INITIAL_EMPLOYEES) {
        await setDoc(doc(db, 'employees', emp.id), emp);
      }
    }
  } catch (error) {
    console.error('Error seeding database:', handleFirestoreError(error));
  }
}

export function subscribeToGifts(callback: (gifts: GiftItem[]) => void) {
  return onSnapshot(collections.gifts, (snapshot) => {
    const gifts = snapshot.docs.map(doc => doc.data() as GiftItem);
    callback(gifts);
  }, (error) => {
    console.error('Error subscribing to gifts:', handleFirestoreError(error));
  });
}

export function subscribeToEmployees(callback: (employees: EmployeeUser[]) => void) {
  return onSnapshot(collections.employees, (snapshot) => {
    const employees = snapshot.docs.map(doc => doc.data() as EmployeeUser);
    callback(employees);
  }, (error) => {
    console.error('Error subscribing to employees:', handleFirestoreError(error));
  });
}

export function subscribeToDeliveries(callback: (deliveries: DeliveryItem[]) => void) {
  return onSnapshot(collections.deliveries, (snapshot) => {
    const deliveries = snapshot.docs.map(doc => doc.data() as DeliveryItem);
    callback(deliveries);
  }, (error) => {
    console.error('Error subscribing to deliveries:', handleFirestoreError(error));
  });
}

export async function addDelivery(delivery: DeliveryItem) {
  try {
    await setDoc(doc(db, 'deliveries', delivery.id), delivery);
  } catch (error) {
    console.error('Error adding delivery:', handleFirestoreError(error));
  }
}

export async function updateGift(gift: GiftItem) {
  try {
    await setDoc(doc(db, 'gifts', gift.id), gift);
  } catch (error) {
    console.error('Error updating gift:', handleFirestoreError(error));
  }
}

export async function addGift(gift: GiftItem) {
  try {
    await setDoc(doc(db, 'gifts', gift.id), gift);
  } catch (error) {
    console.error('Error adding gift:', handleFirestoreError(error));
  }
}

export async function deleteGift(id: string) {
  try {
    await deleteDoc(doc(db, 'gifts', id));
  } catch (error) {
    console.error('Error deleting gift:', handleFirestoreError(error));
  }
}

export async function updateEmployee(employee: EmployeeUser) {
  try {
    await setDoc(doc(db, 'employees', employee.id), employee);
  } catch (error) {
    console.error('Error updating employee:', handleFirestoreError(error));
  }
}
