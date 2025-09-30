/**
 * Generic repository interface that defines common CRUD operations
 * @template T - The entity type
 */
export interface IRepository<T> {
  save(item: T): Promise<T>;
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  getList(params: {
    index: string;
    pageSize: number;
    order?: string;
    filter?: Partial<T>;
  }): Promise<{ index: string | null; items: T[] }>;
  delete(id: string): Promise<{ id: string }>;
  update(id: string, updateParams: Partial<T>): Promise<{
    id: string;
    updateParams: Partial<T>;
    updated: boolean;
  }>;
}
