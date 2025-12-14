import { JsonFileLinkRepository } from "./JsonFileLinkRepository";

export function makeLinkRepository() {
	return new JsonFileLinkRepository();
}
