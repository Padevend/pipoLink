import * as FileSystem from 'expo-file-system/legacy';
import naclUtil from 'tweetnacl-util';

import { ensureChatKeyForChat } from '@/features/messaging/lib/ensure-chat-key';
import { messagingApi } from '@/shared/api/messaging';
import type { Message, MessageType } from '@/shared/api/types';
import { encryptFile } from '@/shared/crypto/document';
import { encryptMessage } from '@/shared/crypto/message';

export type PickedFile = {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
};

export type SendMessageInput = {
  content: string;
  type: 'text' | 'image' | 'document';
  file?: PickedFile;
};

function resolveMessageType(input: SendMessageInput): MessageType {
  if (input.file && input.content.trim()) return 'MIXED';
  if (input.file) {
    const mime = input.file.mimeType ?? '';
    if (mime.startsWith('image/')) return 'IMAGE';
    return 'DOCUMENT';
  }
  if (input.type === 'image') return 'IMAGE';
  if (input.type === 'document') return 'DOCUMENT';
  return 'TEXT';
}

async function readFileBytes(uri: string): Promise<Uint8Array> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return naclUtil.decodeBase64(base64);
}

async function uploadEncryptedFile(
  conversationId: string,
  file: PickedFile,
  chatKey: Uint8Array,
): Promise<{ fileUrl: string; iv: string; fileName: string; fileSize: number; mimeType: string }> {
  const plain = await readFileBytes(file.uri);
  const { encryptedBuffer, iv } = await encryptFile(plain, chatKey);

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error('Cache indisponible pour l’upload chiffré.');
  }

  const tmpPath = `${cacheDir}enc-${Date.now()}.bin`;
  await FileSystem.writeAsStringAsync(tmpPath, naclUtil.encodeBase64(encryptedBuffer), {
    encoding: FileSystem.EncodingType.Base64,
  });

  const formData = new FormData();
  // @ts-expect-error React Native FormData file blob
  formData.append('file', {
    uri: tmpPath,
    name: `${file.name}.enc`,
    type: 'application/octet-stream',
  });

  const uploaded = await messagingApi.uploadAttachment(conversationId, formData);
  return {
    fileUrl: uploaded.url,
    iv,
    fileName: file.name,
    fileSize: file.size ?? plain.length,
    mimeType: file.mimeType ?? 'application/octet-stream',
  };
}

/** Envoie un message (texte et/ou pièce jointe chiffrée) au serveur. */
export async function sendMessageToServer(
  conversationId: string,
  input: SendMessageInput,
): Promise<Message> {
  const chatKey = await ensureChatKeyForChat(conversationId);

  const attachments = input.file ? [await uploadEncryptedFile(conversationId, input.file, chatKey)] : [];

  const plaintext =
    input.content.trim() ||
    (input.file ? `📎 ${input.file.name}` : '');

  const encrypted = await encryptMessage(plaintext, chatKey);

  return messagingApi.sendMessage(conversationId, {
    content: encrypted.cipherText,
    iv: encrypted.iv,
    type: resolveMessageType(input),
    attachments: attachments.length ? attachments : undefined,
  });
}
