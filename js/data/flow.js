OCP.register({
  topic: 'flow',
  course: [
    {
      title: "if / else et opérateur ternaire",
      blocks: [
        { p: "La condition d'un `if`, d'un `while`, d'un `do/while`, d'un `for` et le premier opérande d'un ternaire doivent être de type `boolean` (ou `Boolean`, déballé automatiquement). Java ne convertit jamais un `int`, une référence ou `null` en booléen." },
        { list: [
          "Sans accolades, un `if` ne contrôle **qu'une seule instruction** ; l'indentation ne compte pas.",
          "**Dangling else** : un `else` se rattache toujours au `if` le plus proche qui n'a pas encore de `else`.",
          "`if (b = true)` compile : c'est une affectation dont la valeur (`true`) sert de condition. `if (n = 1)` ne compile pas (`int` n'est pas un `boolean`).",
          "`if (x > 1) ; else ...` compile : l'instruction vide `;` est une instruction valide.",
          "`if (false) { ... }` compile : c'est la seule construction où du code jamais exécuté n'est pas signalé comme inatteignable."
        ] },
        { code: String.raw`if (x > 3)
    if (y < 5)
        System.out.print("A");
else                            // belongs to "if (y < 5)", not to "if (x > 3)"
    System.out.print("B");` },
        { h: "Opérateur ternaire" },
        { list: [
          "`cond ? a : b` est une **expression** : seul l'opérande choisi est évalué.",
          "Associatif à droite : `a ? b : c ? d : e` se lit `a ? b : (c ? d : e)`. Un ternaire peut aussi être imbriqué dans le deuxième opérande : `a ? b ? 1 : 2 : 3`.",
          "Si les deux branches sont numériques de types différents, il y a **promotion numérique binaire** : `true ? 1 : 2.0` vaut `1.0` (un `double`), même affecté à un `Object`.",
          "Si une branche est un wrapper et l'autre un primitif, le wrapper est déballé : `true ? integerNull : 0` lève une `NullPointerException`.",
          "Un ternaire ne peut pas être utilisé seul comme instruction : `x > 0 ? a() : b();` ne compile pas."
        ] },
        { trap: "`boolean open = false; if (open = true) ...` : le bloc est exécuté **et** `open` vaut désormais `true`. L'examen place souvent cette affectation à côté d'un `==` légitime." }
      ]
    },
    {
      title: "switch : sélecteur, constantes et les deux formes",
      blocks: [
        { h: "Types de sélecteur" },
        { table: {
          head: ["Autorisé", "Interdit"],
          rows: [
            ["`byte`, `short`, `char`, `int` et leurs wrappers", "`long`, `float`, `double`, `boolean`"],
            ["`String`, types `enum`", "constantes `1L`, `1.0`, `true` dans un `case`"],
            ["`var` si le type inféré est autorisé", ""],
            ["Java 21 : **tout type référence** (`Object`, interface scellée, record…) avec des patterns ou un `default`", ""]
          ]
        } },
        { p: "Un sélecteur `null` lève une `NullPointerException`, sauf si le switch contient un `case null` (Java 21)." },
        { h: "Constantes de case" },
        { list: [
          "Chaque constante doit être une **constante de compilation** : littéral, variable `final` initialisée **dans sa déclaration** par une constante, ou expression composée de celles-ci (`case a + 10`).",
          "`final int b; b = 2;` n'est **pas** une constante de compilation ; une variable non `final` non plus.",
          "La constante doit être affectable au type du sélecteur : avec un sélecteur `byte`, `case 128` ne compile pas.",
          "Deux `case` de même valeur : erreur `duplicate case label` (y compris `case 1` et `case a` avec `final int a = 1`).",
          "Constantes d'enum : nom simple (`case LOW`) ; depuis Java 21 le nom qualifié (`case Level.LOW`) est aussi accepté.",
          "Plusieurs valeurs par case : `case 1, 2, 3` (dans les deux formes).",
          "`default` est facultatif et peut se placer n'importe où dans un switch à constantes."
        ] },
        { h: "Forme deux-points contre forme flèche" },
        { table: {
          head: ["", "`case X:`", "`case X ->`"],
          rows: [
            ["Fall-through", "oui, jusqu'au prochain `break`", "jamais"],
            ["Corps", "suite d'instructions", "une expression, un bloc `{ }` ou un `throw`"],
            ["Portée des variables locales", "tout le bloc du switch", "le bloc de la branche"],
            ["Valeur d'un switch expression", "`yield valeur;`", "l'expression, ou `yield` dans un bloc"]
          ]
        } },
        { code: String.raw`switch (n) {                 // n = 9
    default: System.out.print("D");   // entry point when nothing matches
    case 1:  System.out.print("1");   // then falls through
    case 2:  System.out.print("2");
    case 3:  System.out.print("3"); break;
    case 4:  System.out.print("4");
}                            // prints D123` },
        { trap: "On ne mélange jamais les deux formes dans un même switch : `case 1 -> ...; default: ...` provoque `different case kinds used in the switch`." },
        { trap: "Dans la forme deux-points, `default` placé en premier n'est pas exécuté en premier : l'exécution saute au `case` correspondant, ou à `default` si aucun ne correspond, puis descend." },
        { tip: "Dans une boucle, `break` à l'intérieur d'un switch ne sort que du switch ; `continue` concerne toujours la boucle englobante." }
      ]
    },
    {
      title: "switch expression, yield et exhaustivité",
      blocks: [
        { p: "Un switch expression produit une valeur : il s'utilise à droite d'une affectation, dans un `return`, comme argument… Utilisé dans une instruction, il se termine par un **point-virgule** après l'accolade fermante." },
        { code: String.raw`int r = switch (k) {
    case 1, 2 -> 10;                          // expression
    case 3 -> { int t = k * 2; yield t; }     // block: yield is mandatory
    default -> throw new IllegalStateException();
};

int s = switch (k) {                          // colon form: yield everywhere
    case 1: yield 10;
    default: yield 20;
};` },
        { list: [
          "Chaque branche doit produire une valeur ou lever une exception. Un bloc sans `yield` ne compile pas, et `{ 10; }` non plus (`not a statement`).",
          "`return`, ainsi que `break` et `continue` visant l'extérieur, sont interdits dans un switch expression.",
          "`yield` ne s'utilise que dans un switch expression ; dans un switch instruction à flèche, un bloc se termine simplement.",
          "Le type du résultat se calcule comme pour un ternaire : avec `var`, des branches `int`, `double` et `char` donnent un `double`."
        ] },
        { h: "Exhaustivité" },
        { table: {
          head: ["Switch", "Doit couvrir toutes les valeurs ?"],
          rows: [
            ["Expression (toujours)", "oui : `default`, ou toutes les constantes de l'enum, ou tous les sous-types d'un type scellé, ou un pattern inconditionnel"],
            ["Instruction classique (constantes sur `int`, `String`, enum…)", "non : si rien ne correspond, il ne se passe rien"],
            ["Instruction avec un pattern ou un `case null`, ou dont le sélecteur est un autre type référence (`Object`, type scellé…)", "oui"]
          ]
        } },
        { list: [
          "Sur un `int` ou une `String`, seul `default` rend un switch expression exhaustif.",
          "Sur un enum, lister toutes les constantes suffit ; le compilateur ajoute alors un `default` caché qui lève `MatchException` si une constante apparaît après coup (recompilation séparée).",
          "Sur un type scellé, il faut couvrir tous les sous-types permis ; un `default` est alors inutile (et empêche le compilateur de signaler un sous-type ajouté plus tard)."
        ] },
        { trap: "Un switch **instruction** sur un enum qui n'énumère pas toutes les constantes compile ; le même switch en **expression** ne compile pas (`the switch expression does not cover all possible input values`)." },
        { trap: "Oublier le `;` final de `int r = switch (k) { ... }` est une erreur de compilation, tout comme écrire `yield` dans un switch instruction." }
      ]
    },
    {
      title: "Pattern matching pour switch (Java 21)",
      blocks: [
        { p: "Un `case` peut porter un **pattern de type** (`case String s`) ou un **record pattern**, éventuellement suivi d'une **garde** `when`. Le sélecteur peut alors être de n'importe quel type référence." },
        { code: String.raw`static String describe(Object o) {
    return switch (o) {
        case null -> "null";
        case Integer i when i > 10 -> "big int";
        case Integer i -> "int";
        case String s -> "string of " + s.length();
        default -> "other";
    };
}` },
        { h: "Règles" },
        { list: [
          "La variable de pattern n'est visible que dans la garde et dans le corps de sa branche.",
          "La garde s'écrit `case Type t when condition` ; `&&` à la place de `when` ne compile pas. Une garde n'est permise que sur un pattern, pas sur une constante.",
          "Un pattern gardé ne compte pas pour l'exhaustivité : `case Integer i when i > 0` seul ne couvre pas `Integer`.",
          "Un seul pattern par `case` : `case String s, Integer i ->` ne compile pas.",
          "Forme deux-points : il est interdit de **tomber dans** un case dont le pattern déclare une variable (`illegal fall-through to a pattern`) : le groupe qui le précède doit finir par `break`, `return`, `yield` ou `throw`. Tomber **depuis** un case à pattern dans un label sans pattern (`default`, `case null`) reste permis : `case String s: print(\"S\"); default: print(\"D\");` compile et affiche `SD` pour une `String`.",
          "Constantes et patterns peuvent cohabiter (`case 5 ->` puis `case Integer i ->`) : placez toujours les constantes **avant** les patterns."
        ] },
        { h: "null" },
        { list: [
          "Sans `case null`, un sélecteur `null` lève `NullPointerException`, même s'il y a un `default` ou un pattern inconditionnel comme `case Object o`.",
          "`case null` peut s'écrire seul ou combiné uniquement avec `default` : `case null, default ->`.",
          "`case default, null`, `default, null` et `case null, String s` ne compilent pas."
        ] },
        { h: "Dominance" },
        { list: [
          "Un case est **dominé** s'il ne peut jamais être atteint parce qu'un case précédent capte déjà toutes ses valeurs : erreur `this case label is dominated by a preceding case label`.",
          "Un pattern non gardé d'un supertype domine tout pattern d'un sous-type placé après lui (`case CharSequence cs` avant `case String s`).",
          "Un pattern non gardé domine le même pattern gardé placé après ; l'ordre inverse (gardé puis non gardé) est correct.",
          "Un pattern non gardé domine une constante placée après (`case Integer i` puis `case 5`).",
          "`default` placé avant un case à pattern est une erreur ; par convention on le met en dernier.",
          "Un pattern inconditionnel (`case Object o` sur un sélecteur `Object`) **et** un `default` dans le même switch : erreur de compilation."
        ] },
        { trap: "Le compilateur n'analyse pas le contenu des gardes : deux gardes qui se recouvrent (`when i > 10 && i % 2 == 0` puis `when i > 10`) compilent, et c'est le **premier** case qui correspond, dans l'ordre du texte, qui gagne." },
        { h: "Exhaustivité avec les types scellés" },
        { code: String.raw`sealed interface Shape permits Circle, Square {}
record Circle(double r) implements Shape {}
record Square(double side) implements Shape {}

double area(Shape s) {
    return switch (s) {              // exhaustive without default
        case Circle c -> Math.PI * c.r() * c.r();
        case Square q -> q.side() * q.side();
    };
}` },
        { trap: "Un switch **instruction** qui utilise des patterns doit lui aussi être exhaustif : s'il manque un sous-type permis et qu'il n'y a pas de `default`, il ne compile pas." },
        { h: "MatchException" },
        { p: "`java.lang.MatchException` (non vérifiée, Java 21) est levée quand un switch exhaustif à la compilation ne trouve aucune branche à l'exécution (enum ou hiérarchie scellée modifiée puis recompilée séparément), ou quand l'accesseur d'un record lève une exception pendant l'évaluation d'un record pattern : l'exception d'origine devient la **cause** de la `MatchException`." }
      ]
    },
    {
      title: "Record patterns",
      blocks: [
        { p: "Un record pattern teste le type **et** déconstruit le record en appelant ses accesseurs. Il s'utilise avec `instanceof` comme dans un `case`, et peut être imbriqué." },
        { code: String.raw`record Point(int x, int y) {}
record Line(Point a, Point b) {}

if (o instanceof Line(Point(var x, var y), Point b) && x < b.x()) {
    System.out.println(x + y + b.y());
}` },
        { list: [
          "Le nombre et l'ordre des sous-patterns doivent correspondre exactement aux composants du record.",
          "Chaque sous-pattern est un pattern de type (`int x`, `Point p`), `var x` (type inféré) ou un autre record pattern.",
          "Un record pattern ne correspond **jamais** à `null` : si le record lui-même est `null`, le test échoue (ou le switch lève `NullPointerException` sans `case null`).",
          "Pour un composant, un pattern de type **inconditionnel** (même type ou supertype que le composant, ou `var`) accepte la valeur `null` ; un pattern d'un sous-type ne l'accepte pas.",
          "En Java 21, on ne peut pas nommer le record entier dans un record pattern : `Point(int x, int y) p` ne compile pas.",
          "L'exhaustivité tient compte de l'imbrication : `case Box(String s)` seul ne couvre pas un `Box(Object v)`."
        ] },
        { code: String.raw`record Box(Object v) {}

String f(Box b) {
    return switch (b) {
        case Box(String s) -> "S";        // does not match Box(null)
        case Box(Object o) -> "O:" + o;   // unconditional: matches Box(null)
    };
}` },
        { trap: "Dans un switch sur des records imbriqués, l'ordre compte : `case Add(Expr l, Expr r)` placé avant `case Add(Num(var a), Num(var b))` domine ce dernier et provoque une erreur de compilation." }
      ]
    },
    {
      title: "Pattern matching pour instanceof et portée de flux",
      blocks: [
        { p: "`o instanceof String s` teste le type et, en cas de succès, déclare la variable `s` déjà convertie. `null instanceof X` vaut toujours `false`, donc une variable de pattern n'est jamais `null`." },
        { list: [
          "Le type du pattern doit être compatible avec celui de l'expression : `Integer i = 1; i instanceof String s` ne compile pas (`incompatible types`).",
          "Depuis Java 21, le pattern peut être du même type ou d'un supertype de l'expression (`str instanceof String s` compile).",
          "Une variable de pattern n'est **pas** implicitement `final` : on peut la réaffecter (cela ne modifie pas l'objet testé ni la variable d'origine). On peut écrire `instanceof final String s`.",
          "Elle ne peut pas porter le nom d'une variable locale déjà visible, mais elle peut **masquer un champ**."
        ] },
        { h: "Portée de flux (flow scoping)" },
        { p: "La variable existe uniquement là où le compilateur peut **prouver** que le test a réussi." },
        { table: {
          head: ["Code", "`s` est-elle utilisable ?"],
          rows: [
            ["`o instanceof String s && s.isEmpty()`", "oui : la partie droite de `&&` n'est évaluée que si le test est vrai"],
            ["`o instanceof String s || s.isEmpty()`", "non : la partie droite de `||` n'est évaluée que si le test est faux"],
            ["`!(o instanceof String s) || s.isEmpty()`", "oui"],
            ["`if (o instanceof String s) { A } else { B }`", "dans A seulement"],
            ["`if (!(o instanceof String s)) { A } else { B }`", "dans B seulement"],
            ["`if (!(o instanceof String s)) { return; }` puis la suite", "oui dans toute la suite de la méthode (sortie anticipée)"],
            ["`if (o instanceof String s || autre) { A }`", "non dans A"]
          ]
        } },
        { code: String.raw`void print(Object o) {
    if (!(o instanceof Integer i)) {
        return;                 // or throw, break, continue
    }
    System.out.println(i + 1);  // i is in scope here
}` },
        { trap: "La sortie anticipée ne fonctionne que si le bloc du `if` ne peut pas se terminer normalement (`return`, `throw`…). Un simple `System.out.println()` dans ce bloc, et la variable n'est plus visible après le `if`." },
        { trap: "Si un champ s'appelle `s` et que l'on écrit `if (!(o instanceof String s)) { print(s); }`, le `s` du bloc désigne le **champ**, car la variable de pattern n'y est pas dans la portée." },
        { trap: "`a instanceof Integer i && i > 0 || a instanceof Integer i && i < -5` ne compile pas : la même variable de pattern serait définie deux fois dans la même expression." }
      ]
    },
    {
      title: "Boucles while, do/while, for et for amélioré",
      blocks: [
        { table: {
          head: ["Boucle", "Test", "Exécutions minimales"],
          rows: [
            ["`while (cond) corps`", "avant chaque tour", "0"],
            ["`do corps while (cond);`", "après chaque tour", "1"],
            ["`for (init; cond; maj) corps`", "avant chaque tour, `maj` après le corps", "0"],
            ["`for (Type v : source) corps`", "tant qu'il reste des éléments", "0"]
          ]
        } },
        { list: [
          "Le `do/while` se termine par un **point-virgule** ; une variable déclarée dans son corps n'est pas visible dans sa condition.",
          "`while (j++ < 3);` : le `;` est le corps (instruction vide). L'incrément a lieu aussi lors du dernier test, celui qui échoue."
        ] },
        { h: "for classique" },
        { list: [
          "Les trois parties sont facultatives : `for (;;)` est une boucle infinie (condition absente = `true`).",
          "L'initialisation est **soit** une déclaration d'un seul type (`int i = 0, j = 10`), **soit** une liste d'expressions (`i = 0, j = 10`), jamais les deux ni deux types (`int i = 0, long j = 1` ne compile pas).",
          "La mise à jour est une liste d'expressions séparées par des virgules (`i++, j--`), sans déclaration.",
          "Une variable déclarée dans l'initialisation n'existe que dans la boucle ; elle ne peut pas reprendre le nom d'une variable locale déjà visible.",
          "Ordre : initialisation une fois, puis condition, corps, mise à jour, condition…",
          "`continue` dans un `for` exécute quand même la mise à jour avant de retester la condition."
        ] },
        { h: "for amélioré" },
        { list: [
          "La source doit être un **tableau** ou un `java.lang.Iterable` (`List`, `Set`, `Deque`…). Une `Map`, une `String`, un `StringBuilder`, un `Iterator` ou un `Stream` ne conviennent pas.",
          "La variable de boucle est une **copie** : la réaffecter (`n *= 2`) ne modifie ni le tableau ni la collection. En revanche, appeler une méthode qui mute l'objet référencé (`sb.append`) est bien visible.",
          "`var` et `final` sont acceptés : `for (final var x : list)`.",
          "Source `null` : `NullPointerException`. Modifier structurellement une `ArrayList` pendant son parcours lève en général `ConcurrentModificationException`."
        ] },
        { h: "Boucles infinies et code inatteignable" },
        { p: "Le compilateur refuse toute instruction qu'il sait inatteignable (`unreachable statement`). Son analyse ne s'appuie que sur les **constantes de compilation**, jamais sur la valeur des variables ordinaires." },
        { table: {
          head: ["Code", "Résultat"],
          rows: [
            ["`while (true) { } print();`", "erreur : `print()` inatteignable"],
            ["`for (;;) { } return 1;`", "erreur : `return` inatteignable"],
            ["`for (;;) { break; } print();`", "compile : le `break` rend la suite atteignable"],
            ["`while (false) { print(); }`", "erreur : corps inatteignable"],
            ["`for (int i = 0; false; i++) { print(); }`", "erreur : corps inatteignable"],
            ["`if (false) { print(); }`", "compile (exception prévue pour `if`)"],
            ["`final boolean t = true; while (t) { } print();`", "erreur : `t` est une constante"],
            ["`boolean t = true; while (t) { } print();`", "compile : `t` n'est pas une constante"],
            ["`int m() { while (true) { } }`", "compile : aucun `return` requis, la fin n'est pas atteignable"],
            ["`int m(int x) { while (x > 0) { return 1; } }`", "erreur : `missing return statement`"],
            ["`break; i++;` ou `continue; x--;` ou `return; x++;`", "erreur : instruction après un saut"]
          ]
        } }
      ]
    },
    {
      title: "break, continue, labels et return",
      blocks: [
        { list: [
          "`break` sans label : sort de la boucle ou du switch **le plus proche**. Hors d'une boucle ou d'un switch : erreur `break outside switch or loop`.",
          "`continue` sans label : passe au tour suivant de la boucle la plus proche (dans un `for`, après la mise à jour ; dans un `while` ou un `do/while`, en retestant la condition). Interdit hors d'une boucle.",
          "`return` termine la méthode immédiatement, quelle que soit la profondeur d'imbrication des boucles.",
          "Un **label** (`nom:`) peut précéder n'importe quelle instruction : boucle, bloc `{ }`, `if`, `switch`.",
          "`break label;` sort de l'instruction étiquetée, même si c'est un simple bloc.",
          "`continue label;` exige que le label désigne une **boucle** ; sinon erreur `not a loop label`.",
          "Un label n'est visible que dans l'instruction qu'il étiquette ; il a son propre espace de noms (il peut porter le nom d'une variable)."
        ] },
        { code: String.raw`int count = 0;
outer:
for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
        if (j == 2) continue outer;   // next i, the rest of the j loop is skipped
        if (i == 3) break outer;      // leaves both loops
        count++;
    }
}                                     // count == 6` },
        { table: {
          head: ["Instruction", "Dans une boucle", "Dans un switch", "Avec label de bloc"],
          rows: [
            ["`break`", "sort de la boucle", "sort du switch", "sort du bloc"],
            ["`continue`", "tour suivant", "interdit sauf si le switch est dans une boucle (agit sur la boucle)", "interdit"],
            ["`return`", "quitte la méthode", "quitte la méthode (interdit dans un switch expression)", "quitte la méthode"]
          ]
        } },
        { trap: "Dans `for (...) { switch (i) { case 1: continue; case 3: break; } suite(); }`, le `continue` saute `suite()` alors que le `break` ne quitte que le switch : `suite()` est exécutée." },
        { tip: "Pour suivre des boucles imbriquées à l'examen, dressez un petit tableau des valeurs (`i`, `j`, compteur) tour par tour plutôt que de raisonner de tête." }
      ]
    }
  ],
  questions: [
    {
      id: "flow-001",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`int x = 5, y = 10;
if (x > 3)
    if (y < 5)
        System.out.print("A");
else
    System.out.print("B");
System.out.print("C");`,
      options: ["BC", "C", "AC", "ABC", "The code does not compile"],
      answer: [0],
      explain: "C'est le piège du **dangling else** : un `else` se rattache au `if` le plus proche sans `else`, ici `if (y < 5)`, quelle que soit l'indentation. `x > 3` est vrai, `y < 5` est faux, donc le `else` affiche `B`. Le dernier `print` n'appartient à aucun `if` et affiche toujours `C`. La réponse `C` seule correspond à la lecture erronée où le `else` irait avec `if (x > 3)`."
    },
    {
      id: "flow-002",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`boolean open = false;
int count = 0;
if (open = true) count++;
if (count == 1) count += 2;
else count = 10;
System.out.println(open + " " + count);`,
      options: ["true 3", "false 10", "true 1", "false 0", "The code does not compile"],
      answer: [0],
      explain: "`open = true` est une **affectation** : sa valeur est `true`, un `boolean`, donc la condition est valide et vraie. `open` vaut désormais `true` et `count` passe à 1, puis à 3. `false 10` est le résultat obtenu en lisant `=` comme `==`. Le code compile parce que l'expression est de type `boolean` ; `if (count = 1)` en revanche ne compilerait pas."
    },
    {
      id: "flow-003",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`int x = 7;
String s = x > 5 ? x < 7 ? "A" : "B" : "C";
Object o = x > 5 ? 1 : 2.0;
System.out.println(s + o);`,
      options: ["B1.0", "B1", "A1.0", "C2.0", "The code does not compile"],
      answer: [0],
      explain: "Le premier ternaire se lit `x > 5 ? (x < 7 ? \"A\" : \"B\") : \"C\"` : `x > 5` est vrai, `x < 7` est faux, donc `s` vaut `B`. Dans le second, les deux branches sont numériques (`int` et `double`) : il y a promotion numérique binaire et le type de l'expression est `double`, même si la cible est un `Object`. La valeur 1 devient donc `1.0`, emballée en `Double`. `B1` oublie cette promotion."
    },
    {
      id: "flow-004",
      difficulty: 2,
      q: "Given the statement `switch (v) { default -> { } }`, which declarations of `v`, used independently, allow it to compile? (Choose three.)",
      options: [
        "`Byte v = 1;`",
        "`var v = 'a';`",
        "`Object v = \"x\";`",
        "`long v = 1;`",
        "`boolean v = true;`",
        "`double v = 1.0;`"
      ],
      answer: [0, 1, 2],
      explain: "Les sélecteurs primitifs autorisés sont `byte`, `short`, `char` et `int` ; leurs wrappers, `String` et les enums le sont aussi. `var v = 'a'` infère `char`, ce qui convient. Depuis Java 21, n'importe quel type référence, dont `Object`, est accepté tant que le switch est exhaustif (ici grâce à `default`). `long`, `boolean` et `double` (comme `float`) restent interdits comme sélecteurs en Java 21."
    },
    {
      id: "flow-005",
      difficulty: 2,
      q: "Which lines fail to compile? (Choose two.)",
      code: String.raw`public class Main {
    static final int D = 4;
    static void test(int x) {
        final int a = 1;
        final int b;
        b = 2;
        int c = 3;
        switch (x) {
            case a: break;        // n1
            case b: break;        // n2
            case c: break;        // n3
            case D: break;        // n4
            case a + 10: break;   // n5
        }
    }
}`,
      options: ["n1", "n2", "n3", "n4", "n5"],
      answer: [1, 2],
      explain: "Une constante de `case` doit être une **constante de compilation**. `a` (`final` et initialisée dans sa déclaration par un littéral), `D` (`static final` initialisée de même) et `a + 10` (expression de constantes, valeur 11) conviennent. `b` est `final` mais initialisée dans une instruction séparée : ce n'est pas une constante de compilation. `c` n'est pas `final`. javac signale `constant expression required` sur n2 et n3."
    },
    {
      id: "flow-006",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`int n = 9;
switch (n) {
    default: System.out.print("D");
    case 1: System.out.print("1");
    case 2: System.out.print("2");
    case 3: System.out.print("3"); break;
    case 4: System.out.print("4");
}`,
      options: ["D123", "D", "D1234", "123", "The code does not compile"],
      answer: [0],
      explain: "Aucun `case` ne vaut 9 : l'exécution entre par `default`, qui peut être placé n'importe où. Dans la forme deux-points il n'y a pas de `break` implicite : on **tombe** dans `case 1`, `case 2` puis `case 3`, où le `break` arrête tout. `D` seul serait le résultat avec la forme flèche ; `D1234` ignore le `break`."
    },
    {
      id: "flow-007",
      difficulty: 2,
      q: "Given `int k = 1;`, which statements compile? (Choose two.)",
      options: [
        "`int r = switch (k) { case 1 -> 10; default -> { yield 20; } };`",
        "`int r = switch (k) { case 1: yield 10; default: yield 20; };`",
        "`int r = switch (k) { case 1 -> 10; default: yield 20; };`",
        "`int r = switch (k) { case 1 -> { return; } default -> 20; };`",
        "`int r = switch (k) { case 1 -> 10; case 2 -> 20; };`",
        "`int r = switch (k) { case 1 -> { 10; } default -> 20; };`"
      ],
      answer: [0, 1],
      explain: "Un switch expression accepte la forme flèche (valeur directe, ou bloc terminé par `yield`) et la forme deux-points (où chaque branche fait `yield`). On ne peut pas **mélanger** flèche et deux-points (`different case kinds used in the switch`). `return` est interdit dans un switch expression. Sans `default`, un switch expression sur un `int` n'est pas exhaustif. Enfin `{ 10; }` n'est pas une instruction valide : dans un bloc, il faut `yield 10;`."
    },
    {
      id: "flow-008",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    enum Level { LOW, MID, HIGH }
    public static void main(String[] args) {
        Level l = Level.HIGH;
        switch (l) {
            case LOW -> System.out.print("l");
            case Level.MID -> System.out.print("m");
        }
        System.out.print("end");
    }
}`,
      options: [
        "end",
        "mend",
        "The code does not compile because the switch does not cover `HIGH`",
        "The code does not compile because a case constant cannot be qualified",
        "A `MatchException` is thrown at runtime"
      ],
      answer: [0],
      explain: "C'est un switch **instruction** classique sur un enum, sans pattern ni `case null` : il n'a pas à être exhaustif. `HIGH` ne correspond à aucun `case`, rien ne se passe, puis `end` est affiché. Depuis Java 21, une constante d'enum peut être écrite sous forme qualifiée (`Level.MID`) dans un `case`. L'exhaustivité ne serait exigée que pour un switch expression."
    },
    {
      id: "flow-009",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    record Pair(int a, int b) {
        public int a() { throw new IllegalStateException("boom"); }
    }
    public static void main(String[] args) {
        Object o = new Pair(1, 2);
        try {
            String r = switch (o) {
                case Pair(int a, int b) -> "P" + a + b;
                default -> "D";
            };
            System.out.print(r);
        } catch (IllegalStateException e) {
            System.out.print("ISE");
        } catch (RuntimeException e) {
            System.out.print(e.getClass().getSimpleName());
        }
    }
}`,
      options: ["MatchException", "ISE", "P12", "D", "The code does not compile"],
      answer: [0],
      explain: "Un record pattern déconstruit le record en appelant ses **accesseurs**. Si un accesseur lève une exception pendant la correspondance, celle-ci est enveloppée dans une `java.lang.MatchException` (une `RuntimeException`), dont elle devient la cause. Le premier `catch` ne s'applique donc pas : c'est le second qui affiche `MatchException`. `P12` suppose que les champs sont lus directement, et `D` que l'échec fait passer au case suivant."
    },
    {
      id: "flow-010",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`Object o = null;
switch (o) {
    case String s -> System.out.print("S");
    default -> System.out.print("D");
}
System.out.print("E");`,
      options: [
        "A `NullPointerException` is thrown",
        "DE",
        "E",
        "SE",
        "The code does not compile"
      ],
      answer: [0],
      explain: "Sans `case null`, un switch dont le sélecteur vaut `null` lève une `NullPointerException`, comme avant Java 21. `default` ne capte **pas** `null` : pour cela il faut écrire `case null ->` ou `case null, default ->`. Un pattern de type comme `case String s` ne correspond pas non plus à `null`."
    },
    {
      id: "flow-011",
      difficulty: 2,
      q: "Which code, inserted at `// n1`, makes the method compile and makes `f(null)` return `X`?",
      code: String.raw`static String f(Object o) {
    return switch (o) {
        case String s -> "S";
        // n1
    };
}`,
      options: [
        "`case null, default -> \"X\";`",
        "`case default, null -> \"X\";`",
        "`case null, Object x -> \"X\";`",
        "`default -> \"X\";`",
        "`case null -> \"X\";`",
        "`case Object x -> \"X\";`"
      ],
      answer: [0],
      explain: "`null` ne peut se combiner qu'avec `default`, et dans cet ordre : `case null, default`. `case default, null` et `case null, Object x` ne compilent pas. `default` seul et `case Object x` seul compilent, mais `f(null)` lève alors une `NullPointerException`, car ni `default` ni un pattern inconditionnel ne captent `null` au niveau du sélecteur. `case null` seul capte bien `null`, mais le switch expression n'est plus exhaustif : il ne compile pas."
    },
    {
      id: "flow-012",
      difficulty: 2,
      q: "Which line causes a compilation error?",
      code: String.raw`static String f(Object o) {
    return switch (o) {
        case CharSequence cs -> "CS";          // n1
        case String s -> "S";                  // n2
        case Integer i when i > 0 -> "P";      // n3
        case Integer i -> "I";                 // n4
        default -> "D";                        // n5
    };
}`,
      options: ["n1", "n2", "n3", "n4", "n5", "The code compiles without error"],
      answer: [1],
      explain: "`String` implémente `CharSequence` : le pattern non gardé `case CharSequence cs` capte déjà toutes les `String`, donc `case String s` est **dominé** (`this case label is dominated by a preceding case label`). En revanche, un pattern gardé suivi du même pattern non gardé (n3 puis n4) est l'ordre correct : c'est l'inverse qui serait une erreur. `default` en dernier est valide puisque aucun pattern n'est inconditionnel pour `Object`."
    },
    {
      id: "flow-013",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    static String f(Integer n) {
        return switch (n) {
            case 5 -> "five";
            case Integer i when i > 10 && i % 2 == 0 -> "A";
            case Integer i when i > 10 -> "B";
            case Integer i -> "C";
        };
    }
    public static void main(String[] args) {
        System.out.println(f(5) + f(20) + f(15) + f(10));
    }
}`,
      options: ["fiveABC", "fiveAAC", "fiveBBC", "CABC", "The code does not compile"],
      answer: [0],
      explain: "Les cases sont testés dans l'ordre du texte et le premier qui correspond gagne. 5 correspond à la constante ; 20 est supérieur à 10 et pair : `A` ; 15 est supérieur à 10 mais impair : `B` ; 10 ne satisfait aucune garde et arrive au pattern non gardé : `C`. Le code compile : une constante peut précéder des patterns, deux patterns gardés ne se dominent pas, et le dernier `case Integer i` non gardé rend le switch exhaustif sans `default`."
    },
    {
      id: "flow-014",
      difficulty: 3,
      q: "What is the result of compiling and running the following code?",
      code: String.raw`public class Main {
    sealed interface Shape permits Circle, Square, Tri {}
    record Circle(double r) implements Shape {}
    record Square(double s) implements Shape {}
    static final class Tri implements Shape {}

    static void show(Shape s) {
        switch (s) {              // n1
            case Circle c -> System.out.print("C");
            case Square q -> System.out.print("S");
        }
    }
    public static void main(String[] args) {
        show(new Tri());
    }
}`,
      options: [
        "The code does not compile because of the switch at n1",
        "The code compiles and prints nothing",
        "A `MatchException` is thrown at runtime",
        "The code does not compile because `Tri` is not a record"
      ],
      answer: [0],
      explain: "Un switch **instruction** qui utilise des patterns doit être exhaustif, exactement comme un switch expression. `Shape` permet trois sous-types et `Tri` n'est pas couvert : javac signale `the switch statement does not cover all possible input values`. « Ne rien afficher » serait le comportement d'un switch classique à constantes. Un sous-type permis peut être une classe `final` ordinaire, pas forcément un record."
    },
    {
      id: "flow-015",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    record Point(int x, int y) {}
    record Line(Point a, Point b) {}
    public static void main(String[] args) {
        Object o = new Line(new Point(1, 2), new Point(3, 4));
        if (o instanceof Line(Point(var x, var y), Point b) && x < b.x()) {
            System.out.println(x + y + b.y());
        } else {
            System.out.println("no");
        }
    }
}`,
      options: ["7", "124", "no", "The code does not compile"],
      answer: [0],
      explain: "Le record pattern imbriqué déconstruit le `Line` : le premier `Point` est lui-même déconstruit en `x = 1` et `y = 2` (`var` infère `int`), le second est lié à `b`. Les variables sont utilisables à droite de `&&` : `1 < 3` est vrai. `x + y + b.y()` est une addition d'`int` : 1 + 2 + 4 = 7. `124` supposerait une concaténation, or aucun opérande n'est une `String`."
    },
    {
      id: "flow-016",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    sealed interface Expr permits Num, Add {}
    record Num(int v) implements Expr {}
    record Add(Expr l, Expr r) implements Expr {}

    static int eval(Expr e) {
        return switch (e) {
            case Num(int v) -> v;
            case Add(Num(var a), Num(var b)) -> a + b;
            case Add(Expr l, Expr r) -> eval(l) + eval(r) + 100;
        };
    }
    public static void main(String[] args) {
        System.out.println(eval(new Add(new Num(1), new Add(new Num(2), new Num(3)))));
    }
}`,
      options: [
        "106",
        "6",
        "206",
        "The code does not compile because the switch is not exhaustive",
        "The code does not compile because a case label is dominated"
      ],
      answer: [0],
      explain: "L'`Add` externe a pour opérande droit un `Add`, pas un `Num` : le deuxième case ne correspond pas, c'est le troisième qui s'applique : `eval(Num(1)) + eval(Add(Num(2), Num(3))) + 100`. L'`Add` interne a deux `Num` : le deuxième case donne 5, sans ajouter 100. Total : 1 + 5 + 100 = 106. Le switch est exhaustif sans `default` (`Num` et `Add` sont entièrement couverts) et l'ordre est correct : le pattern le plus spécifique précède le plus général."
    },
    {
      id: "flow-017",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    record Box(Object v) {}
    static String f(Box b) {
        return switch (b) {
            case Box(String s) -> "S";
            case Box(Object o) -> "O:" + o;
        };
    }
    public static void main(String[] args) {
        System.out.println(f(new Box("x")) + f(new Box(null)));
    }
}`,
      options: [
        "SO:null",
        "SS",
        "A `NullPointerException` is thrown",
        "A `MatchException` is thrown",
        "The code does not compile"
      ],
      answer: [0],
      explain: "Pour un composant de type `Object`, le sous-pattern `String s` n'est pas inconditionnel : il équivaut à un test `instanceof` et ne correspond donc pas à `null`. Le sous-pattern `Object o`, lui, est inconditionnel pour ce composant et accepte `null`. `new Box(null)` arrive donc au second case et donne `O:null`. Il n'y a pas de `NullPointerException`, car c'est le composant qui est `null`, pas le sélecteur ; le switch est exhaustif grâce au second case."
    },
    {
      id: "flow-018",
      difficulty: 2,
      q: "Which line causes a compilation error?",
      code: String.raw`static void m(Object o) {
    if (o instanceof String s && s.length() > 2) { }          // n1
    if (o instanceof String s || s.isEmpty()) { }             // n2
    if (!(o instanceof Integer i)) { return; }
    System.out.println(i + 1);                                // n3
    boolean b = o instanceof Number n && n.intValue() > 0;    // n4
}`,
      options: ["n1", "n2", "n3", "n4", "The code compiles without error"],
      answer: [1],
      explain: "Une variable de pattern n'est visible que là où le test a **certainement réussi**. À droite de `||`, on n'arrive que si `o instanceof String s` est faux : `s` n'existe pas (`cannot find symbol`). À droite de `&&` (n1, n4), le test est forcément vrai. En n3, le `if` inversé se termine par `return` : si l'on atteint la suite, `o` est un `Integer` et `i` est dans la portée. Le `s` de n1 n'est plus visible après son `if` : le redéclarer en n2 n'est pas le problème."
    },
    {
      id: "flow-019",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    static String s = "field";
    public static void main(String[] args) {
        Object o = 42;
        if (!(o instanceof String s)) {
            System.out.print(s);
        } else {
            System.out.print(s.length());
        }
    }
}`,
      options: ["field", "42", "2", "The code does not compile", "A `ClassCastException` is thrown"],
      answer: [0],
      explain: "`o` est un `Integer`, donc `!(o instanceof String s)` est vrai et c'est le premier bloc qui s'exécute. Dans ce bloc, la variable de pattern `s` n'est **pas** dans la portée (le test a échoué) : le nom `s` désigne donc le champ statique et affiche `field`. Dans le `else`, `s` serait la variable de pattern, qui masque le champ. Une variable de pattern peut masquer un champ, c'est pourquoi le code compile."
    },
    {
      id: "flow-020",
      difficulty: 2,
      q: "What is the result of compiling and running the following code?",
      code: String.raw`public class Main {
    static void f(Object o) {
        switch (o) {
            case String s:
                System.out.print("S");
            case Integer i:
                System.out.print("I");
                break;
            default:
                System.out.print("D");
        }
    }
    public static void main(String[] args) {
        f("x");
    }
}`,
      options: ["The code does not compile", "SI", "S", "SID"],
      answer: [0],
      explain: "Dans la forme deux-points, il est interdit de **tomber** dans un case qui déclare une variable de pattern : en arrivant dans `case Integer i` depuis `case String s`, `i` ne serait pas initialisée. javac signale `illegal fall-through to a pattern`. Il faudrait un `break` après le premier `print`. `SI` est ce que donnerait un fall-through classique avec des constantes."
    },
    {
      id: "flow-021",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`int i = 10;
