/**
 * Hybrid Chat Storage Utility
 *
 * Provides a robust storage solution for chat messages that handles
 * browser storage quotas by using IndexedDB as primary storage with
 * localStorage fallback. Automatically migrates existing localStorage
 * data to IndexedDB.
 *
 * Features:
 * - IndexedDB primary storage (50MB+ capacity)
 * - localStorage fallback when IndexedDB unavailable
 * - Automatic migration from localStorage to IndexedDB
 * - Quota exceeded error handling
 * - Data compression for large chat histories
 * - Batch operations for performance
 */

import { UIMessage } from '@ai-sdk/react';

/**
 * Interface for compressed message storage
 */
interface StoredMessage {
    id: string;
    role: string;
    content: string;
    createdAt?: string | Date;
    p?: unknown; // parts
}

/**
 * Chat storage interface
 */
interface ChatStorage {
    /**
     * Save chat messages for a specific game
     * @param gameId - Game identifier
     * @param messages - Array of chat messages
     */
    saveMessages(gameId: string, messages: UIMessage[]): Promise<void>;

    /**
     * Load chat messages for a specific game
     * @param gameId - Game identifier
     * @returns Array of chat messages or null if not found
     */
    loadMessages(gameId: string): Promise<UIMessage[] | null>;

    /**
     * Migrate existing localStorage data to IndexedDB
     * @returns Promise that resolves when migration is complete
     */
    migrateFromLocalStorage(): Promise<void>;

    /**
     * Clear all chat data for a specific game
     * @param gameId - Game identifier
     */
    clearMessages(gameId: string): Promise<void>;
}

/**
 * IndexedDB Chat Storage Implementation
 */
class IndexedDBChatStorage implements ChatStorage {
    private dbName = 'HatchStudiosChatStorage';
    private storeName = 'chatMessages';
    private dbVersion = 1;
    private db: IDBDatabase | null = null;
    private ready: Promise<void>;

    constructor() {
        this.ready = this.initializeDB();
    }

