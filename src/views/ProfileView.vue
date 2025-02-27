<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig";
import { emitter } from "../main";
import { useAuthStore } from "../stores/authStore";

import Info from "../components/Info.vue";
import InfoSinglePosts from "../components/InfoSinglePosts.vue";
import Navbar from "../components/Navbar.vue";
import NavbarUp from "../components/NavbarUp.vue";
import Backicon from "../assets/Backicon.svg";

// const aru = computed(() => socketStore.messages.length > 0);

const props = defineProps(["username"]);
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const userData = ref(null);
const userPosts = ref([]);

// 組件掛載時載入資料
onMounted(async () => {
  if (props.username) {
    await fetchUserData(props.username);
  }

  // 監聽刷新事件
  emitter.on("refreshPost", (data) => {
    const usernameToFetch = data?.newUsername || props.username;
    fetchUserData(usernameToFetch);
  });
});

watch(
  () => [props.username, route.params.username],
  async ([newUsername]) => {
    if (newUsername) {
      await fetchUserData(newUsername);
    }
  }
);

// 獲取使用者資料
const fetchUserData = async (username) => {
  try {
    const [userResponse, postsResponse] = await Promise.all([
      apiClient.get(`/users/${username}`),
      apiClient.get(`/posts/user/${username}`, {
        params: { userId: localStorage.getItem("userId") },
      }),
    ]);

    if (userResponse.data.message === "使用者不存在") {
      router.replace("/not-found");
      return;
    }

    userData.value = {
      id: userResponse.data.id,
      name: userResponse.data.name,
      intro: userResponse.data.intro,
      userAvatar: userResponse.data.avatar_url,
      is_private: userResponse.data.is_private,
    };

    if (postsResponse.status === 200 && Array.isArray(postsResponse.data)) {
      userPosts.value = postsResponse.data.map((comment) => ({
        id: comment.id,
        content: comment.content,
        timestamp: new Date(comment.created_at),
        file_url: comment.file_url,
        name: comment.user_name,
        user_avatar: comment.user_avatar,
        likes: comment.likes || 0,
        userLiked: comment.user_liked || false,
        replies: comment.replies,
      }));
    }
  } catch (error) {
    console.error("查詢用戶錯誤:", error);
    router.replace("/not-found");
  }
};

// 計算是否從 Navbar 跳轉過來
const isFromNavbar = () => {
  return route.query.from === "navbar";
};

// 是否為自己的個人頁面
const isOwnProfile = () => {
  return authStore.isLoggedIn && props.username === authStore.userName;
};

// 返回按鈕是否應隱藏
const shouldHideBackIcon = () => {
  return isFromNavbar() && isOwnProfile();
};
</script>

<template>
  <NavbarUp />
  <div class="container-box">
    <div class="back-icon" :class="{ hidden: shouldHideBackIcon() }">
      <router-link to="/">
        <img :src="Backicon" alt="Backicon" />
      </router-link>
    </div>

    <div class="container">
      <Info :user-data="userData" />
      <InfoSinglePosts :posts="userPosts" />
    </div>
  </div>
  <Navbar />
</template>

<style scoped>
.container-box {
  width: 650px;
  display: flex;
  flex-direction: column;
  justify-self: center;
  margin-bottom: 100px;
  margin-top: calc(100px - 44px);
}

.back-icon {
  margin: 0 0 20px 5px;
  display: flex;
}

.hidden {
  visibility: hidden;
  pointer-events: none;
}

.back-icon a {
  display: flex;
}

/* 淺色下更改引入 icon 顏色 */
.light-mode img {
  filter: invert(1) grayscale(100%) contrast(100%) brightness(0);
}
</style>