do {
    i -= 3;
} while (i > 10);
int j = 0;
while (j++ < 3);
System.out.println(i + " " + j);`,
      options: ["7 4", "7 3", "10 4", "10 3", "The code does not compile"],
      answer: [0],
      explain: "Un `do/while` exécute son corps **au moins une fois** : `i` passe à 7, puis `7 > 10` est faux. Le `while` a pour corps l'instruction vide `;`. `j++ < 3` est vrai pour 0, 1 et 2 ; au quatrième test, `3 < 3` est faux mais la post-incrémentation a quand même lieu : `j` vaut 4. `7 3` oublie cette dernière incrémentation."
    },
    {
      id: "flow-022",
      difficulty: 2,
      q: "Which code fragments, placed independently inside a method, compile? (Choose three.)",
      options: [
        "`for (int i = 0, j = 10; i < j; i++, j--) { }`",
        "`for (;;) { break; }`",
        "`int k = 0; for (k = 1, System.out.println(); k < 2; k++) { }`",
        "`for (int i = 0, long j = 10; i < j; i++) { }`",
        "`for (int i = 0; i < 3; i++, int j = 0) { }`",
        "`int i = 0; for (int i = 5; i < 6; i++) { }`"
      ],
      answer: [0, 1, 2],
      explain: "L'initialisation d'un `for` est soit **une** déclaration (un seul type, plusieurs variables possibles), soit une liste d'expressions séparées par des virgules, appels de méthode compris. Les trois parties sont facultatives : `for (;;)` est valide. On ne peut pas déclarer deux types différents (`int i, long j`), ni déclarer une variable dans la partie mise à jour, ni redéclarer une variable locale déjà visible (`i`)."
    },
    {
      id: "flow-023",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`int k = 3;
