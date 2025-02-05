// stores/webSocketStore.js

export const useWebSocketStore = defineStore("webSocket", {
  state: () => ({
    socket: null, // WebSocket 物件
    messages: [], // 儲存收到的訊息
    isConnected: false, // WebSocket 連線狀態
  }),

  actions: {
    // 建立 WebSocket 連接
    connect() {
      this.socket = new WebSocket(
        "wss://message-board-server-7yot.onrender.com"
      );

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log("Connected to server");
      };

      this.socket.onmessage = (event) => {
        this.messages.push(event.data); // 儲存收到的訊息
        console.log("Received:", event.data);
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        console.log("Disconnected from server");
      };
    },

    // 發送訊息
    sendMessage(message) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(message);
        console.log("Sent:", message);
      } else {
        console.log("WebSocket is not connected");
      }
    },
  },
});
