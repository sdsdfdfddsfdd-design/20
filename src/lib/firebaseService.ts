import { collection, getDocs, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, ensureFirebaseAuth } from './firebase';
import { GiftItem, DeliveryItem, EmployeeUser, HeroBannerItem } from '../types';
import { INITIAL_GIFTS } from '../data/initialGifts';
import { INITIAL_EMPLOYEES } from '../data/initialEmployees';
import { INITIAL_BANNERS } from '../data/initialBanners';
import { handleFirestoreError } from './firebaseErrors';

export const collections = {
  gifts: collection(db, 'gifts'),
  deliveries: collection(db, 'deliveries'),
  employees: collection(db, 'employees'),
  banners: collection(db, 'banners'),
};

export async function seedDatabase() {
  try {
    await ensureFirebaseAuth();

    // 1. Seed & ensure Official Admin is present
    const employeesSnapshot = await getDocs(collections.employees);
    if (employeesSnapshot.empty) {
      console.log('Seeding employees...');
      for (const emp of INITIAL_EMPLOYEES) {
        await setDoc(doc(db, 'employees', emp.id), emp);
      }
    } else {
      // Ensure the official admin exists
      const officialAdmin = INITIAL_EMPLOYEES[0];
      const adminDoc = doc(db, 'employees', officialAdmin.id);
      await setDoc(adminDoc, officialAdmin, { merge: true });
    }

    // 2. Seed gifts
    const giftsSnapshot = await getDocs(collections.gifts);
    if (giftsSnapshot.empty) {
      console.log('Seeding gifts...');
      for (const gift of INITIAL_GIFTS) {
        await setDoc(doc(db, 'gifts', gift.id), gift);
      }
    }

    // 3. Seed banners
    const bannersSnapshot = await getDocs(collections.banners);
    if (bannersSnapshot.empty) {
      console.log('Seeding banners...');
      for (const banner of INITIAL_BANNERS) {
        await setDoc(doc(db, 'banners', banner.id), banner);
      }
    }
  } catch (error) {
    console.error('Error seeding database:', handleFirestoreError(error));
  }
}

// ----------------- GIFTS -----------------
export function subscribeToGifts(callback: (gifts: GiftItem[]) => void) {
  return onSnapshot(collections.gifts, (snapshot) => {
    if (!snapshot.empty) {
      const gifts = snapshot.docs.map(d => d.data() as GiftItem);
      callback(gifts);
    } else {
      callback(INITIAL_GIFTS);
    }
  }, (error) => {
    console.error('Error subscribing to gifts:', handleFirestoreError(error));
  });
}

export async function addGift(gift: GiftItem) {
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, 'gifts', gift.id), gift);
  } catch (error) {
    console.error('Error adding gift:', handleFirestoreError(error));
    throw error;
  }
}

export async function updateGift(gift: GiftItem) {
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, 'gifts', gift.id), gift, { merge: true });
  } catch (error) {
    console.error('Error updating gift:', handleFirestoreError(error));
    throw error;
  }
}

export async function deleteGift(id: string) {
  try {
    await ensureFirebaseAuth();
    await deleteDoc(doc(db, 'gifts', id));
  } catch (error) {
    console.error('Error deleting gift:', handleFirestoreError(error));
    throw error;
  }
}

// ----------------- DELIVERIES / ORDERS -----------------
export function subscribeToDeliveries(callback: (deliveries: DeliveryItem[]) => void) {
  return onSnapshot(collections.deliveries, (snapshot) => {
    const deliveries = snapshot.docs.map(d => d.data() as DeliveryItem);
    callback(deliveries);
  }, (error) => {
    console.error('Error subscribing to deliveries:', handleFirestoreError(error));
  });
}

export async function addDelivery(delivery: DeliveryItem) {
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, 'deliveries', delivery.id), delivery);
  } catch (error) {
    console.error('Error adding delivery:', handleFirestoreError(error));
    throw error;
  }
}

export async function deleteDelivery(id: string) {
  try {
    await ensureFirebaseAuth();
    await deleteDoc(doc(db, 'deliveries', id));
  } catch (error) {
    console.error('Error deleting delivery:', handleFirestoreError(error));
    throw error;
  }
}

// ----------------- EMPLOYEES -----------------
export function subscribeToEmployees(callback: (employees: EmployeeUser[]) => void) {
  return onSnapshot(collections.employees, (snapshot) => {
    if (!snapshot.empty) {
      const employees = snapshot.docs.map(d => d.data() as EmployeeUser);
      callback(employees);
    } else {
      callback(INITIAL_EMPLOYEES);
    }
  }, (error) => {
    console.error('Error subscribing to employees:', handleFirestoreError(error));
  });
}

export async function updateEmployee(employee: EmployeeUser) {
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, 'employees', employee.id), employee, { merge: true });
  } catch (error) {
    console.error('Error updating employee:', handleFirestoreError(error));
    throw error;
  }
}

export async function deleteEmployee(id: string) {
  try {
    await ensureFirebaseAuth();
    await deleteDoc(doc(db, 'employees', id));
  } catch (error) {
    console.error('Error deleting employee:', handleFirestoreError(error));
    throw error;
  }
}

// ----------------- BANNERS -----------------
export function subscribeToBanners(callback: (banners: HeroBannerItem[]) => void) {
  return onSnapshot(collections.banners, (snapshot) => {
    if (!snapshot.empty) {
      const banners = snapshot.docs.map(d => d.data() as HeroBannerItem);
      callback(banners);
    } else {
      callback(INITIAL_BANNERS);
    }
  }, (error) => {
    console.error('Error subscribing to banners:', handleFirestoreError(error));
  });
}

export async function saveBanner(banner: HeroBannerItem) {
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, 'banners', banner.id), banner);
  } catch (error) {
    console.error('Error saving banner:', handleFirestoreError(error));
    throw error;
  }
}

export async function deleteBanner(id: string) {
  try {
    await ensureFirebaseAuth();
    await deleteDoc(doc(db, 'banners', id));
  } catch (error) {
    console.error('Error deleting banner:', handleFirestoreError(error));
    throw error;
  }
}
