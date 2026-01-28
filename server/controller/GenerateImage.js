// import * as dotenv from "dotenv";
// import { createError } from "../error.js";
// import OpenAI from "openai";

// dotenv.config();

// const openai = new OpenAI({
//   apiKey: process.env.OPEN_API_KEY,
// });

// // Mock image for testing when API is unavailable
// const generateMockImage = (prompt) => {
//   // This creates a simple colored rectangle as a placeholder
//   const canvas = new Array(1024 * 1024 * 3).fill(0);
//   for (let i = 0; i < canvas.length; i += 3) {
//     canvas[i] = Math.floor(Math.random() * 255);     // R
//     canvas[i + 1] = Math.floor(Math.random() * 255); // G
//     canvas[i + 2] = Math.floor(Math.random() * 255); // B
//   }
//   return Buffer.from(canvas).toString('base64');
// };

// export const generateImage = async (req, res, next) => {
//   try {
//     const { prompt } = req.body;

//     // Check if we should use mock image (for testing)
//     const useMock = process.env.USE_MOCK_IMAGE === 'true';
    
//     if (useMock) {
//       const mockImage = generateMockImage(prompt);
//       return res.status(200).json({ 
//         photo: mockImage,
//         message: "Mock image generated for testing purposes"
//       });
//     }

//     const response = await openai.images.generate({
//       prompt,
//       n: 1,
//       size: "1024x1024",
//       response_format: "b64_json",
//     });
//     const generatedImage = response.data[0].b64_json;
//     res.status(200).json({ photo: generatedImage });
//   } catch (error) {
//     console.error("OpenAI API Error:", error);
    
//     // Handle specific billing limit error
//     if (error.status === 400 && error.message.includes("billing")) {
//       return res.status(400).json({
//         success: false,
//         message: "OpenAI billing limit reached. Please check your API key or billing status.",
//         error: "BILLING_LIMIT_REACHED"
//       });
//     }
    
//     // Handle other OpenAI API errors
//     if (error.status === 400) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid request to OpenAI API. Please check your prompt.",
//         error: "INVALID_REQUEST"
//       });
//     }
    
//     // Handle authentication errors
//     if (error.status === 401) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid OpenAI API key. Please check your configuration.",
//         error: "INVALID_API_KEY"
//       });
//     }
    
//     next(
//       createError(
//         error.status || 500,
//         error?.response?.data?.error?.message || error.message || "Failed to generate image"
//       )
//     );
//   }
// };

// import * as dotenv from "dotenv";
// import { createError } from "../error.js";
// import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Mock image for testing when API is unavailable
// Returns a valid 1x1 PNG (black pixel) as base64
// const generateMockImage = () => {
//   const ONE_BY_ONE_PNG_BASE64 =
//     "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
//   return ONE_BY_ONE_PNG_BASE64;
// };

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// export const generateImage = async (req, res, next) => {
//   try {
//     const model = genAI.getGenerativeModel({ model: "imagen-3.0" });
//     const { prompt } = req.body;
//     const useMock = process.env.USE_MOCK_IMAGE === "true";
//     const hfToken =
//       process.env.HF_API_KEY || process.env.HFAPIKEY || process.env.HUGGINGFACE_API_KEY;

//     if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Prompt is required",
//         error: "INVALID_REQUEST",
//       });
//     }

//     if (useMock) {
//       const mockImage = generateMockImage();
//       return res.status(200).json({
//         photo: mockImage,
//         message: "Mock image generated for testing purposes",
//       });
//     }

//     if (!hfToken) {
//       return res.status(401).json({
//         success: false,
//         message:
//           "Missing HF_API_KEY. Set HF_API_KEY (or HFAPIKEY) in your server .env.",
//         error: "INVALID_API_KEY",
//       });
//     }

//     // Hugging Face model endpoint (e.g. Stable Diffusion)
//     const HF_MODEL = "runwayml/stable-diffusion-v1-5"; // you can change to any text-to-image model

