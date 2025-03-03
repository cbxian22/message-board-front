<template>
  <nav class="navbar">
    <ul>
      <li
        @click="
          toTop();
          setActive('home');
        "
      >
        <router-link
          to="/"
          class="nav-link"
          :class="{ active: navStore.activeItem === 'home' }"
        >
          <img class="icon" :src="Homeicon" alt="Homeicon" />
        </router-link>
      </li>

      <li @click="setActive('search')">
        <router-link
          to="/"
          class="nav-link"
          :class="{ active: navStore.activeItem === 'search' }"
        >
          <img class="icon" :src="Searchicon" alt="Searchicon" />
        </router-link>
      </li>

      <li>
        <button
          @click="checkTokenAndOpenModal"
          class="nav-link"
          :class="{ active: navStore.activeItem === 'add' }"
        >
          <img class="icon" :src="Addicon" alt="Addicon" />
        </button>
      </li>

      <li v-if="!authStore.isLoggedIn" @click="setActive('login')">
        <router-link
          to="/login"
          class="nav-link"
          :class="{ active: navStore.activeItem === 'login' }"
        >
          <img class="icon" :src="Loginicon" alt="Loginicon" />
        </router-link>
      </li>

      <li v-if="authStore.isLoggedIn" @click="setActive('profile')">
        <router-link
          :to="{ path: `/@${authStore.userName}`, query: { from: 'navbar' } }"
          class="nav-link"
          :class="{ active: navStore.activeItem === 'profile' }"
        >
          <img class="user-img" :src="userAvatar" alt="Accounticon" />
        </router-link>
      </li>
    </ul>
  </nav>

  <!-- 貼文 Modal -->
  <PostView v-model="isPostModalOpen" />

  <!-- 登入 Modal -->
  <Login v-model="isLoginModalOpen" />
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useAuthStore } from "../stores/authStore";
import { useNavStore } from "../stores/navStore";
import { useRoute } from "vue-router";

import PostView from "./ModalPost.vue";
import Login from "./ModalLogin.vue";

import Homeicon from "../assets/Homeicon.svg";
import Searchicon from "../assets/Searchicon.svg";
import Addicon from "../assets/Addicon.svg";
import Loginicon from "../assets/Loginicon.svg";

const authStore = useAuthStore();
const isPostModalOpen = ref(false);
const isLoginModalOpen = ref(false);
const navStore = useNavStore();
const route = useRoute();

const setActive = (item) => {
  navStore.setActive(item);
  navStore.syncWithRoute(); // 點擊後立即同步路由狀態
};

const userAvatar = computed(() => authStore.userAvatar);
const toTop = () => {
  window.scrollTo(0, 0);
};

const checkTokenAndOpenModal = () => {
  if (!authStore.userId || !authStore.accessToken) {
    isLoginModalOpen.value = true;
  } else {
    isPostModalOpen.value = true;
    setActive("add"); // 點擊時設為活躍
  }
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: center;
  width: 100%;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 1000;
}

.navbar ul {
  display: flex;
  justify-content: space-around;
  width: 60%;
}

.navbar ul li {
  list-style-type: none;
}

.nav-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 25px;
  margin: 5px 0;
}

.nav-link:hover,
.nav-link.active {
  background-color: rgba(128, 128, 128, 0.15) !important;
  border-radius: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.user-img {
  width: 24px;
  height: 24px;
  object-fit: cover;
  border-radius: 50%;
}

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
</style>
