import { MediaUploader } from '../utils/MediaUploader.js';
import { t } from '../i18n/i18n.js';

export class SceneArtworkService {
  static async attachArtwork(config, onStatus) {
    const levels = Array.isArray(config?.levels) ? config.levels : [];

    for (let index = 0; index < levels.length; index++) {
      const level = levels[index];
      onStatus?.(t('generate.artworkScene', { n: index + 1, title: level.title || '' }));

      try {
        await this.generateAndAttach(level, index, config.characters);
      } catch (error) {
        const referencedCharacters = [
          config.characters?.creator?.portraitUrl && 'creator',
          config.characters?.receiver?.portraitUrl && 'receiver',
        ].filter(Boolean);
        const imageShape = level.challenge?.type === 'jigsaw' ? 'square' : 'landscape';
        level.artwork = {
          status: 'fallback',
          url: level.background || '',
          model: 'gpt-image-2',
          style: 'romantic-manga',
          quality: 'high',
          size: imageShape === 'square' ? '2048x2048' : '2048x1152',
          outputFormat: 'webp',
          imageShape,
          sourceMode: (level.photos || []).length || referencedCharacters.length ? 'reference' : 'text',
          characterReferencesUsed: referencedCharacters,
          promptVersion: 1,
          generatedAt: new Date().toISOString(),
          error: error.message || t('generate.artworkUnavailable'),
        };
      }
    }

    return config;
  }

  static async regenerateLevel(config, levelIndex, onStatus) {
    const level = config?.levels?.[levelIndex];
    if (!level) throw new Error('Scene not found.');

    onStatus?.(t('generate.artworkRegenerating', { title: level.title || '' }));
    await this.generateAndAttach(level, levelIndex, config.characters);
    return level;
  }

  static async generateAndAttach(level, index, characters = {}) {
    const response = await fetch('/api/scene-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sceneDescription: level.scene_description || level.description || '',
        memory: {
          title: level.title || '',
          description: level.description || '',
          location: level.location || '',
          people: level.people || '',
          dialogue: level.dialogue || '',
        },
        interactives: (level.interactives || []).map(item => ({
          title: item.title || '',
          position: item.position || null,
        })),
        referencePhotoUrls: level.photos || [],
        imageShape: level.challenge?.type === 'jigsaw' ? 'square' : 'landscape',
        characters: {
          creator: {
            name: characters.creator?.name || '',
            portraitUrl: characters.creator?.portraitUrl || '',
          },
          receiver: {
            name: characters.receiver?.name || '',
            portraitUrl: characters.receiver?.portraitUrl || '',
          },
        },
      }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.imageBase64) {
      throw new Error(result.error || t('generate.artworkUnavailable'));
    }

    const file = this.base64File(
      result.imageBase64,
      `memory-scene-${index + 1}.${result.metadata?.outputFormat || 'webp'}`,
      result.contentType || 'image/webp'
    );
    const upload = await MediaUploader.uploadFile(file, { folder: 'memorymaze/generated-scenes' });
    const metadata = result.metadata || {};

    level.background = upload.url;
    level.artwork = {
      status: 'generated',
      url: upload.url,
      model: metadata.model || 'gpt-image-2',
      style: 'romantic-manga',
      quality: metadata.quality || 'high',
      size: metadata.size || (level.challenge?.type === 'jigsaw' ? '2048x2048' : '2048x1152'),
      outputFormat: metadata.outputFormat || 'webp',
      imageShape: metadata.imageShape || (level.challenge?.type === 'jigsaw' ? 'square' : 'landscape'),
      sourceMode: metadata.sourceMode || ((level.photos || []).length ? 'reference' : 'text'),
      characterReferencesUsed: metadata.characterReferencesUsed || [],
      promptVersion: 1,
      generatedAt: new Date().toISOString(),
    };
  }

  static base64File(value, fileName, contentType) {
    const binary = window.atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new File([bytes], fileName, { type: contentType });
  }
}
