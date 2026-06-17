import { strict as assert } from "node:assert";
import test from "node:test";
import { toSentenceCase, toTitleCase } from "../src/title-case";

const locale = "en-US";

test("uses title-case library rules for common small words", () => {
  assert.equal(
    toTitleCase("the wind in the willows", { locale }),
    "The Wind in the Willows",
  );
  assert.equal(
    toTitleCase("a tale of two cities", { locale }),
    "A Tale of Two Cities",
  );
  assert.equal(
    toTitleCase("what we talk about when we talk about love", { locale }),
    "What We Talk About when We Talk About Love",
  );
});

test("capitalizes small words after major punctuation", () => {
  assert.equal(
    toTitleCase("mercy in weakness: hope for sinners", { locale }),
    "Mercy in Weakness: Hope for Sinners",
  );
  assert.equal(
    toTitleCase("law and gospel - notes for pastors", { locale }),
    "Law and Gospel - Notes for Pastors",
  );
});

test("preserves acronyms and mixed case words", () => {
  assert.equal(
    toTitleCase("using API keys in iCloud sync", { locale }),
    "Using API Keys in iCloud Sync",
  );
});

test("title-cases all-caps selections", () => {
  assert.equal(toTitleCase("HERE AND NOW", { locale }), "Here and Now");
  assert.equal(
    toTitleCase("THE WIND IN THE WILLOWS", { locale }),
    "The Wind in the Willows",
  );
});

test("fixes incorrectly capitalized small words", () => {
  assert.equal(toTitleCase("Here And Now", { locale }), "Here and Now");
  assert.equal(
    toTitleCase("A Tale Of Two Cities", { locale }),
    "A Tale of Two Cities",
  );
});

test("keeps inline code unchanged", () => {
  assert.equal(
    toTitleCase("using `toTitleCase` in headings", { locale }),
    "Using `toTitleCase` in Headings",
  );
});

test("title-cases heading text after markdown heading markers", () => {
  assert.equal(
    toTitleCase("## the wind in the willows", { locale }),
    "## The Wind in the Willows",
  );
  assert.equal(
    toTitleCase("### a tale of two cities", { locale }),
    "### A Tale of Two Cities",
  );
});

test("title-cases prose after markdown line prefixes", () => {
  assert.equal(
    toTitleCase("> the first paragraph has words in it", { locale }),
    "> The First Paragraph Has Words in It",
  );
  assert.equal(
    toTitleCase("> - a nested list item with a small word in the middle", {
      locale,
    }),
    "> - A Nested List Item with a Small Word in the Middle",
  );
  assert.equal(
    toTitleCase("- the wind in the willows", { locale }),
    "- The Wind in the Willows",
  );
});

test("title-cases callout titles while preserving callout markers", () => {
  assert.equal(
    toTitleCase(
      "> [!warning] callout title with small words after punctuation",
      { locale },
    ),
    "> [!warning] Callout Title with Small Words After Punctuation",
  );
});

test("title-cases wikilink aliases without changing targets", () => {
  assert.equal(
    toTitleCase("[[Bible/CSB/Romans 8#1|there is now no condemnation]]", {
      locale,
    }),
    "[[Bible/CSB/Romans 8#1|There Is Now No Condemnation]]",
  );
});

test("title-cases wikilink aliases after markdown heading markers", () => {
  assert.equal(
    toTitleCase("## [[Bible/CSB/Romans 8#1|there is now no condemnation]]", {
      locale,
    }),
    "## [[Bible/CSB/Romans 8#1|There Is Now No Condemnation]]",
  );
});

test("sentence case lowercases then starts sentences", () => {
  assert.equal(
    toSentenceCase("THIS IS LOUD. SO IS THIS.", { locale }),
    "This is loud. So is this.",
  );
});

test("sentence-cases heading text after markdown heading markers", () => {
  assert.equal(
    toSentenceCase("## THIS IS LOUD. SO IS THIS.", { locale }),
    "## This is loud. So is this.",
  );
});

test("sentence-cases prose after markdown line prefixes", () => {
  assert.equal(
    toSentenceCase("> THIS IS LOUD. SO IS THIS.", { locale }),
    "> This is loud. So is this.",
  );
  assert.equal(
    toSentenceCase("- THIS IS LOUD. SO IS THIS.", { locale }),
    "- This is loud. So is this.",
  );
});
