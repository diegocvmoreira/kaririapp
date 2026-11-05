import { apiClient } from './config';

export interface UploadedImage {
  url: string;
  path: string;
  mime: string;
  size: number;
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append('image', file);

  return apiClient<UploadedImage>('/uploads/images', {
    method: 'POST',
    body: formData,
  });
}
