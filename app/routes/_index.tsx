import { useState } from "react";
import ReactGA from "react-ga4";
import type { MetaFunction } from "react-router";
import useNotification from "../hooks/useNotification";

export const meta: MetaFunction = () => {
	return [
		{ title: "Taqui Generator" },
		{
			name: "description",
			content: "Gere imagens no estilo “Tá aqui” com texto personalizado.",
		},
	];
};

export default function Index() {
	const [imageUrl, setImageUrl] = useState<string>("");
	const [buttonText, setButtonText] = useState<string>("Copiar");
	const [text, setText] = useState("");
	const showNotification = useNotification();

	const handleClick = () => {
		const trimmed = text.trim();
		if (trimmed.length > 0) {
			setImageUrl(`/api/generate-image?text=${encodeURIComponent(trimmed)}`);
			ReactGA.event({ category: "Botao", action: "Clicou", label: "Gerar" });
		}
	};

	const copy = async () => {
		if (!imageUrl) return;

		ReactGA.event({ category: "Botao", action: "Clicou", label: "Copiar" });

		try {
			const response = await fetch(imageUrl);
			const blob = await response.blob();

			const clipboardItem = new ClipboardItem({ "image/png": blob });
			await navigator.clipboard.write([clipboardItem]);
			setButtonText("Copiado!");
			setTimeout(() => {
				setButtonText("Copiar");
			}, 2000);
			showNotification("Imagem copiada para o clipboard!");
		} catch (error) {
			console.error("Erro ao copiar a imagem: ", error);
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			handleClick();
		}
	};

	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#07B8FF] px-4 py-6">
			<div className="pointer-events-none absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 scale-150 origin-[48%_52%] bg-[url('/assets/taqui-o-background.png')] bg-cover bg-center opacity-100 will-change-transform animate-spin-slower" />

			<div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-6 text-center text-white">
				<img
					src="/assets/taqui-a-logo.png"
					alt="Táqui Generator"
					className="h-auto w-[240px] max-w-full drop-shadow-[0_10px_0_rgba(0,0,0,0.35)]"
				/>

				<div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
					<section className="flex flex-col gap-4 rounded-[28px] border-[3px] border-white/70 bg-white/15 p-5 text-left shadow-[0_12px_0_rgba(0,0,0,0.25)] backdrop-blur-lg">
						<div>
							<label
								htmlFor="taqui-text"
								className="text-xs font-bold uppercase"
							>
								Contexto
							</label>
							<p className="text-xs text-white/80">
								Digite e pressione Enter para gerar.
							</p>
						</div>
						<input
							id="taqui-text"
							type="text"
							name="text"
							value={text}
							onChange={(event) => setText(event.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Tá aqui o contexto"
							autoComplete="off"
							required
							className="taqui-input text-xl"
						/>
						<button
							type="button"
							onClick={handleClick}
							disabled={text.trim().length === 0}
							className="taqui-btn self-start px-4 py-2 text-xl"
						>
							Gerar
						</button>
					</section>

					<section className="rounded-[28px] border-[3px] border-white/70 bg-white/10 p-4 text-center shadow-[0_12px_0_rgba(0,0,0,0.25)] backdrop-blur-lg">
						{imageUrl ? (
							<div className="flex flex-col items-center gap-4">
								<div className="w-full overflow-hidden rounded-2xl border-[3px] border-black bg-white">
									<img
										src={imageUrl}
										alt="Imagem gerada"
										className="w-full max-h-[360px] object-contain"
									/>
								</div>
								<button
									type="button"
									onClick={copy}
									className="taqui-btn w-full max-w-xs text-xl"
								>
									{buttonText}
								</button>
							</div>
						) : (
							<div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border-[3px] border-dashed border-white/60 bg-white/5 px-4 text-sm font-semibold text-white">
								Sua prévia aparece aqui.
								<span className="text-xs font-normal text-white/90">
									Gere um texto e pronto!
								</span>
							</div>
						)}
					</section>
				</div>
			</div>
		</div>
	);
}
