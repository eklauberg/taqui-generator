import { useEffect, useMemo, useRef, useState } from "react";
import type { MetaFunction } from "react-router";
import {
	ArrowClockwiseIcon,
	NotePencilIcon,
	PlusIcon,
	SpeakerHighIcon,
	SpeakerSlashIcon,
	XIcon,
} from "@phosphor-icons/react";
import { PageShell } from "../../components/PageShell";
import { taquiToastPresets, useToast } from "../../components/Toast";

type WheelOption = {
	id: string;
	label: string;
};

type WheelPhase =
	| { kind: "idle" }
	| {
		kind: "spin";
		startTime: number;
		startAngle: number;
		totalDelta: number;
		winnerIndex: number;
		accelDurationMs: number;
		totalDurationMs: number;
		accelPortion: number;
	}
	| { kind: "stopped"; winnerIndex: number };

const IDLE_ROTATION_SECONDS = 24;
const SPIN_ACCEL_MS = 1000;
const SPIN_TOTAL_MS = 6500;
const SPIN_ACCEL_PORTION = 0.32;
const STROBE_INTERVAL_MS = 60;
const POINTER_ANGLE_DEGREES = 90;

const DEFAULT_OPTIONS: WheelOption[] = [
	{ id: "opt_pizza", label: "Pizza" },
	{ id: "opt_sushi", label: "Sushi" },
	{ id: "opt_pastel", label: "Pastel" },
	{ id: "opt_acai", label: "Açaí" },
	{ id: "opt_lasanha", label: "Lasanha" },
	{ id: "opt_churras", label: "Churrasco" },
	{ id: "opt_burger", label: "Burger" },
	{ id: "opt_taco", label: "Taco" },
];

export const roletaMeta: MetaFunction = () => {
	return [
		{ title: "Táqui Tua Roleta" },
		{
			name: "description",
			content:
				"Gire a roleta, edite a lista de opções e deixe o algoritmo decidir por você.",
		},
	];
};

function normalizeAngle(degrees: number) {
	const mod = degrees % 360;
	return mod < 0 ? mod + 360 : mod;
}

function easeInCubic(t: number) {
	return t * t * t;
}

function easeOutCubic(t: number) {
	const u = 1 - t;
	return 1 - u * u * u;
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

function getSliceIndex(rotationDeg: number, sliceCount: number) {
	if (sliceCount <= 0) return 0;
	const sliceAngle = 360 / sliceCount;
	const normalized = normalizeAngle(rotationDeg);
	const localAngle = (360 - normalized + POINTER_ANGLE_DEGREES) % 360;
	return Math.floor(localAngle / sliceAngle) % sliceCount;
}

function buildFinalRotationNormalized(winnerIndex: number, sliceCount: number) {
	const sliceAngle = 360 / sliceCount;
	const centerAngle = (winnerIndex + 0.5) * sliceAngle;
	return normalizeAngle(360 - centerAngle + POINTER_ANGLE_DEGREES);
}

function generateWheelSvgPaths(sliceCount: number, radius: number) {
	const center = radius;
	const sliceAngleRad = (Math.PI * 2) / sliceCount;

	const colors = ["#FFF129", "#47B8FF"];

	return Array.from({ length: sliceCount }, (_, index) => {
		const startRad = index * sliceAngleRad - Math.PI / 2;
		const endRad = startRad + sliceAngleRad;

		const x1 = center + radius * Math.cos(startRad);
		const y1 = center + radius * Math.sin(startRad);
		const x2 = center + radius * Math.cos(endRad);
		const y2 = center + radius * Math.sin(endRad);

		const largeArcFlag = sliceAngleRad > Math.PI ? 1 : 0;
		const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

		return {
			path,
			fill: colors[index % colors.length]!,
		};
	});
}

type SfxEngine = {
	tryUnlock: () => Promise<boolean>;
	playTick: () => void;
	playWin: () => void;
};

function createSfxEngine(): SfxEngine {
	let audioContext: AudioContext | null = null;
	let masterGain: GainNode | null = null;

	const ensureContext = () => {
		if (audioContext) return audioContext;
		const Context =
			(window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
		audioContext = new Context();
		masterGain = audioContext.createGain();
		masterGain.gain.value = 0.55;
		masterGain.connect(audioContext.destination);
		return audioContext;
	};

	const playNoiseClick = () => {
		const ctx = ensureContext();
		if (!masterGain) return;

		const duration = 0.03;
		const frameCount = Math.floor(ctx.sampleRate * duration);
		const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
		const data = buffer.getChannelData(0);

		for (let i = 0; i < frameCount; i += 1) {
			const envelope = Math.exp(-i / (frameCount / 6));
			data[i] = (Math.random() * 2 - 1) * envelope;
		}

		const source = ctx.createBufferSource();
		source.buffer = buffer;

		const filter = ctx.createBiquadFilter();
		filter.type = "highpass";
		filter.frequency.value = 900;

		const clickGain = ctx.createGain();
		clickGain.gain.value = 0.9;

		source.connect(filter);
		filter.connect(clickGain);
		clickGain.connect(masterGain);
		source.start();
	};

	const playWinChime = () => {
		const ctx = ensureContext();
		const output = masterGain;
		if (!output) return;

		const now = ctx.currentTime;
		const notes = [523.25, 659.25, 783.99]; // C5 E5 G5

		notes.forEach((frequency, index) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "square";
			osc.frequency.value = frequency;

			const start = now + index * 0.11;
			const stop = start + 0.18;

			gain.gain.setValueAtTime(0.0001, start);
			gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.0001, stop);

			osc.connect(gain);
			gain.connect(output);

			osc.start(start);
			osc.stop(stop);
		});
	};

	return {
		tryUnlock: async () => {
			try {
				const ctx = ensureContext();
				await ctx.resume();
				return true;
			} catch {
				return false;
			}
		},
		playTick: () => {
			try {
				playNoiseClick();
			} catch {
				// ignore
			}
		},
		playWin: () => {
			try {
				playWinChime();
			} catch {
				// ignore
			}
		},
	};
}

