import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { useAuthStore } from "./stores/authStore"; // 引入 authStore
import App from "./App.vue";
import router from "./router";

// 在 main.js 或某個工具檔案中定義事件總線
import mitt from "mitt";
export const emitter = mitt();

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

const authStore = useAuthStore();
authStore.checkLoginStatus();

app.use(router);

app.mount("#app");
