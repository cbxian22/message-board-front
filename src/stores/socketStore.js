import { defineStore } from "pinia";

export const useSocketStore = defineStore("socket", {
  state: () => ({
    socket: null,
    messages: [],
    reconnectTimeout: null, // 儲存重連計時器，防止重複連線
  }),
  actions: {
    connect() {
      // 確保沒有已存在的 WebSocket 連線，避免多次連線
      if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

      this.socket = new WebSocket(
        "wss://message-board-server-7yot.onrender.com"
      );

      this.socket.onopen = () => {
        console.log("✅ WebSocket 連線成功");
        console.log("WebSocket readyState:", this.socket.readyState);
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("📩 收到訊息:", message);

          // 確保格式為 `{ type: "new_message", data: { title, content } }`
          if (message.type === "new_message" && message.data) {
            this.messages.unshift(message.data); // 更新前端 UI
          }
        } catch (error) {
          console.error("❌ 解析 WebSocket 訊息失敗:", error);
        }
      };

      this.socket.onclose = () => {
        console.warn("⚠️ WebSocket 連線中斷，3 秒後重新連線...");

        // 避免多個 WebSocket 連線
        if (!this.reconnectTimeout) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
          }, 3000);
        }
      };

      this.socket.onerror = (error) => {
        console.error("❌ WebSocket 發生錯誤:", error);
      };
    },

    sendMessage(message) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const msg = JSON.stringify({
          type: "new_message",
          data: {
            // title: message.title,
            content: message.content,
          },
        });
        console.log("📤 發送訊息:", msg);
        this.socket.send(msg);
      } else {
        console.error("❌ WebSocket 未連線，訊息無法發送");
      }
    },
  },
});
