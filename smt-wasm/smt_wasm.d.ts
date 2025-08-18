/* tslint:disable */
/* eslint-disable */
export function hash_data(d: any): string;
export function verify_proof(root: string, proof: string, leaves: any): boolean;
export class CkbSmt {
  free(): void;
  constructor();
  root(): string;
  update(key: string, val: string): void;
  get_proof(keys: string[]): string;
}