var r = switch (k) {
    case 1 -> 1;
    case 2 -> 2.0;
    default -> 'c';
};
System.out.println(r);`,
      options: ["99.0", "c", "99", "The code does not compile"],
      answer: [0],
      explain: "Le type d'un switch expression autonome est déterminé à partir de **toutes** ses branches, comme pour un ternaire : `int`, `double` et `char` sont numériques, donc le résultat est promu en `double` et `var` infère `double`. La branche `default` fournit `'c'` (code 99), converti en `99.0`. Afficher `c` supposerait que le type dépend de la branche réellement choisie."
    },
    {
      id: "flow-024",
      difficulty: 2,
      q: "Given the imports `java.util.*`, what is the output of the following code?",
      code: String.raw`int[] nums = {1, 2, 3};
for (int n : nums) {
    n *= 2;
}
List<StringBuilder> list = List.of(new StringBuilder("a"), new StringBuilder("b"));
for (StringBuilder sb : list) {
    sb.append("!");
}
System.out.println(Arrays.toString(nums) + list);`,
      options: [
        "[1, 2, 3][a!, b!]",
        "[2, 4, 6][a!, b!]",
        "[1, 2, 3][a, b]",
        "An `UnsupportedOperationException` is thrown",
        "The code does not compile"
      ],
      answer: [0],
      explain: "La variable d'un for amélioré est une **copie** de l'élément : `n *= 2` modifie la copie, pas le tableau. Dans la seconde boucle, `sb` est une copie de la référence, mais elle désigne le même objet : `append` modifie le `StringBuilder` lui-même. `List.of` est immuable au sens où l'on ne peut ni ajouter, ni retirer, ni remplacer un élément ; muter l'objet contenu ne lève aucune exception."
    },
    {
      id: "flow-025",
      difficulty: 1,
      q: "Given the imports `java.util.*`, which declarations of `v` allow the statement `for (var x : v) { }` to compile? (Choose three.)",
      options: [
        "`String[] v = {\"a\"};`",
        "`Deque<String> v = new ArrayDeque<>();`",
        "`Iterable<String> v = List.of(\"a\");`",
        "`Map<String, Integer> v = new HashMap<>();`",
        "`String v = \"abc\";`",
        "`Iterator<String> v = List.of(\"a\").iterator();`"
      ],
      answer: [0, 1, 2],
      explain: "Un for amélioré exige un **tableau** ou un objet `java.lang.Iterable`. `Deque` hérite de `Collection`, donc d'`Iterable`. Une `Map` n'est pas `Iterable` (il faut parcourir `keySet()`, `values()` ou `entrySet()`), une `String` non plus (il faut `toCharArray()`), et un `Iterator` n'est pas un `Iterable`. javac signale `for-each not applicable to expression type`."
    },
    {
      id: "flow-026",
      difficulty: 3,
      q: "Which methods compile? (Choose three.)",
      options: [
        "`void m() { for (;;) { break; } System.out.println(\"x\"); }`",
        "`void m() { if (false) { System.out.println(\"x\"); } }`",
        "`int m() { while (true) { } }`",
        "`void m() { while (true) { } System.out.println(\"x\"); }`",
        "`void m() { while (false) { System.out.println(\"x\"); } }`",
        "`void m() { final boolean t = true; while (t) { } System.out.println(\"x\"); }`"
      ],
      answer: [0, 1, 2],
      explain: "Le compilateur rejette toute instruction inatteignable en se fondant sur les **constantes de compilation**. Après `while (true) { }` sans `break`, rien n'est atteignable ; avec `final boolean t = true`, `t` est aussi une constante, donc même erreur. Le corps de `while (false)` est inatteignable. En revanche un `break` rend la suite atteignable, `if (false)` est explicitement toléré, et une méthode `int` dont la fin n'est pas atteignable (boucle infinie) n'a pas besoin de `return`."
    },
    {
      id: "flow-027",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`int count = 0;
outer:
for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
        if (j == 2) continue outer;
        if (i == 3) break outer;
        count++;
    }
}
System.out.println(count);`,
      options: ["6", "8", "7", "9", "The code does not compile"],
      answer: [0],
      explain: "Pour `i` valant 0, 1 et 2, la boucle interne compte `j = 0` et `j = 1`, puis `continue outer` à `j = 2` passe directement au `i` suivant : 2 par tour, soit 6. Pour `i = 3`, à `j = 0`, `break outer` quitte les deux boucles avant l'incrémentation. `8` oublie ce `break`, et `9` traite `continue outer` comme un `continue` simple, qui ne sauterait que `j = 2` (3 par tour)."
    },
    {
      id: "flow-028",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`for (int i = 0; i < 5; i++) {
    switch (i) {
        case 1: continue;
        case 3: break;
        default: System.out.print(i);
    }
    System.out.print("-");
}`,
      options: ["0-2--4-", "0-2-4-", "0-2-", "0-1-2--4-", "The code does not compile"],
      answer: [0],
      explain: "Dans un switch placé dans une boucle, `continue` agit sur la **boucle** : pour `i = 1`, rien n'est affiché, pas même le tiret. `break` ne sort que du **switch** : pour `i = 3`, le chiffre n'est pas affiché mais le tiret l'est, d'où le double tiret. Les autres valeurs passent par `default`. `0-2-` suppose à tort que le `break` quitte la boucle `for`."
    },
    {
      id: "flow-029",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`int x = 0;
block: {
    x++;
    if (x > 0) break block;
    x += 10;
}
loop:
while (x < 5) {
    x += 2;
    continue loop;
}
System.out.println(x);`,
      options: [
        "5",
        "11",
        "15",
        "The code does not compile because `break` requires a loop or a switch",
        "The code does not compile because a label can only be placed on a loop"
      ],
      answer: [0],
      explain: "Un label peut étiqueter n'importe quelle instruction, y compris un simple bloc, et `break label;` permet d'en sortir : `x += 10` est sauté et `x` vaut 1. La boucle ajoute ensuite 2 tant que `x < 5` : 3, puis 5. `continue loop` est valide car `loop` étiquette une boucle. Seul un `break` **sans** label exige une boucle ou un switch ; `continue block` en revanche ne compilerait pas (`not a loop label`)."
    },
    {
      id: "flow-030",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    static int find(int[][] grid, int target) {
        int steps = 0;
        for (int[] row : grid) {
            for (int v : row) {
                steps++;
                if (v == target) return steps;
                if (v < 0) break;
            }
        }
        return -steps;
    }
    public static void main(String[] args) {
        System.out.println(find(new int[][] {{1, -1, 9}, {4, 9}}, 9));
    }
}`,
      options: ["4", "3", "5", "-5", "-2"],
      answer: [0],
      explain: "Première ligne : 1 (steps = 1), puis -1 (steps = 2) déclenche `break`, qui ne quitte que la boucle **interne** : le 9 de cette ligne n'est jamais examiné. Seconde ligne : 4 (steps = 3), puis 9 (steps = 4) : `return` termine immédiatement la méthode, depuis l'intérieur des deux boucles. `3` suppose que le 9 de la première ligne est atteint ; `-2` que le `break` quitte les deux boucles."
    }
  ]
});