//     // Retry logic to gracefully handle initial 503 (model loading) responses
//     const maxAttempts = 3;
//     const backoffMs = 2000;
//     let attempt = 0;
//     let response;
//     while (attempt < maxAttempts) {
//       // eslint-disable-next-line no-await-in-loop
//       const fetchApi = async (...args) => {
//         if (typeof fetch !== "undefined") return fetch(...args);
//         const mod = await import("node-fetch");
//         return mod.default(...args);
//       };
//       response = await fetchApi(
//         `https://api-inference.huggingface.co/models/${HF_MODEL}?wait_for_model=true`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${hfToken}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ inputs: prompt }),
//         }
//       );

//       if (response.status !== 503) break;
//       attempt += 1;
//       if (attempt >= maxAttempts) break;
//       // eslint-disable-next-line no-await-in-loop
//       await new Promise((resolve) => setTimeout(resolve, backoffMs * attempt));
//     }

//     if (!response.ok) {
//       const errorText = await response.text();
//       // Log response for diagnostics
//       // eslint-disable-next-line no-console
//       console.error("HF non-OK response:", response.status, response.statusText, errorText?.slice(0, 200));
//       return res.status(response.status).json({
//         success: false,
//         message: "Hugging Face API Error",
//         error: errorText,
//       });
//     }

//     // Hugging Face returns raw binary image
//     const arrayBuffer = await response.arrayBuffer();
//     const base64Image = Buffer.from(arrayBuffer).toString("base64");
//     const contentType = response.headers.get("content-type") || "image/png";
//     // eslint-disable-next-line no-console
//     console.log("HF OK response:", response.status, contentType, `bytes=${base64Image.length}`);

//     // If HF responds with JSON even on 200, treat as an error payload
//     if (!contentType.startsWith("image/")) {
//       const text = Buffer.from(base64Image, "base64").toString("utf8");
//       return res.status(502).json({
//         success: false,
//         message: "Unexpected non-image response from Hugging Face",
//         error: text,
//       });
//     }

//     res.status(200).json({ photo: base64Image, contentType });
//   } catch (error) {
//     console.error("Hugging Face API Error:", error);

//     next(
//       createError(
//         error.status || 500,
//         error.message || "Failed to generate image with Hugging Face"
//       )
//     );
//   }
// };


import * as dotenv from "dotenv";
import { createError } from "../error.js";

dotenv.config();

// Bright SVG data URL so the mock image is clearly visible
const MOCK_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><rect width='100%' height='100%' fill='%2300bcd4'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='white'>MOCK</text></svg>`;

export const generateImage = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const useMock = process.env.USE_MOCK_IMAGE === "true";
    const stabilityKey = process.env.STABILITY_API_KEY;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
        error: "INVALID_REQUEST",
      });
    }

    // If mock mode is enabled OR no Stability key, return visible mock image
    if (useMock || !stabilityKey) {
      return res.status(200).json({
        success: true,
        photo: MOCK_DATA_URL,
        contentType: "image/svg+xml",
        message:
          "Mock image generated. Set STABILITY_API_KEY in server/.env and USE_MOCK_IMAGE=false to use real Stability images.",
      });
    }

    // Simple fetch wrapper that works in Node (Node 18+ has global fetch)
    const fetchApi = async (...args) => {
      if (typeof fetch !== "undefined") return fetch(...args);
      const mod = await import("node-fetch");
      return mod.default(...args);
    };

    // Stability AI text-to-image endpoint (Stable Diffusion XL)
    const response = await fetchApi(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stabilityKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Stability non-OK response:",
        response.status,
        response.statusText,
        errorText?.slice(0, 200)
      );
      return res.status(response.status).json({
        success: false,
        message: "Stability AI API Error",
        error: errorText,
      });
    }

    const data = await response.json();
    const imageBase64 = data?.artifacts?.[0]?.base64;

    if (!imageBase64) {
      return res.status(500).json({
        success: false,
        message: "No image returned by Stability AI",
        error: "EMPTY_RESPONSE",
      });
    }

    return res.status(200).json({
      success: true,
      photo: imageBase64,
      contentType: "image/png",
    });
  } catch (error) {
    console.error("Stability AI Error:", error);

    return next(
      createError(
        error.status || 500,
        error.message || "Failed to generate image with Stability AI"
      )
    );
  }
};
