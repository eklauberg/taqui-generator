import { taquiGenerator } from "../.server/taquiGenerator";
import type { Route } from "../+types/root";
export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const text = url.searchParams.get("text");

	if (!text) {
		return { error: "?text é obrigatório", status: 400 };
	}

	const imageBuffer = await taquiGenerator(text);
	const body = new Uint8Array(imageBuffer);

	return new Response(body, {
		status: 200,
		headers: {
			"Content-Type": "image/png",
			"Content-Disposition": "inline",
		},
	});
}
