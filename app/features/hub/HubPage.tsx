import type { MetaFunction } from "react-router";
import { Confetti, Flask, Globe, LinkSimple, Sticker } from "@phosphor-icons/react";
import { PageShell } from "../../components/PageShell";

type HubCardProps = {
	title: string;
	description: string;
	href: string;
	badge?: string;
	icon: "sticker" | "globe" | "link";
};

type HubStatProps = {
	label: string;
	value: string;
	detail: string;
};

const hubCards: HubCardProps[] = [
	{
		title: "Taqui teu texto",
		description:
			"Use o gerador oficial para criar o meme “Tá aqui” com qualquer frase e copiar rapidinho.",
		href: "/generator",
		badge: "Disponível",
		icon: "sticker",
	},
	{
		title: "Meu IP",
		description:
			"Veja seu IP público em texto e também como uma imagem pronta no estilo Táqui.",
		href: "/ip",
		badge: "Novo",
		icon: "globe",
	},
	{
		title: "Encurtador de links",
		description:
			"Experimento para gerar links curtos que redirecionam.",
		href: "/link",
		badge: "Beta",
		icon: "link",
	},
];

export const hubMeta: MetaFunction = () => {
	return [
		{ title: "Táqui Hub" },
		{
			name: "description",
			content: "Centralize o acesso às páginas do projeto Táqui.",
		},
	];
};

export function HubPage() {
	return (
		<PageShell
			containerClassName="max-w-[1200px] gap-12"
		>
			<div className="grid w-full gap-4 md:grid-cols-2">
				{hubCards.map((card) => (
					<HubCard key={card.href} {...card} />
				))}
			</div>
		</PageShell>
	);
}

function HubCard({ title, description, href, badge, icon }: HubCardProps) {
	const badgeConfig = getHubBadgeConfig(badge);

	return (
		<a
			href={href}
			className="flex min-h-[150px] w-full gap-6 rounded-lg border-2 border-black bg-white p-4 text-left text-black no-underline shadow-[2px_2px_0_#000000] transition-transform duration-200 hover:-translate-x-[1px] hover:-translate-y-[1px] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50 md:min-h-[152px] md:p-6"
		>
			<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-[#FFF129] shadow-[2px_2px_0_#000000] md:h-24 md:w-24">
				<HubCardIcon kind={icon} />
			</div>

			<div className="flex min-w-0 flex-1 flex-col justify-center gap-3.5 font-mono">
				<div className="flex items-start justify-between gap-3">
					<h2 className="text-base font-bold leading-6 md:text-2xl md:leading-9">
						{title}
					</h2>

					{badgeConfig && (
						<span
							className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black px-2 py-1 text-[10px] font-semibold leading-4 shadow-[2px_2px_0_#000000]"
							style={{ background: badgeConfig.background }}
						>
							<badgeConfig.Icon className="h-4 w-4" weight="bold" />
							{badgeConfig.label}
						</span>
					)}
				</div>

				<p className="text-xs leading-5 text-black/90 md:text-sm md:leading-[22px]">
					{description}
				</p>
			</div>
		</a>
	);
}

function HubCardIcon({ kind }: { kind: HubCardProps["icon"] }) {
	const className = "h-10 w-10 text-black md:h-14 md:w-14";

	switch (kind) {
		case "sticker":
			return <Sticker className={className} weight="bold" />;
		case "globe":
			return <Globe className={className} weight="bold" />;
		case "link":
			return <LinkSimple className={className} weight="bold" />;
	}
}

function getHubBadgeConfig(badge?: string) {
	if (!badge || badge === "Disponível") return null;

	if (badge === "Novo") {
		return { label: badge, background: "#FFF129", Icon: Confetti };
	}

	if (badge === "Beta") {
		return { label: badge, background: "#47B8FF", Icon: Flask };
	}

	return null;
}
