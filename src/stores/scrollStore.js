// stores/scrollStore.js

import { defineStore } from "pinia";

export const useScrollStore = defineStore("scroll", {
  state: () => ({
    scrollPosition: 0,
  }),
  actions: {
    setScrollPosition(position) {
      this.scrollPosition = position;
      // console.log("Scroll position saved:", position);
    },
    getScrollPosition() {
      // console.log("Returning stored scroll position:", this.scrollPosition);
      return this.scrollPosition;
    },
  },
});
