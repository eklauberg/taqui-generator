import { useEffect, useRef, useState } from "react";
import { useLoaderData, type MetaFunction } from "react-router";
import { PageShell } from "../../components/PageShell";

const ADSENSE_SCRIPT_ID = "taqui-adsense";

declare global {
	interface Window {
		adsbygoogle?: unknown[];
	}
}

type AdLoaderData = {
	adsenseClient: string;
	adsenseSlot: string;
};

export const adMeta: MetaFunction = () => {
	return [
		{ title: "Táqui o Anúncio" },
		{
			name: "description",
			content: "Veja um anúncio do Táqui Generator.",
		},
	];
};

function buildAdSenseScriptSrc(client: string) {
	const url = new URL("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
	url.searchParams.set("client", client);
	return url.toString();
}

function ensureAdSenseScriptLoaded(scriptSrc: string) {
	if (typeof document === "undefined") return;

	const existing = (document.getElementById(ADSENSE_SCRIPT_ID) ??
		document.querySelector(
			`script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`,
		)) as HTMLScriptElement | null;

	if (existing) return existing;

	const script = document.createElement("script");
	script.id = ADSENSE_SCRIPT_ID;
	script.async = true;
	script.src = scriptSrc;
	script.crossOrigin = "anonymous";
	document.head.appendChild(script);
	return script;
}

export function AdPage() {
	const { adsenseClient, adsenseSlot } = useLoaderData() as AdLoaderData;
	const insRef = useRef<HTMLModElement | null>(null);
	const [adError, setAdError] = useState<string | null>(null);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;
		setAdError(null);
		if (!adsenseClient || !adsenseSlot) {
			setAdError(
				"Configuração ausente. Defina TAQUI_ADSENSE_CLIENT e TAQUI_ADSENSE_SLOT no servidor.",
			);
			return;
		}

		const script = ensureAdSenseScriptLoaded(buildAdSenseScriptSrc(adsenseClient));

		const handleScriptError = () => {
			setAdError(
				"O anúncio não carregou. Seu navegador/adblock pode estar bloqueando o AdSense.",
			);
		};

		script?.addEventListener("error", handleScriptError);

		const timeout = setTimeout(() => {
			const element = insRef.current;
			if (!element) return;

			const status =
				element.getAttribute("data-ad-status") ??
				element.getAttribute("data-adsbygoogle-status");
			if (status === "filled" || status === "done") return;

			try {
				(window.adsbygoogle = window.adsbygoogle || []).push({});
			} catch (error) {
				console.error("Erro ao carregar anúncio:", error);
				setAdError(
					"O anúncio não carregou. Se você estiver com adblock, talvez ele esteja bloqueando.",
				);
			}
		}, 0);

		return () => {
			clearTimeout(timeout);
			script?.removeEventListener("error", handleScriptError);
		};
	}, [adsenseClient, adsenseSlot, mounted]);

	return (
		<PageShell showLogo containerClassName="max-w-[1200px] gap-12">
			<div className="flex w-full flex-col items-center gap-10">
				<div className="w-full max-w-[540px] rounded-lg border-[3px] border-black bg-white p-6 font-mono text-black shadow-[4px_4px_0_#000000]">
					<h1 className="text-2xl font-bold leading-9">Táqui o anúncio</h1>
					<p className="mt-2 text-sm leading-6 text-black/80">
						Se ele não aparecer, pode ser bloqueio do navegador/adblock.
					</p>

					<div className="mt-6 flex w-full justify-center overflow-x-auto">
						{mounted ? (
							<ins
								ref={insRef}
								className="adsbygoogle"
								style={{ display: "inline-block", width: 540, height: 450 }}
								data-ad-client={adsenseClient}
								data-ad-slot={adsenseSlot}
							/>
						) : (
							<div className="flex h-[450px] w-[540px] max-w-full items-center justify-center rounded-lg border-2 border-black bg-[#47B8FF] px-6 text-center text-sm leading-6 text-black shadow-[4px_4px_0_#000000]">
								Carregando anúncio…
							</div>
						)}
					</div>

					{adError && (
						<p className="mt-4 rounded-lg border-2 border-black bg-[#FF9F29] p-3 text-sm leading-6 shadow-[2px_2px_0_#000000]">
							{adError}
						</p>
					)}
				</div>
			</div>
		</PageShell>
	);
}
