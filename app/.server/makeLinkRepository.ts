import { SqliteLinkRepository } from "./SqliteLinkRepository";

export function makeLinkRepository() {
    return new SqliteLinkRepository()
}