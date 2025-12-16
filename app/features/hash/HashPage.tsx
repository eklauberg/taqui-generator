import {
	CopyIcon,
	DiceSixIcon,
	MagicWandIcon,
	TagIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { MetaFunction } from "react-router";
import { PageShell } from "../../components/PageShell";
import { taquiToastPresets, useToast } from "../../components/Toast";

const HISTORY_LIMIT = 6;

export const hashMeta: MetaFunction = () => {
	return [
		{ title: "Táqui o UUID" },
		{
			name: "description",
			content: "Gere UUID v4 fresquinho e copie rápido. Só UUID, sem firula.",
		},
	];
};

export function HashPage() {
	const [uuid, setUuid] = useState("");
	const [history, setHistory] = useState<string[]>([]);
	const [copiedKey, setCopiedKey] = useState<string | null>(null);
	const toast = useToast();

	useEffect(() => {
		setUuid(createUUID());
	}, []);

	const generateNewUuid = () => {
		const next = createUUID();
		setHistory((prev) => {
			if (!uuid) return prev;
			const ordered = [uuid, ...prev.filter((item) => item !== uuid)];
			return ordered.slice(0, HISTORY_LIMIT);
		});
		setUuid(next);
		setCopiedKey(null);
		return next;
	};

	const generate = () => {
		void generateNewUuid();
	};

	const copy = async (value: string, source: string) => {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			setCopiedKey(source);
			toast({
				...taquiToastPresets.success,
				title: "TÁQUI!",
				message: "UUID copiado pro clipboard.",
			});
			setTimeout(() => setCopiedKey(null), 1600);
		} catch (error) {
			console.error("Erro ao copiar UUID:", error);
			toast({
				...taquiToastPresets.error,
				title: "DEU RUIM!",
				message: "Não consegui copiar o UUID.",
			});
		}
	};

	const copyCurrent = () => void copy(uuid, "current");
	const copyHistory = (value: string) => void copy(value, `history-${value}`);

	const generateAndCopy = async () => {
		const fresh = generateNewUuid();
		await copy(fresh, "current");
	};

	return (
		<PageShell showLogo align="center" containerClassName="max-w-[720px] gap-8">
			<section className="flex w-full flex-col gap-4 rounded-xl border-2 border-black bg-white p-5 text-black shadow-[4px_4px_0_#000000] sm:p-6">
				<header className="flex flex-col gap-2 font-mono">
					<div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-black/70">
						<TagIcon className="h-5 w-5" weight="bold" />
						Laboratório de UUID
					</div>
					<p className="text-lg font-bold leading-7 sm:text-2xl">
						Sem distração: gere um UUID v4 e já manda pro clipboard.
					</p>
				</header>

				<div className="relative flex w-full flex-col gap-2 rounded-lg border-2 border-black bg-white p-4 shadow-[2px_2px_0_#000000]">
					<span className="absolute -top-3 right-3 rounded-full border-2 border-black bg-[#22EB78] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-black shadow-[2px_2px_0_#000000]">
						UUID v4
					</span>
					<p className="break-all font-['Roboto_Flex'] text-base font-bold leading-tight text-black sm:text-lg">
						{uuid || "Gerando..."}
					</p>
					<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-black/60">
						Padrão 8-4-4-4-12 com hyphen. Sempre único.
					</p>
				</div>

				<div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
					<button
						type="button"
						onClick={generate}
						className="flex h-[48px] w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-3 py-2 font-mono text-lg font-bold leading-7 text-black shadow-[2px_2px_0_#000000]"
					>
						<DiceSixIcon className="h-6 w-6" weight="bold" />
						Gerar novo
					</button>

					<button
						type="button"
						onClick={copyCurrent}
						disabled={!uuid}
						className="flex h-[48px] w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-white px-3 py-2 font-mono text-lg font-bold leading-7 text-black shadow-[2px_2px_0_#000000] disabled:cursor-not-allowed disabled:opacity-60"
					>
						<CopyIcon className="h-6 w-6" weight="bold" />
						{copiedKey === "current" ? "Copiado!" : "Copiar"}
					</button>
				</div>

				<button
					type="button"
					onClick={() => void generateAndCopy()}
					disabled={!uuid}
					className="flex h-[46px] w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#47B8FF] px-3 py-2 font-mono text-sm font-bold leading-6 text-black shadow-[2px_2px_0_#000000] transition-transform hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
				>
					<MagicWandIcon className="h-5 w-5" weight="bold" />
					Gerar e copiar direto
				</button>

				<div className="flex flex-col gap-2 rounded-xl border border-black/20 bg-[#F8F8F8] p-3 shadow-[1px_1px_0_#000000]">
					<p className="text-xs font-semibold uppercase tracking-[0.08em] text-black/70">
						Histórico rápido
					</p>
					{history.length === 0 ? (
						<div className="flex h-[100px] items-center justify-center rounded-lg border-2 border-dashed border-[#94D3FF] bg-[#E8F6FF] px-4 text-center font-mono text-black">
							<p className="text-sm font-semibold leading-6">
								Gere um UUID pra começar a preencher o histórico.
							</p>
						</div>
					) : (
						history.map((item) => (
							<div
								key={item}
								className="flex w-full flex-col gap-2 rounded-lg border-2 border-black bg-white p-3 shadow-[2px_2px_0_#000000]"
							>
								<p className="break-all font-['Roboto_Flex'] text-sm font-bold leading-tight text-black">
									{item}
								</p>
								<button
									type="button"
									onClick={() => copyHistory(item)}
									className="flex h-[40px] w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-black shadow-[2px_2px_0_#000000]"
								>
									{copiedKey === `history-${item}` ? (
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
			</section>
		</PageShell>
	);
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
