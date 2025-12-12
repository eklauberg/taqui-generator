import { promises as fs } from 'fs';
import path from 'path';
import { ILinkRepository } from './ILinkRepository';
import { Link } from './Link';

export class JsonFileLinkRepository implements ILinkRepository {
  private readonly FILE_PATH = path.join(process.cwd(), 'links.json');

  async save(link: Link): Promise<void> {
    const links = await this.readFile();
    links[link.key] = link;
    await this.writeFile(links);
  }

  async load(key: string): Promise<Link> {
    const links = await this.readFile();
    const link = links[key];

    if (!link) {
      throw new Error(`Link com chave "${key}" não encontrado.`);
    }

    return link;
  }

  private async readFile(): Promise<Record<string, Link>> {
    try {
      const data = await fs.readFile(this.FILE_PATH, 'utf-8');
      return JSON.parse(data) as Record<string, Link>;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return {};
      }
      throw err;
    }
  }

  private async writeFile(links: Record<string, Link>): Promise<void> {
    const data = JSON.stringify(links, null, 2);
    await fs.writeFile(this.FILE_PATH, data, 'utf-8');
  }

}

