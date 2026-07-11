import browser from "webextension-polyfill";
import type { FeedItem } from "./types";

const BASE_URL = __KSPLATFORM_URL__;
const TOKEN_KEY = "accessToken";

export type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
};

export type TokenPollResult =
  | { status: "approved"; access_token: string }
  | { status: "pending" }
  | { status: "denied" }
  | { status: "expired" };

export type Page<T> = { items: T[]; nextCursor: string | null };

export type FeedResult =
  | { status: "ok"; page: Page<FeedItem> }
  | { status: "reauthenticate" }
  | { status: "offline" };

export async function getStoredToken(): Promise<string | undefined> {
  const stored = await browser.storage.local.get(TOKEN_KEY);
  return stored[TOKEN_KEY] as string | undefined;
}

export async function setStoredToken(token: string | undefined): Promise<void> {
  if (token) {
    await browser.storage.local.set({ [TOKEN_KEY]: token });
  } else {
    await browser.storage.local.remove(TOKEN_KEY);
  }
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/device/code`, { method: "POST" });
  return res.json();
}

export async function pollDeviceToken(deviceCode: string): Promise<TokenPollResult> {
  const res = await fetch(`${BASE_URL}/api/v1/device/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_code: deviceCode }),
  });
  if (res.status === 202) return { status: "pending" };
  if (res.status === 200) {
    const data = (await res.json()) as { access_token: string };
    return { status: "approved", access_token: data.access_token };
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return { status: data.error === "access_denied" ? "denied" : "expired" };
}

export async function fetchFeed(cursor?: string | null): Promise<FeedResult> {
  const token = await getStoredToken();
  if (!token) return { status: "reauthenticate" };

  let res: Response;
  try {
    const url = new URL(`${BASE_URL}/api/v1/feed`);
    if (cursor) url.searchParams.set("cursor", cursor);
    res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return { status: "offline" };
  }

  if (res.status === 401) {
    await setStoredToken(undefined);
    return { status: "reauthenticate" };
  }
  return { status: "ok", page: await res.json() };
}
