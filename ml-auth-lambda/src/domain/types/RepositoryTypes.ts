/**
 * Generic repository constructor type
 * Represents a class constructor that returns an instance of type T
 */
export type RepositoryConstructor<T = any> = new () => T;
