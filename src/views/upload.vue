<template>
  <div>
    <input type="file" @change="handleFileUpload" />
    <button @click="submitPost">發送貼文</button>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      file: null,
      fileUrl: null,
      content: "",
    };
  },
  methods: {
    handleFileUpload(event) {
      this.file = event.target.files[0]; // 只存檔案，不上傳
      if (!this.file) return;
      console.log("檔案已選擇:", this.file.name);
    },

    async submitPost() {
      try {
        let fileUrl = null;

        // 只有當使用者選擇了檔案，才進行上傳
        if (this.file) {
          console.log("開始上傳檔案...");

          // 1️⃣ 向後端請求 Signed URL
          const { data } = await axios.get(
            "https://message-board-server-7yot.onrender.com/api/upload",
            {
              params: {
                filename: this.file.name,
                contentType: this.file.type,
              },
            }
          );

          const { uploadUrl, fileUrl: uploadedFileUrl } = data;

          // 2️⃣ 使用 Signed URL 直接上傳檔案
          await axios.put(uploadUrl, this.file, {
            headers: { "Content-Type": this.file.type },
          });

          fileUrl = uploadedFileUrl; // 取得上傳後的 URL
          console.log("檔案上傳成功:", fileUrl);
        }

        // 3️⃣ 發送貼文（即使沒有檔案，也能發送）
        await axios.post(
          "https://message-board-server-7yot.onrender.com/api/posts/2",
          {
            content: "test url",
            fileUrl, // 這裡才傳遞檔案 URL
          }
        );
        console.log("貼文已發送！");
      } catch (error) {
        console.error("發送失敗:", error);
      }
    },
  },
};
</script>
