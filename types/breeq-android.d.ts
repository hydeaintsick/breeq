/** `window.BreeqAndroid`, injected by the Android shell. Absent in a normal browser. */
interface BreeqAndroidBridge {
  setChrome(cssColor: string): void;
  version(): string;
  /** Start OneSignal when this build was made before the App ID existed. */
  configure(appId: string): boolean;
  notificationsReady(): boolean;
  /** Shows the system permission dialog, then links this account. Result via `__breeqPushResult`. */
  enableNotifications(userId: string): void;
  disableNotifications(): void;
  /** Attach this account to the device subscription. No permission dialog. */
  linkUser(userId: string): void;
}

interface Window {
  BreeqAndroid?: BreeqAndroidBridge;
  __breeqPushResult?: (accepted: boolean) => void;
}
