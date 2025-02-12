<template>
  <nav>
    <div>
      <h1><a href="/">Boardxian</a></h1>
    </div>

    <div>
      <ul>
        <li>
          <router-link to="/" class="nav-link">
            <img :src="Sendicon" alt="Sendicon" />
          </router-link>
        </li>

        <li>
          <button @click="openModal" class="nav-link">
            <img :src="Dragicon" alt="Dragicon" />
          </button>

          <div v-show="isModalOpen" class="modal-overlay">
            <div class="modal-content" @click.stop>
              <!-- 使用 NConfigProvider 並綁定 theme -->
              <n-config-provider :theme="theme">
                <n-button @click="setDarkTheme"> 深色 </n-button>
                <n-button @click="setLightTheme"> 淺色 </n-button>
              </n-config-provider>
              <!--  -->
              <div v-if="!authStore.isLoggedIn" class="nav-link">
                <router-link to="/" @click.prevent="logout">登出</router-link>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import { NButton, NConfigProvider } from "naive-ui";
import Dragicon from "../assets/Dragicon.svg";
import Sendicon from "../assets/Sendicon.svg";

const themeStore = useThemeStore();
const authStore = useAuthStore();
authStore.checkLoginStatus();

const isModalOpen = ref(false);

const openModal = (event) => {
  event.stopPropagation(); // 阻止事件冒泡
  isModalOpen.value = true;
};

const closeModal = (event) => {
  if (isModalOpen.value) {
    const modal = document.querySelector(".modal-content");
    if (modal && !modal.contains(event.target)) {
      isModalOpen.value = false;
    }
  }
};

// 切換深色和淺色主題
const setDarkTheme = () => {
  themeStore.setDarkTheme();
  console.log("目前主題：", themeStore.theme);
};

const setLightTheme = () => {
  themeStore.setLightTheme();
  console.log("目前主題：", themeStore.theme);
};

// 監聽點擊事件
onMounted(() => {
  document.addEventListener("click", closeModal);
});

onUnmounted(() => {
  document.removeEventListener("click", closeModal);
});

const logout = () => {
  authStore.logout();
};

const theme = computed(() => themeStore.theme);
</script>

<style scoped>
/* 整體導航條 */
nav {
  display: flex;
  justify-content: space-between;
  padding: 0 30px;
  width: 100%;
  border-bottom: 0.5px solid #aaa;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

nav div {
  display: flex;
  align-items: center;
}

/* 項目列表樣式 */
nav ul {
  display: flex;
}

/* 項目間距 */
nav ul li {
  display: flex;
  position: relative; /* 確保彈出視窗相對於按鈕定位 */
}

.nav-link {
  display: flex; /* 讓 a 內的內容可以對齊 */
  flex: 1;
  cursor: pointer;
  padding: 10px 25px;
  margin: 5px 0;
  border-radius: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
}
.router-link-exact-active {
  color: red;
}

.nav-link:hover {
  background-color: rgba(128, 128, 128, 0.15);
}

.modal-overlay {
  position: absolute; /* 使用 absolute 定位 */
  top: 100%; /* 將彈出視窗放在按鈕的正下方 */
  right: 150%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000; /* 確保在導覽列之上 */
}

.modal-content {
  background: rgb(16, 16, 16);
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  min-width: 300px;
  max-width: 300px;
}

.modal-content * {
  background: transparent;
}
</style>
