import { DiceSixIcon, TagIcon } from "@phosphor-icons/react";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import type { MetaFunction } from "react-router";
import { PageShell } from "../../components/PageShell";

const MIN_DICE = 1;
const MAX_DICE = 12;
const DEFAULT_DICE = 2;
const MIN_SIDES = 2;
const MAX_SIDES = 20;
const DEFAULT_SIDES = 6;

export const dadosMeta: MetaFunction = () => {
	return [
		{ title: "Táqui os Dados" },
		{
			name: "description",
			content:
				"Controle quantos dados e quantos lados quer rolar, lance e veja cada resultado com clareza.",
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

function rollDice(quantity: number, sides: number) {
	const clampedQuantity = clampNumber(Math.floor(quantity), MIN_DICE, MAX_DICE);
	const clampedSides = clampNumber(Math.floor(sides), MIN_SIDES, MAX_SIDES);
	return Array.from(
		{ length: clampedQuantity },
		() => getRandomInt(clampedSides) + 1,
	);
}

export function DadosPage() {
	const [quantity, setQuantity] = useState(DEFAULT_DICE);
	const [sides, setSides] = useState(DEFAULT_SIDES);
	const [dice, setDice] = useState<number[]>(Array(DEFAULT_DICE).fill(1));

	useEffect(() => {
		setDice(rollDice(DEFAULT_DICE, DEFAULT_SIDES));
	}, []);

	const sliderPercent = useMemo(() => {
		const clamped = clampNumber(Math.floor(quantity), MIN_DICE, MAX_DICE);
		return ((clamped - MIN_DICE) / (MAX_DICE - MIN_DICE)) * 100;
	}, [quantity]);

	const sidesSliderPercent = useMemo(() => {
		const clamped = clampNumber(Math.floor(sides), MIN_SIDES, MAX_SIDES);
		return ((clamped - MIN_SIDES) / (MAX_SIDES - MIN_SIDES)) * 100;
	}, [sides]);

	const total = useMemo(
		() => dice.reduce((sum, value) => sum + value, 0),
		[dice],
	);

	const updateQuantity = (value: number) => {
		const clamped = clampNumber(Math.floor(value), MIN_DICE, MAX_DICE);
		setQuantity(clamped);
		setDice((prev) => {
			const next = Array.from({ length: clamped }, (_, index) =>
				Math.min(prev[index] ?? 1, sides),
			);
			return next;
		});
	};

	const updateSides = (value: number) => {
		const clamped = clampNumber(Math.floor(value), MIN_SIDES, MAX_SIDES);
		setSides(clamped);
		setDice(rollDice(quantity, clamped));
	};

	const roll = () => {
		setDice(rollDice(quantity, sides));
	};

	return (
		<PageShell showLogo containerClassName="max-w-[900px] gap-8">
			<section className="flex w-full flex-col gap-6 rounded-xl border-2 border-black bg-white p-5 text-black shadow-[4px_4px_0_#000000] sm:p-6">
				<header className="flex flex-col gap-2 font-mono">
					<div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/70 sm:text-xs">
						<TagIcon className="h-5 w-5" weight="bold" />
						Laboratório de Dados
					</div>
				</header>

				<div className="grid w-full gap-4 sm:grid-cols-[minmax(0,3fr)_auto] sm:items-start">
					<div className="flex w-full flex-col gap-4 rounded-2xl border-2 border-black bg-white p-5 shadow-[3px_3px_0_#000000]">
						<div className="flex w-full flex-col gap-4 rounded-xl border border-dashed border-black/30 bg-white/80 p-4">
							<div className="flex items-center justify-between gap-2 font-mono text-base font-semibold uppercase tracking-[0.08em] text-black">
								<span>Quantidade de dados</span>
								<span className="rounded-full border border-black px-3 py-1 text-xs shadow-[1px_1px_0_#000000]">
									{quantity} {quantity === 1 ? "dado" : "dados"}
								</span>
							</div>
							<div className="flex flex-col gap-3">
								<input
									type="range"
									min={MIN_DICE}
									max={MAX_DICE}
									step={1}
									value={quantity}
									onChange={(event) =>
										updateQuantity(Number(event.target.value))
									}
									className="taqui-slider"
									style={
										{
											"--taqui-slider-value": `${sliderPercent}%`,
										} as CSSProperties
									}
									aria-label="Quantidade de dados"
								/>
								<div className="flex items-center gap-3">
									<p className="text-xs leading-5 text-black/70">
										De {MIN_DICE} até {MAX_DICE} dados. Altere e clique em
										“Lançar” para novos valores.
									</p>
								</div>
							</div>
						</div>

						<div className="flex w-full flex-col gap-4 rounded-xl border border-dashed border-black/30 bg-white/80 p-4">
							<div className="flex items-center justify-between gap-2 font-mono text-base font-semibold uppercase tracking-[0.08em] text-black">
								<span>Lados do dado</span>
								<span className="rounded-full border border-black px-3 py-1 text-xs shadow-[1px_1px_0_#000000]">
									d{sides}
								</span>
							</div>
							<div className="flex flex-col gap-3">
								<input
									type="range"
									min={MIN_SIDES}
									max={MAX_SIDES}
									step={1}
									value={sides}
									onChange={(event) => updateSides(Number(event.target.value))}
									className="taqui-slider"
									style={
										{
											"--taqui-slider-value": `${sidesSliderPercent}%`,
										} as CSSProperties
									}
									aria-label="Quantidade de lados do dado"
								/>
								<div className="flex items-center gap-3">
									<p className="text-xs leading-5 text-black/70">
										De {MIN_SIDES} até {MAX_SIDES} lados. Alterar a quantidade
										de faces já rola o conjunto com o novo limite.
									</p>
								</div>
							</div>
						</div>
						<button
							type="button"
							onClick={roll}
							className="flex h-11 w-full items-center justify-center gap-2 rounded-full border-[3px] border-black bg-[#FFF129] px-5 py-2 font-mono text-sm font-semibold uppercase tracking-[0.14em] text-black shadow-[2px_2px_0_#000000] transition-transform hover:-translate-y-[1px] sm:w-auto"
						>
							<DiceSixIcon className="h-5 w-5" weight="bold" />
							Lançar dados
						</button>
					</div>
				</div>

				<div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
					<SummaryBadge label="Dados" value={`${quantity}x`} />
					<SummaryBadge label="Lados" value={`d${sides}`} />
					<SummaryBadge label="Total" value={`${total}`} />
				</div>

				<div className="flex flex-col items-center gap-4">
					<div
						className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
						role="list"
						aria-label="Resultados dos dados"
					>
						{dice.map((value, index) => (
							<DiceFace
								key={`${index}-${value}`}
								value={value}
								index={index}
								sides={sides}
							/>
						))}
					</div>
				</div>
			</section>
		</PageShell>
	);
}

function SummaryBadge({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-1 rounded-[18px] border-2 border-black bg-[#F9F7F0] px-4 py-3 text-center shadow-[1px_1px_0_#000000]/60">
			<span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/55">
				{label}
			</span>
			<span className="font-mono text-2xl font-black text-black">{value}</span>
		</div>
	);
}

function DiceFace({
	value,
	index,
	sides,
}: {
	value: number;
	index: number;
	sides: number;
}) {
	return (
		<div
			role="listitem"
			aria-label={`Dado ${index + 1}: resultado ${value} de um dado com ${sides} lados`}
			className="flex min-h-[120px] w-full flex-col gap-2 rounded-xl border-[3px] border-black bg-white px-4 py-3 text-black shadow-[2px_2px_0_#000000]"
		>
			<div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.1em] text-black/60">
				<span>Dado {index + 1}</span>
				<span>d{sides}</span>
			</div>

			<div className="flex flex-1 items-center justify-center">
				<span className="font-mono text-4xl font-black sm:text-5xl">
					{value}
				</span>
			</div>
		</div>
	);
}
