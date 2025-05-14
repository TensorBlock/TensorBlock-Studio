import { MessageContent } from "./chat";

export interface ImageGenerationResult {
    imageResultId: string;
    prompt: string;
    negativePrompt: string;
    seed: string;
    number: number;
    status: string;
    aspectRatio: string;
    provider: string;
    model: string;
    images: MessageContent[];
    updatedAt: Date;
}