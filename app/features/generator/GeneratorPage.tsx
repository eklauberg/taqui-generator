import { useState } from "react";
import { CopyIcon, MagicWandIcon } from "@phosphor-icons/react";
import ReactGA from "react-ga4";
import { type MetaFunction, useSearchParams } from "react-router";
import { PageShell } from "../../components/PageShell";
import { taquiToastPresets, useToast } from "../../components/Toast";

export const generatorMeta: MetaFunction = () => {
	return [
		{ title: "Táqui Generator" },
		{
			name: "description",
			content: "Gere imagens no estilo “Tá aqui” com texto personalizado.",
		},
	];
};

export function GeneratorPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const seededText = searchParams.get("text") ?? "";

	const [imageUrl, setImageUrl] = useState<string>(() => {
		const trimmed = seededText.trim();
		return trimmed.length > 0
			? `/api/generate-image?text=${encodeURIComponent(trimmed)}`
			: "";
	});
	const [buttonText, setButtonText] = useState<string>("Copiar");
	const [text, setText] = useState(seededText);
	const [generatedText, setGeneratedText] = useState(seededText.trim());
	const toast = useToast();

	const setQueryText = (nextText: string) => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				if (nextText.length > 0) {
					next.set("text", nextText);
				} else {
					next.delete("text");
				}
				return next;
			},
			{ replace: true },
		);
	};

	const handleClick = () => {
		const trimmed = text.trim();
		if (trimmed.length > 0) {
			setText(trimmed);
			setQueryText(trimmed);
			setImageUrl(`/api/generate-image?text=${encodeURIComponent(trimmed)}`);
			setGeneratedText(trimmed);
			setButtonText("Copiar");
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
			toast({
				...taquiToastPresets.success,
				title: "TÁQUI!",
				message: "Imagem copiada para o clipboard!",
			});
			setTimeout(() => {
				setButtonText("Copiar");
			}, 2000);
		} catch (error) {
			console.error("Erro ao copiar a imagem: ", error);
			toast({
				...taquiToastPresets.error,
				title: "DEU RUIM!",
				message: "Não foi possível copiar a imagem.",
			});
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			handleClick();
		}
	};

	const trimmedText = text.trim();
	const showGenerate = !imageUrl || trimmedText !== generatedText;
	const canCopy = Boolean(imageUrl) && !showGenerate;
	const buttonWidthClass = canCopy ? "sm:w-[151px]" : "sm:w-[136px]";

	return (
		<PageShell showLogo containerClassName="max-w-[1200px] gap-12">
			<div className="flex w-full flex-col items-center">
				<div className="flex w-full max-w-[540px] flex-col gap-6 sm:flex-row sm:items-start">
					<label htmlFor="taqui-text" className="sr-only">
						Contexto
					</label>
					<input
						id="taqui-text"
						type="text"
						name="text"
						value={text}
						onChange={(event) => {
							setText(event.target.value);
							setQueryText(event.target.value);
						}}
						onKeyDown={handleKeyDown}
						placeholder="Tá aqui o contexto"
						autoComplete="off"
						required
						className="h-[60px] w-full flex-1 rounded-lg border-[3px] border-black bg-white p-4 font-mono text-2xl leading-7 text-black placeholder:text-[#B1B1B1] focus:outline-none"
					/>

					<button
						type="button"
						onClick={canCopy ? copy : handleClick}
						disabled={canCopy ? !imageUrl : trimmedText.length === 0}
						className={`flex h-[60px] w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-[14px] py-3 font-mono text-2xl font-bold leading-9 text-black disabled:cursor-not-allowed disabled:opacity-60 ${buttonWidthClass}`}
					>
						{canCopy ? (
							<>
								{buttonText === "Copiar" && (
									<CopyIcon className="h-7 w-7" weight="bold" />
								)}
								{buttonText}
							</>
						) : (
							<>
								<MagicWandIcon className="h-7 w-7" weight="bold" />
								Gerar
							</>
						)}
					</button>
				</div>

				{canCopy ? (
					<div className="mt-10 w-full max-w-[540px] overflow-hidden rounded-lg border-[3px] border-black bg-white shadow-[2px_2px_0_#000000]">
						<div className="flex h-[61px] items-center justify-center px-[27px]">
							<p className="w-full truncate text-center font-['Roboto_Flex'] text-xl font-bold leading-tight text-black sm:text-2xl md:text-[32px] md:leading-[38px]">
								{generatedText}
							</p>
						</div>
						<div className="w-full aspect-[720/564]">
							<img
								src={imageUrl}
								alt="Imagem gerada"
								className="h-full w-full object-cover object-bottom"
							/>
						</div>
					</div>
				) : (
					<div className="mt-10 flex h-[483px] w-full max-w-[540px] flex-col items-center justify-center gap-4 rounded-lg border-4 border-dashed border-[#94D3FF] bg-[#47B8FF] p-6 text-center font-mono text-black">
						<h2 className="text-[30px] font-bold leading-[45px]">
							Calma aí!
						</h2>
						<p className="text-xl font-semibold leading-7">
							Que o contexto já vem.
						</p>
					</div>
				)}
			</div>
		</PageShell>
	);
}
