// IndexedDB Utility for caching large media files (up to 1.2GB) locally and bypassing Firestore 1MB document size limits.

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        try {
            if (typeof window === 'undefined' || !window.indexedDB) {
                return reject(new Error('IndexedDB is not supported or is blocked in this environment.'));
            }
            const request = window.indexedDB.open('ninho-media-cache-db', 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('media')) {
                    db.createObjectStore('media');
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('Failed to open database'));
        } catch (e) {
            reject(e);
        }
    });
};

export const saveMediaLocal = async (id: string, data: Blob | string): Promise<void> => {
    try {
        const db = await initDB();
        const tx = db.transaction('media', 'readwrite');
        tx.objectStore('media').put(data, id);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("IndexedDB save failed:", e);
    }
};

export const getMediaLocal = async (id: string): Promise<Blob | string | null> => {
    try {
        const db = await initDB();
        const tx = db.transaction('media', 'readonly');
        const store = tx.objectStore('media');
        const request = store.get(id);
        return new Promise((resolve) => {
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    } catch (e) {
        console.error("IndexedDB read failed:", e);
        return null;
    }
};
