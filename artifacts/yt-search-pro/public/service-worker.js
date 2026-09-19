const REFRESH_ALARM = "yt-search-pro-index-refresh";
const AUTH_FLOW_VERSION = "server-code-flow-v2";
const API_ORIGIN = "https://a0579f36-409d-4c94-aed6-476395636419-00-2uej4sz8kg035.pike.replit.dev";

console.info(`[YT Search Pro] service worker ready: ${AUTH_FLOW_VERSION}`);

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: 360 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== REFRESH_ALARM) return;
  chrome.runtime.sendMessage({ type: "INDEX_REFRESH_REQUESTED" }).catch(() => {
    // The UI is closed. Its next launch resumes from the saved checkpoint.
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "GET_GOOGLE_TOKEN") return;

  const redirectUri = chrome.identity.getRedirectURL("oauth-complete");
  console.info("[YT Search Pro] starting OAuth", {
    method: AUTH_FLOW_VERSION,
    redirectUri,
    extensionId: chrome.runtime.id,
  });
  const authUrl = new URL(`${API_ORIGIN}/api/oauth/google/start`);
  authUrl.searchParams.set("extension_redirect", redirectUri);

  chrome.identity.launchWebAuthFlow(
    {
      url: authUrl.toString(),
      interactive: Boolean(message.interactive),
    },
    (responseUrl) => {
      if (chrome.runtime.lastError || !responseUrl) {
        sendResponse({
          error: chrome.runtime.lastError?.message ?? "Google sign-in was cancelled.",
        });
        return;
      }

      const callback = new URL(responseUrl);
      const fragment = new URLSearchParams(callback.hash.slice(1));
      const ticket = fragment.get("ticket");
      const accessToken = fragment.get("access_token");
      const oauthError = fragment.get("error");

      if (accessToken) {
        sendResponse({ token: accessToken });
        return;
      }

      if (!ticket) {
        sendResponse({
          error: oauthError
            ? `Google OAuth failed: ${oauthError}`
            : "Google OAuth completed without returning a one-time ticket.",
        });
        return;
      }

      fetch(`${API_ORIGIN}/api/oauth/google/exchange`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticket }),
      })
        .then(async (response) => {
          const body = await response.json();
          if (!response.ok || !body.accessToken) {
            throw new Error(body.error ?? "The OAuth ticket could not be exchanged.");
          }
          sendResponse({ token: body.accessToken });
        })
        .catch((error) => {
          sendResponse({ error: error.message ?? "Google sign-in failed." });
        });
    },
  );
  return true;
});