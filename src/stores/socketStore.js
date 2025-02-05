import { defineStore } from "pinia";

export const useSocketStore = defineStore("socket", {
  state: () => ({
    socket: null,
    messages: [],
  }),
  actions: {
    connect() {
      // 如果已經有連接且 WebSocket 狀態是開啟的，則不再建立新的連接
      if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

      // 建立新的 WebSocket 連接
      this.socket = new WebSocket(
        "wss://message-board-server-7yot.onrender.com"
      );

      // 處理連接成功事件
      this.socket.onopen = () => {
        console.log("WebSocket connected successfully");
        console.log("WebSocket readyState:", this.socket.readyState);
      };

      // 處理收到的訊息
      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Received message from server:", message); // 確認收到訊息
        // 假設訊息是 { title, content } 格式
        if (message.title && message.content) {
          // 新的留言，將其添加到前端
          this.messages.unshift(message);
        }
      };

      // 處理 WebSocket 關閉事件，並嘗試重連
      this.socket.onclose = () => {
        console.log("WebSocket disconnected, attempting to reconnect...");
        setTimeout(() => this.connect(), 3000); // 3秒後重連
      };

      // 可選：處理錯誤事件
      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    },

    // 發送訊息的功能
    sendMessage(message) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // 這裡發送的訊息將是 { title, content }
        const msg = JSON.stringify({
          title: message.title,
          content: message.content,
        });
        console.log("Sending message:", msg); // 在這裡查看是否確實發送訊息
        this.socket.send(msg);
      } else {
        console.error("WebSocket is not connected.");
      }
    },
  },
});
