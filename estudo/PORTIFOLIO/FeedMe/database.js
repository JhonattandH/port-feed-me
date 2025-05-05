class Database {
    constructor() {
        this.dbName = 'FeedMeDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject('Erro ao abrir o banco de dados');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Criar stores se não existirem
                if (!db.objectStoreNames.contains('pantryItems')) {
                    const pantryStore = db.createObjectStore('pantryItems', { keyPath: 'id' });
                    pantryStore.createIndex('userId', 'userId', { unique: false });
                }

                if (!db.objectStoreNames.contains('shoppingItems')) {
                    const shoppingStore = db.createObjectStore('shoppingItems', { keyPath: 'id' });
                    shoppingStore.createIndex('userId', 'userId', { unique: false });
                }

                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'id' });
                }
            };
        });
    }

    async addItem(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);

            request.onsuccess = () => resolve(item);
            request.onerror = () => reject('Erro ao adicionar item');
        });
    }

    async getItemsByUserId(storeName, userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Erro ao buscar itens');
        });
    }

    async removeItem(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject('Erro ao remover item');
        });
    }

    async updateItem(storeName, item) {
        return this.addItem(storeName, item);
    }

    async addUser(user) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');
            const request = store.put(user);

            request.onsuccess = () => resolve(user);
            request.onerror = () => reject('Erro ao adicionar usuário');
        });
    }

    async getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const request = store.openCursor();
            
            // Converter o email de busca para minúsculas
            const searchEmail = email.toLowerCase();
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    // Comparar os emails em minúsculas
                    if (cursor.value.email.toLowerCase() === searchEmail) {
                        resolve(cursor.value);
                        return;
                    }
                    cursor.continue();
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = () => reject('Erro ao buscar usuário');
        });
    }
}

export const db = new Database();