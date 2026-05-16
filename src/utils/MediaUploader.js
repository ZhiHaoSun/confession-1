export class MediaUploader {
  static async uploadFile(file, { folder = 'memorymaze', onStatus } = {}) {
    if (!file) return null;

    onStatus?.('正在创建云端上传链接...');
    const signedUrlResponse = await fetch('/api/gcs-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        folder,
      }),
    });

    const signedUrlData = await signedUrlResponse.json().catch(() => ({}));
    if (!signedUrlResponse.ok) {
      throw new Error(signedUrlData.error || '无法创建 Google Cloud 上传链接');
    }

    if (!signedUrlData.signedUrl || !signedUrlData.publicUrl) {
      throw new Error('上传接口未返回 Google Cloud 链接。请使用 Vercel 部署或 vercel dev，并检查 GCS 环境变量。');
    }

    onStatus?.('正在上传到 Google Cloud...');
    const uploadResponse = await fetch(signedUrlData.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': signedUrlData.contentType || file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Google Cloud 上传失败 (${uploadResponse.status})`);
    }

    onStatus?.('上传完成');
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
