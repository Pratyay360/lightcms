import type { Tabs } from "melt/builders";

export const TABS_CONTEXT_KEY = Symbol("tabs");

export type MeltTabs<T extends string = string> = Tabs<T>;
