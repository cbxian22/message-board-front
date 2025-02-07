import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { useAuthStore } from "./stores/authStore"; // 引入 authStore

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

// 初始化 Pinia 並掛載到 Vue 應用
const pinia = createPinia();
app.use(pinia);

// 檢查登入狀態
const authStore = useAuthStore();
authStore.checkLoginStatus(); // 在應用啟動時檢查登入狀態

app.use(router);

app.mount("#app");
