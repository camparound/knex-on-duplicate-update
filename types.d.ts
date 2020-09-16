import { QueryBuilder as KnexQB } from 'knex';

declare module 'knex' {
  interface QueryBuilder {
    onDuplicateUpdate(uniqueCol: string, ...columnNames: Array<{ [key: string]: string } | string>): KnexQB;
  }
}

export function attachOnDuplicateUpdate(): void;
