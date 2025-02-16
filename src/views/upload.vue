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
    async handleFileUpload(event) {
      this.file = event.target.files[0];
      if (!this.file) return;

      try {
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

        const { uploadUrl, fileUrl } = data;

        // 2️⃣ 使用 Signed URL 直接上傳檔案
        await axios.put(uploadUrl, this.file, {
          headers: { "Content-Type": this.file.type },
        });

        // 3️⃣ 設定 fileUrl，讓後續提交貼文時使用
        this.fileUrl = fileUrl;
        console.log("檔案上傳成功:", this.fileUrl);
      } catch (error) {
        console.error("檔案上傳失敗:", error);
      }
    },

    async submitPost() {
      try {
        await axios.post(
          "https://message-board-server-7yot.onrender.com/api/posts/2",
          {
            content: "test url",
            fileUrl: this.fileUrl, // 這裡傳遞檔案 URL
          }
        );
        console.log("貼文已發送！");
      } catch (error) {
        console.error("檔案上傳失敗:", error);
        if (error.response) {
          console.error("Response error:", error.response);
        } else if (error.request) {
          console.error("Request error:", error.request);
        } else {
          console.error("General error:", error.message);
        }
      }
    },
  },
};
</script>
