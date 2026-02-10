function migrate_remove_tunpopular() {
    const DB_NAME = "tun-cache";
    const STORE_NAME = "requests";
    const TARGET_KEY_VALUE = "tunpopular";

    return new Promise((resolve, reject) => {
        const open = indexedDB.open(DB_NAME);

        open.onerror = () => reject(open.error);

        open.onsuccess = () => {
            const db = open.result;
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);

            store.delete(TARGET_KEY_VALUE);

            tx.oncomplete = () => { db.close(); resolve("success"); };
            tx.onerror = () => { db.close(); reject(tx.error); };
            tx.onabort = () => { db.close(); reject(tx.error); };
        };
    })
}

export default () => {
    return new Promise(async (resolve) => {
        try {
            try {
                await migrate_remove_tunpopular();
            } catch (err) { console.log(`[update] - Error Migrate IndexDB`, err) }
            const keys = ['shadow-api', 'tsk-tunime'];

            keys.forEach(key => localStorage.removeItem(key));
        } finally {
            resolve("success");
        }
    });
}