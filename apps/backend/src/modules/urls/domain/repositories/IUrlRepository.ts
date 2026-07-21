import { UrlRecord } from "../entities/Url";

export interface IUrlRepository {
  create(data: { id?: string; title: string; url: string; createdBy: string | null }): Promise<UrlRecord>;
  list(): Promise<UrlRecord[]>;
  remove(id: string): Promise<void>;
}