export function RoletaPage() {
	const toast = useToast();

	const [options, setOptions] = useState<WheelOption[]>(DEFAULT_OPTIONS);
	const [newOptionText, setNewOptionText] = useState("");

	const [highlightId, setHighlightId] = useState<string | null>(null);
	const highlightIdRef = useRef<string | null>(null);
	const [winnerId, setWinnerId] = useState<string | null>(null);

	const [phaseKind, setPhaseKind] = useState<WheelPhase["kind"]>("idle");
	const phaseRef = useRef<WheelPhase>({ kind: "idle" });

	const [editMode, setEditMode] = useState(false);
	const [bulkText, setBulkText] = useState("");

	const [soundEnabled, setSoundEnabled] = useState(false);
	const soundEnabledRef = useRef(false);
	const sfxRef = useRef<SfxEngine | null>(null);

	const wheelRef = useRef<HTMLDivElement | null>(null);
	const dotsRef = useRef<HTMLDivElement | null>(null);
	const wheelAngleRef = useRef<number>(123);
	const rafRef = useRef<number | null>(null);
	const lastFrameTimeRef = useRef<number | null>(null);
	const lastStrobeTimeRef = useRef<number>(0);
	const lastSliceIndexRef = useRef<number | null>(null);
	const lastTickTimeRef = useRef<number>(0);

	const listItemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

	const svgSlices = useMemo(() => {
		const sliceCount = Math.max(options.length, 1);
		return generateWheelSvgPaths(sliceCount, 180);
	}, [options.length]);

	const setHighlight = (id: string | null, options?: { scroll?: boolean }) => {
		if (highlightIdRef.current === id) return;
		highlightIdRef.current = id;
		setHighlightId(id);

		if (!id) return;
		if (!options?.scroll) return;

		const element = listItemRefs.current.get(id);
		element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
	};

	const ensureSfx = () => {
		if (sfxRef.current) return sfxRef.current;
		if (typeof window === "undefined") return null;
		sfxRef.current = createSfxEngine();
		return sfxRef.current;
	};

	const playTick = () => {
		if (!soundEnabledRef.current) return;
		const now = performance.now();
		if (now - lastTickTimeRef.current < 28) return;
		lastTickTimeRef.current = now;
		ensureSfx()?.playTick();
	};

	const playWin = () => {
		if (!soundEnabledRef.current) return;
		ensureSfx()?.playWin();
	};

	const spin = async () => {
		if (phaseRef.current.kind === "spin") return;

		if (options.length < 2) {
			toast({
				...taquiToastPresets.warning,
				title: "OPA!",
				message: "Coloca pelo menos 2 opções pra roleta fazer sentido.",
			});
			return;
		}

		setWinnerId(null);

		if (soundEnabledRef.current) {
			const unlocked = await ensureSfx()?.tryUnlock();
			if (!unlocked) {
				toast({
					...taquiToastPresets.warning,
					title: "SHH!",
					message: "Ative o som para mais emoção.",
				});
			}
		}

		const winnerIndex = getRandomInt(options.length);
		const finalNormalized = buildFinalRotationNormalized(winnerIndex, options.length);
		const startAngle = wheelAngleRef.current;
		const startNormalized = normalizeAngle(startAngle);
		const deltaToFinal = normalizeAngle(finalNormalized - startNormalized);
		const extraTurns = 6 + getRandomInt(5);
		const totalDelta = extraTurns * 360 + deltaToFinal;

		phaseRef.current = {
			kind: "spin",
			startTime: performance.now(),
			startAngle,
			totalDelta,
			winnerIndex,
			accelDurationMs: SPIN_ACCEL_MS,
			totalDurationMs: SPIN_TOTAL_MS,
			accelPortion: SPIN_ACCEL_PORTION,
		};
		setPhaseKind("spin");
		lastStrobeTimeRef.current = 0;
		lastSliceIndexRef.current = null;
	};

	const parseBulkText = (text: string) => {
		const lines = text
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		const unique = Array.from(new Set(lines));
		if (unique.length === 0) return DEFAULT_OPTIONS;

		let counter = 0;
		return unique.map((label) => {
			counter += 1;
			return { id: `opt_${Date.now().toString(36)}_${counter.toString(36)}`, label };
		});
	};

	const commitBulkText = () => {
		const nextOptions = parseBulkText(bulkText);
		setOptions(nextOptions);
		setEditMode(false);
		setHighlight(null);
		setWinnerId(null);
	};

	const removeOption = (id: string) => {
		setOptions((prev) => prev.filter((option) => option.id !== id));
		if (highlightIdRef.current === id) {
			setHighlight(null);
		}
		setWinnerId((prev) => (prev === id ? null : prev));
	};

	const addOption = () => {
		const trimmed = newOptionText.trim();
		if (!trimmed) return;

		setOptions((prev) => {
			if (prev.some((option) => option.label.toLowerCase() === trimmed.toLowerCase())) {
				return prev;
			}
			const nextId = `opt_${Date.now().toString(36)}_${getRandomInt(1_000_000).toString(36)}`;
			return [...prev, { id: nextId, label: trimmed }];
		});
		setNewOptionText("");
	};

	useEffect(() => {
		soundEnabledRef.current = soundEnabled;
	}, [soundEnabled]);

	useEffect(() => {
		const wheel = wheelRef.current;
		if (!wheel) return;

		const idleDegPerSecond = 360 / IDLE_ROTATION_SECONDS;

		const frame = (now: number) => {
			if (lastFrameTimeRef.current == null) {
				lastFrameTimeRef.current = now;
			}

			const deltaMs = now - lastFrameTimeRef.current;
			lastFrameTimeRef.current = now;
			const deltaSeconds = deltaMs / 1000;

			const phase = phaseRef.current;

			if (phase.kind === "idle") {
				wheelAngleRef.current += idleDegPerSecond * deltaSeconds;
			}

			if (phase.kind === "spin") {
				const elapsed = now - phase.startTime;
				const accelMs = phase.accelDurationMs;
				const totalMs = phase.totalDurationMs;

				const clampedElapsed = Math.min(Math.max(elapsed, 0), totalMs);

				let progress = 0;
				if (clampedElapsed <= accelMs) {
					const t = accelMs === 0 ? 1 : clampedElapsed / accelMs;
					progress = easeInCubic(t) * phase.accelPortion;

					if (
						lastStrobeTimeRef.current === 0 ||
						clampedElapsed - lastStrobeTimeRef.current >= STROBE_INTERVAL_MS
					) {
						lastStrobeTimeRef.current = clampedElapsed;
						const randomIndex = getRandomInt(options.length);
						setHighlight(options[randomIndex]?.id ?? null);
					}
				} else {
					const remaining = totalMs - accelMs;
					const t = remaining === 0 ? 1 : (clampedElapsed - accelMs) / remaining;
					progress =
						phase.accelPortion + easeOutCubic(t) * (1 - phase.accelPortion);
				}

				const nextAngle = phase.startAngle + phase.totalDelta * progress;
				wheelAngleRef.current = nextAngle;

				const sliceIndex = getSliceIndex(nextAngle, options.length);
				if (lastSliceIndexRef.current !== sliceIndex) {
					lastSliceIndexRef.current = sliceIndex;
					playTick();
				}

				if (clampedElapsed > accelMs) {
					const id = options[sliceIndex]?.id ?? null;
					setHighlight(id, { scroll: true });
				}

				if (elapsed >= totalMs) {
					const winner = options[phase.winnerIndex];
					const winnerOptionId = winner?.id ?? null;
					setWinnerId(winnerOptionId);
					setHighlight(winnerOptionId, { scroll: true });
					setPhaseKind("stopped");
					phaseRef.current = {
						kind: "stopped",
						winnerIndex: phase.winnerIndex,
					};

					playWin();
					toast({
						...taquiToastPresets.success,
						title: "A CULPA É DO ALGORITMO",
						message: winner?.label
							? `Deu: ${winner.label}`
							: "O algoritmo decidiu.",
					});
				}
			}

			const rotation = `rotate(${wheelAngleRef.current}deg)`;
			wheel.style.transform = rotation;
			if (dotsRef.current) {
				dotsRef.current.style.transform = rotation;
			}
			rafRef.current = requestAnimationFrame(frame);
		};

		rafRef.current = requestAnimationFrame(frame);

		return () => {
			if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
			lastFrameTimeRef.current = null;
		};
	}, [options, toast]);

	useEffect(() => {
		if (!editMode) return;
		setBulkText(options.map((option) => option.label).join("\n"));
	}, [editMode, options]);

	return (
		<PageShell showLogo containerClassName="max-w-[1200px] gap-12">
			<div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-16">
				<div className="relative flex shrink-0 items-center justify-center">
					<div className="relative h-[360px] w-[360px] sm:h-[520px] sm:w-[520px]">
						<div className="absolute inset-0 rounded-full border-[2px] border-black bg-white shadow-[4px_4px_0_#000000]" />

						<div className="absolute inset-[16px] overflow-hidden rounded-full border-[1px] border-black bg-white shadow-[1px_1px_0_#000000]">
							<div
								ref={wheelRef}
								className="absolute inset-0 will-change-transform [--taqui-label-distance:-90px] sm:[--taqui-label-distance:-110px]"
								style={{ transform: `rotate(${wheelAngleRef.current}deg)` }}
							>
								<svg
									viewBox="0 0 360 360"
									className="absolute inset-0 h-full w-full"
									aria-hidden="true"
								>
									{svgSlices.map((slice) => (
										<path
											key={slice.path}
											d={slice.path}
											fill={slice.fill}
											stroke="#000000"
											strokeWidth="1"
										/>
									))}
								</svg>

								{options.map((option, index) => {
									const sliceAngle = 360 / Math.max(options.length, 1);
									const rotation = (index + 0.5) * sliceAngle;
									return (
										<div
											key={option.id}
											className="absolute left-1/2 top-1/2 w-[150px] text-center font-mono text-sm font-bold leading-8 text-black sm:w-[170px] sm:text-2xl"
											style={{
												transform: `translate(-50%, -50%) rotate(${rotation}deg) translateY(var(--taqui-label-distance)) rotate(-90deg)`,
											}}
										>
											<span className="block select-none truncate px-1">
												{option.label}
											</span>
										</div>
									);
								})}

								<div className="absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[1px] border-black bg-white shadow-[2px_2px_0_#000000]">
									<ArrowClockwiseIcon className="h-8 w-8 text-black" weight="bold" />
								</div>
							</div>
						</div>

						<div className="absolute inset-0 hidden sm:block" aria-hidden="true">
							<div
								ref={dotsRef}
								className="absolute inset-0 will-change-transform"
								style={{ transform: `rotate(${wheelAngleRef.current}deg)` }}
							>
								{Array.from({ length: Math.max(options.length, 1) }, (_, index) => {
									const sliceAngle = 360 / Math.max(options.length, 1);
									const angle = index * sliceAngle;
									return (
										<div
											key={`dot_${angle}`}
											className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full border-1 border-black bg-white shadow-[3px_2px_0_#000000]"
											style={{
												transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-244px)`,
											}}
										/>
									);
								})}
							</div>
						</div>

						<div className="pointer-events-none absolute top-1/2 right-[-68px] z-20 -translate-y-1/2 translate-y-[-40px] sm:right-[-98px]">
							<svg
								viewBox="0 0 100 120"
								className="h-[96px] w-[80px] -rotate-90 drop-shadow-[-3px_3px_0_#000000] sm:h-[90px] sm:w-[180px]"
								aria-hidden="true"
							>
								<polygon
									points="50,0 100,120 0,120"
									fill="#FF4D4D"
									stroke="#000000"
									strokeWidth="2"
									strokeLinejoin="round"
								/>
							</svg>
						</div>
					</div>
				</div>

				<div className="flex w-full max-w-[560px] flex-col gap-4 font-mono text-black">
					<div className="flex w-full flex-col gap-4 sm:flex-row">
						<input
							type="text"
							value={newOptionText}
							onChange={(event) => setNewOptionText(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") addOption();
							}}
							placeholder="Adicionar nova opção..."
							className="h-[58px] w-full flex-1 rounded-lg border-[2px] border-black bg-white px-4 text-lg font-bold leading-6 shadow-[2px_2px_0_#000000] placeholder:text-black/40 focus:outline-none"
						/>

						<button
							type="button"
							onClick={addOption}
							className="flex h-[58px] w-full shrink-0 items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-white px-4 text-lg font-bold leading-6 shadow-[2px_2px_0_#000000] sm:w-[170px]"
						>
							<span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-white">
								<PlusIcon className="h-4 w-4 text-black" weight="bold" />
							</span>
							Adicionar
						</button>
					</div>

					<button
						type="button"
						onClick={() => void spin()}
						disabled={phaseKind === "spin"}
						className="flex h-[64px] w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-[14px] py-3 text-2xl font-bold leading-9 text-black shadow-[2px_2px_0_#000000] disabled:cursor-not-allowed disabled:opacity-60"
					>
						<ArrowClockwiseIcon className="h-7 w-7" weight="bold" />
						{phaseKind === "spin" ? "Girando..." : "Girar"}
					</button>

					<div className="w-full overflow-hidden rounded-lg border-[3px] border-black bg-white shadow-[4px_4px_0_#000000]">
						<div className="flex items-center justify-between border-b-2 border-black px-4 py-3">
							<p className="text-sm font-bold leading-5 text-black/70">Opções</p>

							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => setEditMode((prev) => !prev)}
									className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#000000]"
									aria-label={editMode ? "Voltar" : "Editar tudo"}
								>
									<NotePencilIcon className="h-5 w-5 text-black" weight="bold" />
								</button>

								<button
									type="button"
									onClick={() => setSoundEnabled((prev) => !prev)}
									aria-pressed={soundEnabled}
									className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#000000]"
									aria-label={`Som: ${soundEnabled ? "ON" : "OFF"}`}
								>
									{soundEnabled ? (
										<SpeakerHighIcon className="h-5 w-5 text-black" weight="bold" />
									) : (
										<SpeakerSlashIcon className="h-5 w-5 text-black" weight="bold" />
									)}
								</button>
							</div>
						</div>

						{editMode ? (
							<textarea
								value={bulkText}
								onChange={(event) => setBulkText(event.target.value)}
								onBlur={commitBulkText}
								placeholder="Separe as opções por linha..."
								rows={12}
								className="w-full resize-none bg-white p-4 text-base leading-6 text-black focus:outline-none"
							/>
						) : (
							<div className="max-h-[332px] w-full overflow-y-auto">
								{options.map((option) => {
									const isHighlighted = highlightId === option.id;
									const isWinner = winnerId === option.id;
									return (
										<div
											key={option.id}
											ref={(node) => {
												listItemRefs.current.set(option.id, node);
											}}
											className={`flex items-center justify-between gap-4 border-b-2 border-black px-4 py-3 ${isHighlighted ? "bg-[#FFF129]" : "bg-white"
												} ${isWinner ? "animate-pulse" : ""}`}
										>
											<p className="min-w-0 flex-1 truncate text-base font-bold leading-6 text-xl">
												{option.label}
											</p>

											<button
												type="button"
												onClick={() => removeOption(option.id)}
												className="flex h-9 w-9 items-center justify-center text-black"
												aria-label={`Remover ${option.label}`}
											>
												<XIcon className="h-5 w-5" weight="bold" />
											</button>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>
		</PageShell>
	);
}
