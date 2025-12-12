import { useState, useEffect } from 'react';

function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission | undefined>(undefined);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);

      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(setPermission);
      }
    }
  }, []);

  const showNotification = (title: string, options: NotificationOptions = {
    body: "Notificação Taqui Generator",
    icon: "/assets/taqui-a-logo.png",
  }) => {
    if (permission === "granted" && "Notification" in window) {
      new Notification(title, options);
    } else {
      alert(title);
      console.log("Notificações não permitidas ou não suportadas pelo navegador.");
    }
  };

  return showNotification;
}

export default useNotification;