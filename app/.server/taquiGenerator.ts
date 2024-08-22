import path from 'path';
import sharp from "sharp";
import { fileURLToPath } from 'url';

export async function taquiGenerator(text: string): Promise<Buffer> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const inputImagePath = path.join(__dirname, 'boy.webp');
        
    const image = sharp(inputImagePath);
    const { width } = await image.metadata();

    const textSvg = `
    <svg width="${width}" height="110">
      <rect x="0" y="0" width="100%" height="100%" fill="white" />
      <text x="50%" y="50%" font-size="55" fill="black" text-anchor="middle" dominant-baseline="middle">
        ${text}
      </text>
    </svg>
  `;

    const svgBuffer = Buffer.from(textSvg);

    return await image
        .composite([{ input: svgBuffer, top: 0, left: 0 }])
        .toBuffer()    
}