<template>
  <!-- 使用 v-bind 和 v-on 來綁定和觸發事件 -->
  <Modal :modelValue="modelValue" @update:modelValue="handleModalClose">
    <!-- @update:modelValue="emit('update:modelValue', $event)" -->
    <div class="message-container">
      <form @submit.prevent="handleMessage" class="message-form">
        <!-- <div class="form-group">
          <label for="messagetitle">主題:</label>
          <input
            id="messagetitle"
            v-model="messagetitle"
            type="text"
            required
            class="form-input"
          />
        </div> -->

        <div class="message-form-up">
          <p>新貼文</p>
        </div>

        <div class="message-form-mi">
          <!-- <img
            :src="comment.photo || 'https://fakeimg.pl/50/'"
            alt="頭像"
            class="photo"
          /> -->
          <div>
            <img
              :src="'https://fakeimg.pl/50/'"
              alt="頭像"
              class="photo"
              draggable="false"
            />
          </div>

          <div class="user-content">
            <p>user</p>
            <label for="content"></label>
            <textarea
              id="content"
              v-model="content"
              placeholder="最近想潑點什麼呢？"
              required
              @input="adjustHeight"
              ref="textarea"
            ></textarea>
          </div>
        </div>

        <div class="message-form-end">
          <button type="submit" class="submit-btn">發佈</button>
        </div>
      </form>
    </div>
  </Modal>
</template>

<script setup>
import Modal from "./Modal.vue"; // 引入彈窗組件
import { ref, nextTick, watch } from "vue";
import axios from "../stores/axiosConfig"; // 統一配置後的 axios
import { useSocketStore } from "../stores/socketStore"; // WebSocket Store

const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

// const messagetitle = ref("");
const content = ref("");
const textarea = ref(null); // 取得 textarea DOM 節點
const prevHeight = ref("auto"); // 儲存上一次高度

const adjustHeight = () => {
  nextTick(() => {
    if (textarea.value) {
      textarea.value.style.height = "auto"; // 先重設高度
      textarea.value.style.height = `${textarea.value.scrollHeight}px`; // 設定自動增長
      prevHeight.value = textarea.value.style.height; // 儲存當前高度
    }
  });
};

const socketStore = useSocketStore();

// 處理 Modal 關閉的邏輯
const handleModalClose = (newValue) => {
  // 當 Modal 關閉時，這個方法會被觸發
  if (content.value.trim() !== "") {
    const confirmClose = window.confirm("確認要關閉並清除內容嗎？");
    if (confirmClose) {
      content.value = ""; // 清空內容
      emit("update:modelValue", false);
      prevHeight.value = null; // 儲存上一次高度
    }
  } else {
    emit("update:modelValue", false);
  }
};

const handleMessage = async () => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  if (!userId || !token) {
    alert("請先登入！");
    return;
  }

  try {
    const response = await axios.post(
      `https://message-board-server-7yot.onrender.com/api/posts/${userId}`,
      // { title: messagetitle.value, content: content.value },
      { content: content.value },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 201) {
      // 發送 WebSocket 訊息
      socketStore.sendMessage({
        // title: messagetitle.value,
        content: content.value,
      });

      // 清空輸入欄
      // messagetitle.value = "";
      content.value = "";

      // 關閉 Modal
      emit("update:modelValue", false);
    } else {
      alert("留言提交失敗");
    }
  } catch (error) {
    console.error("留言提交錯誤:", error);
    alert("留言提交失敗");
  }
};

// 監聽 Modal 開啟，恢復高度
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      nextTick(() => {
        if (textarea.value) {
          textarea.value.style.height = prevHeight.value; // 恢復之前的高度
        }
      });
    }
  }
);
</script>

<style scoped>
.message-container {
  display: flex;
  flex-direction: column;
  width: 625px;
  height: auto;
  border-radius: 20px;
  background-color: rgb(16, 16, 16);
  text-align: center;
  border: 0.5px solid rgba(102, 102, 102, 0.5);
}
.message-container * {
  background: transparent;
}

.message-form {
  display: flex;
  flex-direction: column; /* 讓內部元素垂直排列 */
  height: 100%;
}

.message-form-up {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 0.5px solid rgba(102, 102, 102, 0.5);
  max-height: 52px;
  min-height: 52px;
}

.message-form-mi {
  flex: 2;
  display: flex;
  align-items: flex-start;
  padding-top: 20px;
  margin-left: 30px;
  min-height: 104px;

  max-height: 250px;
  overflow: auto;
}

.message-form-mi::-webkit-scrollbar-thumb {
  /* background: rgba(102, 102, 102, 0.5);
  border-radius: 3px; */
}

.photo {
  border-radius: 50%;
  width: 50px;
  margin-right: 10px;
  display: flex;
}

.user-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.user-content p {
  margin-bottom: 5px;
  font-weight: bold;
}

.user-content textarea {
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  padding-right: 30px;
}

.user-content textarea::placeholder {
  color: gray; /* 設定 placeholder 的顏色 */
  opacity: 0.7; /* 調整透明度 */
}

.message-form-end {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: end;
  margin: 20px 30px;
  max-height: 52px;
  min-height: 52px;
}

.message-form-end button {
  padding: 10px 20px;
  border: 0.5px solid rgba(102, 102, 102, 0.5);
  border-radius: 10px;
}
</style>