    private async initializeDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') {
                reject(new Error('IndexedDB not supported'));
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('❌ IndexedDB error:', event);
                reject(new Error('Failed to open IndexedDB'));
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'gameId' });
                }
            };
        });
    }

    private async ensureDBReady(): Promise<void> {
        try {
            await this.ready;
        } catch (error) {
            console.warn('⚠️ IndexedDB not available, falling back to localStorage');
            throw error;
        }
    }

    async saveMessages(gameId: string, messages: UIMessage[]): Promise<void> {
        try {
            await this.ensureDBReady();

            const db = this.db;
            if (!db) {
                throw new Error('IndexedDB not initialized');
            }

            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            // Use compression for large message arrays
            const compressedData = this.compressMessages(messages);

            const request = store.put({
                gameId,
                messages: compressedData,
                updatedAt: new Date().toISOString()
            });

            await new Promise<void>((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = (event) => {
                    console.error('❌ Failed to save messages to IndexedDB:', event);
                    reject(new Error('Failed to save messages'));
                };
            });
        } catch (error) {
            console.warn('⚠️ IndexedDB save failed, falling back to localStorage:', error);
            this.fallbackToLocalStorage(gameId, messages);
        }
    }

    async loadMessages(gameId: string): Promise<UIMessage[] | null> {
        try {
            await this.ensureDBReady();

            const db = this.db;
            if (!db) {
                throw new Error('IndexedDB not initialized');
            }

            return new Promise<UIMessage[] | null>((resolve, reject) => {
                const transaction = db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(gameId);

                request.onsuccess = () => {
                    if (request.result) {
                        try {
                            const decompressed = this.decompressMessages(request.result.messages as StoredMessage[]);
                            resolve(decompressed);
                        } catch (error) {
                            console.error('❌ Failed to decompress messages:', error);
                            resolve([]);
                        }
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = (event) => {
                    console.error('❌ Failed to load messages from IndexedDB:', event);
                    reject(new Error('Failed to load messages'));
                };
            });
        } catch (error) {
            console.warn('⚠️ IndexedDB load failed, falling back to localStorage:', error);
            return this.fallbackLoadFromLocalStorage(gameId);
        }
    }

    async migrateFromLocalStorage(): Promise<void> {
        try {
            // Check if localStorage has any chat data
            const localStorageKeys = Object.keys(localStorage);
            const chatKeys = localStorageKeys.filter(key => key.startsWith('studio-conversation-'));

            if (chatKeys.length === 0) {
                console.log('📂 No localStorage chat data to migrate');
                return;
            }

            console.log('🚀 Migrating', chatKeys.length, 'chat histories from localStorage to IndexedDB');

            await this.ensureDBReady();

            const db = this.db;
            if (!db) {
                throw new Error('IndexedDB not initialized');
            }

            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            for (const key of chatKeys) {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const messages = JSON.parse(data) as UIMessage[];
                        const gameId = key.replace('studio-conversation-', '');

                        // Compress and store
                        const compressedData = this.compressMessages(messages);

                        await new Promise<void>((resolve, reject) => {
                            const request = store.put({
                                gameId,
                                messages: compressedData,
                                updatedAt: new Date().toISOString()
                            });
                            request.onsuccess = () => resolve();
                            request.onerror = (event) => {
                                console.error('❌ Failed to migrate chat data for key', key, ':', event);
                                reject(new Error('Failed to migrate chat data'));
                            };
                        });

                        // Remove from localStorage after successful migration
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    console.error('❌ Failed to migrate chat data for key', key, ':', error);
                }
            }

            console.log('✅ Chat data migration completed');
        } catch (error) {
            console.error('❌ Chat data migration failed:', error);
        }
    }

    async clearMessages(gameId: string): Promise<void> {
        try {
            await this.ensureDBReady();

            const db = this.db;
            if (!db) {
                throw new Error('IndexedDB not initialized');
            }

            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(gameId);

            await new Promise<void>((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = (event) => {
                    console.error('❌ Failed to clear messages from IndexedDB:', event);
                    reject(new Error('Failed to clear messages'));
                };
            });
        } catch (error) {
            console.warn('⚠️ IndexedDB clear failed, falling back to localStorage:', error);
            localStorage.removeItem(`studio-conversation-${gameId}`);
        }
    }

    /**
     * Simple compression for chat messages
     * Removes redundant data and uses shorter keys
     */
    private compressMessages(messages: UIMessage[]): StoredMessage[] {
        return messages.map(msg => {
            const msgAny = msg as unknown as Record<string, unknown>;
            const content = (msgAny.content as string) ?? '';
            const createdAt = msgAny.createdAt as string | Date;
            const parts = msgAny.parts as unknown[];

            const result: StoredMessage = {
                id: msg.id || '',
                role: msg.role || 'user',
                content,
                createdAt,
            };

            // Only include parts if they exist and are different from content
            if (parts && parts.length > 0) {
                // If it's more than just a simple text part matching the content, store it
                const isSimpleText = parts.length === 1 &&
                    parts[0].type === 'text' &&
                    parts[0].text === content;

                if (!isSimpleText) {
                    result.p = parts;
                }
            }

            return result;
        });
    }

    /**
     * Decompress messages back to full format
     */
    private decompressMessages(compressed: StoredMessage[]): UIMessage[] {
        return compressed.map(msg => {
            // Reconstruct UIMessage structure with proper typing
            const result: UIMessage = {
                id: msg.id,
                role: msg.role as UIMessage['role'],
                content: msg.content,
                createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined,
            };

            // Handle parts - ensure proper structure
            if (msg.p) {
                const parts = msg.p as any[];
                // Map tool-call-related data into toolInvocations for assistant messages
                if (msg.role === 'assistant') {
                    const toolInvocations = parts
                        .filter(p => p.type === 'tool-call' || p.type === 'tool-result')
                        .map(p => ({
                            toolCallId: p.toolCallId,
                            toolName: p.toolName,
                            args: p.args,
                            result: p.result,
                            state: p.type === 'tool-result' ? 'result' : 'call'
                        }));
                    
                    if (toolInvocations.length > 0) {
                        (result as any).toolInvocations = toolInvocations;
                    }
                }
                (result as any).parts = parts;
            } else {
                (result as any).parts = [{ type: 'text', text: msg.content }];
            }

            return result;
        });
    }

    /**
     * Fallback to localStorage when IndexedDB fails
     */
    private fallbackToLocalStorage(gameId: string, messages: UIMessage[]): void {
        try {
            const storageKey = `studio-conversation-${gameId}`;
            localStorage.setItem(storageKey, JSON.stringify(messages));
            console.log('💾 Saved messages to localStorage fallback');
        } catch (error) {
            console.error('❌ Both IndexedDB and localStorage failed:', error);
            // If both fail, we have to accept data loss
        }
    }

    /**
     * Fallback load from localStorage when IndexedDB fails
     */
    private fallbackLoadFromLocalStorage(gameId: string): UIMessage[] | null {
        try {
            const storageKey = `studio-conversation-${gameId}`;
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) as UIMessage[] : null;
        } catch (error) {
            console.error('❌ Failed to load from localStorage fallback:', error);
            return null;
        }
    }
}

