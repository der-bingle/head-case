export type TitleCaseStyle = "chicago";

export interface TitleCaseOptions {
	locale?: string;
	style?: TitleCaseStyle;
}

const SMALL_WORDS = new Set([
	"a",
	"an",
	"and",
	"as",
	"at",
	"but",
	"by",
	"for",
	"if",
	"in",
	"nor",
	"of",
	"on",
	"or",
	"per",
	"so",
	"the",
	"to",
	"up",
	"via",
	"yet",
]);

const ROMAN_NUMERAL_RE = /^(?=[mdclxvi]+$)m{0,4}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/i;
const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu;
const MARKDOWN_LINK_RE = /^(!?\[\[?)(.*?)(\]\]?)(.*)$/u;

const isSmallWord = (word: string): boolean => SMALL_WORDS.has(word.toLocaleLowerCase("en-US"));
const isAllCaps = (word: string): boolean => /[A-Z]/u.test(word) && word === word.toLocaleUpperCase("en-US");
const hasInternalCapital = (word: string): boolean => /[\p{Ll}][\p{Lu}]/u.test(word);
const isRomanNumeral = (word: string): boolean => ROMAN_NUMERAL_RE.test(word);
const startsNewMajorPhrase = (previousText: string): boolean => /(?:^|[:;.!?]\s*|[-–—]\s*)$/u.test(previousText);

const capitalize = (locale: string | undefined, word: string): string => {
	const [first = "", ...rest] = Array.from(word);
	return `${first.toLocaleUpperCase(locale)}${rest.join("").toLocaleLowerCase(locale)}`;
};

const splitWordParts = (word: string): string[] => word.split(/([-/])/u);

const titleCaseWord = (
	options: TitleCaseOptions,
	text: string,
	word: string,
	index: number,
	words: RegExpMatchArray[]
): string => {
	const locale = options.locale;
	const lowerWord = word.toLocaleLowerCase(locale);
	const isFirst = index === 0;
	const isLast = index === words.length - 1;
	const previousText = index === 0 ? "" : text.slice(0, words[index].index ?? 0);
	const forceCap = isFirst || isLast || startsNewMajorPhrase(previousText);

	if (isRomanNumeral(word)) {
		return word.toLocaleUpperCase(locale);
	}

	if (isAllCaps(word) || hasInternalCapital(word)) {
		return word;
	}

	if (!forceCap && isSmallWord(lowerWord)) {
		return lowerWord;
	}

	return splitWordParts(word)
		.map((part) => (part === "-" || part === "/" ? part : capitalize(locale, part)))
		.join("");
};

const titleCasePlainText = (text: string, options: TitleCaseOptions): string => {
	const words = Array.from(text.matchAll(WORD_RE));

	if (words.length === 0) {
		return text;
	}

	let output = "";
	let cursor = 0;

	words.forEach((match, index) => {
		const start = match.index ?? cursor;
		const word = match[0];
		output += text.slice(cursor, start);
		output += titleCaseWord(options, text, word, index, words);
		cursor = start + word.length;
	});

	return output + text.slice(cursor);
};

const titleCaseMarkdownLink = (text: string, options: TitleCaseOptions): string => {
	const match = MARKDOWN_LINK_RE.exec(text);

	if (!match) {
		return titleCasePlainText(text, options);
	}

	const [, opener, body, closer, rest] = match;
	const [target, alias] = body.split("|");

	if (!alias) {
		return `${opener}${target}${closer}${titleCasePlainText(rest, options)}`;
	}

	return `${opener}${target}|${titleCasePlainText(alias, options)}${closer}${titleCasePlainText(rest, options)}`;
};

const protectCodeSpans = (text: string): [text: string, restore: (value: string) => string] => {
	const codeSpans: string[] = [];
	const protectedText = text.replace(/`[^`]*`/gu, (codeSpan) => {
		const index = codeSpans.push(codeSpan) - 1;
		return `\uE000${String.fromCharCode(0xe100 + index)}\uE001`;
	});

	return [
		protectedText,
		(value: string): string =>
			codeSpans.reduce(
				(restored, codeSpan, index) =>
					restored.replace(`\uE000${String.fromCharCode(0xe100 + index)}\uE001`, codeSpan),
				value
			),
	];
};

export const toTitleCase = (text: string, options: TitleCaseOptions = {}): string => {
	const [protectedText, restoreCodeSpans] = protectCodeSpans(text);
	return restoreCodeSpans(titleCaseMarkdownLink(protectedText, { style: "chicago", ...options }));
};

export const toSentenceCase = (text: string, options: Pick<TitleCaseOptions, "locale"> = {}): string => {
	const locale = options.locale;
	const lower = text.toLocaleLowerCase(locale);
	return lower.replace(/(^\s*[\p{L}]|[.!?]\s+[\p{L}])/gu, (match) => match.toLocaleUpperCase(locale));
};
