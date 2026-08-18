import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
import type { Config as ConfigType } from './types.js';
export declare const name = "dsh-brave-search";
export declare const inject: string[];
export type { BraveService, BraveSearchArgs, BraveSearchError, JsonObject } from './types.js';
export interface Config extends ConfigType {
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map