/**
 * LocalStorage-only fallback implementation
 */
class LocalStorageChatStorage implements ChatStorage {
    async saveMessages(gameId: string, messages: UIMessage[]): Promise<void> {
        try {
            const storageKey = `studio-conversation-${gameId}`;
            localStorage.setItem(storageKey, JSON.stringify(messages));
        } catch (error) {
            console.error('❌ Failed to save messages to localStorage:', error);
            // Handle quota exceeded errors
            if (this.isQuotaExceededError(error)) {
                console.warn('🚨 localStorage quota exceeded - implementing data retention policy');
                this.handleQuotaExceeded(gameId, messages);
            }
        }
    }

    async loadMessages(gameId: string): Promise<UIMessage[] | null> {
        try {
            const storageKey = `studio-conversation-${gameId}`;
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) as UIMessage[] : null;
        } catch (error) {
            console.error('❌ Failed to load messages from localStorage:', error);
            return null;
        }
    }

    async migrateFromLocalStorage(): Promise<void> {
        // No migration needed for localStorage-only implementation
    }

    async clearMessages(gameId: string): Promise<void> {
        try {
            const storageKey = `studio-conversation-${gameId}`;
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('❌ Failed to clear messages from localStorage:', error);
        }
    }

    /**
     * Check if error is a quota exceeded error
     */
    private isQuotaExceededError(error: unknown): boolean {
        return error instanceof DOMException &&
            (error.name === 'QuotaExceededError' ||
                error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    }

    /**
     * Handle quota exceeded by implementing a data retention policy
     * Keep only the most recent messages to stay under quota
     */
    private handleQuotaExceeded(gameId: string, newMessages: UIMessage[]): void {
        try {
            const storageKey = `studio-conversation-${gameId}`;

            // The new payload is too large, so truncate it directly.
            const retainedMessages = newMessages.slice(-50);

            try {
                localStorage.setItem(storageKey, JSON.stringify(retainedMessages));
                console.log('📉 Reduced chat history to', retainedMessages.length, 'messages to stay under quota');
            } catch (error) {
                console.error('❌ Even reduced dataset failed to save:', error);
                localStorage.removeItem(storageKey);
                console.log('🗑️ Removed chat history as it could not be reduced to fit quota.');
            }
        } catch (error) {
            console.error('❌ All quota handling strategies failed:', error);
            // Data loss is unavoidable at this point
        }
    }
}

/**
 * Chat Storage Factory - creates the appropriate storage implementation
 */
export function createChatStorage(): ChatStorage {
    // Check if IndexedDB is available
    if (typeof indexedDB !== 'undefined') {
        try {
            return new IndexedDBChatStorage();
        } catch (error) {
            console.warn('⚠️ IndexedDB not available, falling back to localStorage:', error);
        }
    }

    // Fallback to localStorage-only implementation
    return new LocalStorageChatStorage();
}

/**
 * Singleton chat storage instance
 */
const chatStorage = createChatStorage();

// Export the singleton instance
export default chatStorage;

// Export types for better TypeScript support
export type { ChatStorage, UIMessage };
