import { toSentenceCase, toTitleCase } from "./title-case";

export type CommandFn = (text: string, options?: { locale?: string }) => string;

export interface HeadCaseCommand {
	id: string;
	name: string;
	fn: CommandFn;
}

export const commands: HeadCaseCommand[] = [
	{
		id: "title-case",
		name: "Title Case",
		fn: toTitleCase,
	},
	{
		id: "sentence-case",
		name: "Sentence case",
		fn: toSentenceCase,
	},
	{
		id: "lower-case",
		name: "lower case",
		fn: (text, options) => text.toLocaleLowerCase(options?.locale),
	},
	{
		id: "upper-case",
		name: "UPPER CASE",
		fn: (text, options) => text.toLocaleUpperCase(options?.locale),
	},
];

