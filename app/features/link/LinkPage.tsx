import {
	ArrowSquareOutIcon,
	CopyIcon,
	ScissorsIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { MetaFunction } from "react-router";
import { Form, useActionData } from "react-router";
import { PageShell } from "../../components/PageShell";
import { taquiToastPresets, useToast } from "../../components/Toast";

export type ActionData = {
	shortUrl?: string;
	originalUrl?: string;
	error?: string;
	status?: number;
};

export const linkMeta: MetaFunction = () => {
	return [
		{ title: "Encurtador Táqui" },
		{
			name: "description",
			content: "Crie links curtos usando o backend do Táqui Generator.",
		},
	];
};

export function LinkPage() {
	const [text, setText] = useState("");
	const [link, setLink] = useState("");
	const [copyButtonText, setCopyButtonText] = useState("Copiar");
	const toast = useToast();

	const actionData = useActionData<ActionData>();
	const origin =
		typeof window !== "undefined"
			? window.location.origin
			: "https://taqui.app";
	const shortUrl = actionData?.shortUrl;
	const fullShortUrl = shortUrl ? `${origin}/redirect/${shortUrl}` : "";
	const lastShortUrlRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (!shortUrl) return;
		if (lastShortUrlRef.current === shortUrl) return;
		lastShortUrlRef.current = shortUrl;
		setCopyButtonText("Copiar");
		toast({
			...taquiToastPresets.success,
			title: "TÁQUI!",
			message: "Link gerado! Agora é só copiar ou testar.",
		});
	}, [shortUrl, toast]);

	useEffect(() => {
		if (!actionData?.error) return;
		switch (actionData.status) {
			case 422:
				toast({
					...taquiToastPresets.warning,
					title: "TÁ DE BRINCADEIRA?",
					message: actionData.error,
				});
				return;

			case 423:
				toast({
					...taquiToastPresets.warning,
					title: "TÁ QUERENDO O CONTEXTO É?",
					message: actionData.error,
				});
				return;

			case 400:
				toast({
					...taquiToastPresets.error,
					title: "DEU RUIM!",
					message: actionData.error,
				});
				return;

			case 500:
				toast({
					...taquiToastPresets.error,
					title: "DEU RUIM!",
					message: actionData.error,
				});
				return;

			default:
				toast({
					...taquiToastPresets.error,
					title: "DEU RUIM!",
					message: actionData.error,
				});
		}
	}, [actionData, toast]);

	const copy = async () => {
		if (!fullShortUrl) return;
		try {
			await navigator.clipboard.writeText(fullShortUrl);
			setCopyButtonText("Copiado!");
			toast({
				...taquiToastPresets.success,
				title: "TÁQUI!",
				message:
					"Link copiado. O vizinho agradece por você não mandar aquele textão.",
			});
			setTimeout(() => {
				setCopyButtonText("Copiar");
			}, 2000);
		} catch (error) {
			console.error("Erro ao copiar o link:", error);
			toast({
				...taquiToastPresets.error,
				title: "DEU RUIM!",
				message: "Não foi possível copiar o link.",
			});
		}
	};

	return (
		<>
			<PageShell showLogo containerClassName="max-w-[1200px] gap-12">
				<div className="flex w-full flex-col items-center gap-10">
					<Form
						method="post"
						noValidate
						className="flex w-full max-w-[540px] flex-col items-center gap-6"
					>
						<div className="flex w-full flex-col gap-4">
							<label htmlFor="link-url" className="sr-only">
								URL de destino
							</label>
							<input
								id="link-url"
								type="url"
								name="url"
								value={link}
								onChange={(v) => setLink(v.target.value)}
								placeholder="Cola aquela URL quilométrica aqui"
								required
								className="h-[60px] w-full rounded-lg border-[3px] border-black bg-white p-4 font-mono text-2xl leading-7 text-black placeholder:text-[#B1B1B1] focus:outline-none"
							/>

							<label htmlFor="link-contexto" className="sr-only">
								Contexto
							</label>
							<input
								id="link-contexto"
								type="text"
								name="contexto"
								value={text}
								onChange={(v) => setText(v.target.value)}
								placeholder="Mando o contexto"
								required
								className="h-[60px] w-full rounded-lg border-[3px] border-black bg-white p-4 font-mono text-2xl leading-7 text-black placeholder:text-[#B1B1B1] focus:outline-none"
							/>
						</div>

						<button
							type="submit"
							className="flex h-[60px] w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-[14px] py-3 font-mono text-2xl font-bold leading-9 text-black"
						>
							<ScissorsIcon className="h-7 w-7" weight="bold" />
							Gerar
						</button>
					</Form>

					<div className="flex w-full max-w-[540px] flex-col items-center gap-6">
						<div className="flex w-full flex-col items-center gap-4 rounded-lg border-4 border-dashed border-[#94D3FF] bg-[#47B8FF] p-6 text-center font-mono text-black">
							{shortUrl ? (
								<>
									<h2 className="text-[30px] font-bold leading-[45px]">
										Táqui teu Link
									</h2>
									<label htmlFor="link-short-url" className="sr-only">
										Link curto
									</label>
									<input
										id="link-short-url"
										type="text"
										readOnly
										value={fullShortUrl}
										className="h-[60px] w-full rounded-lg border-[3px] border-black bg-white p-4 font-mono text-2xl leading-7 text-black shadow-[3px_3px_0_#000000] focus:outline-none"
									/>
								</>
							) : (
								<>
									<h2 className="text-[30px] font-bold leading-[45px]">
										Calma aí!
									</h2>
									<p className="text-xl font-semibold leading-7">
										Que o contexto já vem.
									</p>
								</>
							)}
						</div>

						{shortUrl && (
							<div className="flex w-full flex-col gap-6 sm:flex-row">
								<button
									type="button"
									onClick={() => void copy()}
									className="flex h-[60px] w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-[14px] py-3 font-mono text-2xl font-bold leading-9 text-black sm:w-[258px]"
								>
									{copyButtonText === "Copiar" && (
										<CopyIcon className="h-7 w-7" weight="bold" />
									)}
									{copyButtonText}
								</button>

								<a
									href={`/redirect/${shortUrl}`}
									target="_blank"
									rel="noreferrer"
									className="flex h-[60px] w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-[14px] py-3 font-mono text-2xl font-bold leading-9 text-black sm:w-[258px]"
								>
									<ArrowSquareOutIcon className="h-7 w-7" weight="bold" />
									Testar
								</a>
							</div>
						)}
					</div>
				</div>
			</PageShell>
		</>
	);
}
