import { defineStore } from "pinia";

export const useSocketStore = defineStore("socket", {
  state: () => ({
    socket: null,
    messages: [],
  }),
  actions: {
    connect() {
      if (this.socket) return;
      this.socket = new WebSocket(
        "wss://message-board-server-7yot.onrender.com"
      );

      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "new_message") {
          this.messages.unshift(message.data);
        }
      };

      this.socket.onclose = () => {
        console.log("WebSocket disconnected, attempting to reconnect...");
        setTimeout(() => this.connect(), 3000);
      };
    },
  },
});
