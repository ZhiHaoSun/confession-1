import { t } from '../i18n/i18n.js';

export class MediaUploader {
  static async uploadFile(file, { folder = 'memorymaze', objectName, onStatus } = {}) {
    if (!file) return null;

    onStatus?.(t('upload.creatingLink'));
    const signedUrlResponse = await fetch('/api/gcs-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        folder,
        objectName,
      }),
    });

    const signedUrlData = await signedUrlResponse.json().catch(() => ({}));
    if (!signedUrlResponse.ok) {
      throw new Error(signedUrlData.error || t('upload.linkError'));
    }

    if (!signedUrlData.signedUrl || !signedUrlData.publicUrl) {
      throw new Error(t('upload.linkMissing'));
    }

    onStatus?.(t('upload.uploading'));
    const uploadResponse = await fetch(signedUrlData.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': signedUrlData.contentType || file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`${t('upload.uploadFailed')} (${uploadResponse.status})`);
    }

    onStatus?.(t('upload.uploadDone'));
    return {
      url: signedUrlData.publicUrl,
      objectName: signedUrlData.objectName,
      name: file.name,
      type: file.type,
      size: file.size,
    };
  }

  static async imageFileToUploadBlob(file, maxDim = 1200) {
    const dataUrl = await this.fileToDataUrl(file);
    const image = await this.loadImage(dataUrl);
    let { width, height } = image;

    if (width > maxDim || height > maxDim) {
      const ratio = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.82);
    });

    return new File([blob], this.toJpegName(file.name), { type: 'image/jpeg' });
  }

  static async uploadJson(data, { fileName, objectName, folder = 'memorymaze/configs', onStatus } = {}) {
    const json = JSON.stringify(data, null, 2);
    const file = new File([json], fileName || 'config.json', { type: 'application/json' });
    return await this.uploadFile(file, { folder, objectName, onStatus });
  }

  static fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  static loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  static toJpegName(fileName) {
    return String(fileName || 'memory-photo').replace(/\.[^.]+$/, '') + '.jpg';
  }
}
