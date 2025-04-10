import React from "react";
import { AIProvider } from "../../types/ai-providers";
import openaiLogo from '/provider-icons/openai.svg';
import anthropicLogo from '/provider-icons/anthropic.svg';
import geminiLogo from '/provider-icons/gemini.svg';
import fireworksLogo from '/provider-icons/fireworks.svg';
import togetherLogo from '/provider-icons/together.svg';
import openrouterLogo from '/provider-icons/openrouter.svg';
import tensorBlockLogo from '/provider-icons/tensorblock.svg';

interface ProviderIconProps {
  providerName: string;
  className?: string;
  alt?: string;
}

/**
 * Component that displays an icon for an AI provider
 * If the provider has an icon in /src/public/provider-icons, it will display that
 * Otherwise, it will display a fallback with the provider's first letter
 */
const ProviderIcon: React.FC<ProviderIconProps> = ({
  providerName,
  className = "w-4 h-4",
  alt = "",
}) => {
  // Check if the provider is one of the known providers
  const isKnownProvider = (name: string): name is AIProvider => {
    const knownProviders: string[] = Object.values(AIProvider);
    return knownProviders.includes(name);
  };

  // Clean the provider name for file path (lowercase, no spaces)
  const getIconFilename = (name: string): string => {
    switch (name) {
      case "TensorBlock":
        return tensorBlockLogo;
      case "OpenAI":
        return openaiLogo;
      case "Anthropic":
        return anthropicLogo;
      case "Gemini":
        return geminiLogo;
      case "Fireworks":
        return fireworksLogo;
      case "Together":
        return togetherLogo;
      case "OpenRouter":
        return openrouterLogo;
      default:
        return name.toLowerCase();
    }
  };

  // If it's a known provider (except for Custom which doesn't have an icon)
  if (isKnownProvider(providerName)) {
    const iconFilename = getIconFilename(providerName);

    return (
      <img
        src={iconFilename}
        alt={alt || providerName}
        className={className}
      />
    );
  }

  // Fallback for custom or unknown providers: show first letter in a circle
  const firstLetter = providerName ? providerName.charAt(0).toUpperCase() : "?";

  return (
    <div
      className={`${className} flex items-center justify-center settings-provider-text-icon`}
      aria-label={alt || providerName}
      title={providerName}
    >
      <span className="flex-1 p-2">{firstLetter}</span>
    </div>
  );
};

export default ProviderIcon;
