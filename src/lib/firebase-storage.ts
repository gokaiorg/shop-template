import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Uploads a product image file to Firebase Storage and returns its public download URL.
 *
 * @param file - The File object to upload
 * @param customPath - Optional custom path inside storage bucket
 * @returns Promise<string> Public download URL
 */
export async function uploadProductImage(file: File, customPath?: string): Promise<string> {
    if (!file) {
        throw new Error('No file provided for upload.');
    }

    // Clean filename and ensure uniqueness with timestamp & random token
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const storagePath = customPath || `products/${timestamp}-${randomSuffix}-${cleanFileName}`;

    const storageRef = ref(storage, storagePath);

    // Upload file with appropriate metadata
    const metadata = {
        contentType: file.type || 'image/jpeg',
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
}

/**
 * Deletes a product image file from Firebase Storage given its full download URL or relative storage path.
 *
 * @param imageUri - The full download URL or storage path of the image to delete
 */
export async function deleteProductImage(imageUri?: string | null): Promise<void> {
    if (!imageUri) return;

    try {
        let storagePath = imageUri;
        if (imageUri.includes('/o/')) {
            const encodedPath = imageUri.split('/o/')[1]?.split('?')[0];
            if (encodedPath) {
                storagePath = decodeURIComponent(encodedPath);
            }
        } else if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
            // Ignore external URLs (e.g. Unsplash placeholders)
            if (!imageUri.includes('firebasestorage.googleapis.com') && !imageUri.includes('storage.googleapis.com')) {
                return;
            }
        }

        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
    } catch (error: any) {
        if (error?.code === 'storage/object-not-found') {
            return;
        }
        console.warn('[FIREBASE_STORAGE_DELETE_WARNING]', error);
    }
}
