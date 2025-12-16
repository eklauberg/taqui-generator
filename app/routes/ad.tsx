import { AdPage, adMeta } from "../features/ad/AdPage";
import type { Route } from "./+types/ad";

export const meta = adMeta;

export async function loader(_: Route.LoaderArgs) {
	return {
		adsenseClient: process.env.TAQUI_ADSENSE_CLIENT ?? "",
		adsenseSlot: process.env.TAQUI_ADSENSE_SLOT ?? "",
	};
}

export default function AdRoute() {
	return <AdPage />;
}
