import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import { profileService } from '@/src/services/transactionService';

const BUCKET = 'avatars';

export type AvatarSource = 'camera' | 'library';

export class AvatarPermissionError extends Error {
  constructor(public source: AvatarSource) {
    super(`permission:${source}`);
    this.name = 'AvatarPermissionError';
  }
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let o = 0;
  for (let i = 0; i < clean.length; i++) {
    buffer = (buffer << 6) | B64.indexOf(clean[i]);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (buffer >> bits) & 0xff;
    }
  }
  return out.subarray(0, o);
}

async function removeFiles(userId: string, keep?: string) {
  const { data } = await supabase.storage.from(BUCKET).list(userId);
  const stale = (data ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== keep);
  if (stale.length) await supabase.storage.from(BUCKET).remove(stale);
}

export const avatarService = {
  /** Opens camera/gallery with a square crop. Returns null if the user cancels. */
  async pick(source: AvatarSource): Promise<ImagePicker.ImagePickerAsset | null> {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new AvatarPermissionError(source);

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ ...options, cameraType: ImagePicker.CameraType.front })
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets?.[0]?.base64) return null;
    return result.assets[0];
  },

  async upload(userId: string, asset: ImagePicker.ImagePickerAsset): Promise<string> {
    const mime = asset.mimeType && asset.mimeType.startsWith('image/') ? asset.mimeType : 'image/jpeg';
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : mime === 'image/heic' ? 'heic' : 'jpg';
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, base64ToBytes(asset.base64!), { contentType: mime, upsert: true });
    if (error) handleSupabaseError(error);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    await profileService.update(userId, { avatar_url: data.publicUrl });
    await removeFiles(userId, path).catch(() => undefined);
    return data.publicUrl;
  },

  async remove(userId: string) {
    await profileService.update(userId, { avatar_url: null });
    await removeFiles(userId).catch(() => undefined);
  },
};
