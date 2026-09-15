import { collection, getDocs, doc, setDoc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, ensureFirebaseAuth } from './firebase';
import { GiftItem, DeliveryItem, EmployeeUser, HeroBannerItem, CustomCategory, SiteSettings, UserRole, UserPermissions } from '../types';
import { INITIAL_GIFTS } from '../data/initialGifts';
import { INITIAL_EMPLOYEES } from '../data/initialEmployees';
import { INITIAL_BANNERS } from '../data/initialBanners';
import { INITIAL_CATEGORIES } from '../data/initialCategories';
import { handleFirestoreError } from './firebaseErrors';

export const collections = {
  gifts: collection(db, 'gifts'),
  deliveries: collection(db, 'deliveries'),
  employees: collection(db, 'employees'),
  users: collection(db, 'users'),
  banners: collection(db, 'banners'),
  categories: collection(db, 'categories'),
  settings: collection(db, 'settings'),
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'Jiawei Effects | جياوي للمؤثرات',
  siteSlogan: 'LIVE STREAM VFX',
  siteSubTitle: 'مؤثرات بصرية وهدايا رقمية للبث المباشر',
  logoUrl: ''
};

export async function seedDatabase() {
  try {
    await ensureFirebaseAuth();

    // 1. Seed & ensure Official Admin and initial employees are present
    const employeesSnapshot = await getDocs(collections.employees);
    if (employeesSnapshot.empty) {
      console.log('Seeding employees into Firestore database...');
      for (const emp of INITIAL_EMPLOYEES) {
        await setDoc(doc(db, 'employees', emp.id), emp);
      }
    } else {
      // Ensure the official admin exists and has latest permissions
      const officialAdmin = INITIAL_EMPLOYEES[0];
      const adminDoc = doc(db, 'employees', officialAdmin.id);
      await setDoc(adminDoc, officialAdmin, { merge: true });
    }

    // 2. Seed gifts
    const giftsSnapshot = await getDocs(collections.gifts);
    if (giftsSnapshot.empty) {
      console.log('Seeding real gifts into Firestore database...');
      for (const gift of INITIAL_GIFTS) {
        await setDoc(doc(db, 'gifts', gift.id), gift);
      }
    }

    // 3. Seed banners
    const bannersSnapshot = await getDocs(collections.banners);
    if (bannersSnapshot.empty) {
      console.log('Seeding hero banners into Firestore database...');
      for (const banner of INITIAL_BANNERS) {
        await setDoc(doc(db, 'banners', banner.id), banner);
      }
    }

    // 4. Seed categories (General Category as base default)
    const categoriesSnapshot = await getDocs(collections.categories);
    if (categoriesSnapshot.empty) {
      console.log('Seeding initial categories into Firestore database...');
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }
    }

    // 5. Seed site settings
    const settingsDoc = doc(db, 'settings', 'general');
    const settingsSnapshot = await getDocs(collections.settings);
    if (settingsSnapshot.empty) {
      console.log('Seeding default site settings into Firestore...');
      await setDoc(settingsDoc, DEFAULT_SITE_SETTINGS);
    }
  } catch (error) {
    console.error('Error seeding database:', handleFirestoreError(error));
  }
}

function sanitizeData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        clean[k] = sanitizeData(v);
      } else {
        clean[k] = v;
      }
    }
  }
  return clean;
}

