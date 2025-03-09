<template>
  <nav class="navbar-up">
    <div>
      <a href="/">
        <h1 class="boardxian-text">Boardxian</h1>
        <img :src="Boardxian" alt="Boardxian Logo" class="boardxian-logo" />
      </a>
    </div>

    <div>
      <ul>
        <li v-if="shouldShowChatAndNotification" @click="setActive('chatlist')">
          <router-link
            to="/chatlist"
            class="nav-link"
            :class="{ active: navStore.activeItem === 'chatlist' }"
          >
            <img class="icon" :src="Sendicon" alt="Sendicon" />
          </router-link>
        </li>

        <li
          v-if="shouldShowChatAndNotification"
          @click="setActive('notification')"
        >
          <router-link to="/notification" class="nav-link">
            <img class="icon" :src="Favoriteicon" alt="Favoriteicon" />
          </router-link>
        </li>

        <li v-if="shouldShowMenuIcon">
          <button ref="modalButton" @click="openModal" class="nav-link">
            <img class="icon" :src="Menuicon" alt="Menuicon" />
          </button>

          <div v-show="isModalOpen" class="modal-overlay" @click="closeModal">
            <div class="modal-content" @click.stop>
              <n-collapse arrow-placement="right" class="nav-modal">
                <n-collapse-item title="外觀">
                  <div class="theme-switch-container">
                    <span>淺色</span>
                    <n-switch
                      size="large"
                      v-model:value="themeStore.isDarkMode"
                      @update:value="toggleTheme"
                    />
                    <span>深色</span>
                  </div>
                </n-collapse-item>
              </n-collapse>

              <div v-if="authStore.isLoggedIn" class="border-login"></div>

              <div
                v-if="authStore.isLoggedIn"
                class="nav-modal"
                @click="logout"
              >
                <div class="logout">登出</div>
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
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import { useNavStore } from "../stores/navStore";
import { NSwitch, NCollapseItem, NCollapse } from "naive-ui";
import Menuicon from "../assets/Menuicon.svg";
import Sendicon from "../assets/Sendicon.svg";
import Favoriteicon from "../assets/Favoriteicon.svg";
import Boardxian from "/Boardxian.svg";

const router = useRouter();
const route = useRoute();
const themeStore = useThemeStore();
const authStore = useAuthStore();
const navStore = useNavStore();

const isModalOpen = ref(false);

const shouldShowMenuIcon = computed(() => {
  if (!authStore.isLoggedIn) return true;
  if (
    route.name === "Profile" &&
    route.params.accountname === authStore.accountName
  ) {
    return true;
  }
  return false;
});

const shouldShowChatAndNotification = computed(() => {
  if (!authStore.isLoggedIn) return false;
  if (
    route.name === "Profile" &&
    route.params.accountname === authStore.accountName
  ) {
    return false;
  }
  return true;
});

const setActive = (item) => {
  navStore.setActive(item);
  navStore.syncWithRoute(); // 點擊後立即同步路由狀態
};

const openModal = (event) => {
  event.stopPropagation();
  isModalOpen.value = !isModalOpen.value;
};

const closeModal = (event) => {
  const modalContent = document.querySelector(".modal-content");
  if (
    isModalOpen.value &&
    modalContent &&
    !modalContent.contains(event.target)
  ) {
    isModalOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", closeModal);
});

onUnmounted(() => {
  document.removeEventListener("click", closeModal);
});

const logout = async () => {
  await authStore.logout();
  isModalOpen.value = false;
  router.push("/login");
};

// 變更主題並儲存
const toggleTheme = (value) => {
  if (value) {
    themeStore.setDarkTheme();
  } else {
    themeStore.setLightTheme();
  }
};
</script>

<style scoped>
/* 整體導航條 */
.navbar-up {
  padding: 0 30px;
  display: flex;
  justify-content: space-between;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.navbar-up > div {
  display: flex;
  align-items: center;
}

/* 項目列表樣式 */
.navbar-up ul {
  display: flex;
}

/* 項目間距 */
.navbar-up ul li {
  display: flex;
}

.navbar-up ul li:last-child {
  position: relative;
  margin-left: 10%;
}

.nav-link {
  display: flex;
  padding: 10px 25px;
  margin: 5px 0;
}

.nav-link:hover,
.nav-link.active {
  background: rgba(128, 128, 128, 0.15) !important;
  border-radius: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.modal-overlay {
  position: absolute;
  top: 100%;
  right: 0;
  display: flex;
  justify-content: center;
}

.modal-content {
  display: flex;
  flex-direction: column;
  padding: 20px;
  border: 0.5px solid #aaa;
  border-radius: 10px;
}
.nav-modal {
  margin: 5px 0;
  cursor: pointer;
}

.nav-modal:hover {
  background: rgba(128, 128, 128, 0.15);
  border-radius: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.nav-modal .logout {
  padding: 5px 10px;
  width: 200px;
  color: red;
}
.n-collapse-item {
  flex-direction: column;
  align-items: self-start;
}

/* 你的 CSS 可能被 scoped 限制，導致外部樣式無法影響該組件。 */
::v-deep(.n-collapse-item__header-main),
.nav-modal a {
  width: 200px;
  padding: 5px 10px;
}

::v-deep(.n-collapse-item__content-inner) {
  padding: 5px 10px;
}

.theme-switch-container span {
  cursor: default;
}

.n-switch {
  padding: 0 20px;
}

::v-deep(.nav-modal .router-link-active) {
  padding: 5px 10px;
  width: 200px;
}

.nav-modal a {
  color: red;
}

.border-login {
  border-top: 0.5px solid #aaa;
  width: 100%;
  margin: 5px 0;
}

/* 淺色下更改引入 icon 顏色 */
/* .light-mode img {
  filter: invert(1) grayscale(100%) contrast(100%) brightness(0);
} */

.dark-mode nav {
  background: rgba(10, 10, 10, 0.6);
  backdrop-filter: blur(10px);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.light-mode nav {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.dark-mode .modal-content {
  background: rgb(24, 24, 24);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.light-mode .modal-content {
  background: rgb(255, 255, 255);
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>
