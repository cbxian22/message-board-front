<!-- <template>
  <div class="chat-container">
    <div class="chat-sidebar">
      <h2>好友</h2>
      <ul>
        <li
          v-for="friend in friends"
          :key="friend.id"
          @click="selectChat(friend.id)"
        >
          {{ friend.name }}
        </li>
      </ul>
    </div>

    <div class="chat-window">
      <div class="chat-header">
        <h2 v-if="activeChatUser">{{ activeChatUser.name }}</h2>
        <h2 v-else>請選擇好友</h2>
      </div>
      <div class="chat-messages">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="{ 'my-message': msg.senderId === userId }"
        >
          <p>{{ msg.content }}</p>
          <span>{{ new Date(msg.timestamp).toLocaleTimeString() }}</span>
        </div>
      </div>
      <div class="chat-input">
        <input
          v-model="message"
          @keyup.enter="sendMessage"
          placeholder="輸入訊息..."
        />
        <button @click="sendMessage">發送</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useChatStore } from "@/stores/chatStore";
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";

export default {
  setup() {
    const chatStore = useChatStore();
    const userStore = useAuthStore();
    const message = ref("");

    const userId = computed(() => userStore.userId);
    const friends = ref([]); // 這裡可以接 API 拿好友列表
    const activeChatUser = computed(() =>
      friends.value.find((f) => f.id === chatStore.activeChatId)
    );

    // 假設從 API 拿到好友列表
    onMounted(async () => {
      if (userId.value) {
        chatStore.connectWebSocket(userId.value);
        // 假設這裡能夠獲取好友列表
        friends.value = await fetchFriends(); // 假設 fetchFriends 是一個API函數
      }
    });

    const selectChat = async (friendId) => {
      await chatStore.setActiveChat(friendId);
    };

    const sendMessage = () => {
      if (message.value.trim()) {
        chatStore.sendMessage(message.value);
        message.value = "";
      }
    };

    return {
      messages: chatStore.messages,
      userId,
      friends,
      activeChatUser,
      message,
      selectChat,
      sendMessage,
    };
  },
};

// 假設 fetchFriends 是一個模擬 API 請求的函數
async function fetchFriends() {
  return [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
  ];
}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
}

.chat-sidebar {
  width: 250px;
  background: #f4f4f4;
  padding: 10px;
}

.chat-sidebar ul {
  list-style: none;
  padding: 0;
}

.chat-sidebar li {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #ddd;
}

.chat-sidebar li:hover {
  background: #ddd;
}

.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 15px;
  background: #6200ea;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.chat-messages div {
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 5px;
  max-width: 60%;
}

.my-message {
  background: #6200ea;

  align-self: flex-end;
}

.chat-input {
  display: flex;
  padding: 10px;
  border-top: 1px solid #ddd;
}

.chat-input input {
  flex: 1;
  padding: 10px;
  border: none;
}

.chat-input button {
  padding: 10px 15px;
  background: #6200ea;

  border: none;
  cursor: pointer;
}
</style> -->
