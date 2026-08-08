export type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type ShowAlertFn = (title: string, message?: string, buttons?: AlertButton[]) => void;

let globalShowAlert: ShowAlertFn = (title, message, buttons) => {
  console.warn("CustomAlertProvider is not mounted. Alert called with:", title, message);
};

export const setGlobalAlert = (fn: ShowAlertFn) => {
  globalShowAlert = fn;
};

export const CustomAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    globalShowAlert(title, message, buttons);
  },
};
