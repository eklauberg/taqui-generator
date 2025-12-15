import path from "node:path";
import sharp from "sharp";

export async function taquiGenerator(text: string): Promise<Buffer> {
	const inputImagePath = path.join(
		process.cwd(),
		"public",
		"assets",
		"boy.webp",
	);

	const image = sharp(inputImagePath);
	const { width } = await image.metadata();

	const textSvg = `
    <svg width="${width}" height="110">
      <rect x="0" y="0" width="100%" height="100%" fill="white" />
      <text x="50%" y="65%" font-size="55" fill="black" text-anchor="middle" dominant-baseline="middle" style="font-family: Arial; font-weight: 600; font-smooth: always; text-shadow: rgba(0,0,0,.01) 0 0 1px;">
        ${text}
      </text>
    </svg>
  `;

	const svgBuffer = Buffer.from(textSvg);

	return await image
		.composite([{ input: svgBuffer, top: 0, left: 0 }])
		.toBuffer();
}
