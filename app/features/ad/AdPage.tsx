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

function ensureAdSenseScriptLoaded(scriptSrc: string, parent: HTMLElement) {
	if (typeof document === "undefined") return;

	const existing = (document.getElementById(ADSENSE_SCRIPT_ID) ??
		document.querySelector(
			`script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`,
		)) as HTMLScriptElement | null;

	if (existing) {
		if (existing.id === ADSENSE_SCRIPT_ID && existing.parentElement !== parent) {
			parent.appendChild(existing);
		}
		return existing;
	}

	const script = document.createElement("script");
	script.id = ADSENSE_SCRIPT_ID;
	script.async = true;
	script.src = scriptSrc;
	script.crossOrigin = "anonymous";
	parent.appendChild(script);
	return script;
}

export function AdPage() {
	const { adsenseClient, adsenseSlot } = useLoaderData() as AdLoaderData;
	const adSlotRef = useRef<HTMLDivElement | null>(null);
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

		const adSlot = adSlotRef.current;
		if (!adSlot) return;

		if (adSlot.dataset.taquiAdsenseMounted === "true") return;
		adSlot.dataset.taquiAdsenseMounted = "true";

		const script = ensureAdSenseScriptLoaded(buildAdSenseScriptSrc(adsenseClient), adSlot);

		const handleScriptError = () => {
			setAdError(
				"O anúncio não carregou. Seu navegador/adblock pode estar bloqueando o AdSense.",
			);
		};

		script?.addEventListener("error", handleScriptError);

		// Renderiza exatamente o snippet recomendado pelo Google (client-side),
		// para evitar mismatch de hidratação no SSR.
		const comment = document.createComment(" taqui ");
		const ins = document.createElement("ins");
		ins.className = "adsbygoogle";
		ins.style.cssText = "display:inline-block;width:540px;height:450px";
		ins.setAttribute("data-ad-client", adsenseClient);
		ins.setAttribute("data-ad-slot", adsenseSlot);

		const pushScript = document.createElement("script");
		pushScript.text = "(adsbygoogle = window.adsbygoogle || []).push({});";

		adSlot.appendChild(comment);
		adSlot.appendChild(ins);
		adSlot.appendChild(pushScript);

		return () => {
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
							<div ref={adSlotRef} />
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
