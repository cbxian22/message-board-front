import { defineStore } from "pinia";

export const useScrollStore = defineStore("scroll", {
  state: () => ({
    scrollPosition: 0,
  }),
  actions: {
    setScrollPosition(position) {
      this.scrollPosition = position || 0;
      console.log("Scroll position saved:", this.scrollPosition);
    },
    getScrollPosition() {
      console.log("Getting scroll position:", this.scrollPosition);
      return this.scrollPosition || 0;
    },
  },
});
