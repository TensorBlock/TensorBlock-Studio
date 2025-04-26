import React, { useState, useEffect } from 'react';
import { SettingsService, SETTINGS_CHANGE_EVENT } from '../../services/settings-service';
import { Orbit, Languages, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { Message, MessageRole } from '../../types/chat';
import { AIService } from '../../services/ai-service';
import { StreamControlHandler } from '../../services/streaming-control';
import { MessageHelper } from '../../services/message-helper';

export const TranslationPage: React.FC = () => {
  const { t } = useTranslation();
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [error, setError] = useState<Error | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(true);

  // Check if API key is available
  useEffect(() => {
    setIsApiKeyMissing(!SettingsService.getInstance().getApiKey());

    const handleSettingsChange = () => {
      setIsApiKeyMissing(!SettingsService.getInstance().getApiKey());
    };

    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);

    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    };
  }, []);

  // Handle translation
  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    setError(null);

    try {
      const settingsService = SettingsService.getInstance();
      const provider = settingsService.getSelectedProvider();
      const model = settingsService.getSelectedModel();
      
      // Create conversation ID (just for streaming handler, won't be stored)
      const tempConversationId = uuidv4();

      // Create messages for translation
      const messages = createTranslationMessages(tempConversationId, sourceText, targetLanguage);

      // Create placeholder message for streaming
      const placeholderMessage = MessageHelper.getPlaceholderMessage(model, provider, tempConversationId);
      placeholderMessage.fatherMessageId = messages[0].messageId;

      // Create stream controller for handling the response
      const streamController = new StreamControlHandler(
        // We create a minimal conversation object just for the StreamControlHandler
        {
          conversationId: tempConversationId,
          folderId: '',
          title: 'Translation',
          firstMessageId: messages[0].messageId,
          messages: new Map([[placeholderMessage.messageId, placeholderMessage]]),
          createdAt: new Date(),
          updatedAt: new Date(),
          messageInput: ''
        },
        placeholderMessage,
        // On chunk callback
        (updatedConversation) => {
          const updatedMessage = updatedConversation.messages.get(placeholderMessage.messageId);
          if (updatedMessage) {
            setTranslatedText(MessageHelper.MessageContentToText(updatedMessage.content));
          }
        },
        // On finish callback
        (aiResponse) => {
          setIsTranslating(false);
          if (aiResponse) {
            setTranslatedText(MessageHelper.MessageContentToText(aiResponse.content));
          }
        }
      );

      // Send to AI service
      await AIService.getInstance().getChatCompletion(
        messages,
        {
          model,
          provider,
          stream: true
        },
        streamController
      );
    } catch (err) {
      setError(err as Error);
      setIsTranslating(false);
    }
  };

  // Create messages for translation
  const createTranslationMessages = (conversationId: string, text: string, targetLang: string): Message[] => {
    // Create a system message with translation instructions
    const systemMessage: Message = {
      messageId: uuidv4(),
      conversationId,
      role: 'system' as MessageRole,
      content: MessageHelper.pureTextMessage(
        `You are a translation assistant. Detect the source language of the text and translate it to ${getLanguageName(targetLang)}. 
         Only return the translated text without any explanations, notes, or decorations.
         Do not include any text that is not in the original input.`
      ),
      timestamp: new Date(),
      provider: SettingsService.getInstance().getSelectedProvider(),
      model: SettingsService.getInstance().getSelectedModel(),
      tokens: 0,
      fatherMessageId: null,
      childrenMessageIds: [],
      preferIndex: -1
    };

    // Create the user message with text to translate
    const userMessage: Message = {
      messageId: uuidv4(),
      conversationId,
      role: 'user' as MessageRole,
      content: MessageHelper.pureTextMessage(text),
      timestamp: new Date(),
      provider: 'user',
      model: 'user',
      tokens: 0,
      fatherMessageId: systemMessage.messageId,
      childrenMessageIds: [],
      preferIndex: -1
    };

    // Link messages
    systemMessage.childrenMessageIds.push(userMessage.messageId);
    systemMessage.preferIndex = 0;

    return [systemMessage, userMessage];
  };

  // Get language name from code
  const getLanguageName = (code: string): string => {
    const language = languages.find(lang => lang.code === code);
    return language ? language.name : code;
  };

  // Languages for dropdown
  const languages = [
    { code: 'auto', name: t('translation.autoDetect') },
    { code: 'en', name: t('translation.english') },
    { code: 'es', name: t('translation.spanish') },
    { code: 'fr', name: t('translation.french') },
    { code: 'de', name: t('translation.german') },
    { code: 'it', name: t('translation.italian') },
    { code: 'pt', name: t('translation.portuguese') },
    { code: 'ru', name: t('translation.russian') },
    { code: 'zh', name: t('translation.chinese') },
    { code: 'ja', name: t('translation.japanese') },
    { code: 'ko', name: t('translation.korean') },
  ];

  return (
    <div className="flex flex-col w-full h-full bg-white">
      {isApiKeyMissing && (
        <div className="p-2 text-sm text-center text-yellow-800 bg-yellow-100">
          {t('translation.apiKeyMissing')}
        </div>
      )}

      <div className="flex flex-row h-full">
        {/* Left side - Source */}
        <div className="flex-1 p-6 overflow-hidden frame-right-border">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between gap-4 mb-4">
                
              {/* Language selector */}
              <div className="relative flex items-center gap-4">
                <h1 className="text-2xl font-semibold">
                    {t('translation.title')}
                </h1>
                
                <span className="text-sm text-light-hint">
                  {t('translation.sourceLanguageWithAutoSelected')}
                </span>
              </div>

              <button
                onClick={handleTranslate}
                disabled={isTranslating || !sourceText.trim() || isApiKeyMissing}
                className="px-8 py-2.5 text-white confirm-btn flex items-center"
              >
                {isTranslating ? (
                  <>
                    <Orbit size={18} className="mr-2 animate-spin" />
                    {t('translation.translating')}
                  </>
                ) : (
                  <>
                    <Languages size={18} className="mr-2" />
                    {t('translation.translateButton')}
                  </>
                )}
              </button>
            </div>
            
            {/* Source text input */}
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={t('translation.inputPlaceholder')}
              className="flex-1 w-full p-3 mb-4 form-textarea-border input-box"
              style={{ minHeight: '200px', resize: 'none' }}
            />

            {/* Translation button */}
            {/* <div className="flex justify-center">
              <button
                onClick={handleTranslate}
                disabled={isTranslating || !sourceText.trim() || isApiKeyMissing}
                className="px-8 py-2.5 text-white confirm-btn flex items-center"
              >
                {isTranslating ? (
                  <>
                    <Orbit size={18} className="mr-2 animate-spin" />
                    {t('translation.translating')}
                  </>
                ) : (
                  <>
                    <Languages size={18} className="mr-2" />
                    {t('translation.translateButton')}
                  </>
                )}
              </button>
            </div> */}
          </div>
        </div>

        {/* Right side - Translation result */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="flex items-center text-xl font-medium">
                <ArrowRight size={24} />
              </h2>

              {/* Target language selector */}
              <div className="relative">
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="px-4 py-2 input-box"
                >
                  {languages.filter(lang => lang.code !== 'auto').map((lang) => (
                    <option key={`target-${lang.code}`} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 mb-4 text-red-700 bg-red-100 rounded-lg">
                {t('common.error')}: {error.message}
              </div>
            )}

            {/* Translation result */}
            <div className="flex-1 p-3 overflow-auto form-textarea-border major-area-bg-color">
              {isTranslating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 rounded-full border-primary-300 border-t-primary-600 animate-spin"></div>
                </div>
              ) : (
                <div className="h-full">
                  {translatedText ? (
                    <p className="text-primary-800">{translatedText}</p>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-surface-400">{t('translation.resultPlaceholder')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationPage; 