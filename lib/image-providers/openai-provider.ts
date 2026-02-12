import {
  generateImage as openaiGenerate,
  editImage as openaiEdit,
  type ImageModel,
  type ImageSize,
  type ImageQuality,
} from "@/lib/openai/images"
import type { ImageProvider, GenerateOptions, EditOptions } from "./types"

export const openaiProvider: ImageProvider = {
  id: "openai",
  name: "OpenAI",
  async generate(options: GenerateOptions) {
    return openaiGenerate({
      prompt: options.prompt,
      model: options.model as ImageModel | undefined,
      size: options.size as ImageSize | undefined,
      quality: options.quality as ImageQuality | undefined,
    })
  },
  async edit(options: EditOptions) {
    return openaiEdit({
      prompt: options.prompt,
      referenceImageUrls: options.referenceImageUrls,
      model: options.model as ImageModel | undefined,
      size: options.size as ImageSize | undefined,
      quality: options.quality as ImageQuality | undefined,
    })
  },
}
