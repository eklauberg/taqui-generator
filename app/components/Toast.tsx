import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ComponentType,
	type ReactNode,
} from "react";
import { ConfettiIcon, SkullIcon, XIcon } from "@phosphor-icons/react";

export type ToastIconComponent = ComponentType<{
	className?: string;
	weight?: any;
}>;

export type ToastPreset = {
	color: string;
	icon: ToastIconComponent;
};

export type ToastOptions = ToastPreset & {
	title: string;
	message: string;
	durationMs?: number;
};

export const taquiToastPresets = {
	success: { color: "#00FF55", icon: ConfettiIcon },
	error: { color: "#FF4D4D", icon: SkullIcon },
} satisfies Record<string, ToastPreset>;

type Toast = ToastOptions & {
	id: string;
};

type ToastContextValue = {
	pushToast: (options: ToastOptions) => string;
	dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

function createToastId() {
	toastCounter = (toastCounter + 1) % 1_000_000;
	return `toast_${Date.now().toString(36)}_${toastCounter.toString(36)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);
	const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	const dismissToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
		const timeout = timeoutsRef.current.get(id);
		if (timeout) {
			clearTimeout(timeout);
			timeoutsRef.current.delete(id);
		}
	}, []);

	const pushToast = useCallback(
		(options: ToastOptions) => {
			const id = createToastId();
			setToasts((prev) => [...prev, { id, ...options }].slice(-3));

			const durationMs = options.durationMs ?? 4000;
			if (durationMs > 0) {
				const timeout = setTimeout(() => dismissToast(id), durationMs);
				timeoutsRef.current.set(id, timeout);
			}

			return id;
		},
		[dismissToast],
	);

	useEffect(() => {
		return () => {
			for (const timeout of timeoutsRef.current.values()) {
				clearTimeout(timeout);
			}
			timeoutsRef.current.clear();
		};
	}, []);

	const value = useMemo(
		() => ({ pushToast, dismissToast }),
		[pushToast, dismissToast],
	);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<ToastViewport toasts={toasts} onDismiss={dismissToast} />
		</ToastContext.Provider>
	);
}

export type ToastController = {
	(options: ToastOptions): string;
	show: (options: ToastOptions) => string;
	dismiss: (id: string) => void;
};

export function useToast(): ToastController {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within <ToastProvider />");
	}

	const { pushToast, dismissToast } = context;

	return useMemo(() => {
		const toast = ((options: ToastOptions) => pushToast(options)) as ToastController;
		toast.show = (options: ToastOptions) => pushToast(options);
		toast.dismiss = dismissToast;
		return toast;
	}, [dismissToast, pushToast]);
}

function ToastViewport({
	toasts,
	onDismiss,
}: {
	toasts: Toast[];
	onDismiss: (id: string) => void;
}) {
	if (toasts.length === 0) return null;

	return (
		<div
			className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 p-6"
			aria-live="polite"
		>
			{toasts.map((toast) => {
				const Icon = toast.icon;
				return (
					<div
						key={toast.id}
						className="flex w-[500px] max-w-[calc(100vw-48px)] items-start gap-4 rounded-lg border-2 border-black p-4 shadow-[4px_4px_0_#000000]"
						style={{ backgroundColor: toast.color }}
					>
						<div className="flex h-9 w-9 items-center justify-center">
							<Icon className="h-9 w-9 text-black" weight="bold" />
						</div>

						<div className="flex min-w-0 flex-1 flex-col justify-center font-mono text-black">
							<p className="text-base font-bold leading-6">{toast.title}</p>
							<p className="text-base leading-6">{toast.message}</p>
						</div>

						<button
							type="button"
							onClick={() => onDismiss(toast.id)}
							className="flex h-6 w-6 items-center justify-center text-black"
							aria-label="Fechar"
						>
							<XIcon className="h-6 w-6" weight="bold" />
						</button>
					</div>
				);
			})}
		</div>
	);
}
