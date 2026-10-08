// Robôs de pré-visualização (WhatsApp, Slack, iMessage...) não contam como acesso.
const BOT =
  /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|linkedin|skype|embedly|vkshare|pinterest|quora|outbrain|redditbot|applebot|bingpreview|google-?(?:read|site|inspection)|headless|python|curl|wget|go-http|okhttp|axios|node-fetch|undici/i;

export const isBot = (ua: string | null) => !ua || BOT.test(ua);
