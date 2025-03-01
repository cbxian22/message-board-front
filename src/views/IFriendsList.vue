<template>
  <div class="friends-list">
    <h2>好友列表</h2>
    <div v-if="friends.length === 0">目前沒有好友</div>
    <div v-else>
      <div
        v-for="friend in friends"
        :key="friend.id"
        class="friend-item"
        @click="goToChat(friend)"
      >
        <img :src="friend.avatar_url" class="avatar" />
        <div class="friend-info">
          <div class="name">{{ friend.name }}</div>
          <div class="account">@{{ friend.account }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig";

const friends = ref([]);
const router = useRouter();

onMounted(async () => {
  try {
    const { data } = await apiClient.get("/friends");
    friends.value = data.map((f) => ({
      id: f.friend_id,
      name: f.friend_name,
      account: f.friend_account,
      avatar_url: f.friend_avatar_url,
    }));
  } catch (error) {
    console.error("取得好友列表失敗", error);
  }
});

function goToChat(friend) {
  router.push({
    path: `/chat/${friend.id}`,
    query: {
      name: friend.name,
      avatar: friend.avatar_url,
    },
  });
}
</script>

<style scoped>
.friends-list {
  padding: 16px;
}
.friend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}
.friend-item:hover {
  background-color: #f5f5f5;
}
.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}
.friend-info {
  display: flex;
  flex-direction: column;
}
.name {
  font-weight: bold;
}
.account {
  font-size: 14px;
  color: #888;
}
</style>
