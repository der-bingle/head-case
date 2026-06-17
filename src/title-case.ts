import { SMALL_WORDS, titleCase as titleCaseText } from "title-case";

export type TitleCaseStyle = "chicago";

export interface TitleCaseOptions {
  acronyms?: ReadonlySet<string> | readonly string[];
  locale?: string;
  style?: TitleCaseStyle;
}

interface NormalizeOptions {
  acronyms: ReadonlySet<string>;
  locale?: string;
}

const DEFAULT_ACRONYMS = new Set([
  "AI",
  "API",
  "CSS",
  "HTML",
  "HTTP",
  "HTTPS",
  "JSON",
  "LLM",
  "OCR",
  "PDF",
  "SQL",
  "UI",
  "URL",
  "UX",
  "XML",
  "YAML",
]);
const WIKILINK_RE = /!?\[\[([^\]]*?)\]\]/gu;
const MARKDOWN_LINE_PREFIX_RE =
  /^((?:\s{0,3}>\s?)*\s{0,3}(?:#{1,6}\s+|(?:[-*+]|\d+[.)])\s+)?)(.+)$/u;
const CALLOUT_PREFIX_RE = /^((?:\s{0,3}>\s?)+\[![^\]]+\][+-]?\s*)(.*)$/u;
const IS_MANUAL_CASE = /\p{Ll}(?=[\p{Lu}])/u;
const WORD_RE = /[\p{L}\p{N}]+/gu;

const isShouting = (text: string, locale?: string): boolean => {
  const letters = [...text.matchAll(/\p{L}/gu)].map((match) => match[0]);

  if (letters.length === 0) {
    return false;
  }

  const upperCount = letters.filter(
    (letter) => letter === letter.toLocaleUpperCase(locale),
  ).length;
  return upperCount / letters.length >= 0.8;
};

const normalizeWordForTitleCase = (
  word: string,
  shouting: boolean,
  options: NormalizeOptions,
): string => {
  const upper = word.toLocaleUpperCase(options.locale);

  if (IS_MANUAL_CASE.test(word)) {
    return word;
  }

  const lower = word.toLocaleLowerCase(options.locale);

  if (options.acronyms.has(upper)) {
    return upper;
  }

  if (shouting) {
    return lower;
  }

  if (
    word === upper &&
    /\p{L}/u.test(word) &&
    !SMALL_WORDS.has(lower)
  ) {
    return word;
  }

  return lower;
};

const normalizeAcronyms = (
  acronyms: TitleCaseOptions["acronyms"],
): ReadonlySet<string> =>
  new Set([
    ...DEFAULT_ACRONYMS,
    ...(acronyms
      ? Array.from(acronyms).map((acronym) => acronym.toLocaleUpperCase())
      : []),
  ]);

const normalizeForTitleCase = (
  text: string,
  options: TitleCaseOptions,
): string => {
  const shouting = isShouting(text, options.locale);
  const normalizeOptions = {
    acronyms: normalizeAcronyms(options.acronyms),
    locale: options.locale,
  };

  return text.replace(/\S+/gu, (token) =>
    token.replace(WORD_RE, (word) =>
      normalizeWordForTitleCase(word, shouting, normalizeOptions),
    ),
  );
};

const titleCasePlainText = (text: string, options: TitleCaseOptions): string =>
  titleCaseText(normalizeForTitleCase(text, options), {
    locale: options.locale,
  });

const transformMarkdownLineText = (
  text: string,
  transform: (text: string) => string,
): string => {
  const calloutMatch = CALLOUT_PREFIX_RE.exec(text);

  if (calloutMatch) {
    const [, calloutMarker, calloutTitle] = calloutMatch;
    return `${calloutMarker}${transform(calloutTitle)}`;
  }

  const match = MARKDOWN_LINE_PREFIX_RE.exec(text);

  if (!match) {
    return transform(text);
  }

  const [, linePrefix, lineText] = match;
  return `${linePrefix}${transform(lineText)}`;
};

const splitWikilinkBody = (
  body: string,
): { target: string; alias?: string } => {
  const aliasSeparatorIndex = body.indexOf("|");

  if (aliasSeparatorIndex === -1) {
    return { target: body };
  }

  return {
    alias: body.slice(aliasSeparatorIndex + 1),
    target: body.slice(0, aliasSeparatorIndex),
  };
};

const titleCaseWikilink = (
  linkText: string,
  body: string,
  options: TitleCaseOptions,
): string => {
  const { target, alias } = splitWikilinkBody(body);

  if (alias === undefined) {
    return linkText;
  }

  const embedPrefix = linkText.startsWith("!") ? "!" : "";
  return `${embedPrefix}[[${target}|${titleCasePlainText(alias, options)}]]`;
};

const titleCaseMarkdownLinks = (
  text: string,
  options: TitleCaseOptions,
): string => {
  const links: string[] = [];
  let cursor = 0;
  let textWithLinkPlaceholders = "";

  for (const match of text.matchAll(WIKILINK_RE)) {
    const [linkText, body] = match;
    const linkIndex = match.index ?? 0;
    const placeholder = `\uE010${links.length}\uE011`;

    textWithLinkPlaceholders += text.slice(cursor, linkIndex);
    textWithLinkPlaceholders += placeholder;
    links.push(titleCaseWikilink(linkText, body, options));
    cursor = linkIndex + linkText.length;
  }

  if (links.length === 0) {
    return titleCasePlainText(text, options);
  }

  textWithLinkPlaceholders += text.slice(cursor);

  return links.reduce(
    (restored, link, index) =>
      restored.replace(`\uE010${index}\uE011`, link),
    titleCasePlainText(textWithLinkPlaceholders, options),
  );
};

const protectCodeSpans = (
  text: string,
): [text: string, restore: (value: string) => string] => {
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
          restored.replace(
            `\uE000${String.fromCharCode(0xe100 + index)}\uE001`,
            codeSpan,
          ),
        value,
      ),
  ];
};

export const toTitleCase = (
  text: string,
  options: TitleCaseOptions = {},
): string => {
  const [protectedText, restoreCodeSpans] = protectCodeSpans(text);
  return restoreCodeSpans(
    transformMarkdownLineText(protectedText, (lineText) =>
      titleCaseMarkdownLinks(lineText, { style: "chicago", ...options }),
    ),
  );
};

export const toSentenceCase = (
  text: string,
  options: Pick<TitleCaseOptions, "locale"> = {},
): string => {
  const locale = options.locale;
  return transformMarkdownLineText(text, (lineText) => {
    const lower = lineText.toLocaleLowerCase(locale);
    return lower.replace(/(^\s*[\p{L}]|[.!?]\s+[\p{L}])/gu, (match) =>
      match.toLocaleUpperCase(locale),
    );
  });
};
