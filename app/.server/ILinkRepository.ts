import { Link } from './Link';

export interface ILinkRepository {
    save(link: Link): Promise<void>;
    load(key: string): Promise<Link>;
}