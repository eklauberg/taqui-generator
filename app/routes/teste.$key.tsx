import { useEffect, useState } from "react";
import { useLoaderData } from "react-router";
import type { Link } from "../.server/Link";
import { makeLinkRepository } from "../.server/makeLinkRepository";
import type { Route } from "../+types/root";

export async function loader({ params }: Route.LoaderArgs) {
	if (!params.key) {
		throw new Response("Bad Request: 'key' parameter is required.", {
			status: 400,
		});
	}

	try {
		const link = await makeLinkRepository().load(params.key);

		if (!link) {
			throw new Response("Not Found: Link does not exist.", { status: 404 });
		}

		return link;
	} catch (_) {
		throw new Response("Internal Server Error: Could not load the link.", {
			status: 500,
		});
	}
}

export default function Index() {
	const data = useLoaderData<Link>();
	const [secondsRemaining, setSecondsRemaining] = useState(5);

	useEffect(() => {
		if (secondsRemaining === 0) {
			window.location.href = data.url;
			return;
		}

		const timer = setTimeout(() => {
			setSecondsRemaining((prev) => prev - 1);
		}, 1000);

		return () => clearTimeout(timer);
	}, [data.url, secondsRemaining]);

	return (
		<div className="flex w-full justify-center min-h-screen p-4">
			<div className="flex flex-col items-center w-full max-w-md">
				<div className="mb-2">
					<img
						src="/assets/taqui-a-logo.png"
						alt="Tá aqui Generator"
						className="w-auto m-auto"
					/>
				</div>
				<div className="flex flex-col w-full my-4 gap-4">
					<p>
						Você será redirecionado para uma página externa em{" "}
						{secondsRemaining} segundos...
					</p>
					<img
						id="npm-install"
						src={`/api/generate-image?text=${data.contexto}`}
						alt="Imagem gerada"
						className="w-full border border-gray-300 rounded-md shadow-sm"
					/>
				</div>
			</div>
		</div>
	);
}
