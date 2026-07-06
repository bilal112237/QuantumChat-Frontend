import type { IAttachment } from '@quantum-chat/shared';
import {
  createKeyEnvelope,
  decryptBytesRaw,
  decryptContent,
  encryptBytes,
  encryptPlaintext,
  generateConversationKey,
  getStoredKey,
  storeKey,
  b64Decode,
} from './e2eCrypto';

export const ENCRYPTED_FILE_MIME = 'application/octet-stream';
export const ENCRYPTED_FILE_NAME = 'encrypted.bin';

export interface EncryptedAttachmentMeta {
  isEncrypted: true;
  encryptionIv: string;
  originalMimeType: string;
  encryptedOriginalName: string;
}

export async function ensureConversationKey(
  conversationId: string
): Promise<{ key: string; keyExchange?: string }> {
  let key = getStoredKey(conversationId);
  let keyExchange: string | undefined;

  if (!key) {
    key = await generateConversationKey();
    storeKey(conversationId, key);
    keyExchange = createKeyEnvelope(key);
  }

  return { key, keyExchange };
}

export async function encryptFileForUpload(
  conversationId: string,
  file: File
): Promise<{ file: File; meta: EncryptedAttachmentMeta }> {
  const { key } = await ensureConversationKey(conversationId);
  const buffer = await file.arrayBuffer();
  const { ciphertext, iv } = await encryptBytes(key, buffer);
  const encryptedOriginalName = await encryptPlaintext(key, file.name);
  const encryptedBytes = b64Decode(ciphertext);
  const encryptedFile = new File([encryptedBytes], ENCRYPTED_FILE_NAME, {
    type: ENCRYPTED_FILE_MIME,
  });

  return {
    file: encryptedFile,
    meta: {
      isEncrypted: true,
      encryptionIv: iv,
      originalMimeType: file.type || 'application/octet-stream',
      encryptedOriginalName,
    },
  };
}

export async function decryptAttachmentBytes(
  conversationId: string,
  attachment: IAttachment,
  encryptedBytes: ArrayBuffer
): Promise<{ data: ArrayBuffer; originalName: string; mimeType: string } | null> {
  if (!attachment.isEncrypted || !attachment.encryptionIv) return null;

  const key = getStoredKey(conversationId);
  if (!key) return null;

  const data = await decryptBytesRaw(key, encryptedBytes, attachment.encryptionIv);
  if (!data) return null;

  let originalName = attachment.originalName || 'download';
  if (attachment.encryptedOriginalName) {
    const name = await decryptContent(conversationId, attachment.encryptedOriginalName);
    if (name) originalName = name;
  }

  const mimeType = attachment.originalMimeType || 'application/octet-stream';
  return { data, originalName, mimeType };
}
