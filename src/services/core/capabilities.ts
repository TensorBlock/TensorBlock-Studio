/**
 * Represents a capability that an AI service provider can support
 */
export enum AIServiceCapability {
  TextCompletion = 'textCompletion',
  ChatCompletion = 'chatCompletion',
  ImageGeneration = 'imageGeneration',
  ImageEditing = 'imageEditing',
  AudioTranscription = 'audioTranscription',
  AudioGeneration = 'audioGeneration',
  Embedding = 'embedding',
  VoiceCloning = 'voiceCloning',
  LangchainSupport = 'langchainSupport',
  FunctionCalling = 'functionCalling',
  AgentFramework = 'agentFramework',
  ToolUsage = 'toolUsage',
  VisionAnalysis = 'visionAnalysis',
  FineTuning = 'fineTuning',
  StreamingCompletion = 'streamingCompletion',
}

/**
 * Maps AI-SDK model capabilities to our internal capability enum
 */
export const mapModelCapabilities = (
  supportsImages: boolean,
  supportsAudio: boolean,
  supportsObjectGeneration: boolean,
  supportsToolUsage: boolean
): AIServiceCapability[] => {
  const capabilities: AIServiceCapability[] = [
    AIServiceCapability.TextCompletion,
    AIServiceCapability.ChatCompletion,
    AIServiceCapability.StreamingCompletion
  ];

  if (supportsImages) {
    capabilities.push(AIServiceCapability.VisionAnalysis);
  }

  if (supportsAudio) {
    capabilities.push(AIServiceCapability.AudioTranscription);
  }

  if (supportsObjectGeneration) {
    capabilities.push(AIServiceCapability.FunctionCalling);
  }

  if (supportsToolUsage) {
    capabilities.push(AIServiceCapability.ToolUsage);
  }

  return capabilities;
}; 