/**
 * Apple Wallet (.pkpass) for ShivAI digital business cards.
 *
 *   GET <route>/:slug  →  the card's signed .pkpass file
 *
 * The website links straight to this route: Safari on iPhone shows "Add to Apple
 * Wallet"; on Android, Pass2U Wallet / WalletPasses open the same file.
 *
 * Needs `npm install node-forge` (PKCS#7 signing — Node's crypto can't produce the
 * detached CMS signature Apple requires). `sharp`, if installed, adds the person's
 * photo to the pass; without it the pass is built without a photo.
 *
 * Config (environment variables; the PEM ones take the PEM text or a file path):
 *   APPLE_PASS_TYPE_ID        e.g. pass.com.callshivai.card   (Apple Developer → Identifiers)
 *   APPLE_TEAM_ID             10-character Apple team id
 *   APPLE_PASS_CERT           Pass Type ID certificate (PEM)
 *   APPLE_PASS_KEY            its private key (PEM)
 *   APPLE_PASS_KEY_PASSPHRASE optional, if the key is encrypted
 *   APPLE_WWDR_CERT           Apple WWDR intermediate certificate, G4 (PEM)
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { HEX_RE, WalletError, secret, href, host, fullPhone, cardLink, cardKey, fetchCard, toFailure, corsFor, slugFromPath } = require("./common");

const ASSETS = path.join(__dirname, "apple-assets");

// ── config ───────────────────────────────────────────────────────────────────

let config = null;
function loadConfig() {
  if (config) return config;
  const passTypeId = (process.env.APPLE_PASS_TYPE_ID || "").trim();
  const teamId = (process.env.APPLE_TEAM_ID || "").trim();
  if (!passTypeId || !teamId) throw new WalletError("APPLE_PASS_TYPE_ID / APPLE_TEAM_ID not set", 503, "This wallet isn't available yet");
  let forge;
  try {
    forge = require("node-forge");
  } catch {
    throw new WalletError("node-forge is not installed (npm install node-forge)", 503, "This wallet isn't available yet");
  }
  const passphrase = process.env.APPLE_PASS_KEY_PASSPHRASE || undefined;
  const keyPem = secret("APPLE_PASS_KEY");
  config = {
    forge,
    passTypeId,
    teamId,
    signerCert: forge.pki.certificateFromPem(secret("APPLE_PASS_CERT")),
    wwdrCert: forge.pki.certificateFromPem(secret("APPLE_WWDR_CERT")),
    signerKey: passphrase ? forge.pki.decryptRsaPrivateKey(keyPem, passphrase) : forge.pki.privateKeyFromPem(keyPem),
  };
  if (!config.signerKey) throw new WalletError("APPLE_PASS_KEY could not be decrypted", 503, "This wallet isn't available yet");
  return config;
}

// ── pass.json ────────────────────────────────────────────────────────────────

function rgb(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return { r, g, b, css: `rgb(${r}, ${g}, ${b})`, light: (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 };
}

function buildPassJson(card, { passTypeId, teamId }) {
  const link = cardLink(card);
  const phone = fullPhone(card);
  const bg = rgb(HEX_RE.test(card.color_code || "") ? card.color_code : "#161616");
  const ink = bg.light ? "rgb(22, 22, 22)" : "rgb(255, 255, 255)";
  const label = bg.light ? "rgb(90, 90, 90)" : "rgb(200, 200, 200)";

  const secondary = [];
  if (card.job_title) secondary.push({ key: "title", label: "TITLE", value: card.job_title });
  if (card.company_name) secondary.push({ key: "company", label: "COMPANY", value: card.company_name });
  const auxiliary = phone ? [{ key: "phone", label: "PHONE", value: phone }] : [];

  const back = [];
  if (card.tagline) back.push({ key: "about", label: "About", value: card.tagline });
  if (phone) back.push({ key: "phone-back", label: "Phone", value: phone, dataDetectorTypes: ["PKDataDetectorTypePhoneNumber"] });
  if (card.email) back.push({ key: "email", label: "Email", value: card.email, dataDetectorTypes: ["PKDataDetectorTypeLink"] });
  if (card.website) back.push({ key: "website", label: "Website", value: href(card.website), dataDetectorTypes: ["PKDataDetectorTypeLink"] });
  back.push({ key: "card", label: "Digital card", value: link, dataDetectorTypes: ["PKDataDetectorTypeLink"] });
  back.push({ key: "powered", label: "Powered by", value: "ShivAI — callshivai.com" });

  return {
    formatVersion: 1,
    passTypeIdentifier: passTypeId,
    teamIdentifier: teamId,
    serialNumber: cardKey(card),
    organizationName: "ShivAI",
    description: `${card.full_name || "Digital"} business card`,
    logoText: card.company_name || "Digital Business Card",
    backgroundColor: bg.css,
    foregroundColor: ink,
    labelColor: label,
    sharingProhibited: false,
    barcodes: [{ format: "PKBarcodeFormatQR", message: link, messageEncoding: "iso-8859-1", altText: host(link) }],
    generic: {
      primaryFields: [{ key: "name", label: "", value: card.full_name || "Digital Business Card" }],
      secondaryFields: secondary,
      auxiliaryFields: auxiliary,
      backFields: back,
    },
  };
}

/** The person's photo as the pass thumbnail (PNG required) — only when `sharp` is available. */
async function thumbnails(card) {
  if (!/^https:\/\//i.test(card.image_url || "")) return {};
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    return {};
  }
  try {
    const res = await fetch(card.image_url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return {};
    const src = Buffer.from(await res.arrayBuffer());
    const out = {};
    for (const [name, px] of [["thumbnail.png", 90], ["thumbnail@2x.png", 180], ["thumbnail@3x.png", 270]]) {
      out[name] = await sharp(src).resize(px, px, { fit: "cover", position: "attention" }).png().toBuffer();
    }
    return out;
  } catch {
    return {}; // a missing photo shouldn't stop the pass
  }
}

// ── signing + zip ────────────────────────────────────────────────────────────

const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex");

/** Detached PKCS#7 signature of manifest.json — the "signature" file Apple checks. */
function sign(manifest, { forge, signerCert, signerKey, wwdrCert }) {
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifest.toString("binary"));
  p7.addCertificate(signerCert);
  p7.addCertificate(wwdrCert);
  p7.addSigner({
    key: signerKey,
    certificate: signerCert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() },
    ],
  });
  p7.sign({ detached: true });
  return Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), "binary");
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Minimal ZIP writer (stored, no compression) — a .pkpass is just a zip. */
function zip(files) {
  const local = [];
  const central = [];
  let offset = 0;
  for (const [name, data] of Object.entries(files)) {
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(20, 4); // version needed
    head.writeUInt16LE(0x0800, 6); // UTF-8 names
    head.writeUInt16LE(0, 8); // stored
    head.writeUInt32LE(0, 10); // time/date
    head.writeUInt32LE(crc, 14);
    head.writeUInt32LE(data.length, 18);
    head.writeUInt32LE(data.length, 22);
    head.writeUInt16LE(nameBuf.length, 26);
    head.writeUInt16LE(0, 28);
    local.push(head, nameBuf, data);

    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0x0800, 8);
    dir.writeUInt16LE(0, 10);
    dir.writeUInt32LE(0, 12);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(data.length, 20);
    dir.writeUInt32LE(data.length, 24);
    dir.writeUInt16LE(nameBuf.length, 28);
    dir.writeUInt32LE(offset, 42);
    central.push(dir, nameBuf);
    offset += head.length + nameBuf.length + data.length;
  }
  const dirBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(dirBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, dirBuf, end]);
}

