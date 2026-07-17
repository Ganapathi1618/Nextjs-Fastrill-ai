// lib/encryption.js
const crypto = require("crypto")

const ALGO = "aes-256-gcm"
const IV_LEN = 16
const TAG_LEN = 16

function getKey() {
  const hex = process.env.TOKEN_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)")
  }
  return Buffer.from(hex, "hex")
}

function encrypt(plaintext) {
  if (!plaintext) return plaintext
  const key = getKey()
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return iv.toString("hex") + ":" + tag.toString("hex") + ":" + enc.toString("hex")
}

function decrypt(ciphertext) {
  if (!ciphertext) return ciphertext
  if (!ciphertext.includes(":")) return ciphertext
  const parts = ciphertext.split(":")
  if (parts.length !== 3) return ciphertext
  const key = getKey()
  const iv = Buffer.from(parts[0], "hex")
  const tag = Buffer.from(parts[1], "hex")
  const enc = Buffer.from(parts[2], "hex")
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(enc) + decipher.final("utf8")
}

module.exports = { encrypt, decrypt }
