import { useEffect, useMemo, useState } from "react";
import type { MetaFunction } from "react-router";
import {
	CopyIcon,
	HashStraightIcon,
	LightningIcon,
	SealCheckIcon,
	SparkleIcon,
} from "@phosphor-icons/react";
import { PageShell } from "../../components/PageShell";
import { taquiToastPresets, useToast } from "../../components/Toast";

type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-512";

type HashSpec = {
	id: string;
	label: string;
	hint: string;
	algorithm: HashAlgorithm;
	useSalt?: boolean;
};

type HashResult = {
	id: string;
	label: string;
	value: string;
	hint: string;
};

type LabId = {
	id: string;
	label: string;
	value: string;
	helper: string;
};

const HASH_SPECS: HashSpec[] = [
	{
		id: "sha1",
		label: "SHA-1 nostálgico",
		hint: "Pra falar com legado e APIs teimosas.",
		algorithm: "SHA-1",
	},
	{
		id: "sha256",
		label: "SHA-256 blindado",
		hint: "Equilíbrio perfeito entre força e velocidade.",
		algorithm: "SHA-256",
	},
	{
		id: "sha512",
		label: "SHA-512 exagerado",
		hint: "Quando sobra bit e falta paciência.",
		algorithm: "SHA-512",
	},
	{
		id: "salty256",
		label: "SHA-256 com sal",
		hint: "Mistura o texto com um sal aleatório antes de hashear.",
		algorithm: "SHA-256",
		useSalt: true,
	},
];

const EMOJI_STAMP = ["🔥", "✨", "🧊", "🛸", "🧪", "🦾", "🌶️", "⚡", "🧱", "🎲"];

export const hashMeta: MetaFunction = () => {
	return [
		{ title: "Táqui o Hash" },
		{
			name: "description",
			content: "Gere UUID e hashes SHA no estilo Táqui: rápido, copiado e temperado.",
		},
	];
};

