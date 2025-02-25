// stores/dateStore.js
import { defineStore } from "pinia";

export const useDateStore = defineStore("date", {
  // state 可選，如果不需要存儲狀態可以省略
  state: () => ({}),

  // 將 formatDate 作為一個 action
  actions: {
    formatDate(date) {
      if (!date) return "未知時間";

      const timestamp = typeof date === "string" ? parseInt(date, 10) : date;
      const currentTime = new Date();
      const inputDate = new Date(timestamp);
      const diffInSeconds = Math.floor((currentTime - inputDate) / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInSeconds < 60) {
        return "剛剛";
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} 分鐘前`;
      } else if (diffInHours < 24) {
        return `${diffInHours} 小時前`;
      } else if (diffInDays === 1) {
        return "昨天";
      } else if (diffInDays <= 7) {
        return `${diffInDays} 天前`;
      } else {
        const year = inputDate.getFullYear();
        const month = String(inputDate.getMonth() + 1).padStart(2, "0");
        const day = String(inputDate.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    },
  },
});
