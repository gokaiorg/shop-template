import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Recursively converts Firestore document data into plain JSON-serializable JavaScript objects.
 * Converts Firestore Timestamps or any objects with .toDate() to ISO string dates,
 * handles native Dates, and traverses nested arrays and objects.
 */
export function serializeFirestore<T = any>(data: any): T {
  if (data === null || data === undefined) {
    return data;
  }

  function toPlain(val: any): any {
    if (val === null || val === undefined) return val;

    // Check for Firestore Sentinel values (like FieldValue.delete())
    if (typeof val === 'object' && (val.constructor?.name === 'DeleteTransform' || val.constructor?.name === 'FieldValue')) {
      return undefined;
    }

    // Firestore Timestamp or object with toDate()
    if (typeof val.toDate === 'function') {
      return val.toDate().toISOString();
    }

    // Native Date
    if (val instanceof Date) {
      return val.toISOString();
    }

    // Array traversal
    if (Array.isArray(val)) {
      return val.map(toPlain).filter((item) => item !== undefined);
    }

    // Object traversal
    if (typeof val === 'object') {
      const plain: Record<string, any> = {};
      for (const [key, value] of Object.entries(val)) {
        const converted = toPlain(value);
        if (converted !== undefined) {
          plain[key] = converted;
        }
      }
      return plain;
    }

    return val;
  }

  const plain = toPlain(data);
  try {
    return JSON.parse(JSON.stringify(plain));
  } catch {
    return plain;
  }
}

export {
  getContrastTextColor,
  isLightColor,
  getLuminance,
  getYIQ,
  getContrastRatio,
  getContrastHex,
  parseColorToRgb,
  resolveCssVariable,
} from "./utils/colors";

