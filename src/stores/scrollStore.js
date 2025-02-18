// stores/scrollStore.js
import { defineStore } from "pinia";

export const useScrollStore = defineStore("scroll", {
  state: () => ({
    scrollPosition: 0,
  }),
  actions: {
    setScrollPosition(position) {
      this.scrollPosition = position;
    },
    getScrollPosition() {
      return this.scrollPosition;
    },
  },
});
