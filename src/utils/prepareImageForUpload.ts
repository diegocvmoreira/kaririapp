import imageCompression from 'browser-image-compression';

const MAX_INPUT_SIZE = 15 * 1024 * 1024;

export async function prepareImageForUpload(
  file: File
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem.');
  }

  if (file.size > MAX_INPUT_SIZE) {
    throw new Error('A imagem original deve ter no máximo 15 MB.');
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.82,
  });

  return new File(
    [compressed],
    `${file.name.replace(/\.[^/.]+$/, '')}.webp`,
    {
      type: 'image/webp',
      lastModified: Date.now(),
    }
  );
}
