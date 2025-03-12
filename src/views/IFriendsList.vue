<!-- Friends.vue -->
<template>
  <NavbarUp />
  <div class="container-box">
    <div class="back-icon">
      <router-link to="#" @click.prevent="$router.back()">
        <img class="icon" :src="Backicon" alt="Backicon" />
      </router-link>
    </div>
    <div class="container">
      <h2>{{ authStore.accountName }}</h2>
      <div class="friend-list">
        <p v-if="isLoading" class="no-friend">載入中...</p>
        <div
          v-if="friends"
          v-for="friend in friends"
          :key="friend.id"
          class="friend-item"
        >
          <router-link :to="`/@${friend.accountname}`" class="info">
            <img :src="friend.avatar_url" :alt="friend.name" class="avatar" />
            <div class="info-name">
              <span class="friend-name">{{ friend.name }}</span>
              <span class="friend-account-name">{{ friend.accountname }}</span>
            </div>
          </router-link>
          <div class="actions">
            <button @click="goToChat(friend.id)" class="chat-button">
              發送信息
            </button>
            <button
              @click="handleDeleteFriendConfirm(friend.id)"
              class="remove-button"
            >
              移除好友
            </button>
          </div>
        </div>
        <p v-else class="no-friend">暫無好友</p>
      </div>
    </div>
  </div>
  <Navbar />
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig";
import { useAuthStore } from "../stores/authStore";
import { useMessage, useLoadingBar, useDialog } from "naive-ui";

import Navbar from "../components/Navbar.vue";
import NavbarUp from "../components/NavbarUp.vue";

import Backicon from "../assets/Backicon.svg";

const router = useRouter();
const authStore = useAuthStore();
const dialog = useDialog();
const loadingBar = useLoadingBar();
const message = useMessage();

const friends = ref([]);
const currentUserId = ref(null);
const isLoading = ref(true);

// 獲取當前用戶 ID
const fetchCurrentUser = async () => {
  try {
    const response = await apiClient.get("/auth/me");
    currentUserId.value = response.data.id.toString();
    console.log("當前用戶 ID:", currentUserId.value);
    await fetchFriends();
  } catch (err) {
    console.error(
      "獲取用戶 ID 失敗:",
      err.response?.data?.message || err.message
    );
    message.error(err.response?.data?.message || err.message);
  } finally {
    isLoading.value = false;
  }
};

// 獲取好友清單
const fetchFriends = async () => {
  try {
    const response = await apiClient.get("/friends");
    friends.value = response.data;
    console.log("獲取好友清單:", friends.value);
  } catch (err) {
    console.error(
      "獲取好友清單失敗:",
      err.response?.data?.message || err.message
    );
  }
};

// const friends = [
//   {
//     id: 4,
//     name: "胡摩豬",
//     accountname: "shan4",
//     avatar_url:
//       "https://storage.googleapis.com/message_board_storage/1000006562.jpg",
//   },
//   {
//     id: 34,
//     name: "麥香2",
//     accountname: "50150134",
//     avatar_url:
//       "https://storage.googleapis.com/message_board_storage/S__162439172.jpg",
//   },
// ];

// 跳轉到聊天頁面

const handleDeleteFriendConfirm = (id) => {
  dialog.warning({
    content: "需要再次加入好友才可以瀏覽私人帳號！",
    positiveText: "移除好友",
    negativeText: "取消",
    onPositiveClick: () => {
      deleteFriend(id);
    },
  });
};

const deleteFriend = async (id) => {
  if (!authStore.accessToken) {
    isLoginModalOpen.value = true;
    return;
  }

  const friendId = id;
  loadingBar.start();
  try {
    const response = await apiClient.delete(`/friends/${friendId}`);
    if (response.status === 200) {
      await fetchFriends();
      message.success("已移除好友！");
    }
  } catch (error) {
    console.error("移除好友失敗:", error);
    if (error.response?.status === 404) {
      message.error("好友關係不存在！");
    } else if (error.response?.status === 401) {
      message.error("登入已過期，請重新登入！");
      authStore.logout();
      isLoginModalOpen.value = true;
    } else {
      message.error("移除好友失敗，請稍後再試！");
    }
    loadingBar.error();
  } finally {
    loadingBar.finish();
  }
};

const goToChat = (friendId) => {
  router.push({ name: "Chat", params: { friendId } });
};

// 頁面掛載時執行
onMounted(async () => {
  await fetchCurrentUser();
});
</script>

<style scoped>
.container-box {
  width: 650px;
  display: flex;
  flex-direction: column;
  justify-self: center;
  margin: 100px 0;
  margin-top: calc(100px - 44px);
}

.back-icon {
  margin: 15px 0 15px 5px;
  display: flex;
}

.back-icon a {
  display: flex;
}

h2 {
  padding: 20px 30px;
  cursor: default;
  border-bottom: 0.5px solid #373737;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 20px 30px;
  justify-content: space-between;
  border-bottom: 0.5px solid #373737;
}

.friend-item .info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.friend-item .info .avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.info-name {
  display: flex;
  flex-direction: column;
}

.friend-item .info .friend-name,
.friend-account-name {
  cursor: pointer;
}

.friend-item:last-child {
  border-bottom: none;
}

.friend-item .actions {
  display: flex;
  gap: 10px;
}

.friend-item .chat-button,
.remove-button {
  padding: 10px 15px;
  border: none;
}

.friend-item .chat-button:hover,
.remove-button:hover {
  background-color: rgba(128, 128, 128, 0.15) !important;
  border-radius: 10px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.no-friend {
  display: flex;
  padding: 20px;
}
</style>
