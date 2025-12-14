import { GoogleGenAI, Modality, Part } from "@google/genai";
import { ImageFile } from '../types';

// Retrieve API Key from process.env as per guidelines.
// This relies on vite.config.ts replacing process.env.API_KEY with the actual key during build.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable is not set. Please set VITE_API_KEY or API_KEY in your Netlify site settings.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

const imageFileToPart = (imageFile: ImageFile): Part => {
  return {
    inlineData: {
      data: imageFile.base64.split(',')[1],
      mimeType: imageFile.file.type,
    },
  };
};

const base64ToPart = (base64: string, mimeType: string = 'image/png'): Part => {
    return {
        inlineData: {
            data: base64.split(',')[1],
            mimeType,
        }
    }
}


export const editImage = async (
  prompt: string,
  images: (ImageFile | { base64: string, file: { type: string } })[]
): Promise<string> => {
  try {
    if (!API_KEY) {
        throw new Error("API Key is missing. Please configure your environment variables.");
    }

    const imageParts: Part[] = images.map(img => {
        // Fix: Use a proper type guard to differentiate between ImageFile (with a File object)
        // and the mask image object. A File object will have a `size` property, whereas the
        // mask's file object will not.
        if ('size' in img.file) {
            return imageFileToPart(img as ImageFile);
        }
        return base64ToPart(img.base64, img.file.type);
    });
    
    const allParts = [...imageParts, { text: prompt }];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: allParts,
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const firstPart = response.candidates?.[0]?.content?.parts?.[0];
    if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
      const { data, mimeType } = firstPart.inlineData;
      return `data:${mimeType};base64,${data}`;
    }

    throw new Error("No image data found in the API response.");

  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    throw new Error(`Failed to edit image. ${error instanceof Error ? error.message : String(error)}`);
  }
};