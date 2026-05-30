import { strict as assert } from "node:assert";
import test from "node:test";
import { toSentenceCase, toTitleCase } from "../src/title-case";

const locale = "en-US";

test("uses Chicago-ish title case for common small words", () => {
	assert.equal(toTitleCase("the wind in the willows", { locale }), "The Wind in the Willows");
	assert.equal(toTitleCase("a tale of two cities", { locale }), "A Tale of Two Cities");
	assert.equal(toTitleCase("what we talk about when we talk about love", { locale }), "What We Talk About When We Talk About Love");
});

test("capitalizes small words after major punctuation", () => {
	assert.equal(toTitleCase("mercy in weakness: hope for sinners", { locale }), "Mercy in Weakness: Hope for Sinners");
	assert.equal(toTitleCase("law and gospel - notes for pastors", { locale }), "Law and Gospel - Notes for Pastors");
});

test("preserves acronyms, roman numerals, and mixed case words", () => {
	assert.equal(toTitleCase("using API keys in iCloud sync part ii", { locale }), "Using API Keys in iCloud Sync Part II");
});

test("keeps inline code unchanged", () => {
	assert.equal(toTitleCase("using `toTitleCase` in headings", { locale }), "Using `toTitleCase` in Headings");
});

test("title-cases wikilink aliases without changing targets", () => {
	assert.equal(
		toTitleCase("[[Bible/CSB/Romans 8#1|there is now no condemnation]]", { locale }),
		"[[Bible/CSB/Romans 8#1|There Is Now No Condemnation]]"
	);
});

test("sentence case lowercases then starts sentences", () => {
	assert.equal(toSentenceCase("THIS IS LOUD. SO IS THIS.", { locale }), "This is loud. So is this.");
});

