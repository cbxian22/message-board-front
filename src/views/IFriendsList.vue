<template>
  <div>
    <h2>好友列表</h2>
    <ul>
      <li v-for="friend in friends" :key="friend.id">
        <img :src="friend.avatar_url" class="avatar" />
        <span>{{ friend.name }}</span>
        <button @click="goToChat(friend)">聊天</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiClient from "../stores/axiosConfig";

const friends = ref([]);
const router = useRouter();

onMounted(async () => {
  const { data } = await apiClient.get("/friends");
  friends.value = data; // 假設後端 /friends 回傳朋友列表
});

function goToChat(friend) {
  router.push(`/chat/${friend.id}`);
}
</script>

<style scoped>
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}
</style>