// ----------------- GIFTS -----------------
export function subscribeToGifts(callback: (gifts: GiftItem[]) => void) {
  return onSnapshot(collections.gifts, (snapshot) => {
    const gifts = snapshot.docs.map(d => d.data() as GiftItem);
    if (gifts.length > 0) {
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
    await setDoc(doc(db, 'gifts', gift.id), sanitizeData(gift));
  } catch (error) {
    console.error('Error adding gift:', handleFirestoreError(error));
    throw error;
  }
}

export async function updateGift(gift: GiftItem) {
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, 'gifts', gift.id), sanitizeData(gift), { merge: true });
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

/**
 * Updates WhatsApp contact on all gifts uploaded by a specific creator/employee
 */
export async function updateCreatorGiftsWhatsapp(creatorId: string, creatorName: string, newWhatsapp: string): Promise<number> {
  try {
    await ensureFirebaseAuth();
    const giftsSnapshot = await getDocs(collections.gifts);
    let updatedCount = 0;
    const updatePromises: Promise<void>[] = [];

    giftsSnapshot.forEach((giftDoc) => {
      const data = giftDoc.data() as GiftItem;
      const matchById = creatorId && data.author?.id === creatorId;
      const matchByName = creatorName && data.author?.name && 
        data.author.name.trim().toLowerCase() === creatorName.trim().toLowerCase();

      if (matchById || matchByName) {
        const updatedAuthor = {
          ...data.author,
          whatsapp: newWhatsapp
        };
        updatePromises.push(
          updateDoc(doc(db, 'gifts', giftDoc.id), {
            'author.whatsapp': newWhatsapp
          })
        );
        updatedCount++;
      }
    });

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }
    return updatedCount;
  } catch (error) {
    console.error('Error updating creator gifts WhatsApp:', handleFirestoreError(error));
    return 0;
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
    const colName = (employee.role === 'designer' || employee.role === 'admin' || employee.role === 'employee') 
      ? 'employees' 
      : 'users';
    await setDoc(doc(db, colName, employee.id), sanitizeData(employee), { merge: true });
  } catch (error) {
    console.error('Error updating employee:', handleFirestoreError(error));
    throw error;
  }
}

export async function changeEmployeeRole(employee: EmployeeUser, newRole: UserRole) {
  try {
    await ensureFirebaseAuth();
    
    // Determine collections based on old and new roles
    const oldColName = (employee.role === 'designer' || employee.role === 'admin' || employee.role === 'employee') 
      ? 'employees' 
      : 'users';
      
    const newColName = (newRole === 'designer' || newRole === 'admin' || newRole === 'employee') 
      ? 'employees' 
      : 'users';
      
    const updatedEmployee = { ...employee, role: newRole };
    
    // If collection changes, write to new and delete from old
    if (oldColName !== newColName) {
      await setDoc(doc(db, newColName, employee.id), sanitizeData(updatedEmployee), { merge: true });
      await deleteDoc(doc(db, oldColName, employee.id));
    } else {
      // Just update in the same collection
      await setDoc(doc(db, newColName, employee.id), sanitizeData(updatedEmployee), { merge: true });
    }
  } catch (error) {
    console.error('Error changing employee role:', handleFirestoreError(error));
    throw error;
  }
}

export async function toggleEmployeeStatus(id: string, status: 'active' | 'inactive', role: UserRole = 'employee') {
  try {
    await ensureFirebaseAuth();
    const colName = (role === 'designer' || role === 'admin' || role === 'employee') 
      ? 'employees' 
      : 'users';
    await setDoc(doc(db, colName, id), { status }, { merge: true });
  } catch (error) {
    console.error('Error toggling employee status:', handleFirestoreError(error));
    throw error;
  }
}

export async function updateEmployeePermissions(id: string, permissions: Partial<UserPermissions>, role: UserRole = 'employee') {
  try {
    await ensureFirebaseAuth();
    const colName = (role === 'designer' || role === 'admin' || role === 'employee') 
      ? 'employees' 
      : 'users';
    const empRef = doc(db, colName, id);
    
    // We update the permissions object inside the document
    await setDoc(empRef, { permissions }, { merge: true });
  } catch (error) {
    console.error('Error updating employee permissions:', handleFirestoreError(error));
    throw error;
  }
}

