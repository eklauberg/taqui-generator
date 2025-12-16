import { useEffect, useRef } from "react";
import { PageShell } from "../../components/PageShell";
import { useLoaderData } from "react-router";

const ADSENSE_SCRIPT_ID = "taqui-adsense";

type AdLoaderData = {
	adsenseClient: string;
	adsenseSlot: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdPage() {
  const insRef = useRef<HTMLModElement | null>(null);
  const { adsenseClient, adsenseSlot } = useLoaderData() as AdLoaderData;

  useEffect(() => {
    let script = document.getElementById(ADSENSE_SCRIPT_ID) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = ADSENSE_SCRIPT_ID;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    const pushAd = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
      }
    };

    if (script.getAttribute("data-loaded") === "true") {
      pushAd();
      return;
    }

    const onLoad = () => {
      script?.setAttribute("data-loaded", "true");
      pushAd();
    };

    script.addEventListener("load", onLoad);
    return () => script.removeEventListener("load", onLoad);
  }, []);

  return (
    <PageShell showLogo containerClassName="max-w-[1200px] gap-12">
      <div className="flex w-full flex-col items-center gap-10">
        <div className="w-full max-w-[540px] rounded-lg border-[3px] border-black bg-white p-6 font-mono text-black shadow-[4px_4px_0_#000000]">
          <h1 className="text-2xl font-bold leading-9">Táqui o anúncio</h1>
          <p className="mt-2 text-sm leading-6 text-black/80">
            Se ele não aparecer, pode ser bloqueio do navegador/adblock.
          </p>

          <ins
            ref={insRef}
            className="adsbygoogle"
            style={{ display: "inline-block", width: 480, height: 600 }}
            data-ad-client={adsenseClient}
            data-ad-slot={adsenseSlot}
          />
        </div>
      </div>
    </PageShell>
  );
}
