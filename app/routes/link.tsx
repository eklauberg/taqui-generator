import { useState } from "react";
import { Form, type MetaFunction, useActionData } from "react-router";
import type { Link } from "../.server/Link";
import { makeLinkRepository } from "../.server/makeLinkRepository";
import type { Route } from "../+types/root";

export const meta: MetaFunction = () => {
	return [
		{ title: "Link Generator" },
		{ name: "description", content: "Welcome to Remix!" },
	];
};

type ActionData = {
	shortUrl?: string;
	originalUrl?: string;
	error?: string;
};

export const action = async ({ request }: Route.ActionArgs) => {
	const formData = await request.formData();
	const originalUrl = formData.get("url");
	const contexto = formData.get("contexto");

	if (!originalUrl) {
		return { error: "URL é obrigatória", status: 400 };
	}

	if (!contexto) {
		return { error: "Contexto é obrigatório", status: 400 };
	}

	const shortUrl = Math.random().toString(36).substring(2, 8); // Gerador de URL curta

	const link: Link = {
		key: shortUrl,
		contexto: contexto.toString(),
		url: originalUrl.toString(),
	};
	makeLinkRepository().save(link);

	return { shortUrl: shortUrl };
};

export default function Index() {
	const [text, setText] = useState("");
	const [link, setLink] = useState("");

	const actionData = useActionData<ActionData>();

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
				<Form method="post">
					<div className="flex flex-col w-full my-4 gap-4">
						<input
							type="text"
							name="contexto"
							value={text}
							onChange={(v) => setText(v.target.value)}
							placeholder="Digite aqui o contexto"
							required
							className="w-full p-3 text-2xl border-[3px] border-black rounded-md focus:outline-none focus:shadow-[3px_3px_0px_0px_#000000] transition-shadow duration-200"
						/>
						<input
							type="text"
							name="url"
							value={link}
							onChange={(v) => setLink(v.target.value)}
							placeholder="Digite aqui o link"
							required
							className="w-full p-3 text-2xl border-[3px] border-black rounded-md focus:outline-none focus:shadow-[3px_3px_0px_0px_#000000] transition-shadow duration-200"
						/>
						<button
							type="submit"
							className="py-3 px-6 text-2xl text-black font-bold rounded-md bg-[#FFE500] hover:bg-[#FFF129] hover:shadow-[3px_3px_0px_0px_#000000] active:bg-[#FFE500] active:shadow-[3px_3px_0px_0px_#000000] border-[3px] border-black transition duration-200 focus:outline-none"
						>
							Encurtar
						</button>
					</div>
				</Form>
				{actionData?.shortUrl && (
					<div>
						<p>
							URL Encurtada:{" "}
							<a
								href={`/teste/${actionData.shortUrl}`}
							>{`${window.location.origin}/teste/${actionData.shortUrl}`}</a>
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
