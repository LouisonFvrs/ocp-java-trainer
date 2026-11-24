OCP.register({
  topic: 'streams',
  course: [
    {
      title: "Lambdas : syntaxe des paramètres et du corps",
      blocks: [
        { p: "Une lambda est une implémentation anonyme de l'unique méthode abstraite d'une **interface fonctionnelle**. Elle n'a pas de type propre : son type est déduit du contexte (affectation, argument de méthode, `return`, cast)." },
        { h: "Paramètres" },
        { table: { head: ["Forme", "Valide ?", "Remarque"], rows: [
          ["`x -> x + 1`", "oui", "parenthèses facultatives uniquement pour **un seul** paramètre **sans type**"],
          ["`(x) -> x + 1`", "oui", ""],
          ["`(int x) -> x + 1`", "oui", "type explicite : parenthèses obligatoires"],
          ["`(var x) -> x + 1`", "oui", "`var` autorisé depuis Java 11"],
          ["`(final var x) -> x`, `(@NonNull String s) -> s`", "oui", "un modificateur ou une annotation exige un type ou `var`"],
          ["`() -> 42`", "oui", "zéro paramètre : parenthèses obligatoires"],
          ["`(a, b) -> a + b`", "oui", "parenthèses obligatoires dès deux paramètres"],
          ["`int x -> x + 1`, `var x -> x`", "non", "type ou `var` sans parenthèses"],
          ["`a, b -> a + b`", "non", "parenthèses manquantes"],
          ["`(int a, b) -> a + b`", "non", "types explicites et implicites mélangés"],
          ["`(var a, int b) -> a + b`", "non", "`var` mélangé avec un type explicite"],
          ["`(var a, b) -> a + b`", "non", "`var` mélangé avec un type implicite"],
          ["`(final x) -> x`", "non", "`final` sans type"]
        ] } },
        { trap: "Règle du tout ou rien : tous les paramètres sont sans type, **ou** tous avec un type explicite, **ou** tous avec `var`. Tout mélange est une erreur de compilation." },
        { h: "Corps" },
        { list: [
          "**Expression** : `x -> x * 2` — pas d'accolades, pas de `return`, pas de point-virgule propre à la lambda.",
          "**Bloc** : `x -> { return x * 2; }` — accolades, instructions terminées par `;`, et `return` obligatoire si l'interface attend une valeur.",
          "`x -> return x * 2;` ne compile pas (`return` hors bloc) ; `x -> { x * 2; }` ne compile pas (`x * 2` n'est pas une instruction).",
          "Un bloc qui lève toujours une exception convient à n'importe quel type de retour : `() -> { throw new IllegalStateException(); }`."
        ] },
        { code: String.raw`Predicate<String> p1 = s -> s.isEmpty();                // expression
Predicate<String> p2 = s -> { return s.isEmpty(); };    // bloc
Predicate<String> p3 = s -> { s.isEmpty(); };           // KO : aucune valeur renvoyée
Consumer<String>  c1 = s -> s.isEmpty();                // OK : valeur ignorée
Consumer<String>  c2 = s -> s + "x";                    // KO : pas une instruction` },
        { trap: "Une lambda à corps expression est compatible avec une méthode `void` seulement si l'expression est aussi une instruction valide (appel de méthode, affectation, `++`/`--`, `new`). `s -> s.isEmpty()` convient donc à un `Consumer<String>`, mais `s -> s + \"x\"` non." },
        { trap: "`var f = () -> 1;` et `Object o = () -> 1;` ne compilent pas : sans interface fonctionnelle cible, le compilateur ne peut pas typer la lambda." },
        { tip: "Le point-virgule final de `Runnable r = () -> {};` appartient à la déclaration de variable, pas à la lambda. À l'examen, comptez séparément les `;` du bloc et celui de l'instruction englobante." }
      ]
    },
    {
      title: "Interfaces fonctionnelles",
      blocks: [
        { p: "Une interface fonctionnelle possède **exactement une méthode abstraite** (SAM, *single abstract method*). C'est la seule condition pour servir de cible à une lambda ou à une référence de méthode." },
        { list: [
          "Les méthodes `default`, `static` et `private` ne comptent pas : il peut y en avoir autant que l'on veut.",
          "Une méthode abstraite qui redéclare une méthode **publique de `Object`** (`equals(Object)`, `hashCode()`, `toString()`) ne compte pas : toute implémentation l'hérite déjà de `Object`. Exemple : `Comparator` déclare `compare` et `equals`, et reste fonctionnelle.",
          "Les méthodes abstraites **héritées** des interfaces parentes comptent. Redéclarer la même signature dans la sous-interface n'en ajoute pas.",
          "`@FunctionalInterface` est **facultative**. Elle demande seulement au compilateur de vérifier la règle : erreur de compilation si l'interface a zéro ou plusieurs méthodes abstraites.",
          "Une classe abstraite, même avec une seule méthode abstraite, n'est jamais une cible de lambda."
        ] },
        { code: String.raw`@FunctionalInterface
interface Runner {
    void run();                    // la seule méthode abstraite qui compte
    String toString();             // méthode de Object : ne compte pas
    default void stop() { }        // default : ne compte pas
    static Runner noop() { return () -> { }; }
}
interface Sprinter extends Runner { void run(); }   // toujours fonctionnelle
interface Walker extends Runner { void walk(); }    // 2 méthodes abstraites : non
interface Alpha { boolean equals(Object o); }       // 0 méthode abstraite : non` },
        { trap: "Une interface qui ne déclare que `boolean equals(Object o)` ou `String toString()` a **zéro** méthode abstraite au sens de la règle : elle n'est pas fonctionnelle et `@FunctionalInterface` y provoque une erreur." },
        { trap: "Une interface qui ne contient que des méthodes `default` et `static` n'est pas fonctionnelle non plus : il faut une méthode abstraite, pas zéro." },
        { tip: "Pour décider, listez les méthodes abstraites (héritées comprises), rayez celles de `Object`, ignorez `default`/`static`/`private` : il doit en rester exactement une." }
      ]
    },
    {
      title: "Interfaces de java.util.function",
      blocks: [
        { h: "Interfaces génériques" },
        { table: { head: ["Interface", "Méthode abstraite", "Rôle"], rows: [
          ["`Supplier<T>`", "`T get()`", "fournit une valeur"],
          ["`Consumer<T>`", "`void accept(T t)`", "consomme une valeur"],
          ["`BiConsumer<T, U>`", "`void accept(T t, U u)`", "consomme deux valeurs"],
          ["`Predicate<T>`", "`boolean test(T t)`", "teste une valeur"],
          ["`BiPredicate<T, U>`", "`boolean test(T t, U u)`", "teste deux valeurs"],
          ["`Function<T, R>`", "`R apply(T t)`", "transforme T en R"],
          ["`BiFunction<T, U, R>`", "`R apply(T t, U u)`", "transforme (T, U) en R"],
          ["`UnaryOperator<T>`", "`T apply(T t)`", "étend `Function<T, T>`"],
          ["`BinaryOperator<T>`", "`T apply(T t1, T t2)`", "étend `BiFunction<T, T, T>`"]
        ] } },
        { p: "Le dernier paramètre de type de `Function` et `BiFunction` est le type de **retour**. `UnaryOperator` et `BinaryOperator` n'ont qu'un seul paramètre de type." },
        { h: "Spécialisations primitives (int, long, double uniquement)" },
        { table: { head: ["Interface", "Méthode abstraite", "Lecture du nom"], rows: [
          ["`IntSupplier`", "`int getAsInt()`", "fournit un `int`"],
          ["`BooleanSupplier`", "`boolean getAsBoolean()`", "seule interface pour `boolean`"],
          ["`IntConsumer`", "`void accept(int v)`", "consomme un `int`"],
          ["`ObjIntConsumer<T>`", "`void accept(T t, int v)`", "consomme un objet et un `int`"],
          ["`IntPredicate`", "`boolean test(int v)`", "teste un `int`"],
          ["`IntFunction<R>`", "`R apply(int v)`", "préfixe `Int` = **paramètre** `int`"],
          ["`ToIntFunction<T>`", "`int applyAsInt(T t)`", "préfixe `ToInt` = **retour** `int`"],
          ["`ToIntBiFunction<T, U>`", "`int applyAsInt(T t, U u)`", "deux objets vers `int`"],
          ["`IntToLongFunction`", "`long applyAsLong(int v)`", "`int` vers `long`"],
          ["`IntToDoubleFunction`", "`double applyAsDouble(int v)`", "`int` vers `double`"],
          ["`IntUnaryOperator`", "`int applyAsInt(int v)`", "`int` vers `int`"],
          ["`IntBinaryOperator`", "`int applyAsInt(int a, int b)`", "deux `int` vers `int`"]
        ] } },
        { list: [
          "Les mêmes familles existent avec `Long` et `Double` (`LongSupplier.getAsLong()`, `DoubleUnaryOperator.applyAsDouble(double)`, `ToDoubleFunction<T>`, `ObjLongConsumer<T>`…).",
          "Dès que le **retour** est primitif, le nom de la méthode porte le suffixe : `getAsInt`, `applyAsInt`, `applyAsLong`, `applyAsDouble`, `getAsBoolean`. `test` et `accept` ne changent jamais de nom.",
          "Il n'existe pas de `IntBiFunction`, de `BiSupplier`, ni de spécialisation pour `char`, `byte`, `short` ou `float`."
        ] },
        { trap: "Un type primitif n'est jamais un argument de type : `Supplier<int>` ne compile pas. Il faut `Supplier<Integer>` (autoboxing) ou `IntSupplier`." },
        { trap: "`IntSupplier` n'a pas de méthode `get()` et `ToIntFunction` n'a pas de méthode `apply()` : ce sont `getAsInt()` et `applyAsInt()`. À l'inverse, `IntFunction<R>` renvoie un objet et garde `apply(int)`." },
        { trap: "`BiFunction<String, Integer, Void> f = (s, i) -> System.out.println(s);` ne compile pas : `println` renvoie `void`, pas `Void`. Pour une lambda sans résultat, il faut un `Consumer`, `BiConsumer` ou `ObjIntConsumer`." },
        { h: "Choisir le bon type" },
        { code: String.raw`ToIntFunction<String>   f1 = s -> s.length();          // objet -> int
IntFunction<String>     f2 = i -> "n" + i;             // int -> objet
ObjIntConsumer<String>  f3 = (s, i) -> System.out.println(s.repeat(i));
IntBinaryOperator       f4 = (a, b) -> a * b;          // (int, int) -> int
BinaryOperator<Integer> f5 = (a, b) -> a * b;          // version avec boxing
BooleanSupplier         f6 = () -> true;` }
      ]
    },
    {
      title: "Méthodes utilitaires des interfaces fonctionnelles",
      blocks: [
        { table: { head: ["Interface", "Méthodes `default`", "Méthodes `static`"], rows: [
          ["`Predicate<T>`", "`and(Predicate)`, `or(Predicate)`, `negate()`", "`not(Predicate)`, `isEqual(Object)`"],
          ["`BiPredicate<T, U>`", "`and`, `or`, `negate`", "—"],
          ["`Function<T, R>`", "`andThen(Function)`, `compose(Function)`", "`identity()`"],
          ["`BiFunction<T, U, R>`", "`andThen(Function)` uniquement", "—"],
          ["`Consumer<T>`, `BiConsumer<T, U>`", "`andThen`", "—"],
          ["`UnaryOperator<T>`", "héritées de `Function`", "`identity()`"],
          ["`BinaryOperator<T>`", "héritée de `BiFunction`", "`minBy(Comparator)`, `maxBy(Comparator)`"],
          ["`Supplier<T>`", "—", "—"]
        ] } },
        { h: "Predicate" },
        { list: [
          "`a.and(b)` et `a.or(b)` sont **court-circuités** comme `&&` et `||` : `b` n'est pas évalué si `a` suffit à décider.",
          "Les appels s'enchaînent de gauche à droite sans priorité : `a.or(b).and(c)` vaut `(a || b) && c`.",
          "`Predicate.not(p)` (Java 11) équivaut à `p.negate()` ; il permet de nier une référence de méthode : `Predicate.not(String::isBlank)`.",
          "`Predicate.isEqual(x)` renvoie un prédicat qui teste `Objects.equals(x, t)` : il accepte `null` sans exception."
        ] },
        { trap: "`String::isBlank.negate()` ne compile pas : une référence de méthode (ou une lambda) n'a pas de type tant qu'elle n'est pas affectée ou passée à une interface fonctionnelle. D'où l'intérêt de `Predicate.not(String::isBlank)`." },
        { h: "Function" },
        { code: String.raw`Function<Integer, Integer> plus = x -> x + 2;
Function<Integer, Integer> times = x -> x * 3;
plus.andThen(times).apply(1);   // times(plus(1)) = 9  : this d'abord
plus.compose(times).apply(1);   // plus(times(1)) = 5  : l'argument d'abord
Function.<Integer>identity().apply(7);   // 7` },
        { tip: "`f.andThen(g)` : f **puis** g. `f.compose(g)` : g **avant** f, comme la composition mathématique f∘g." },
        { trap: "`andThen` et `compose` sont déclarées dans `Function` et renvoient une `Function`. Sur un `UnaryOperator<String> u`, `u.andThen(u)` est de type `Function<String, String>` : l'affecter à un `UnaryOperator<String>` ne compile pas." },
        { h: "Consumer et BinaryOperator" },
        { list: [
          "`c1.andThen(c2).accept(x)` exécute `c1` puis `c2` avec le **même** argument ; si `c1` lève une exception, `c2` n'est pas appelé.",
          "`BinaryOperator.minBy(cmp)` et `maxBy(cmp)` renvoient un `BinaryOperator<T>` (pas un `Optional`) qui retourne le plus petit ou le plus grand des deux arguments selon le comparateur.",
          "En cas d'égalité selon le comparateur, `minBy` comme `maxBy` renvoient le **premier** argument.",
          "Les opérateurs primitifs ont leurs propres versions : `IntUnaryOperator.andThen/compose/identity`, `IntPredicate.and/or/negate`."
        ] }
      ]
    },
    {
      title: "Références de méthodes",
      blocks: [
        { p: "Une référence de méthode est un raccourci pour une lambda qui se contente d'appeler une méthode ou un constructeur. Comme une lambda, elle n'a de sens que face à une interface fonctionnelle : c'est elle qui fixe le nombre et le type des arguments." },
        { table: { head: ["Forme", "Exemple", "Lambda équivalente"], rows: [
          ["Méthode statique", "`Integer::parseInt`", "`s -> Integer.parseInt(s)`"],
          ["Instance liée (objet connu)", "`prefix::startsWith`", "`s -> prefix.startsWith(s)`"],
          ["Instance non liée (type)", "`String::startsWith`", "`(s, t) -> s.startsWith(t)`"],
          ["Constructeur", "`ArrayList::new`", "`() -> new ArrayList<>()` ou `n -> new ArrayList<>(n)`"],
          ["Constructeur de tableau", "`String[]::new`", "`n -> new String[n]`"]
        ] } },
        { list: [
          "Instance **non liée** : le **premier** argument de l'interface devient le récepteur, les suivants sont les arguments de la méthode. `String::length` convient à `Function<String, Integer>`, pas à `Supplier<Integer>`.",
          "Instance **liée** : le récepteur est évalué **une seule fois, à la création** de la référence. La variable n'a pas besoin d'être effectivement finale et un récepteur `null` lève `NullPointerException` immédiatement.",
          "Constructeur : le constructeur choisi dépend de l'interface cible. `Supplier<List<String>>` appelle `new ArrayList<>()`, `Function<Integer, List<String>>` appelle `new ArrayList<>(int)` (capacité initiale, la liste reste vide).",
          "`this::method` et `super::method` sont des références liées valides dans une méthode d'instance."
        ] },
        { code: String.raw`String str = "x";
Supplier<String> up = str::toUpperCase;        // "x" capturé maintenant
str = "y";                                     // autorisé avec une référence liée
up.get();                                      // "X"
Supplier<String> lam = () -> str.toUpperCase();   // KO : str n'est plus
                                                  // effectivement finale` },
        { trap: "Référence ambiguë : `Function<Integer, String> f = Integer::toString;` ne compile pas. Deux méthodes conviennent, la statique `Integer.toString(int)` et la méthode d'instance `toString()` prise comme non liée. En revanche `IntFunction<String> f = Integer::toString;` et `Function<Integer, String> f = Object::toString;` compilent." },
        { trap: "Une référence de méthode ne peut pas transmettre d'argument supplémentaire ni enchaîner des appels : `s -> s.substring(1)` ou `s -> s.trim().length()` n'ont pas d'équivalent en `::`." },
        { tip: "Devant `Type::methode`, cherchez d'abord une méthode statique acceptant tous les arguments, puis une méthode d'instance acceptant tous les arguments sauf le premier. Si les deux existent, c'est une erreur de compilation." }
      ]
    },
    {
      title: "Variables, portée et this dans une lambda",
      blocks: [
        { table: { head: ["Élément", "Lecture", "Modification"], rows: [
          ["Variable locale ou paramètre de la méthode englobante", "oui, si `final` ou **effectivement finale**", "non"],
          ["Champ d'instance", "oui", "oui"],
          ["Champ statique", "oui", "oui"],
          ["Paramètre de la lambda et variable déclarée dans son corps", "oui", "oui"]
        ] } },
        { list: [
          "**Effectivement finale** : la variable n'est affectée qu'une seule fois, où que ce soit dans la méthode. Une réaffectation **après** la lambda (ou un `++`) lui fait perdre ce statut.",
          "L'erreur est signalée à l'endroit où la lambda **utilise** la variable, pas sur la ligne de réaffectation.",
          "L'état d'un objet référencé par une variable effectivement finale peut changer : `list.add(x)` ou `sb.append(x)` dans une lambda sont permis.",
          "Une lambda **n'ouvre pas de nouvelle portée** : un paramètre de lambda ou une variable locale de son corps ne peut pas porter le nom d'une variable locale déjà visible (`variable x is already defined`).",
          "Une classe anonyme ouvre une nouvelle portée : ses paramètres peuvent masquer une variable locale englobante."
        ] },
        { code: String.raw`int base = 10;
int count = 0;
Runnable r1 = () -> System.out.println(base);   // KO : base réaffectée plus bas
Runnable r2 = () -> count++;                    // KO : modification d'une locale
base = 20;
int x = 1;
IntUnaryOperator op = x -> x + 1;               // KO : x déjà défini` },
        { h: "this" },
        { list: [
          "Dans une lambda, `this` (et un appel non qualifié comme `toString()`) désigne l'instance de la **classe englobante** : la lambda n'est pas un objet avec son propre `this`.",
          "Dans une classe anonyme, `this` désigne l'instance de la **classe anonyme** ; l'instance englobante s'écrit `Outer.this`.",
          "Conséquence : une lambda écrite dans une méthode `static` ne peut pas utiliser `this`."
        ] },
        { trap: "Champs et variables locales ne suivent pas la même règle : `total += v` sur un champ d'instance ou `calls++` sur un champ statique compilent dans une lambda, alors que la même opération sur une variable locale est refusée." }
      ]
    },
    {
      title: "Optional",
      blocks: [
        { p: "`Optional<T>` est un conteneur immuable qui contient une valeur non nulle ou rien. Chaque méthode de transformation renvoie un nouvel `Optional`." },
        { h: "Création et lecture" },
        { table: { head: ["Méthode", "Comportement"], rows: [
          ["`Optional.of(v)`", "`NullPointerException` si `v` est `null`"],
          ["`Optional.ofNullable(v)`", "vide si `v` est `null`"],
          ["`Optional.empty()`", "optional vide"],
          ["`isPresent()` / `isEmpty()`", "`isEmpty()` existe depuis Java 11"],
          ["`get()`", "valeur, ou `NoSuchElementException` si vide"],
          ["`orElseThrow()`", "identique à `get()` (Java 10)"],
          ["`orElseThrow(Supplier)`", "valeur, ou lève l'exception fournie par le `Supplier`"],
          ["`orElse(T other)`", "valeur, ou `other` — l'argument est **toujours évalué**"],
          ["`orElseGet(Supplier)`", "valeur, ou résultat du `Supplier` — appelé **seulement si vide**"]
        ] } },
        { trap: "`opt.orElse(load())` exécute `load()` même si l'optional contient une valeur : c'est un argument de méthode ordinaire, évalué avant l'appel. `opt.orElseGet(() -> load())` ne l'exécute que si l'optional est vide." },
        { trap: "`orElseThrow(IllegalStateException::new)` attend un `Supplier` d'exception. `orElseThrow(new IllegalStateException())` ne compile pas." },
        { h: "Transformation et action" },
        { table: { head: ["Méthode", "Paramètre", "Résultat"], rows: [
          ["`map`", "`Function<T, R>`", "`Optional<R>` ; vide si la fonction renvoie `null`"],
          ["`flatMap`", "`Function<T, Optional<R>>`", "`Optional<R>`, sans imbrication"],
          ["`filter`", "`Predicate<T>`", "le même optional si le test réussit, sinon vide"],
          ["`or` (Java 9)", "`Supplier<Optional<T>>`", "cet optional s'il est présent, sinon celui du `Supplier`"],
          ["`ifPresent`", "`Consumer<T>`", "`void`"],
          ["`ifPresentOrElse` (Java 9)", "`Consumer<T>`, `Runnable`", "`void`"],
          ["`stream()` (Java 9)", "—", "`Stream<T>` de zéro ou un élément"]
        ] } },
        { list: [
          "Sur un optional vide, `map`, `flatMap` et `filter` renvoient un optional vide **sans appeler** la lambda.",
          "`map` avec une fonction qui renvoie déjà un `Optional` donne un `Optional<Optional<R>>` : il faut `flatMap`. Inversement, `flatMap` avec une fonction qui ne renvoie pas un `Optional` ne compile pas.",
          "`or` renvoie un `Optional`, `orElse` renvoie la valeur : ne pas les confondre.",
          "`toString()` : `Optional[cache]` ou `Optional.empty`. `equals` compare les valeurs contenues."
        ] },
        { code: String.raw`Optional<String> name = Optional.of("  ");
name.map(String::strip)               // Optional[""]
    .filter(s -> !s.isEmpty())        // Optional.empty
    .map(String::length)              // toujours vide, lambda non appelée
    .or(() -> Optional.of(-1))        // Optional[-1]
    .get();                           // -1` },
        { h: "Optionals primitifs" },
        { table: { head: ["Type", "Lecture", "Valeur par défaut"], rows: [
          ["`OptionalInt`", "`getAsInt()`", "`orElse(int)`, `orElseGet(IntSupplier)`"],
          ["`OptionalLong`", "`getAsLong()`", "`orElse(long)`, `orElseGet(LongSupplier)`"],
          ["`OptionalDouble`", "`getAsDouble()`", "`orElse(double)`, `orElseGet(DoubleSupplier)`"]
        ] } },
        { trap: "`OptionalInt`, `OptionalLong` et `OptionalDouble` n'ont **pas** de méthode `get()`, ni `map`, `flatMap`, `filter` ou `or`. Ils offrent `getAsXxx()`, `orElseThrow()`, `orElse`, `orElseGet`, `isPresent`, `isEmpty`, `ifPresent`, `ifPresentOrElse` et `stream()`. Un `getAsInt()` sur un optional vide lève `NoSuchElementException`." }
      ]
    }
  ],
  questions: [
    {
      id: "lambdas-001",
      difficulty: 2,
      q: "Which of the following declarations compile? (Choose three.)",
      options: [
        "BiFunction<Integer, Integer, Integer> f = (a, b) -> a + b;",
        "BiFunction<Integer, Integer, Integer> f = (Integer a, b) -> a + b;",
        "BiFunction<Integer, Integer, Integer> f = (var a, var b) -> { return a + b; };",
        "BiFunction<Integer, Integer, Integer> f = (var a, Integer b) -> a + b;",
        "Function<Integer, Integer> f = a -> { a * 2; };",
        "Function<Integer, Integer> f = (final var a) -> a * 2;"
      ],
      answer: [0, 2, 5],
      explain: "Les paramètres d'une lambda sont tous sans type, tous avec un type explicite ou tous avec `var` : `(a, b)` et `(var a, var b)` sont valides, et `final` est permis dès qu'il accompagne un type ou `var`. `(Integer a, b)` et `(var a, Integer b)` mélangent les formes : erreur `invalid lambda parameter declaration`. `a -> { a * 2; }` échoue pour une autre raison : dans un bloc, `a * 2;` n'est pas une instruction valide, et il manquerait de toute façon le `return`."
    },
    {
      id: "lambdas-002",
      difficulty: 2,
      q: "Which lines fail to compile? (Choose two.)",
      code: String.raw`Predicate<String> p1 = s -> s.isEmpty();                 // n1
Predicate<String> p2 = s -> { return s.isEmpty(); };     // n2
Predicate<String> p3 = s -> return s.isEmpty();          // n3
Predicate<String> p4 = (String s) -> { s.isEmpty(); };   // n4
Consumer<String> c1 = s -> s.isEmpty();                  // n5
Runnable r = () -> {};                                   // n6`,
      options: ["n1", "n2", "n3", "n4", "n5", "n6"],
      answer: [2, 3],
      explain: "n3 : le mot-clé `return` n'est permis que dans un corps en bloc, entre accolades. n4 : le bloc ne renvoie rien alors que `Predicate.test` doit renvoyer un `boolean` (`bad return type in lambda expression`). n5 est le piège : un corps expression qui est un appel de méthode est accepté pour une méthode `void`, la valeur est simplement ignorée. n6 est une lambda vide parfaitement valide pour `Runnable`."
    },
    {
      id: "lambdas-003",
      difficulty: 3,
      q: "Given the following declarations, which interfaces can be annotated with @FunctionalInterface without causing a compilation error? (Choose two.)",
      code: String.raw`interface Alpha { boolean equals(Object o); }
interface Runner { void run(); String toString(); default void stop() {} }
interface Sprinter extends Runner { void run(); }
interface Walker extends Runner { void walk(); }
interface Helper { static void go() {} default void stop() {} }`,
      options: ["Alpha", "Runner", "Sprinter", "Walker", "Helper"],
      answer: [1, 2],
      explain: "Il faut exactement une méthode abstraite, sans compter celles qui redéclarent une méthode publique de `Object` ni les méthodes `default` et `static`. `Runner` n'a donc que `run()` (`toString()` et `stop()` ne comptent pas). `Sprinter` redéclare la même `run()` : toujours une seule. `Walker` hérite de `run()` et ajoute `walk()` : deux méthodes abstraites. `Alpha` ne déclare que `equals(Object)`, donc zéro méthode abstraite au sens de la règle, et `Helper` n'en a aucune : dans ces trois cas le compilateur signale `Unexpected @FunctionalInterface annotation`."
    },
    {
      id: "lambdas-004",
      difficulty: 1,
      q: "Which statements about functional interfaces are true? (Choose two.)",
      options: [
        "An interface with exactly one abstract method can be the target of a lambda even if it is not annotated with @FunctionalInterface.",
        "A functional interface may declare several default methods and several static methods.",
        "An abstract class that declares a single abstract method can be implemented with a lambda expression.",
        "A functional interface cannot extend another interface.",
        "An interface that declares one abstract method and also redeclares toString() as abstract is not a functional interface."
      ],
      answer: [0, 1],
      explain: "`@FunctionalInterface` est facultative : elle ne sert qu'à faire vérifier la règle par le compilateur. Seules les méthodes abstraites comptent, donc les méthodes `default` et `static` sont libres. Une lambda ne peut cibler qu'une interface, jamais une classe abstraite (`not a functional interface`). Une interface fonctionnelle peut étendre une autre interface tant qu'il reste une seule méthode abstraite au total (`UnaryOperator` étend `Function`). Enfin, redéclarer `toString()`, `equals(Object)` ou `hashCode()` ne compte pas, car ce sont des méthodes publiques de `Object`."
    },
    {
      id: "lambdas-005",
      difficulty: 2,
      q: "Which of the following declarations compile? (Choose three.)",
      options: [
        "ToIntFunction<String> a = s -> s.length();",
        "IntFunction<String> b = i -> \"n\" + i;",
        "ObjIntConsumer<String> c = (s, i) -> System.out.println(s.repeat(i));",
        "Supplier<int> d = () -> 1;",
        "IntUnaryOperator e = (i, j) -> i + j;",
        "IntPredicate f = i -> i + 1;",
        "ToIntBiFunction<String, String> g = (s, t) -> s + t;"
      ],
      answer: [0, 1, 2],
      explain: "`ToIntFunction<T>` prend un objet et renvoie un `int` (`applyAsInt`), `IntFunction<R>` prend un `int` et renvoie un objet (`apply`), `ObjIntConsumer<T>` prend un objet et un `int` et ne renvoie rien (`accept`). `Supplier<int>` est impossible : un primitif n'est pas un argument de type, il faut `IntSupplier` ou `Supplier<Integer>`. `IntUnaryOperator` n'a qu'un paramètre ; pour deux `int` il faut `IntBinaryOperator`. `IntPredicate` doit renvoyer un `boolean`, pas un `int`. `ToIntBiFunction` doit renvoyer un `int`, or `s + t` est une `String`."
    },
    {
      id: "lambdas-006",
      difficulty: 1,
      q: "Which lines fail to compile? (Choose two.)",
      code: String.raw`Supplier<Integer> s = () -> 1;
IntSupplier is = () -> 2;
ToIntFunction<String> tf = String::length;
UnaryOperator<String> u = String::trim;
BooleanSupplier bs = () -> true;

int r1 = s.get();                 // n1
int r2 = is.get();                // n2
int r3 = tf.apply("abc");         // n3
String r4 = u.apply(" a ");       // n4
boolean r5 = bs.getAsBoolean();   // n5`,
      options: ["n1", "n2", "n3", "n4", "n5"],
      answer: [1, 2],
      explain: "Quand une interface de `java.util.function` renvoie un primitif, le nom de sa méthode l'indique : `IntSupplier.getAsInt()` et `ToIntFunction.applyAsInt(T)`. Les appels `is.get()` et `tf.apply(...)` provoquent donc `cannot find symbol`. `Supplier<Integer>.get()` renvoie un `Integer` déballé automatiquement en `int`, `UnaryOperator` hérite de `apply` de `Function`, et `BooleanSupplier` expose bien `getAsBoolean()`."
    },
    {
      id: "lambdas-007",
      difficulty: 2,
      q: "Which lines fail to compile? (Choose two.)",
      code: String.raw`OptionalInt oi = OptionalInt.of(4);
int a = oi.getAsInt();                                    // n1
int b = oi.get();                                         // n2
OptionalDouble od = OptionalDouble.empty();
double c = od.orElse(1.5);                                // n3
Optional<Integer> o = Optional.of(4);
Optional<String> s = o.map(i -> Optional.of("v" + i));    // n4
o.ifPresentOrElse(System.out::println,
        () -> System.out.println("none"));                // n5
int d = o.orElseThrow();                                  // n6`,
      options: ["n1", "n2", "n3", "n4", "n5", "n6"],
      answer: [1, 3],
      explain: "n2 : `OptionalInt` n'a pas de méthode `get()`, seulement `getAsInt()` (et `orElseThrow()`). n4 : `map` enveloppe le résultat de la fonction, on obtient donc un `Optional<Optional<String>>`, incompatible avec `Optional<String>` ; il fallait `flatMap`. `OptionalDouble.orElse(double)` existe (n3), `ifPresentOrElse` attend bien un `Consumer` puis un `Runnable` (n5), et `orElseThrow()` sans argument, équivalent de `get()`, renvoie un `Integer` déballé en `int` (n6)."
    },
    {
      id: "lambdas-008",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`Predicate<String> a = s -> { System.out.print("a"); return s.isEmpty(); };
Predicate<String> b = s -> { System.out.print("b"); return s.length() > 2; };
System.out.print(a.and(b).test("java"));
System.out.print(a.or(b).negate().test("java"));`,
      options: [
        "afalseabfalse",
        "abfalseabfalse",
        "afalseabtrue",
        "afalseafalse",
        "abfalseabtrue"
      ],
      answer: [0],
      explain: "`and` et `or` sont court-circuités comme `&&` et `||`. Pour `a.and(b)`, `a` affiche `a` et renvoie `false` : `b` n'est pas évalué, résultat `false`. Pour `a.or(b)`, `a` renvoie `false`, donc `b` est évalué (affiche `b`) et renvoie `true` ; `negate()` inverse le résultat global en `false`. La sortie est donc `afalse` puis `abfalse`. Répondre `abfalse...` au début revient à oublier le court-circuit ; `...abtrue` revient à oublier `negate()`."
    },
    {
      id: "lambdas-009",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`Predicate<String> blank = String::isBlank;
List<String> list = new ArrayList<>(List.of("a", " ", "b", ""));
list.removeIf(Predicate.not(blank).or(Predicate.isEqual("")));
System.out.println(list.size());`,
      options: ["0", "1", "2", "3", "The code does not compile"],
      answer: [1],
      explain: "`Predicate.not(blank)` est vrai pour les chaînes non blanches (`a` et `b`). `Predicate.isEqual(\"\")` est vrai pour la chaîne vide, par comparaison avec `Objects.equals`. `removeIf` supprime donc `a`, `b` et la chaîne vide ; il ne reste que la chaîne d'un espace, qui est blanche mais pas égale à la chaîne vide : taille 1. Le code compile : `not` et `isEqual` sont des méthodes statiques de `Predicate`, et `or` est une méthode `default`."
    },
    {
      id: "lambdas-010",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`Function<Integer, Integer> plus = x -> x + 2;
Function<Integer, Integer> times = x -> x * 3;
System.out.println(plus.andThen(times).apply(1) + " "
        + plus.compose(times).apply(1) + " "
        + Function.<Integer>identity().compose(plus).apply(1));`,
      options: ["9 5 3", "5 9 3", "9 5 1", "5 9 1", "9 9 3"],
      answer: [0],
      explain: "`plus.andThen(times)` applique `plus` puis `times` : (1 + 2) * 3 = 9. `plus.compose(times)` applique d'abord l'argument `times`, puis `plus` : 1 * 3 + 2 = 5. `identity().compose(plus)` applique `plus` puis renvoie la valeur telle quelle : 3. La réponse `5 9 3` correspond à l'inversion classique de `andThen` et `compose`."
    },
    {
      id: "lambdas-011",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`BinaryOperator<String> shortest =
        BinaryOperator.minBy(Comparator.comparing(String::length));
BinaryOperator<String> last = BinaryOperator.maxBy(Comparator.naturalOrder());
System.out.println(shortest.apply("kiwi", "fig") + " "
        + shortest.apply("pear", "plum") + " "
        + last.apply("fig", "kiwi"));`,
      options: [
        "fig pear kiwi",
        "fig plum kiwi",
        "fig pear fig",
        "kiwi plum fig",
        "The code does not compile because minBy returns an Optional"
      ],
      answer: [0],
      explain: "`BinaryOperator.minBy` et `maxBy` sont des méthodes statiques qui renvoient un `BinaryOperator<T>` (aucun `Optional` ici, contrairement à `Stream.min`). `shortest` renvoie la chaîne la plus courte : `fig`. Pour `pear` et `plum`, les longueurs sont égales : en cas d'égalité, c'est le **premier** argument qui est renvoyé, donc `pear`. `last` utilise l'ordre naturel : `kiwi` est après `fig` dans l'ordre alphabétique."
    },
    {
      id: "lambdas-012",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`List<String> log = new ArrayList<>();
Consumer<String> c1 = s -> log.add(s.toUpperCase());
Consumer<String> c2 = s -> log.add(s + s.length());
c1.andThen(c2).andThen(c1).accept("ab");
System.out.println(log);`,
      options: [
        "[AB, ab2, AB]",
        "[AB, AB2, AB2]",
        "[AB, AB, ab2]",
        "[AB, ab2]",
        "The code does not compile"
      ],
      answer: [0],
      explain: "`Consumer.andThen` enchaîne les consommateurs dans l'ordre d'écriture, et chacun reçoit le **même** argument d'origine (`ab`) : un `Consumer` ne renvoie rien, rien n'est donc transmis d'un maillon au suivant. On obtient `AB`, puis `ab2`, puis de nouveau `AB`. Le code compile : `log` est effectivement finale, et modifier le contenu de la liste n'est pas une réaffectation ; `log.add(...)` renvoie un `boolean` simplement ignoré."
    },
    {
      id: "lambdas-013",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`String prefix = "ja";
Predicate<String> p1 = prefix::startsWith;
BiPredicate<String, String> p2 = String::startsWith;
System.out.println(p1.test("java") + " " + p2.test("java", prefix)
        + " " + p1.test("j"));`,
      options: [
        "false true true",
        "true true false",
        "true true true",
        "false false true",
        "The code does not compile"
      ],
      answer: [0],
      explain: "`prefix::startsWith` est une référence **liée** : elle équivaut à `s -> prefix.startsWith(s)`. `p1.test(\"java\")` évalue donc `\"ja\".startsWith(\"java\")`, soit `false`, et `p1.test(\"j\")` évalue `\"ja\".startsWith(\"j\")`, soit `true`. `String::startsWith` est **non liée** : le premier argument est le récepteur, `(s, t) -> s.startsWith(t)`, donc `\"java\".startsWith(\"ja\")` vaut `true`. La réponse `true true false` vient de l'inversion du récepteur et de l'argument pour `p1`."
    },
    {
      id: "lambdas-014",
      difficulty: 3,
      q: "What is the result of the following code?",
      code: String.raw`StringBuilder sb = new StringBuilder("a");
Supplier<Integer> len = sb::length;
String str = "x";
Supplier<String> up = str::toUpperCase;
str = "y";
sb.append("bc");
System.out.println(len.get() + up.get());`,
      options: [
        "3X",
        "1X",
        "3Y",
        "1Y",
        "The code does not compile because str is not effectively final"
      ],
      answer: [0],
      explain: "Dans une référence de méthode liée, l'expression du récepteur est évaluée une seule fois, à la création de la référence. `up` a donc capturé l'objet `\"x\"` : la réaffectation de `str` ne change rien et n'est pas une erreur, car la règle de la variable effectivement finale concerne les lambdas (`() -> str.toUpperCase()` ne compilerait pas ici). `len` a capturé le même objet `StringBuilder`, modifié ensuite par `append` : sa longueur vaut 3 au moment de `get()`. Résultat : `3X`."
    },
    {
      id: "lambdas-015",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`Supplier<List<String>> s = ArrayList::new;
Function<Integer, List<String>> f = ArrayList::new;
IntFunction<String[]> arr = String[]::new;
List<String> a = f.apply(5);
System.out.println(s.get().size() + " " + a.size() + " " + arr.apply(3).length);`,
      options: [
        "0 0 3",
        "0 5 3",
        "0 0 0",
        "0 1 3",
        "The code does not compile"
      ],
      answer: [0],
      explain: "Une même référence de constructeur désigne un constructeur différent selon l'interface cible. Avec `Supplier`, c'est `new ArrayList<>()`. Avec `Function<Integer, ...>`, c'est `new ArrayList<>(int)` : l'argument 5 est une **capacité initiale**, la liste reste vide (taille 0, et non 5 ni 1). `String[]::new` équivaut à `n -> new String[n]` : un tableau de longueur 3."
    },
    {
      id: "lambdas-016",
      difficulty: 3,
      q: "Which line fails to compile?",
      code: String.raw`Function<Integer, String> f1 = Integer::toString;            // n1
Function<Integer, String> f2 = i -> i.toString();            // n2
Function<Integer, String> f3 = Object::toString;             // n3
Supplier<String> f4 = Integer.valueOf(5)::toString;          // n4
IntFunction<String> f5 = Integer::toString;                  // n5`,
      options: ["n1", "n2", "n3", "n4", "n5", "All lines compile successfully"],
      answer: [0],
      explain: "n1 est ambiguë : pour un `Function<Integer, String>`, `Integer::toString` peut désigner la méthode statique `Integer.toString(int)` (l'argument est déballé) ou la méthode d'instance `toString()` en référence non liée. Le compilateur refuse de choisir. La lambda de n2 lève l'ambiguïté, `Object` n'a pas de `toString` statique (n3), n4 est une référence liée sans argument, donc seule la méthode d'instance convient, et pour `IntFunction<String>` (n5) l'argument est un `int`, qui ne peut pas servir de récepteur : seule la méthode statique convient."
    },
    {
      id: "lambdas-017",
      difficulty: 2,
      q: "Which lines cause a compilation error? (Choose two.)",
      code: String.raw`public class Counter {
    private int total;
    static int calls;

    void run(List<Integer> values) {
        int local = 0;
        int base = 10;
        values.forEach(v -> total += v);                    // n1
        values.forEach(v -> calls++);                       // n2
        values.forEach(v -> local += v);                    // n3
        values.forEach(v -> System.out.println(v + base));  // n4
        base = 20;                                          // n5
    }
}`,
      options: ["n1", "n2", "n3", "n4", "n5"],
      answer: [2, 3],
      explain: "Une lambda peut lire et modifier les champs d'instance et les champs statiques (n1, n2), mais une variable locale utilisée dans une lambda doit être `final` ou effectivement finale. n3 modifie `local` dans la lambda : erreur. `base` est réaffectée en n5, elle n'est donc pas effectivement finale ; l'erreur est signalée là où la lambda l'utilise, en n4. La ligne n5 est en elle-même une affectation tout à fait légale."
    },
    {
      id: "lambdas-018",
      difficulty: 2,
      q: "Which lines fail to compile? (Choose two.)",
      code: String.raw`int x = 1;
IntUnaryOperator a = x -> x + 1;                      // n1
IntUnaryOperator b = y -> { int x = 2; return y; };   // n2
IntUnaryOperator c = new IntUnaryOperator() {
    public int applyAsInt(int x) { return x + 1; }    // n3
};
IntUnaryOperator d = y -> x + y;                      // n4`,
      options: ["n1", "n2", "n3", "n4"],
      answer: [0, 1],
      explain: "Une lambda n'ouvre pas de nouvelle portée : ni ses paramètres (n1) ni les variables locales de son corps (n2) ne peuvent reprendre le nom d'une variable locale déjà visible, d'où `variable x is already defined`. Une classe anonyme, elle, définit une nouvelle portée : le paramètre `x` de n3 masque légalement la variable locale. n4 se contente de lire `x`, qui est effectivement finale."
    },
    {
      id: "lambdas-019",
      difficulty: 3,
      q: "What is the output of the following program?",
      code: String.raw`import java.util.function.Supplier;

public class Robot {
    public String toString() { return "Robot"; }

    void test() {
        Supplier<String> a = () -> this.toString();
        Supplier<String> b = new Supplier<>() {
            public String get() { return this.toString(); }
            public String toString() { return "Anon"; }
        };
        Supplier<String> c = () -> toString();
        System.out.println(a.get() + " " + b.get() + " " + c.get());
    }

    public static void main(String[] args) {
        new Robot().test();
    }
}`,
      options: [
        "Robot Anon Robot",
        "Robot Robot Robot",
        "Anon Anon Anon",
        "Robot Anon Anon",
        "The code does not compile"
      ],
      answer: [0],
      explain: "Dans une lambda, `this` et les appels non qualifiés désignent l'instance de la classe englobante : `a` et `c` appellent `Robot.toString()`. Dans une classe anonyme, `this` désigne l'instance de la classe anonyme elle-même : `b` appelle le `toString()` redéfini, qui renvoie `Anon`. Le code compile : l'opérateur diamant est autorisé avec une classe anonyme depuis Java 9."
    },
    {
      id: "lambdas-020",
      difficulty: 2,
      q: "What is the output of the following program?",
      code: String.raw`import java.util.Optional;

public class Main {
    static String load() {
        System.out.print("L");
        return "db";
    }

    public static void main(String[] args) {
        Optional<String> o = Optional.of("cache");
        String a = o.orElse(load());
        String b = o.orElseGet(() -> load());
        String c = Optional.<String>empty().orElseGet(Main::load);
        System.out.println(a + b + c);
    }
}`,
      options: [
        "LLcachecachedb",
        "Lcachecachedb",
        "LLLcachecachedb",
        "LLdbcachedb",
        "cachecachedb"
      ],
      answer: [0],
      explain: "L'argument de `orElse` est une expression ordinaire, évaluée **avant** l'appel : `load()` s'exécute et affiche `L` même si l'optional contient `cache`, et sa valeur de retour est ignorée. `orElseGet` reçoit un `Supplier` qui n'est appelé que si l'optional est vide : rien n'est affiché pour `b`, mais `load()` est appelé pour `c` (deuxième `L`), qui vaut `db`. Sortie : `LLcachecachedb`."
    },
    {
      id: "lambdas-021",
      difficulty: 1,
      q: "What is the result of executing the following code?",
      code: String.raw`String v = null;
Optional<String> o1 = Optional.ofNullable(v);
System.out.print(o1.isEmpty() + " ");
Optional<String> o2 = Optional.of(v);
System.out.print(o2.isPresent());`,
      options: [
        "It prints true and then throws a NullPointerException",
        "It prints true false",
        "It prints true and then throws a NoSuchElementException",
        "It throws a NullPointerException without printing anything",
        "It prints false false"
      ],
      answer: [0],
      explain: "`Optional.ofNullable(null)` renvoie un optional vide : `isEmpty()` vaut `true`, ce qui est affiché. `Optional.of(null)` lève immédiatement une `NullPointerException` : `of` exige une valeur non nulle. `NoSuchElementException` est l'exception de `get()` ou `orElseThrow()` sur un optional vide, pas celle de `of`."
    },
    {
      id: "lambdas-022",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`Optional<String> name = Optional.of("  ");
Optional<Integer> len = name.map(String::strip)
        .filter(s -> !s.isEmpty())
        .map(String::length);
System.out.println(len.or(() -> Optional.of(-1)).get() + " "
        + name.map(s -> (String) null).isPresent() + " "
        + name.flatMap(s -> Optional.of(s.length())).orElseThrow());`,
      options: [
        "-1 false 2",
        "0 false 2",
        "-1 true 2",
        "-1 false 0",
        "A NoSuchElementException is thrown at runtime",
        "A NullPointerException is thrown at runtime"
      ],
      answer: [0],
      explain: "`strip` donne une chaîne vide, que `filter` rejette : l'optional devient vide et le `map(String::length)` suivant n'est pas exécuté (ce n'est donc pas 0). `or` remplace un optional vide par celui du `Supplier` : `get()` renvoie -1. Quand la fonction passée à `map` renvoie `null`, le résultat est un optional vide et non une `NullPointerException` : `isPresent()` vaut `false`. `name` lui-même est immuable et contient toujours deux espaces : `flatMap` renvoie `Optional[2]` et `orElseThrow()` donne 2."
    }
  ]
});
