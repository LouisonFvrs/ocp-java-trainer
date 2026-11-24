# Content contract

Each file in `js/data/` contributes course sections and questions to one exam topic of
**Oracle Certified Professional, Java SE 21 Developer (1Z0-830)**.
The file is a plain script (no modules) that calls `OCP.register` exactly once:

```js
OCP.register({
  topic: 'flow',            // topic id from js/registry.js
  course: [ /* sections */ ],
  questions: [ /* questions */ ]
});
```

Check a file with `node tools/validate.js js/data/<file>.js` (it must print `OK`).

## Languages

- Question text (`q`), options and code: **English**, in the style of the real exam.
- Course (`course`) and explanations (`explain`): **French**, with correct accents (é, è, à, ç…). Keep Java terms and API names in English.
- File encoding: UTF-8 without BOM.

## Strings

- Prose goes in ordinary double-quoted JS strings. Inside prose, `` `inline code` `` (backticks) and `**bold**` are rendered. No HTML.
- Java code goes in ``String.raw`...` `` template literals so that backslashes (`\n`, `\t`, `\\`) are kept verbatim. Code must not contain a backtick or `${`.
- Code starts right after the opening backtick (no leading blank line), 4-space indentation, lines of at most ~85 characters.

## Course sections

```js
{
  title: "Switch : instruction et expression",
  blocks: [
    { p: "Paragraphe d'explication avec `code` et **gras**." },
    { h: "Sous-titre" },
    { list: ["Point clé 1", "Point clé 2"] },
    { code: String.raw`int x = switch (day) {
    case 1, 7 -> 0;
    default -> 1;
};` },
    { table: { head: ["Forme", "Fall-through"], rows: [["`case X:`", "oui"], ["`case X ->`", "non"]] } },
    { trap: "Piège classique d'examen, formulé précisément." },
    { tip: "Astuce ou moyen mnémotechnique." }
  ]
}
```

Each block has exactly one key among `h`, `p`, `list`, `code`, `trap`, `tip`, `table`.
The course is a dense revision sheet, not a tutorial: rules, exact API signatures and behaviours,
tables for things to memorise, short code samples, and many `trap` blocks (what the exam tries to trick you with).
It must cover every exam objective of the topic well enough that someone who knows the sheet can answer the questions.

## Questions

```js
{
  id: "flow-001",              // <file name without .js>-NNN, numbered from 001
  difficulty: 2,               // 1 = direct knowledge, 2 = exam level, 3 = tricky / several rules combined
  q: "What is the result of executing the following code?",
  code: String.raw`...`,       // optional
  options: ["0", "1", "The code does not compile", "An exception is thrown at runtime"],
  answer: [2],                 // 0-based indexes of ALL correct options
  explain: "Explication en français : pourquoi la bonne réponse est juste ET pourquoi les distracteurs tentants sont faux, en citant la règle."
}
```

Rules:

- 4 to 7 options. Single-answer or multi-answer; a multi-answer question ends its `q` with `(Choose two.)` or `(Choose three.)` and lists as many indexes in `answer`.
- **Options are shuffled at display time**: never write "All of the above", "None of the above", "A and B", "Option C". "None of the other options" style is forbidden too. Each option must stand alone.
- To designate a line of code, put a marker comment in the code (`// n1`, `// line X`) and refer to the marker, never to a line number.
- An option may be multi-line code (use `String.raw` with real line breaks); it is rendered as a code block.
- Distractors must be plausible: the output you would get by making the classic mistake, "does not compile", "throws XxxException", etc.
- Aim for the real exam mix: mostly code-reading questions ("What is the output?", "Which line fails to compile?", "Which statements are true?"), some API/knowledge questions. Roughly 20 % difficulty 1, 55 % difficulty 2, 25 % difficulty 3.
- Stay inside Java 21 final features (no preview features such as string templates or unnamed classes; unnamed variables `_` are preview in 21, so not allowed). Cover Java 21 novelties where the topic has them.
- No two questions testing the exact same fact with the same code shape. Spread across all objectives of the topic.

## Accuracy (non negotiable)

A wrong answer key is worse than no question. For **every** question that contains code, or whose answer depends on
what compiles / what is printed / what is thrown, compile and run the code for real before writing the answer:

- A JDK 25 is installed. Compile with `javac --release 21 -d out File.java` and run with `java -cp out Main`
  (wrap snippets in a class/`main` as needed; `jshell` is also available).
- For "does not compile" answers, confirm that javac rejects it and that the error is the one the explanation gives.
  Also confirm that the options claimed to compile really do.
- For multi-answer "which are true / which compile" questions, verify each option individually.
- Work in a scratch directory outside the project (given in your brief); never leave `.java` or `.class` files in the project.
- If you cannot verify a behaviour and are not certain of it, drop the question and write another one.
- Avoid questions whose output depends on unspecified ordering (HashMap/HashSet iteration order, thread scheduling, parallel streams)
  unless the uncertainty itself is the point and the correct option says so.
