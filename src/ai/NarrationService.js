import { MediaUploader } from '../utils/MediaUploader.js';
import { t } from '../i18n/i18n.js';

export class NarrationService {
  static async attachNarration(config, wizardData, onStatus) {
    if (!wizardData.voiceNarrationEnabled) {
      return config;
    }

    config.narration = {
      ...(config.narration || {}),
      enabled: true,
      disclosure: t('game.aiNarrationDisclosure'),
    };

    try {
      const voiceProfile = await this.prepareVoiceProfile(config, wizardData);
      config.narration.voiceId = voiceProfile.voiceId || config.narration.voiceId || '';
      config.narration.voiceMode = voiceProfile.voiceMode || config.narration.voiceMode || 'built-in';
      if (voiceProfile.warning) config.narration.voiceWarning = voiceProfile.warning;

      const finaleText = String(config.finale?.loveLetter || '').trim();
      if (finaleText) {
        onStatus?.(t('generate.narrationFinale'));
        const finaleAudio = await this.generateAndUpload(
          finaleText,
          'final-confession',
          config.narration.voiceId,
          'finale'
        );
        config.finale.narrationUrl = finaleAudio.url;
        config.finale.narrationVoiceMode = finaleAudio.voiceMode;
        config.finale.narrationType = finaleAudio.narrationType;
        config.narration.voiceMode = finaleAudio.voiceMode;
        config.narration.model = finaleAudio.model || config.narration.model;
      }

      for (const [levelIndex, level] of (config.levels || []).entries()) {
        const puzzleItem = (level.interactives || []).find(item => item?.puzzle?.hint);
        if (!puzzleItem?.puzzle?.hint) continue;

        onStatus?.(t('generate.narrationHint', { n: levelIndex + 1 }));
        const hintText = `${t('game.hintPrefix')}${puzzleItem.puzzle.hint}`;
        const hintAudio = await this.generateAndUpload(
          hintText,
          `chapter-${levelIndex + 1}-hint`,
          config.narration.voiceId,
          'hint'
        );
        puzzleItem.puzzle.narrationUrl = hintAudio.url;
      }
    } catch (error) {
      console.warn('Voice narration generation failed:', error.message);
      config.narration.error = error.message;
      onStatus?.(t('generate.narrationUnavailable'));
    }

    return config;
  }

  static async prepareVoiceProfile(config, wizardData) {
    if (config.narration?.voiceId) {
      return {
        voiceId: config.narration.voiceId,
        voiceMode: config.narration.voiceMode || 'custom-configured',
      };
    }

    const response = await fetch('/api/voice-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioSampleUrl: wizardData.creatorVoiceSampleUrl || '',
        name: `${wizardData.myName || 'MemoryMaze'} voice`,
      }),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.error || `Voice profile request failed (${response.status})`);
    }
    return await response.json();
  }

  static async generateAndUpload(text, assetName, voiceId, narrationType = 'hint') {
    const response = await fetch('/api/narration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId, narrationType }),
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail.error || `Narration request failed (${response.status})`);
    }

    const blob = await response.blob();
    const file = new File([blob], `${assetName}.mp3`, { type: 'audio/mpeg' });
    const upload = await MediaUploader.uploadFile(file, { folder: 'memorymaze/narration' });
    return {
      ...upload,
      model: response.headers.get('X-Narration-Model') || 'gpt-4o-mini-tts',
      voiceMode: response.headers.get('X-Narration-Voice-Mode') || 'built-in',
      narrationType: response.headers.get('X-Narration-Type') || narrationType,
    };
  }
}
