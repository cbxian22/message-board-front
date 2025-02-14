const DB_NAME = "ChatAppDB";
const STORE_NAME = "messages";
const DB_VERSION = 1;

// 開啟 IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("chatId", "chatId", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("❌ IndexedDB 無法開啟！");
  });
};

// 儲存訊息（確保 message.id 唯一）
export const saveMessage = async (message) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // 確保 message 有 id，若無則手動添加
    const newMessage = {
      ...message,
      id:
        message.id ||
        `${message.chatId}-${message.timestamp}-${message.senderId}`,
    };

    const request = store.put(newMessage);

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      console.error("❌ 無法儲存訊息！", event.target.error);
      reject("❌ 無法儲存訊息！");
    };
  });
};

// 取得指定 chatId 的所有訊息（依時間排序）
export const getMessages = async (chatId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("chatId");
    const request = index.getAll(IDBKeyRange.only(chatId));

    request.onsuccess = () => {
      const sortedMessages = request.result.sort(
        (a, b) => a.timestamp - b.timestamp
      );
      resolve(sortedMessages);
    };

    request.onerror = () => reject("❌ 無法取得聊天記錄！");
  });
};

// 刪除訊息
export const deleteMessage = async (messageId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(messageId);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject("❌ 無法刪除訊息！");
  });
};

// 搜尋聊天記錄（依 chatId 篩選，訊息內容關鍵字比對）
export const searchMessages = async (chatId, keyword) => {
  const messages = await getMessages(chatId);
  return messages.filter((msg) => msg.content.includes(keyword));
};
