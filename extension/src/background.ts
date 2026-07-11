import browser from "webextension-polyfill";
import { requestDeviceCode, pollDeviceToken, setStoredToken } from "./lib/api";

type ConnectResultMessage =
  | { type: "connect-result"; status: "connected" }
  | { type: "connect-result"; status: "denied" | "expired" };

async function runConnectFlow(): Promise<void> {
  const code = await requestDeviceCode();
  await browser.tabs.create({ url: code.verification_uri_complete });

  const deadline = Date.now() + code.expires_in * 1000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, code.interval * 1000));
    const result = await pollDeviceToken(code.device_code);
    if (result.status === "approved") {
      await setStoredToken(result.access_token);
      const msg: ConnectResultMessage = { type: "connect-result", status: "connected" };
      void browser.runtime.sendMessage(msg);
      return;
    }
    if (result.status === "denied" || result.status === "expired") {
      const msg: ConnectResultMessage = { type: "connect-result", status: result.status };
      void browser.runtime.sendMessage(msg);
      return;
    }
    // pending — keep polling
  }
  const msg: ConnectResultMessage = { type: "connect-result", status: "expired" };
  void browser.runtime.sendMessage(msg);
}

browser.runtime.onMessage.addListener((message: unknown) => {
  if ((message as { type?: string })?.type === "start-connect") {
    void runConnectFlow();
  }
});
