import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
