import { useEffect, useMemo, useState } from "react";
import type { MetaFunction } from "react-router";
import { CopyIcon, DiceSixIcon } from "@phosphor-icons/react";
import { PageShell } from "../../components/PageShell";
import { taquiToastPresets, useToast } from "../../components/Toast";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 15;
const MIN_NUMBER = 1;
const MAX_NUMBER = 60;
const DEFAULT_QUANTITY = 6;
const MIN_GAMES = 1;
const MAX_GAMES = 20;
const DEFAULT_GAMES = 5;

export const lotoMeta: MetaFunction = () => {
	return [
		{ title: "Táqui a Loteria" },
		{
			name: "description",
			content:
				"Gere vários jogos de loteria, escolha quantos números e quantos jogos e já copie cada um.",
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

function generateGames(quantity: number, games: number) {
	const clampedGames = clampNumber(Math.floor(games), MIN_GAMES, MAX_GAMES);
	return Array.from({ length: clampedGames }, () => generateLotteryNumbers(quantity));
}

function formatLotteryNumbers(numbers: number[]) {
	return numbers.map((value) => value.toString().padStart(2, "0")).join(" ");
}

export function LotoPage() {
	const [quantity, setQuantity] = useState(DEFAULT_QUANTITY);
	const [gameCount, setGameCount] = useState(DEFAULT_GAMES);
	const [games, setGames] = useState<number[][]>([]);
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
	const [copiedAll, setCopiedAll] = useState(false);
	const toast = useToast();

	const generate = () => {
		setGames(generateGames(quantity, gameCount));
		setCopiedIndex(null);
		setCopiedAll(false);
	};

	useEffect(() => {
		// Generate once after mount to avoid SSR hydration mismatch.
		setGames(generateGames(DEFAULT_QUANTITY, DEFAULT_GAMES));
	}, []);

	const gameTexts = useMemo(() => games.map((game) => formatLotteryNumbers(game)), [games]);

	const numbersSliderPercent = useMemo(() => {
		const clampedQuantity = clampNumber(
			Math.floor(quantity),
			MIN_QUANTITY,
			MAX_QUANTITY,
		);
		return ((clampedQuantity - MIN_QUANTITY) / (MAX_QUANTITY - MIN_QUANTITY)) * 100;
	}, [quantity]);

	const gamesSliderPercent = useMemo(() => {
		const clampedGames = clampNumber(Math.floor(gameCount), MIN_GAMES, MAX_GAMES);
		return ((clampedGames - MIN_GAMES) / (MAX_GAMES - MIN_GAMES)) * 100;
	}, [gameCount]);

	const copy = async (index: number) => {
		const text = gameTexts[index];
		if (!text) return;

		try {
			await navigator.clipboard.writeText(text);
			setCopiedIndex(index);
			setCopiedAll(false);
			toast({
				...taquiToastPresets.success,
				title: "TÁQUI!",
				message: "Jogo copiado. Se ganhar, lembra de mim. ❤️",
			});
			setTimeout(() => setCopiedIndex(null), 2000);
		} catch (error) {
			console.error("Erro ao copiar números:", error);
			toast({
				...taquiToastPresets.error,
				title: "DEU RUIM!",
				message: "Não foi possível copiar os números.",
			});
		}
	};

	const copyAll = async () => {
		if (gameTexts.length === 0) return;

		try {
			await navigator.clipboard.writeText(gameTexts.join("\n"));
			setCopiedIndex(null);
			setCopiedAll(true);
			toast({
				...taquiToastPresets.success,
				title: "TÁQUI!",
				message: "Todos os jogos foram pro clipboard. Bora sonhar!",
			});
			setTimeout(() => setCopiedAll(false), 2000);
		} catch (error) {
			console.error("Erro ao copiar números:", error);
			toast({
				...taquiToastPresets.error,
				title: "DEU RUIM!",
				message: "Não foi possível copiar os jogos.",
			});
		}
	};

	return (
		<PageShell showLogo containerClassName="max-w-[1200px] gap-12">
			<div className="flex w-full flex-col items-center gap-10">
				<div className="flex w-full max-w-[720px] flex-col gap-6">
					<div className="w-full rounded-lg border-2 border-black bg-white p-6 shadow-[4px_4px_0_#000000]">
						<div className="flex w-full flex-col gap-2 font-mono text-black">
							<p className="text-2xl font-bold leading-9">Quantidade de números por jogo</p>
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
											"--taqui-slider-value": `${numbersSliderPercent}%`,
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

					<div className="w-full rounded-lg border-2 border-black bg-white p-6 shadow-[4px_4px_0_#000000]">
						<div className="flex w-full flex-col gap-2 font-mono text-black">
							<p className="text-2xl font-bold leading-9">Quantidade de jogos</p>
							<div className="flex items-center gap-4">
								<input
									type="range"
									min={MIN_GAMES}
									max={MAX_GAMES}
									step={1}
									value={gameCount}
									onChange={(event) => setGameCount(Number(event.target.value))}
									className="taqui-slider"
									style={
										{
											"--taqui-slider-value": `${gamesSliderPercent}%`,
										} as React.CSSProperties
									}
									aria-label="Quantidade de jogos"
								/>
								<p className="w-10 text-right text-xl leading-7">
									{clampNumber(Math.floor(gameCount), MIN_GAMES, MAX_GAMES)}
								</p>
							</div>
							<p className="text-sm leading-6 text-black/80">
								Gere até {MAX_GAMES} jogos de uma vez pra otimizar a sorte.
							</p>
						</div>
					</div>

					<div className="flex w-full flex-col gap-6 sm:flex-row">
						<button
							type="button"
							onClick={generate}
							className="flex h-[60px] w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-[14px] py-3 font-mono text-2xl font-bold leading-9 text-black sm:w-[50%]"
						>
							<DiceSixIcon className="h-7 w-7" weight="bold" />
							Gerar jogos
						</button>

						<button
							type="button"
							onClick={() => void copyAll()}
							disabled={gameTexts.length === 0}
							className="flex h-[60px] w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-white px-[14px] py-3 font-mono text-2xl font-bold leading-9 text-black shadow-[2px_2px_0_#000000] disabled:cursor-not-allowed disabled:opacity-60 sm:w-[50%]"
						>
							<CopyIcon className="h-7 w-7" weight="bold" />
							{copiedAll ? "Copiado!" : "Copiar todos"}
						</button>
					</div>
				</div>

				<div className="flex w-full max-w-[720px] flex-col gap-4">
					{gameTexts.length === 0 ? (
						<div className="flex h-[200px] w-full flex-col items-center justify-center gap-3 rounded-lg border-4 border-dashed border-[#94D3FF] bg-[#47B8FF] p-6 text-center font-mono text-black">
							<h2 className="text-[30px] font-bold leading-[45px]">Calma aí!</h2>
							<p className="text-xl font-semibold leading-7">
								Gera os jogos ali em cima.
							</p>
						</div>
					) : (
						gameTexts.map((text, index) => (
							<div
								key={`${text}-${index}`}
								className="flex w-full items-center gap-4 rounded-lg border-2 border-black bg-white p-4 text-left text-black shadow-[2px_2px_0_#000000]"
							>
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-[#FFF129] font-mono text-xl font-black shadow-[2px_2px_0_#000000]">
									{index + 1}
								</div>
								<div className="flex min-w-0 flex-1 flex-col gap-2">
									<p className="truncate font-['Roboto_Flex'] text-xl font-bold leading-tight sm:text-2xl">
										{text}
									</p>
									<p className="text-xs font-semibold uppercase tracking-[0.08em] text-black/60">
										Jogo {index + 1} • {quantity} números
									</p>
								</div>
								<button
									type="button"
									onClick={() => void copy(index)}
									className="flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-3 py-2 font-mono text-lg font-bold leading-7 text-black"
								>
									{copiedIndex === index ? (
										"Copiado!"
									) : (
										<>
											<CopyIcon className="h-6 w-6" weight="bold" />
											Copiar
										</>
									)}
								</button>
							</div>
						))
					)}
				</div>
			</div>
		</PageShell>
	);
}
