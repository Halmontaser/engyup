import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to base64url encode
function base64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Obtain Google OAuth2 access token via service account JWT
 */
export async function getGoogleAccessToken(serviceAccountPath) {
  const raw = fs.readFileSync(serviceAccountPath, 'utf8');
  const creds = JSON.parse(raw);

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedClaim = base64url(JSON.stringify(claimSet));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(creds.private_key);
  const jwt = `${signatureInput}.${base64url(signature)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to obtain Google access token (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { token: data.access_token, email: creds.client_email };
}

/**
 * Google Play Developer API Client
 */
export class GooglePlayAPI {
  constructor(accessToken, packageName) {
    this.token = accessToken;
    this.packageName = packageName;
    this.baseUrl = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
  }

  async fetch(url, options = {}) {
    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
      ...(options.headers || {})
    };
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  }

  // 1. Create a new edit transaction
  async createEdit() {
    const url = `${this.baseUrl}/${this.packageName}/edits`;
    return this.fetch(url, { method: 'POST' });
  }

  // 2. Validate edit transaction
  async validateEdit(editId) {
    const url = `${this.baseUrl}/${this.packageName}/edits/${editId}:validate`;
    return this.fetch(url, { method: 'POST' });
  }

  // 3. Commit edit transaction
  async commitEdit(editId, changesNotSentForReview = false) {
    const url = `${this.baseUrl}/${this.packageName}/edits/${editId}:commit?changesNotSentForReview=${changesNotSentForReview}`;
    return this.fetch(url, { method: 'POST' });
  }

  // 4. Update app details (contact email, website, default language)
  async updateDetails(editId, details) {
    const url = `${this.baseUrl}/${this.packageName}/edits/${editId}/details`;
    return this.fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    });
  }

  // 5. Update localized listing (title, shortDescription, fullDescription)
  async updateListing(editId, language, listing) {
    const url = `${this.baseUrl}/${this.packageName}/edits/${editId}/listings/${language}`;
    return this.fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listing)
    });
  }

  // 6. Upload an image (icon, featureGraphic, phoneScreenshots)
  async uploadImage(editId, language, imageType, imagePath) {
    const url = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${this.packageName}/edits/${editId}/listings/${language}/${imageType}?uploadType=media`;
    const fileBytes = fs.readFileSync(imagePath);
    const contentType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    return this.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: fileBytes
    });
  }

  // 7. Upload AAB bundle
  async uploadBundle(editId, aabPath) {
    const url = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${this.packageName}/edits/${editId}/bundles?uploadType=media`;
    const fileBytes = fs.readFileSync(aabPath);
    return this.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: fileBytes
    });
  }

  // 8. Update Track (production, internal, alpha, beta)
  async updateTrack(editId, track, versionCodes, releaseNotes = []) {
    const url = `${this.baseUrl}/${this.packageName}/edits/${editId}/tracks/${track}`;
    const payload = {
      track,
      releases: [
        {
          name: '1.0.0 (Engy Up Release)',
          versionCodes: versionCodes.map(String),
          status: 'completed',
          releaseNotes: releaseNotes
        }
      ]
    };

    return this.fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }
}
