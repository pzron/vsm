import type { Product, Customer, Invoice, User } from "@shared/schema";

const DB_NAME = "StoreManagerDB";
const DB_VERSION = 1;

export class IndexedDBStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains("products")) {
          db.createObjectStore("products", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("customers")) {
          db.createObjectStore("customers", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("invoices")) {
          db.createObjectStore("invoices", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("staff")) {
          db.createObjectStore("staff", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("syncQueue")) {
          const syncStore = db.createObjectStore("syncQueue", { keyPath: "timestamp" });
          syncStore.createIndex("synced", "synced", { unique: false });
        }
      };
    });
  }

  private async performOperation<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveProducts(products: Product[]): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction("products", "readwrite");
    const store = transaction.objectStore("products");
    
    for (const product of products) {
      store.put(product);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getProducts(): Promise<Product[]> {
    return this.performOperation("products", "readonly", (store) => store.getAll());
  }

  async saveCustomers(customers: Customer[]): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction("customers", "readwrite");
    const store = transaction.objectStore("customers");
    
    for (const customer of customers) {
      store.put(customer);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCustomers(): Promise<Customer[]> {
    return this.performOperation("customers", "readonly", (store) => store.getAll());
  }

  async saveInvoices(invoices: Invoice[]): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction("invoices", "readwrite");
    const store = transaction.objectStore("invoices");
    
    for (const invoice of invoices) {
      store.put(invoice);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getInvoices(): Promise<Invoice[]> {
    return this.performOperation("invoices", "readonly", (store) => store.getAll());
  }

  async saveStaff(staff: Partial<User>[]): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction("staff", "readwrite");
    const store = transaction.objectStore("staff");
    
    for (const member of staff) {
      store.put(member);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getStaff(): Promise<Partial<User>[]> {
    return this.performOperation("staff", "readonly", (store) => store.getAll());
  }

  async addToSyncQueue(operation: {
    type: string;
    endpoint: string;
    method: string;
    data: any;
    timestamp: number;
    synced: boolean;
  }): Promise<void> {
    return this.performOperation("syncQueue", "readwrite", (store) => 
      store.add(operation)
    );
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction("syncQueue", "readonly");
    const store = transaction.objectStore("syncQueue");
    const index = store.index("synced");
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(false));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(timestamp: number): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction("syncQueue", "readwrite");
    const store = transaction.objectStore("syncQueue");
    
    const getRequest = store.get(timestamp);
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.synced = true;
          store.put(record);
        }
      };
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction("syncQueue", "readwrite");
    const store = transaction.objectStore("syncQueue");
    const index = store.index("synced");
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(true));
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const indexedDB = new IndexedDBStorage();
