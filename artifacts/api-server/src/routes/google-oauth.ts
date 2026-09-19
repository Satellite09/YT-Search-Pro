import crypto from "node:crypto";
import { Router, type IRouter } from "express";
import {
  CompleteGoogleOAuthQueryParams,
  ExchangeGoogleOAuthTicketBody,
  ExchangeGoogleOAuthTicketResponse,
  StartGoogleOAuthQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();
const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_READONLY = "https://www.googleapis.com/auth/youtube.readonly";
const STATE_TTL_MS = 10 * 60_000;
const TICKET_TTL_MS = 2 * 60_000;

interface OAuthState {
  extensionRedirect: string;
  expiresAt: number;
  nonce: string;
}

interface TicketRecord {
  accessToken: string;
  expiresIn: number;
  scope: string;
  expiresAt: number;
}

const tickets = new Map<string, TicketRecord>();

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function base64url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", env("SESSION_SECRET")).update(payload).digest("base64url");
}

function createState(extensionRedirect: string): string {
  const data: OAuthState = {
    extensionRedirect,
    expiresAt: Date.now() + STATE_TTL_MS,
    nonce: crypto.randomUUID(),
  };
  const payload = base64url(JSON.stringify(data));
  return `${payload}.${sign(payload)}`;
}

function parseState(state: string): OAuthState {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) throw new Error("Invalid OAuth state");
  const expected = sign(payload);
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    throw new Error("Invalid OAuth state");
  }
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OAuthState;
  if (parsed.expiresAt < Date.now()) throw new Error("OAuth state expired");
  return parsed;
}

function isExtensionRedirect(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      /^[a-p]{32}\.chromiumapp\.org$/.test(url.hostname) &&
      url.pathname === "/oauth-complete"
    );
  } catch {
    return false;
  }
}

function callbackUrl(): string {
  return `${env("OAUTH_PUBLIC_ORIGIN").replace(/\/$/, "")}/api/oauth/google/callback`;
}

function redirectWithError(extensionRedirect: string, error: string): string {
  const target = new URL(extensionRedirect);
  target.hash = new URLSearchParams({ error }).toString();
  return target.toString();
}

router.get("/oauth/google/start", (req, res): void => {
  const parsed = StartGoogleOAuthQueryParams.safeParse(req.query);
  if (!parsed.success || !isExtensionRedirect(parsed.data.extension_redirect)) {
    res.status(400).json({ error: "Invalid extension redirect URL" });
    return;
  }

  const authorize = new URL(GOOGLE_AUTHORIZE_URL);
  authorize.searchParams.set("client_id", env("GOOGLE_OAUTH_CLIENT_ID"));
  authorize.searchParams.set("redirect_uri", callbackUrl());
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", YOUTUBE_READONLY);
  authorize.searchParams.set("access_type", "offline");
  authorize.searchParams.set("prompt", "consent");
  authorize.searchParams.set("include_granted_scopes", "true");
  authorize.searchParams.set("state", createState(parsed.data.extension_redirect));
  res.redirect(authorize.toString());
});

router.get("/oauth/google/callback", async (req, res): Promise<void> => {
  const parsed = CompleteGoogleOAuthQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).send("Invalid OAuth callback");
    return;
  }

  let state: OAuthState;
  try {
    state = parseState(parsed.data.state);
  } catch (error) {
    req.log.warn({ error }, "Rejected Google OAuth state");
    res.status(400).send("The sign-in request expired or was invalid. Return to the extension and try again.");
    return;
  }

  if (parsed.data.error || !parsed.data.code) {
    res.redirect(redirectWithError(state.extensionRedirect, parsed.data.error ?? "missing_code"));
    return;
  }

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env("GOOGLE_OAUTH_CLIENT_ID"),
        client_secret: env("GOOGLE_OAUTH_CLIENT_SECRET"),
        code: parsed.data.code,
        grant_type: "authorization_code",
        redirect_uri: callbackUrl(),
      }),
    });
    const token = await response.json() as {
      access_token?: string;
      expires_in?: number;
      scope?: string;
      error?: string;
    };
    if (!response.ok || !token.access_token) {
      req.log.warn({ status: response.status, oauthError: token.error }, "Google token exchange failed");
      res.redirect(redirectWithError(state.extensionRedirect, token.error ?? "token_exchange_failed"));
      return;
    }

    const ticket = crypto.randomBytes(32).toString("base64url");
    tickets.set(ticket, {
      accessToken: token.access_token,
      expiresIn: token.expires_in ?? 3600,
      scope: token.scope ?? YOUTUBE_READONLY,
      expiresAt: Date.now() + TICKET_TTL_MS,
    });
    const target = new URL(state.extensionRedirect);
    target.hash = new URLSearchParams({
      ticket,
      access_token: token.access_token,
      expires_in: String(token.expires_in ?? 3600),
      scope: token.scope ?? YOUTUBE_READONLY,
    }).toString();
    res.redirect(target.toString());
  } catch (error) {
    req.log.error({ error }, "Google OAuth callback failed");
    res.redirect(redirectWithError(state.extensionRedirect, "server_error"));
  }
});

router.post("/oauth/google/exchange", (req, res): void => {
  const parsed = ExchangeGoogleOAuthTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid one-time ticket" });
    return;
  }

  const record = tickets.get(parsed.data.ticket);
  tickets.delete(parsed.data.ticket);
  if (!record || record.expiresAt < Date.now()) {
    res.status(400).json({ error: "One-time ticket expired or was already used" });
    return;
  }

  res.json(ExchangeGoogleOAuthTicketResponse.parse({
    accessToken: record.accessToken,
    expiresIn: record.expiresIn,
    scope: record.scope,
  }));
});

export default router;