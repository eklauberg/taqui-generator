import { Database } from "bun:sqlite";
import type { ILinkRepository } from "./ILinkRepository";
import type { Link } from "./Link";

export class SqliteLinkRepository implements ILinkRepository {
	private readonly db: Database;

	constructor() {
		this.db = new Database("links.db");

		// Cria a tabela de links se ela não existir
		this.db.run(`
            CREATE TABLE IF NOT EXISTS links (
                key TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                contexto TEXT
            );
        `);
	}

	async save(link: Link): Promise<void> {
		this.db.run(
			"INSERT OR REPLACE INTO links (key, url, contexto) VALUES (?, ?, ?)",
			[link.key, link.url, link.contexto],
		);
	}

	async load(key: string): Promise<Link> {
		const row = this.db
			.query<Link, [string]>("SELECT * FROM links WHERE key = ?")
			.get(key);

		if (!row) {
			throw new Error(`Link com chave "${key}" não encontrado.`);
		}

		return {
			key: row.key as string,
			url: row.url as string,
			contexto: row.contexto as string,
		};
	}
}
