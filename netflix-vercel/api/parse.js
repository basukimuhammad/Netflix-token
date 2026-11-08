const COOKIE_KEYS = [
  "NetflixId",
  "SecureNetflixId",
  "nfvdid",
  "OptanonConsent"
];

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseCookies(input) {
  const result = {};

  // JSON export: [{name, value}, ...] or {cookies: [...]}
  try {
    const parsed = JSON.parse(input);

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (
          item &&
          COOKIE_KEYS.includes(item.name) &&
          typeof item.value === "string"
        ) {
          result[item.name] = safeDecode(item.value);
        }
      }
    } else if (parsed && typeof parsed === "object") {
      const list = Array.isArray(parsed.cookies) ? parsed.cookies : null;

      if (list) {
        for (const item of list) {
          if (
            item &&
            COOKIE_KEYS.includes(item.name) &&
            typeof item.value === "string"
          ) {
            result[item.name] = safeDecode(item.value);
          }
        }
      } else {
        for (const key of COOKIE_KEYS) {
          if (typeof parsed[key] === "string") {
            result[key] = safeDecode(parsed[key]);
          }
        }
      }
    }
  } catch {
    // Continue with text and Netscape formats.
  }

  // Netscape cookie file: tab-separated columns, name at index 5.
  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const parts = line.split("\t");
    if (parts.length >= 7 && COOKIE_KEYS.includes(parts[5])) {
      result[parts[5]] = safeDecode(parts[6]);
    }
  }

  // Cookie header / plain text.
  for (const key of COOKIE_KEYS) {
    if (result[key]) continue;

    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = input.match(
      new RegExp("(?:^|[;,\\s])" + escaped + "=([^;,\\s]+)")
    );

    if (match) result[key] = safeDecode(match[1]);
  }

  return result;
}

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      success: false,
      message: "Method not allowed."
    });
  }

  const body = req.body || {};
  const input = body.cookie;

  if (typeof input !== "string" || !input.trim()) {
    return res.status(400).json({
      success: false,
      message: "Cookie belum diisi."
    });
  }

  if (input.length > 50000) {
    return res.status(413).json({
      success: false,
      message: "Input terlalu besar."
    });
  }

  const cookies = parseCookies(input);

  if (!cookies.NetflixId) {
    return res.status(400).json({
      success: false,
      message: "NetflixId tidak ditemukan. Periksa format input."
    });
  }

  // Never return cookie values to the browser or store them.
  return res.status(200).json({
    success: true,
    message: "Cookie berhasil dibaca. Nilai cookie tidak disimpan atau dikembalikan.",
    cookies: Object.keys(cookies),
    count: Object.keys(cookies).length,
    requiredFound: true
  });
};
