import { useEffect, useMemo, useState } from "react";
import type { MetaFunction } from "react-router";
import { CopyIcon, DiceSixIcon } from "@phosphor-icons/react";
import { PageShell } from "../../components/PageShell";
import { taquiToastPresets, useToast } from "../../components/Toast";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 10;
const MIN_NUMBER = 1;
const MAX_NUMBER = 60;
const DEFAULT_QUANTITY = 6;

export const lotoMeta: MetaFunction = () => {
	return [
		{ title: "Táqui a Loteria" },
		{
			name: "description",
			content:
				"Gere números da loteria, escolha a quantidade e copie ou gere a imagem no estilo Táqui.",
		},
	];
};

function clampNumber(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function getRandomInt(maxExclusive: number) {
	if (maxExclusive <= 1) return 0;

	const cryptoApi = typeof crypto !== "undefined" ? crypto : undefined;
	if (!cryptoApi?.getRandomValues) {
		return Math.floor(Math.random() * maxExclusive);
	}

	const maxUint32 = 0xffff_ffff;
	const limit = Math.floor(maxUint32 / maxExclusive) * maxExclusive;
	const buffer = new Uint32Array(1);

	while (true) {
		cryptoApi.getRandomValues(buffer);
		const value = buffer[0]!;
		if (value < limit) return value % maxExclusive;
	}
}

function shuffleArray<T>(items: T[]) {
	const array = [...items];
	for (let index = array.length - 1; index > 0; index -= 1) {
		const swapIndex = getRandomInt(index + 1);
		[array[index], array[swapIndex]] = [array[swapIndex]!, array[index]!];
	}
	return array;
}

function generateLotteryNumbers(quantity: number) {
	const clampedQuantity = clampNumber(
		Math.floor(quantity),
		MIN_QUANTITY,
		MAX_QUANTITY,
	);

	const pool = Array.from({ length: MAX_NUMBER }, (_, index) => index + MIN_NUMBER);
	const shuffled = shuffleArray(pool);
	return shuffled.slice(0, clampedQuantity).sort((a, b) => a - b);
}

function formatLotteryNumbers(numbers: number[]) {
	return numbers.map((value) => value.toString().padStart(2, "0")).join(" ");
}

export function LotoPage() {
	const [quantity, setQuantity] = useState(DEFAULT_QUANTITY);
	const [numbers, setNumbers] = useState<number[]>(() =>
		Array.from({ length: DEFAULT_QUANTITY }, (_, index) => index + MIN_NUMBER),
	);
	const [copyButtonText, setCopyButtonText] = useState("Copiar");
	const toast = useToast();

	const generate = () => {
		setNumbers(generateLotteryNumbers(quantity));
		setCopyButtonText("Copiar");
	};

	useEffect(() => {
		// Generate once after mount to avoid SSR hydration mismatch.
		setNumbers(generateLotteryNumbers(DEFAULT_QUANTITY));
		setCopyButtonText("Copiar");
	}, []);

	const numbersText = useMemo(() => formatLotteryNumbers(numbers), [numbers]);
	const imageUrl = useMemo(
		() =>
			numbersText.length > 0
				? `/api/generate-image?text=${encodeURIComponent(numbersText)}`
				: "",
		[numbersText],
	);

	const sliderPercent = useMemo(() => {
		const clampedQuantity = clampNumber(
			Math.floor(quantity),
			MIN_QUANTITY,
			MAX_QUANTITY,
		);
		return ((clampedQuantity - MIN_QUANTITY) / (MAX_QUANTITY - MIN_QUANTITY)) * 100;
	}, [quantity]);

	const copy = async () => {
		if (!numbersText) return;

		try {
			await navigator.clipboard.writeText(numbersText);
			setCopyButtonText("Copiado!");
			toast({
				...taquiToastPresets.success,
				title: "TÁQUI!",
				message: "Boa sorte, e se ganhar lembra de quem te deu o número em... ❤️",
			});
			setTimeout(() => setCopyButtonText("Copiar"), 2000);
		} catch (error) {
			console.error("Erro ao copiar números:", error);
			toast({
				...taquiToastPresets.error,
				title: "DEU RUIM!",
				message: "Não foi possível copiar os números.",
			});
		}
	};

	return (
		<PageShell showLogo containerClassName="max-w-[1200px] gap-12">
			<div className="flex w-full flex-col items-center gap-10">
				<div className="flex w-full max-w-[540px] flex-col gap-6">
					<label htmlFor="loto-numbers" className="sr-only">
						Números gerados
					</label>
					<input
						id="loto-numbers"
						type="text"
						readOnly
						value={numbersText}
						className="h-[60px] w-full rounded-lg border-[3px] border-black bg-white p-4 font-mono text-2xl leading-7 text-black shadow-[3px_3px_0_#000000] focus:outline-none"
					/>

					<div className="flex w-full flex-col gap-6 sm:flex-row">
						<button
							type="button"
							onClick={generate}
							className="flex h-[60px] w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-[14px] py-3 font-mono text-2xl font-bold leading-9 text-black sm:w-[258px]"
						>
							<DiceSixIcon className="h-7 w-7" weight="bold" />
							Gerar
						</button>

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
					</div>
				</div>

				<div className="flex w-full max-w-[540px] flex-col gap-10">
					<div className="w-full rounded-lg border-2 border-black bg-white p-6 shadow-[4px_4px_0_#000000]">
						<div className="flex w-full flex-col gap-2 font-mono text-black">
							<p className="text-2xl font-bold leading-9">
								Quantidade de números
							</p>
							<div className="flex items-center gap-4">
								<input
									type="range"
									min={MIN_QUANTITY}
									max={MAX_QUANTITY}
									step={1}
									value={quantity}
									onChange={(event) => setQuantity(Number(event.target.value))}
									className="taqui-slider"
									style={
										{
											"--taqui-slider-value": `${sliderPercent}%`,
										} as React.CSSProperties
									}
									aria-label="Quantidade de números"
								/>
								<p className="w-8 text-right text-xl leading-7">
									{clampNumber(
										Math.floor(quantity),
										MIN_QUANTITY,
										MAX_QUANTITY,
									)}
								</p>
							</div>
							<p className="text-sm leading-6 text-black/80">
								Números entre {MIN_NUMBER} e {MAX_NUMBER}.
							</p>
						</div>
					</div>

					{imageUrl ? (
						<div className="w-full overflow-hidden rounded-lg border-[3px] border-black bg-white shadow-[2px_2px_0_#000000]">
							<div className="flex h-[61px] items-center justify-center px-[27px]">
								<p className="w-full truncate text-center font-['Roboto_Flex'] text-xl font-bold leading-tight text-black sm:text-2xl md:text-[32px] md:leading-[38px]">
									{numbersText}
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
						<div className="flex h-[483px] w-full flex-col items-center justify-center gap-4 rounded-lg border-4 border-dashed border-[#94D3FF] bg-[#47B8FF] p-6 text-center font-mono text-black">
							<h2 className="text-[30px] font-bold leading-[45px]">Calma aí!</h2>
							<p className="text-xl font-semibold leading-7">
								Que os números já vêm.
							</p>
						</div>
					)}
				</div>
			</div>
		</PageShell>
	);
}
