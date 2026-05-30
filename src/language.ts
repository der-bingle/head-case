let obsidianLanguage: string | null | undefined;

try {
	obsidianLanguage = self.localStorage.getItem("language");
} catch {
	obsidianLanguage = undefined;
}

export const getLanguage = (): string | undefined => {
	let language = obsidianLanguage;

	try {
		language ||= self.navigator.language;
	} catch {
		return language || undefined;
	}

	return language || undefined;
};