export function HashPage() {
	const [text, setText] = useState("Tá aqui o texto que vai virar hash.");
	const [useSalt, setUseSalt] = useState(true);
	const [salt, setSalt] = useState(() => createFriendlyId(8));
	const [uppercaseHex, setUppercaseHex] = useState(false);
	const [hashResults, setHashResults] = useState<HashResult[]>([]);
	const [isHashing, setIsHashing] = useState(false);
	const [idBatch, setIdBatch] = useState<LabId[]>([]);
	const [isMixingIds, setIsMixingIds] = useState(false);
	const [copiedKey, setCopiedKey] = useState<string | null>(null);
	const toast = useToast();

	const cleanedText = useMemo(() => text.trim(), [text]);
	const saltedText = useMemo(() => {
		if (!useSalt) return cleanedText;
		if (cleanedText.length === 0) return "";
		return `${cleanedText}\n::${salt}`;
	}, [cleanedText, useSalt, salt]);

	useEffect(() => {
		let cancelled = false;
		const run = async () => {
			if (cleanedText.length === 0) {
				setHashResults([]);
				setIsHashing(false);
				return;
			}

			setIsHashing(true);
			const results = await Promise.all(
				HASH_SPECS.map(async (spec) => {
					const source = spec.useSalt
						? useSalt
							? saltedText
							: cleanedText
						: cleanedText;
					const value = await digestString(source, spec.algorithm, uppercaseHex);
					const hint = spec.useSalt
						? useSalt
							? `${spec.hint} Sal atual: ${salt.toUpperCase()}.`
							: "Sem sal: resultado determinístico."
						: spec.hint;
					return { id: spec.id, label: spec.label, value, hint };
				}),
			);

			if (!cancelled) {
				setHashResults(results);
				setIsHashing(false);
			}
		};

		void run();
		return () => {
			cancelled = true;
		};
	}, [cleanedText, saltedText, uppercaseHex, salt, useSalt]);

	useEffect(() => {
		void mixNewIds();
	}, []);

	const mixNewIds = async () => {
		setIsMixingIds(true);
		try {
			const now = new Date();
			const uuid = createUUID();
			const compact = uuid.replaceAll("-", "");
			const slug = createFriendlyId(18).toLowerCase();
			const flash = await digestString(
				`${now.toISOString()}-${createFriendlyId(6)}`,
				"SHA-256",
				false,
			);
			const emojiValue = buildEmojiStamp(cleanedText || slug);

			setIdBatch([
				{
					id: "uuid",
					label: "UUID v4",
					value: uuid,
					helper: "Sai direto do crypto.randomUUID().",
				},
				{
					id: "compact",
					label: "UUID sem hífen",
					value: compact,
					helper: "Pra header, query e qualquer campo chato.",
				},
				{
					id: "slug",
					label: "Slug crocante",
					value: slug,
					helper: "Base 32, sem vogal confusa, pronto pra URLs.",
				},
				{
					id: "flash",
					label: "Hash relâmpago",
					value: flash.slice(0, 32),
					helper: "SHA-256 curtinho usando timestamp + ruído.",
				},
				{
					id: "emoji",
					label: "Carimbo visual",
					value: emojiValue,
					helper: "Mesma entrada, sempre a mesma sequência de emoji.",
				},
			]);
		} catch (error) {
			console.error("Erro ao gerar lote de IDs:", error);
			toast({
				...taquiToastPresets.error,
				title: "DEU RUIM!",
				message: "Falhou gerar um lote novo de IDs.",
			});
		} finally {
			setIsMixingIds(false);
		}
	};

	const copyValue = async (value: string, source: string) => {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			setCopiedKey(source);
			toast({
				...taquiToastPresets.success,
				title: "TÁQUI!",
				message: "Valor copiado. Vai lá usar antes que esfrie.",
			});
			setTimeout(() => setCopiedKey(null), 1800);
		} catch (error) {
			console.error("Erro ao copiar:", error);
			toast({
				...taquiToastPresets.error,
				title: "DEU RUIM!",
				message: "Não consegui copiar pro clipboard.",
			});
		}
	};

	const copyAllIds = async () => {
		if (idBatch.length === 0) return;
		const textToCopy = idBatch.map((item) => `${item.label}: ${item.value}`).join("\n");
		await copyValue(textToCopy, "all-ids");
	};

	return (
		<PageShell
			showLogo
			align="start"
			containerClassName="max-w-[1200px] gap-10"
			title="Táqui o Hash"
			description="UUID fresquinho, hashes SHA e até um carimbo visual. Cola teu texto, tempera com sal ou só copia tudo no grito."
		>
			<div className="grid w-full gap-6 lg:grid-cols-[1.2fr_1fr]">
				<section className="flex w-full flex-col gap-4 rounded-lg border-2 border-black bg-white p-6 text-black shadow-[4px_4px_0_#000000]">
					<header className="flex flex-col gap-2 font-mono">
						<div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-black/70">
							<SealCheckIcon className="h-5 w-5" weight="bold" />
							Moedor de Hashes
						</div>
						<p className="text-xl font-bold leading-7 sm:text-2xl">
							Digita qualquer coisa e leva várias versões do hash.
						</p>
						<p className="text-sm leading-6 text-black/75">
							Trocou uma letra? Todos os hashes mudam. Perdeu o sal? Troca ali embaixo.
						</p>
					</header>

					<textarea
						value={text}
						onChange={(event) => setText(event.target.value)}
						placeholder="Cola aqui o segredo, token, payload ou aquele texto aleatório."
						rows={4}
						className="min-h-[120px] w-full rounded-lg border-[3px] border-black bg-white p-4 font-mono text-base leading-6 text-black placeholder:text-[#B1B1B1] shadow-[2px_2px_0_#000000] focus:outline-none"
					/>

					<div className="flex flex-wrap gap-3">
						<TogglePill
							active={useSalt}
							label="Sal secreto"
							onToggle={() => setUseSalt((prev) => !prev)}
						/>
						<button
							type="button"
							onClick={() => setSalt(createFriendlyId(8))}
							className="flex items-center gap-2 rounded-full border-2 border-black bg-[#FFF129] px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-black shadow-[2px_2px_0_#000000] transition-transform hover:-translate-y-[1px] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-60"
							disabled={!useSalt}
						>
							<SparkleIcon className="h-5 w-5" weight="bold" />
							Trocar sal
						</button>
						<TogglePill
							active={uppercaseHex}
							label="HEX maiúsculo"
							onToggle={() => setUppercaseHex((prev) => !prev)}
						/>
					</div>

					<div className="flex items-center gap-2 rounded-md bg-[#F4F4F4] px-3 py-2 text-xs font-mono text-black/70 shadow-[1px_1px_0_#000000]">
						<HashStraightIcon className="h-5 w-5" weight="bold" />
						<span className="truncate">
							{useSalt
								? `Entrada temperada com sal "${salt}".`
								: "Hash puro, sem sal (determinístico)."}
						</span>
					</div>

					<div className="flex flex-col gap-3 rounded-xl border border-black/20 bg-[#F8F8F8] p-3 shadow-[1px_1px_0_#000000]">
						{cleanedText.length === 0 ? (
							<div className="flex h-[160px] items-center justify-center rounded-lg border-2 border-dashed border-[#94D3FF] bg-[#47B8FF] px-4 text-center font-mono text-black">
								<p className="text-base font-semibold leading-7">
									Joga um texto aqui pra começar a fritar os hashes.
								</p>
							</div>
						) : (
							<>
								{isHashing && (
									<p className="text-xs font-semibold uppercase tracking-[0.08em] text-black/60">
										Calculando hashes...
									</p>
								)}

								{hashResults.map((item) => (
									<div
										key={item.id}
										className="flex w-full flex-col gap-3 rounded-lg border-2 border-black bg-white p-4 shadow-[2px_2px_0_#000000] sm:flex-row sm:items-start sm:gap-4"
									>
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-[#FFF129] font-mono text-sm font-black uppercase shadow-[2px_2px_0_#000000]">
											{item.id}
										</div>
										<div className="flex min-w-0 flex-1 flex-col gap-1">
											<p className="break-all font-['Roboto_Flex'] text-base font-bold leading-tight text-black sm:text-lg">
												{item.value}
											</p>
											<p className="text-xs font-semibold uppercase tracking-[0.08em] text-black/60">
												{item.label} • {item.hint}
											</p>
										</div>
										<button
											type="button"
											onClick={() => void copyValue(item.value, `hash-${item.id}`)}
											className="flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-3 py-2 font-mono text-sm font-bold leading-6 text-black sm:self-center"
										>
											{copiedKey === `hash-${item.id}` ? (
												"Copiado!"
											) : (
												<>
													<CopyIcon className="h-5 w-5" weight="bold" />
													Copiar
												</>
											)}
										</button>
									</div>
								))}
							</>
						)}
					</div>
				</section>

				<section className="flex w-full flex-col gap-4 rounded-lg border-2 border-black bg-white p-6 text-black shadow-[4px_4px_0_#000000]">
					<header className="flex items-center justify-between gap-3 font-mono">
						<div className="flex flex-col gap-1">
							<div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-black/70">
								<LightningIcon className="h-5 w-5" weight="bold" />
								Laboratório de IDs
							</div>
							<p className="text-xl font-bold leading-7 sm:text-2xl">
								UUID, slug curto e um hash relâmpago com um clique.
							</p>
						</div>

						<button
							type="button"
							onClick={() => void mixNewIds()}
							className="flex h-[48px] items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-3 py-2 font-mono text-sm font-bold leading-6 text-black shadow-[2px_2px_0_#000000]"
						>
							<LightningIcon className="h-5 w-5" weight="bold" />
							Misturar
						</button>
					</header>

					<p className="text-sm leading-6 text-black/75">
						Mantém um lote com vários sabores de identificador. Mistura de novo quando quiser um
						UUID fresquinho ou um slug mais curto.
					</p>

					<div className="flex flex-col gap-3">
						{idBatch.length === 0 ? (
							<div className="flex h-[160px] items-center justify-center rounded-lg border-2 border-dashed border-[#FFD54F] bg-[#FFF8C7] px-4 text-center font-mono text-black">
								<p className="text-base font-semibold leading-7">
									Sem lote ainda. Clica em “Misturar” pra nascer tudo.
								</p>
							</div>
						) : (
							idBatch.map((item) => (
								<div
									key={item.id}
									className="flex w-full items-center gap-3 rounded-lg border-2 border-black bg-white p-4 shadow-[2px_2px_0_#000000]"
								>
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-[#47B8FF] font-mono text-sm font-black uppercase text-white shadow-[2px_2px_0_#000000]">
										{item.id}
									</div>
									<div className="flex min-w-0 flex-1 flex-col gap-1">
										<p className="truncate font-['Roboto_Flex'] text-lg font-bold leading-tight text-black sm:text-xl">
											{item.value}
										</p>
										<p className="text-xs font-semibold uppercase tracking-[0.08em] text-black/60">
											{item.label} • {item.helper}
										</p>
									</div>
									<button
										type="button"
										onClick={() => void copyValue(item.value, `id-${item.id}`)}
										className="flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#47B8FF] px-3 py-2 font-mono text-sm font-bold leading-6 text-black"
									>
										{copiedKey === `id-${item.id}` ? (
											"Copiado!"
										) : (
											<>
												<CopyIcon className="h-5 w-5" weight="bold" />
												Copiar
											</>
										)}
									</button>
								</div>
							))
						)}
					</div>

					<div className="flex gap-3">
						<button
							type="button"
							onClick={() => void mixNewIds()}
							disabled={isMixingIds}
							className="flex h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-white px-3 py-2 font-mono text-sm font-bold leading-6 text-black shadow-[2px_2px_0_#000000] disabled:cursor-not-allowed disabled:opacity-60"
						>
							<SparkleIcon className="h-5 w-5" weight="bold" />
							{isMixingIds ? "Gerando..." : "Lote novo"}
						</button>

						<button
							type="button"
							onClick={() => void copyAllIds()}
							disabled={idBatch.length === 0}
							className="flex h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-3 py-2 font-mono text-sm font-bold leading-6 text-black shadow-[2px_2px_0_#000000] disabled:cursor-not-allowed disabled:opacity-60"
						>
							<CopyIcon className="h-5 w-5" weight="bold" />
							Copiar lote inteiro
						</button>
					</div>
				</section>
			</div>
		</PageShell>
	);
}

function TogglePill({
	active,
	label,
	onToggle,
}: {
	active: boolean;
	label: string;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onToggle}
			aria-pressed={active}
			className="flex items-center gap-2 rounded-full border-2 border-black bg-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-black shadow-[2px_2px_0_#000000] transition-transform hover:-translate-y-[1px] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
			style={{ background: active ? "#47B8FF" : "#FFFFFF" }}
		>
			<span
				className="flex h-[18px] w-[32px] items-center rounded-full border border-black bg-white shadow-[2px_2px_0_#000000]"
				style={{ justifyContent: active ? "flex-end" : "flex-start" }}
			>
				<span
					className="m-[2px] h-[12px] w-[12px] rounded-full border border-black"
					style={{ background: active ? "#FFF129" : "#9D9D9D" }}
				/>
			</span>
			{label}
		</button>
	);
}

