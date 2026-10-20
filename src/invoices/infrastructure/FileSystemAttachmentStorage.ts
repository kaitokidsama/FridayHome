import { Directory, File, Paths } from 'expo-file-system';

import type { AttachmentStorage } from '../application/ports';

const ATTACHMENTS_FOLDER = 'attachments';

const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

/** Copies picked files into the app document directory so they survive cache cleanup. */
export class FileSystemAttachmentStorage implements AttachmentStorage {
  private directory() {
    const directory = new Directory(Paths.document, ATTACHMENTS_FOLDER);
    if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
    return directory;
  }

  async store(sourceUri: string, preferredName?: string) {
    const fallbackName = sourceUri.split('/').pop() ?? 'attachment';
    const name = `${Date.now()}-${sanitize(preferredName ?? fallbackName)}`;
    const destination = new File(this.directory(), name);
    await new File(sourceUri).copy(destination);
    return destination.uri;
  }

  async remove(uri: string) {
    const file = new File(uri);
    if (file.exists) file.delete();
  }
}
