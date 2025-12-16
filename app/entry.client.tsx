import { startTransition, StrictMode } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

function renderClient() {
	createRoot(document).render(
		<StrictMode>
			<HydratedRouter />
		</StrictMode>,
	);
}

function hasQueryParam(name: string) {
	try {
		return new URLSearchParams(window.location.search).has(name);
	} catch {
		return false;
	}
}

function isHydrationMismatch(error: unknown) {
	if (!(error instanceof Error)) return false;
	return error.message.includes("#418") || error.message.includes("Hydration");
}

startTransition(() => {
	if (hasQueryParam("csr")) {
		console.warn("[taqui] CSR mode enabled via ?csr=1 (SSR hydration skipped).");
		renderClient();
		return;
	}

	let root: Root | null = null;
	let didFallback = false;

	const fallbackToClient = (reason: unknown) => {
		if (didFallback) return;
		didFallback = true;
		console.error("[taqui] Falling back to client render:", reason);

		const schedule =
			typeof queueMicrotask === "function"
				? queueMicrotask
				: (cb: () => void) => void Promise.resolve().then(cb);

		schedule(() => {
			try {
				root?.unmount();
			} catch (_) {
				// ignore
			}
			renderClient();
		});
	};

	root = hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter />
		</StrictMode>,
		{
			onRecoverableError(error, errorInfo) {
				console.error("[taqui] Recoverable error:", error, errorInfo);
				if (isHydrationMismatch(error)) {
					fallbackToClient(error);
				}
			},
			onUncaughtError(error, errorInfo) {
				console.error("[taqui] Uncaught error:", error, errorInfo);
				if (isHydrationMismatch(error)) {
					fallbackToClient(error);
				}
			},
		},
	);
});

