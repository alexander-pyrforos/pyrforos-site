export interface LeadPayload {
  service: string;
  package?: string | null;
  name: string;
  email: string;
  niche: string;
  message?: string | null;
}

export type TgConfig = { TG_BOT_TOKEN?: string; TG_CHAT_ID?: string };

export function buildTelegramMessage(lead: LeadPayload): string {
  const lines = [
    `New lead on pyrforos.xyz`,
    `service: ${lead.service}`,
    lead.package ? `package: ${lead.package}` : null,
    `name: ${lead.name}`,
    `email: ${lead.email}`,
    `niche: ${lead.niche}`,
    lead.message ? `message: ${lead.message}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

/**
 * Fire-and-forget Telegram notification. Never throws: a down Telegram
 * must not fail the lead request. Skips silently when unconfigured.
 */
export async function sendMessage(
  cfg: TgConfig,
  text: string,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  if (!cfg.TG_BOT_TOKEN || !cfg.TG_CHAT_ID) return;
  try {
    await fetcher(`https://api.telegram.org/bot${cfg.TG_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: cfg.TG_CHAT_ID, text }),
    });
  } catch {
    // Telegram is best-effort; the lead is already stored.
  }
}
