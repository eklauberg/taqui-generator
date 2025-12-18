import { useMemo, useState } from "react";
import type { MetaFunction } from "react-router";
import {
	FileTextIcon,
	TextAaIcon,
	TextAlignLeftIcon,
	TextTIcon,
	TwitterLogoIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { PageShell } from "../../components/PageShell";

const TWEET_LIMIT = 280;

export const textaoMeta: MetaFunction = () => {
	return [
		{ title: "Táqui Teu Textão" },
		{
			name: "description",
			content:
				"Cole um texto e veja quantos caracteres, palavras e linhas ele tem.",
		},
	];
};

function countWords(text: string) {
	const trimmed = text.trim();
	if (trimmed.length === 0) return 0;
	return trimmed.split(/\s+/).filter(Boolean).length;
}

function countLines(text: string) {
	const trimmed = text.trim();
	if (trimmed.length === 0) return 0;
	return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").length;
}

function getTag(characters: number) {
	switch (true) {
		case (characters > 0 && characters <= 280):
			return {
				label: "Tweet Tímido",
				background: "#47B8FF",
				Icon: TwitterLogoIcon,
				shadowClass: "shadow-[2px_2px_0_#000000]",
			};
		case (characters > 280 && characters <= 1000):
			return {
				label: "Textão Padrão",
				background: "#FFE500",
				Icon: TextTIcon,
				shadowClass: "shadow-[2px_2px_0_#000000]",
			};
		case (characters > 1000 && characters <= 3000):
			return {
				label: "Redação do Enem",
				background: "#FF9F29",
				Icon: FileTextIcon,

				shadowClass: "shadow-[2px_2px_0_#000000]",
			};
		case (characters > 3000):
			return {
				label: "Passou de 2 linhas não leio",
				background: "#FF4D4D",
				Icon: FileTextIcon,
				shadowClass: "",
			};
		default:
			return {};
	}
}

type StatCardProps = {
	label: string;
	value: number;
	Icon: typeof TextTIcon;
};

function StatCard({ label, value, Icon }: StatCardProps) {
	return (
		<div className="flex h-[123px] flex-col items-start justify-between rounded-lg border-2 border-black bg-white p-6 font-mono text-black shadow-[4px_4px_0_#000000]">
			<div className="flex w-full items-center gap-4">
				<div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-[#FFF129] shadow-[2px_2px_0_#000000]">
					<Icon className="h-6 w-6 text-black" />
				</div>
				<p className="text-[38px] font-bold leading-[49px]">{value}</p>
			</div>

			<p className="text-[18px] leading-[26px]">{label}</p>
		</div>
	);
}

export function TextaoPage() {
	const [text, setText] = useState("");

	const stats = useMemo(() => {
		return {
			characters: text.length,
			words: countWords(text),
			lines: countLines(text),
		};
	}, [text]);

	const tag = useMemo(() => getTag(stats.characters), [stats.characters]);

	return (
		<PageShell showLogo containerClassName="max-w-[1200px] gap-12">
			<div className="flex w-full flex-col items-center">
				<div className="flex w-full max-w-[700px] flex-col items-center gap-6">
					<div className="relative w-full">
						<textarea
							value={text}
							onChange={(event) => setText(event.target.value)}
							placeholder="Cole seu textão aqui..."
							className="h-[320px] w-full resize-y rounded border-2 border-black bg-white p-4 font-mono text-2xl leading-7 text-black shadow-[4px_4px_0_#000000] placeholder:text-[#B1B1B1] focus:outline-none"
						/>
						{tag.Icon ?
							<div
								className={`absolute right-[-8px] top-[-12px] z-10 flex h-[24px] items-center justify-center gap-1.5 rounded-[50px] border border-black px-2 py-1 font-mono text-xs font-semibold leading-4 text-black ${tag.shadowClass}`}
								style={{ background: tag.background }}
							>
								<tag.Icon className="h-4 w-4" />
								<span className="whitespace-nowrap">{tag.label}</span>
							</div>
							: null}
					</div>

					<div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
						<StatCard label="Caracteres" value={stats.characters} Icon={TextTIcon} />
						<StatCard label="Palavras" value={stats.words} Icon={TextAaIcon} />
						<StatCard label="Linhas" value={stats.lines} Icon={TextAlignLeftIcon} />
					</div>
				</div>
			</div>
		</PageShell>
	);
}

