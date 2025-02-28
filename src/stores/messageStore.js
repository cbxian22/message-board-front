import { defineStore } from "pinia";
import { useMessage } from "naive-ui";

export const useMessageStore = defineStore("message", () => {
  const message = useMessage();

  const showInfo = (customInfo) => {
    message.info(customInfo || "This is a customMessage.", {
      keepAliveOnHover: true,
    });
  };

  const showError = (customError) => {
    message.error(customError || "This is a customMessage.");
  };

  const showWarning = (customWarning) => {
    message.warning(customWarning || "This is a customWarning.");
  };

  const showSuccess = (customMessage) => {
    message.success(customMessage || "This is a showSuccess.");
  };

  const showLoading = (customLoading) => {
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
