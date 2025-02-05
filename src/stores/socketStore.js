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
      };

      // 處理收到的訊息
      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "new_message") {
          // 新的留言，將其添加到前端
          this.messages.unshift(message.data);
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

    // 可以新增發送訊息的功能
    sendMessage(message) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(
          JSON.stringify({ type: "new_message", data: message })
        );
      } else {
        console.error("WebSocket is not connected.");
      }
    },
  },
});