/** Builds the signed .pkpass for a card (an already-loaded card object). */
async function buildPkpass(card) {
  const cfg = loadConfig();
  const files = { "pass.json": Buffer.from(JSON.stringify(buildPassJson(card, cfg))) };
  for (const f of fs.readdirSync(ASSETS)) files[f] = fs.readFileSync(path.join(ASSETS, f));
  Object.assign(files, await thumbnails(card));
  const manifest = Buffer.from(JSON.stringify(Object.fromEntries(Object.entries(files).map(([n, d]) => [n, sha1(d)]))));
  files["manifest.json"] = manifest;
  files.signature = sign(manifest, cfg);
  return zip(files);
}

// ── handlers ─────────────────────────────────────────────────────────────────

async function respond(slug) {
  try {
    const card = await fetchCard(slug);
    return { status: 200, file: await buildPkpass(card), name: `${card.slug}.pkpass` };
  } catch (e) {
    return { ...toFailure(e, "apple-wallet") };
  }
}

/** Express:  app.get("/api/v1/business-cards/public/:slug/apple-wallet", expressHandler) */
async function expressHandler(req, res) {
  const r = await respond(req.params.slug);
  if (!r.file) return res.status(r.status).set("Cache-Control", "no-store").json({ success: false, message: r.message });
  res
    .status(200)
    .set({
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="${r.name}"`,
      "Cache-Control": "no-store",
    })
    .send(r.file);
}

/** AWS Lambda (Function URL): the slug is the last path segment. */
async function lambdaHandler(event) {
  const cors = corsFor(event);
  const r = await respond(slugFromPath(event, "apple-wallet"));
  if (!r.file) {
    return { statusCode: r.status, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify({ success: false, message: r.message }) };
  }
  return {
    statusCode: 200,
    isBase64Encoded: true,
    headers: { ...cors, "content-type": "application/vnd.apple.pkpass", "content-disposition": `attachment; filename="${r.name}"`, "cache-control": "no-store" },
    body: r.file.toString("base64"),
  };
}

module.exports = { buildPkpass, expressHandler, lambdaHandler, handler: lambdaHandler, _buildPassJson: buildPassJson, _zip: zip };
