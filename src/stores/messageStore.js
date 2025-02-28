// src/stores/messageStore.js
import { defineStore } from "pinia";
import { useMessage } from "naive-ui";

export const useMessageStore = defineStore("message", () => {
  const getMessage = () => useMessage();

  const showInfo = (customInfo) => {
    const message = getMessage();
    message.info(customInfo || "This is a customMessage.", {
      keepAliveOnHover: true,
    });
  };

  const showError = (customError) => {
    const message = getMessage();
    message.error(customError || "This is a customMessage.");
  };

  const showWarning = (customWarning) => {
    const message = getMessage();
    message.warning(customWarning || "This is a customWarning.");
  };

  const showSuccess = (customMessage) => {
    const message = getMessage();
    message.success(customMessage || "This is a showSuccess.");
  };

  const showLoading = (customLoading) => {
    const message = getMessage();
    message.loading(customLoading || "This is a customLoading.");
  };

  return {
    showInfo,
    showError,
    showWarning,
    showSuccess,
    showLoading,
  };
});