function buildEmojiStamp(value: string) {
	if (value.length === 0) return "...";
	let accumulator = 0;
	for (let index = 0; index < value.length; index += 1) {
		accumulator = (accumulator + value.charCodeAt(index) * (index + 3)) % 0x7fffffff;
	}
	const slots = Array.from({ length: 4 }, (_, index) => {
		const seed = (accumulator >> (index * 3)) ^ (value.charCodeAt(index % value.length) ?? 0);
		return EMOJI_STAMP[seed % EMOJI_STAMP.length]!;
	});
	return slots.join(" ");
}

async function digestString(value: string, algorithm: HashAlgorithm, uppercase: boolean) {
	if (value.length === 0) return "";
	const cryptoApi = typeof crypto !== "undefined" ? crypto : undefined;
	if (cryptoApi?.subtle?.digest) {
		const encoder = new TextEncoder();
		const data = encoder.encode(value);
		const digest = await cryptoApi.subtle.digest(algorithm, data);
		return bufferToHex(digest, uppercase);
	}
	return fallbackHash(value, uppercase);
}

function bufferToHex(buffer: ArrayBuffer, uppercase: boolean) {
	const bytes = new Uint8Array(buffer);
	const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
	return uppercase ? hex.toUpperCase() : hex;
}

function fallbackHash(value: string, uppercase: boolean) {
	let hash = 0x811c9dc5;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	const hex = hash.toString(16).padStart(8, "0");
	const doubled = (hex + hash.toString(16).padStart(8, "0")).slice(0, 16);
	return uppercase ? doubled.toUpperCase() : doubled;
}

function createFriendlyId(length = 12) {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	const cryptoApi = typeof crypto !== "undefined" ? crypto : undefined;
	const randomBytes = cryptoApi?.getRandomValues
		? cryptoApi.getRandomValues(new Uint8Array(length))
		: Array.from({ length }, () => Math.floor(Math.random() * 256));

	return Array.from({ length }, (_, index) => {
		const byte = randomBytes[index] ?? 0;
		return alphabet[byte % alphabet.length]!;
	}).join("");
}

function createUUID() {
	const cryptoApi = typeof crypto !== "undefined" ? crypto : undefined;
	if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();

	const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
	return template.replace(/[xy]/g, (char) => {
		const random = Math.floor(Math.random() * 16);
		const value = char === "x" ? random : (random & 0x3) | 0x8;
		return value.toString(16);
	});
}
