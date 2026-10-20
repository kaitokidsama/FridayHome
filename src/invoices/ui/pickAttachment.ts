import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { strings } from '../../shared/i18n/strings';

export interface PickedAttachment {
  uri: string;
  name: string;
  isImage: boolean;
}

export class PickerPermissionError extends Error {}

const imageOptions: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };

const defaultImageName = () => `invoice-${Date.now()}.jpg`;

export async function takePhoto(): Promise<PickedAttachment | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new PickerPermissionError(strings.invoices.cameraDenied);
  const result = await ImagePicker.launchCameraAsync(imageOptions);
  if (result.canceled) return null;
  const [asset] = result.assets;
  return { uri: asset.uri, name: asset.fileName ?? defaultImageName(), isImage: true };
}

export async function pickFromLibrary(): Promise<PickedAttachment | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new PickerPermissionError(strings.invoices.libraryDenied);
  const result = await ImagePicker.launchImageLibraryAsync(imageOptions);
  if (result.canceled) return null;
  const [asset] = result.assets;
  return { uri: asset.uri, name: asset.fileName ?? defaultImageName(), isImage: true };
}

export async function pickDocument(): Promise<PickedAttachment | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const [asset] = result.assets;
  return { uri: asset.uri, name: asset.name, isImage: asset.mimeType?.startsWith('image/') ?? false };
}

export function isImageUri(uri: string): boolean {
  return /\.(jpe?g|png|heic|heif|webp|gif)$/i.test(uri);
}
