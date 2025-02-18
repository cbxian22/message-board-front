import { defineStore } from "pinia";

export const useScrollStore = defineStore("scroll", {
  state: () => ({
    scrollPosition: 0,
  }),
  actions: {
    setScrollPosition(position) {
      console.log("Saving scroll position:", position);
      this.scrollPosition = position;
    },
    getScrollPosition() {
      console.log("Restoring scroll position:", this.scrollPosition);
      return this.scrollPosition;
    },
  },
});
