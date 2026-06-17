import { SMALL_WORDS, titleCase as titleCaseText } from "title-case";

export type TitleCaseStyle = "chicago";

export interface TitleCaseOptions {
  locale?: string;
  style?: TitleCaseStyle;
}

const MARKDOWN_LINK_RE = /^(!?\[\[?)(.*?)(\]\]?)(.*)$/u;
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
  locale?: string,
): string => {
  if (IS_MANUAL_CASE.test(word)) {
    return word;
  }

  const lower = word.toLocaleLowerCase(locale);

  if (shouting) {
    return lower;
  }

  if (
    word === word.toLocaleUpperCase(locale) &&
    /\p{L}/u.test(word) &&
    !SMALL_WORDS.has(lower)
  ) {
    return word;
  }

  return lower;
};

const normalizeForTitleCase = (text: string, locale?: string): string => {
  const shouting = isShouting(text, locale);

  return text.replace(/\S+/gu, (token) =>
    token.replace(WORD_RE, (word) =>
      normalizeWordForTitleCase(word, shouting, locale),
    ),
  );
};

const titleCasePlainText = (text: string, options: TitleCaseOptions): string =>
  titleCaseText(normalizeForTitleCase(text, options.locale), {
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

const titleCaseMarkdownLink = (
  text: string,
  options: TitleCaseOptions,
): string => {
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
      titleCaseMarkdownLink(lineText, { style: "chicago", ...options }),
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
