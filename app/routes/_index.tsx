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
		<div className="relative min-h-screen overflow-hidden bg-[#07B8FF] px-4 py-10">
			<div className="pointer-events-none absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 scale-150 origin-[48%_52%] bg-[url('/assets/taqui-o-background.png')] bg-cover bg-center opacity-100 will-change-transform animate-spin-slower" />

			<div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center">
				<div className="mb-6">
					<img
						src="/assets/taqui-a-logo.png"
						alt="Táqui Generator"
						className="h-auto w-[320px] max-w-full"
					/>
				</div>

				<div className="flex w-full items-stretch gap-4">
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
						className="taqui-input"
					/>
					<button
						type="button"
						onClick={handleClick}
						disabled={text.trim().length === 0}
						className="taqui-btn whitespace-nowrap"
					>
						Gerar
					</button>
				</div>

				{imageUrl && (
					<div className="mt-6 flex w-full flex-col items-center gap-4">
						<div className="w-full overflow-hidden rounded-md bg-white shadow-[0px_8px_0px_0px_rgba(0,0,0,0.15)]">
							<img src={imageUrl} alt="Imagem gerada" className="w-full" />
						</div>
						<button type="button" onClick={copy} className="taqui-btn">
							{buttonText}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