export async function toggleEmployeeGiftPermission(id: string, canUpload: boolean, role: UserRole = 'employee') {
  try {
    await ensureFirebaseAuth();
    const colName = (role === 'designer' || role === 'admin' || role === 'employee') 
      ? 'employees' 
      : 'users';
    const empRef = doc(db, colName, id);
    try {
      await updateDoc(empRef, {
        'permissions.giftUploadAndPublish': canUpload
      });
    } catch {
      await setDoc(empRef, { 
        permissions: { 
          giftUploadAndPublish: canUpload 
        } 
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error toggling employee gift permission:', handleFirestoreError(error));
    throw error;
  }
}

export async function deleteEmployee(id: string, role: UserRole = 'employee') {
  try {
    await ensureFirebaseAuth();
    const colName = (role === 'designer' || role === 'admin' || role === 'employee') 
      ? 'employees' 
      : 'users';
    await deleteDoc(doc(db, colName, id));
  } catch (error) {
    console.error('Error deleting employee:', handleFirestoreError(error));
    throw error;
  }
}

// ----------------- USERS / BUYERS ACCOUNTS -----------------
export function subscribeToUsers(callback: (users: EmployeeUser[]) => void) {
  return onSnapshot(collections.users, (snapshot) => {
    if (!snapshot.empty) {
      const users = snapshot.docs.map(d => d.data() as EmployeeUser);
      callback(users);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Error subscribing to users:', handleFirestoreError(error));
  });
}

export async function saveUserToDatabase(user: EmployeeUser) {
  try {
    await ensureFirebaseAuth();
    // Save to users collection, or employees if role is designer/admin/employee
    const colName = (user.role === 'designer' || user.role === 'admin' || user.role === 'employee') 
      ? 'employees' 
      : 'users';
    await setDoc(doc(db, colName, user.id), sanitizeData(user), { merge: true });
  } catch (error) {
    console.error('Error saving user to database:', handleFirestoreError(error));
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
    await setDoc(doc(db, 'banners', banner.id), sanitizeData(banner));
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

// ----------------- CUSTOM CATEGORIES -----------------
export function subscribeToCategories(callback: (categories: CustomCategory[]) => void) {
  return onSnapshot(collections.categories, (snapshot) => {
    if (!snapshot.empty) {
      const cats = snapshot.docs.map(d => d.data() as CustomCategory);
      // Ensure 'general' exists and is at the beginning
      const generalIndex = cats.findIndex(c => c.id === 'general');
      if (generalIndex > 0) {
        const [gen] = cats.splice(generalIndex, 1);
        cats.unshift(gen);
      } else if (generalIndex === -1) {
        cats.unshift(INITIAL_CATEGORIES[0]);
      }
      callback(cats);
    } else {
      callback(INITIAL_CATEGORIES);
    }
  }, (error) => {
    console.error('Error subscribing to categories:', handleFirestoreError(error));
    callback(INITIAL_CATEGORIES);
  });
}

export async function saveCategory(category: CustomCategory) {
  try {
    await ensureFirebaseAuth();
    await setDoc(doc(db, 'categories', category.id), sanitizeData(category));
  } catch (error) {
    console.error('Error saving category:', handleFirestoreError(error));
    throw error;
  }
}

export async function deleteCategory(id: string) {
  if (id === 'general') {
    throw new Error('لا يمكن حذف القسم العام لأنه القسم الأساسي للنظام');
  }
  try {
    await ensureFirebaseAuth();
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    console.error('Error deleting category:', handleFirestoreError(error));
    throw error;
  }
}

// ----------------- SITE SETTINGS (NAME & LOGO) -----------------
export function subscribeToSiteSettings(callback: (settings: SiteSettings) => void) {
  const settingsDocRef = doc(db, 'settings', 'general');
  return onSnapshot(settingsDocRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as SiteSettings);
    } else {
      callback(DEFAULT_SITE_SETTINGS);
    }
  }, (error) => {
    console.error('Error subscribing to site settings:', handleFirestoreError(error));
    callback(DEFAULT_SITE_SETTINGS);
  });
}

export async function saveSiteSettings(settings: SiteSettings) {
  try {
    await ensureFirebaseAuth();
    const settingsDocRef = doc(db, 'settings', 'general');
    await setDoc(settingsDocRef, sanitizeData(settings), { merge: true });
    // Local storage backup for instantaneous initial paint
    localStorage.setItem('jiawei_site_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving site settings:', handleFirestoreError(error));
    throw error;
  }
}

