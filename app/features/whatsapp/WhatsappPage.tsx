import {
	ArrowSquareOutIcon,
	CopyIcon,
	WhatsappLogoIcon,
} from "@phosphor-icons/react";
import { type KeyboardEvent, useMemo, useState } from "react";
import type { MetaFunction } from "react-router";
import { PageShell } from "../../components/PageShell";
import { taquiToastPresets, useToast } from "../../components/Toast";

const MIN_PHONE_LENGTH = 10;

export const whatsappMeta: MetaFunction = () => {
	return [
		{ title: "Táqui o Zap" },
		{
			name: "description",
			content:
				"Abra uma conversa do WhatsApp Web direto do Táqui: cola o número, digita a mensagem e já vai pro papo.",
		},
	];
};

function sanitizePhone(value: string) {
	return value.replace(/\D/g, "");
}

function buildWhatsappUrl(phoneInput: string, message: string) {
	const phone = sanitizePhone(phoneInput);
	if (phone.length < MIN_PHONE_LENGTH) {
		throw new Error("Cola o número com DDI e DDD pra abrir o zap.");
	}

	const trimmedMessage = message.trim();
	const query =
		trimmedMessage.length > 0
			? `?text=${encodeURIComponent(trimmedMessage)}`
			: "";
	return `https://wa.me/${phone}${query}`;
}

export function WhatsappPage() {
	const toast = useToast();
	const [phone, setPhone] = useState("55");
	const [message, setMessage] = useState(
		"Tá aqui! Bora trocar uma ideia pelo zap?",
	);
	const [link, setLink] = useState<string>("");
	const sanitizedPhone = useMemo(() => sanitizePhone(phone), [phone]);
	const canGenerate = sanitizedPhone.length >= MIN_PHONE_LENGTH;

	const openConversation = () => {
		try {
			const whatsappUrl = buildWhatsappUrl(phone, message);
			setLink(whatsappUrl);
			window.open(whatsappUrl, "_blank", "noopener,noreferrer");
			toast({
				...taquiToastPresets.success,
				title: "TÁQUI!",
				message: "Abrindo o zap web já com a conversa pronta.",
			});
		} catch (error) {
			console.error(error);
			const message =
				error instanceof Error
					? error.message
					: "Não deu pra abrir o WhatsApp com esse número.";
			toast({
				...taquiToastPresets.warning,
				title: "TÁ DE BRINCADEIRA?",
				message,
			});
		}
	};

	const copyLink = async () => {
		if (!link) return;
		try {
			await navigator.clipboard.writeText(link);
			toast({
				...taquiToastPresets.success,
				title: "TÁQUI!",
				message: "Link copiado. É só colar e abrir o zap.",
			});
		} catch (error) {
			console.error(error);
			toast({
				...taquiToastPresets.error,
				title: "DEU RUIM!",
				message: "Não rolou copiar o link do WhatsApp.",
			});
		}
	};

	const handleSubmit = () => {
		if (!canGenerate) {
			toast({
				...taquiToastPresets.warning,
				title: "TÁ DE BRINCADEIRA?",
				message: "Manda o número completo com DDI e DDD pra abrir o zap.",
			});
			return;
		}

		openConversation();
	};

	const handleKeyDown = (
		event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	};

	return (
		<PageShell showLogo containerClassName="max-w-[1200px] gap-12">
			<div className="flex w-full flex-col items-center gap-10">
				<div className="flex w-full max-w-[720px] flex-col gap-6 sm:flex-row sm:items-start">
					<div className="flex w-full flex-col gap-4">
						<label htmlFor="zap-number" className="sr-only">
							Número com DDI e DDD
						</label>
						<input
							id="zap-number"
							type="tel"
							value={phone}
							onChange={(event) => setPhone(event.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="55DDD + número"
							autoComplete="tel"
							className="h-[60px] w-full rounded-lg border-[3px] border-black bg-white p-4 font-mono text-2xl leading-7 text-black placeholder:text-[#B1B1B1] focus:outline-none"
						/>

						<label htmlFor="zap-message" className="sr-only">
							Mensagem opcional
						</label>
						<textarea
							id="zap-message"
							value={message}
							onChange={(event) => setMessage(event.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Mensagem pra já chegar no papo"
							rows={3}
							className="w-full resize-none rounded-lg border-[3px] border-black bg-white p-4 font-mono text-lg leading-7 text-black placeholder:text-[#B1B1B1] focus:outline-none"
						/>

						<p className="text-sm text-white/90">
							Use o DDI (tipo 55) e DDD no número. Se quiser, já deixa a
							mensagem pronta que o WhatsApp Web abre com ela preenchida.
						</p>
					</div>

					<button
						type="button"
						onClick={handleSubmit}
						disabled={!canGenerate}
						className="flex h-[60px] w-full max-w-[260px] items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-[14px] py-3 font-mono text-2xl font-bold leading-9 text-black shadow-[2px_2px_0_#000000] disabled:cursor-not-allowed disabled:opacity-60"
					>
						<WhatsappLogoIcon className="h-8 w-8" weight="bold" />
						Conversar
					</button>
				</div>

				<div className="flex w-full max-w-[720px] flex-col items-center gap-6">
					<div className="flex w-full flex-col items-center gap-4 rounded-lg border-4 border-dashed border-[#94D3FF] bg-[#47B8FF] p-6 text-center font-mono text-black">
						{link ? (
							<>
								<h2 className="text-[30px] font-bold leading-[45px]">
									Táqui o zap
								</h2>
								<p className="text-xl font-semibold leading-7">
									Pronto pra falar com {sanitizedPhone}.
								</p>
								<label htmlFor="zap-link" className="sr-only">
									Link do WhatsApp
								</label>
								<input
									id="zap-link"
									type="text"
									readOnly
									value={link}
									className="h-[60px] w-full rounded-lg border-[3px] border-black bg-white p-4 font-mono text-xl leading-7 text-black shadow-[3px_3px_0_#000000] focus:outline-none"
								/>
							</>
						) : (
							<>
								<h2 className="text-[30px] font-bold leading-[45px]">
									Calma aí!
								</h2>
								<p className="text-xl font-semibold leading-7">
									Que o zap já abre.
								</p>
							</>
						)}
					</div>

					{link && (
						<div className="flex w-full flex-col gap-6 sm:flex-row">
							<button
								type="button"
								onClick={() => void copyLink()}
								className="flex h-[60px] w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-[#FFF129] px-[14px] py-3 font-mono text-2xl font-bold leading-9 text-black sm:w-[50%]"
							>
								<CopyIcon className="h-7 w-7" weight="bold" />
								Copiar link
							</button>

							<a
								href={link}
								target="_blank"
								rel="noreferrer"
								className="flex h-[60px] w-full items-center justify-center gap-2 rounded-lg border-[3px] border-black bg-white px-[14px] py-3 font-mono text-2xl font-bold leading-9 text-black shadow-[2px_2px_0_#000000] sm:w-[50%]"
							>
								<ArrowSquareOutIcon className="h-7 w-7" weight="bold" />
								Abrir de novo
							</a>
						</div>
					)}
				</div>
			</div>
		</PageShell>
	);
}
