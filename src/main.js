import "./assets/main.css";

import mitt from "mitt";
import router from "./router";
import App from "./App.vue";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { useAuthStore } from "./stores/authStore";

export const emitter = mitt();

const authStore = useAuthStore();
const pinia = createPinia();
const app = createApp(App);

authStore.checkLoginStatus();
app.use(router);
app.use(pinia);

app.mount("#app");
