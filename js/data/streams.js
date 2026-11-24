OCP.register({
  topic: 'streams',
  course: [
    {
      title: "Anatomie d'un pipeline de stream",
      blocks: [
        { p: "Un pipeline comporte trois parties : une **source**, zéro ou plusieurs **opérations intermédiaires** (elles renvoient un stream et sont **lazy**), et exactement une **opération terminale** (elle renvoie autre chose qu'un stream, ou `void`, et déclenche l'exécution)." },
        { list: [
          "Sans opération terminale, **rien ne s'exécute** : aucun lambda de `filter`, `map` ou `peek` n'est appelé.",
          "Un stream ne se consomme qu'**une seule fois**. Toute seconde opération (intermédiaire ou terminale) sur le même objet lève `IllegalStateException` (« stream has already been operated upon or closed »).",
          "Les opérations intermédiaires renvoient un **nouveau** stream : il faut chaîner ou réaffecter le résultat. `s.map(...)` seul « consomme » déjà `s`.",
          "Le traitement est **vertical** : chaque élément traverse tout le pipeline avant que le suivant ne soit tiré de la source, sauf barrière créée par une opération **stateful** (`sorted`, `distinct`…).",
          "Les opérations **short-circuit** (`limit`, `takeWhile`, `findFirst`, `findAny`, `anyMatch`, `allMatch`, `noneMatch`) arrêtent le tirage des éléments dès que le résultat est connu.",
          "Un stream ne modifie jamais sa source."
        ] },
        { code: String.raw`Stream.of(1, 2, 3, 4, 5)
    .filter(n -> { System.out.print("f" + n); return n % 2 == 0; })
    .map(n -> { System.out.print("m" + n); return n * 10; })
    .limit(1)
    .forEach(n -> System.out.print("e" + n));
// f1f2m2e20  (3, 4 et 5 ne sont jamais tirés de la source)

Stream.of(3, 1, 2)
    .peek(n -> System.out.print("a" + n))
    .sorted()                               // barrière : doit tout voir avant d'émettre
    .peek(n -> System.out.print("b" + n))
    .forEach(n -> System.out.print("c" + n));
// a3a1a2b1c1b2c2b3c3` },
        { trap: "`Stream<Integer> s = Stream.of(1, 2, 3); s.map(x -> x * 2); s.forEach(System.out::print);` compile, mais lève `IllegalStateException` : l'appel à `map` a déjà lié `s` à un pipeline, même si son résultat est ignoré." },
        { trap: "Un pipeline sans opération terminale compile parfaitement et n'affiche rien. À l'examen, vérifiez toujours la présence de l'opération terminale avant de dérouler les lambdas." },
        { tip: "`peek(Consumer)` est une opération intermédiaire destinée au débogage : elle ne s'exécute que pour les éléments réellement tirés. Depuis Java 9, `count()` peut même ne pas exécuter le pipeline si la taille se calcule directement depuis la source : ne comptez pas sur les effets de bord de `peek`." }
      ]
    },
    {
      title: "Créer un stream",
      blocks: [
        { table: { head: ["Fabrique", "Résultat", "Fini ?"], rows: [
          ["`Stream.empty()`", "`Stream<T>` vide", "oui"],
          ["`Stream.of(a, b, c)` / `Stream.of(T... values)`", "`Stream<T>`", "oui"],
          ["`collection.stream()` / `collection.parallelStream()`", "`Stream<E>`", "oui"],
          ["`Arrays.stream(T[])`", "`Stream<T>`", "oui"],
          ["`Arrays.stream(int[])`", "`IntStream` (idem `long[]`, `double[]`)", "oui"],
          ["`Stream.generate(Supplier<T>)`", "`Stream<T>`", "**infini**"],
          ["`Stream.iterate(seed, UnaryOperator<T>)`", "`Stream<T>` : seed, f(seed), f(f(seed))…", "**infini**"],
          ["`Stream.iterate(seed, Predicate<T> hasNext, UnaryOperator<T> next)`", "`Stream<T>`, s'arrête dès que `hasNext` est faux", "oui (comme une boucle `for`)"],
          ["`IntStream.range(a, b)`", "`IntStream` de a à b **exclu**", "oui"],
          ["`IntStream.rangeClosed(a, b)`", "`IntStream` de a à b **inclus**", "oui"]
        ] } },
        { code: String.raw`Stream.iterate(1, n -> n < 20, n -> n * 3)   // 1 3 9   (27 échoue au test : fin)
Stream.iterate(1, n -> n * 3).limit(4)       // 1 3 9 27

int[] data = {1, 2, 3};
Stream.of(data).count();      // 1  -> Stream<int[]> à un seul élément
Arrays.stream(data).count();  // 3  -> IntStream` },
        { h: "Streams infinis : qui termine, qui bloque" },
        { list: [
          "`limit(n)`, `takeWhile`, `findFirst`, `findAny` rendent un stream infini exploitable.",
          "`anyMatch` termine dès qu'un élément correspond ; `allMatch` et `noneMatch` terminent dès qu'un élément **contredit** le résultat. Sinon ils tournent indéfiniment.",
          "`sorted()`, `count()`, `forEach`, `collect`, `reduce`, `min`, `max` sur un stream infini ne terminent jamais normalement (boucle sans fin, ou `OutOfMemoryError` pour ceux qui stockent).",
          "L'ordre compte : `generate(...).limit(5).sorted()` termine, `generate(...).sorted().limit(5)` non.",
          "`Stream.generate(() -> 1).distinct().limit(2)` ne termine jamais : `distinct` ne laisse passer qu'un seul élément et `limit(2)` attend indéfiniment le second."
        ] },
        { trap: "`Stream.iterate(1, n -> n + 1).noneMatch(n -> n > 5)` **termine** et renvoie `false` (l'élément 6 contredit). `Stream.generate(() -> 1).noneMatch(n -> n > 5)` ne termine jamais : aucun élément ne permettra de conclure." }
      ]
    },
    {
      title: "Opérations intermédiaires",
      blocks: [
        { table: { head: ["Opération", "Paramètre", "Remarques"], rows: [
          ["`filter`", "`Predicate<T>`", "garde les éléments pour lesquels le prédicat est vrai"],
          ["`map`", "`Function<T, R>`", "un élément → un élément ; `Stream<R>`"],
          ["`flatMap`", "`Function<T, Stream<R>>`", "un élément → 0..n éléments ; la fonction **doit renvoyer un stream**"],
          ["`mapMulti` (Java 16)", "`BiConsumer<T, Consumer<R>>`", "pousse 0..n éléments dans le `Consumer` reçu"],
          ["`distinct`", "aucun", "stateful, utilise `equals`/`hashCode`"],
          ["`sorted()`", "aucun", "ordre naturel ; stateful ; éléments `Comparable` exigés **à l'exécution**"],
          ["`sorted(Comparator<T>)`", "comparateur", "stateful"],
          ["`limit(long n)`", "", "garde les n premiers ; short-circuit"],
          ["`skip(long n)`", "", "ignore les n premiers"],
          ["`takeWhile(Predicate<T>)`", "", "prend tant que vrai, puis **s'arrête définitivement**"],
          ["`dropWhile(Predicate<T>)`", "", "ignore tant que vrai, puis **laisse tout passer**"],
          ["`peek(Consumer<T>)`", "", "observe sans modifier le flux"]
        ] } },
        { code: String.raw`Stream.of(1, 2, 3, 1, 5).takeWhile(n -> n < 3)  // 1 2
Stream.of(1, 2, 3, 1, 5).dropWhile(n -> n < 3)  // 3 1 5
Stream.of(1, 2, 3, 1, 5).filter(n -> n < 3)     // 1 2 1

var data = List.of(List.of(1, 2), List.<Integer>of(), List.of(3));
data.stream().flatMap(List::stream)   // 1 2 3  (Stream<Integer>)
data.stream().map(List::stream)       // Stream<Stream<Integer>> : 3 éléments
// data.stream().flatMap(l -> l)      // ne compile pas : une List n'est pas un Stream

Stream.of(1, 2, 3, 4)
    .<String>mapMulti((n, sink) -> {
        if (n % 2 == 0) { sink.accept("a" + n); sink.accept("b" + n); }
    })                                // a2 b2 a4 b4` },
        { trap: "`sorted()` sans argument sur des objets qui n'implémentent pas `Comparable` **compile** (la signature n'impose rien) mais lève `ClassCastException` à l'exécution de l'opération terminale, dès qu'il y a au moins deux éléments à comparer." },
        { trap: "`mapMulti` ne peut pas inférer `R` à partir du corps du lambda : quand un autre appel est chaîné derrière, le résultat est un `Stream<Object>`. `List<String> r = Stream.of(1, 2).mapMulti((n, sink) -> sink.accept(\"v\" + n)).toList();` ne compile pas ; il faut écrire `.<String>mapMulti(...)`. Seule une affectation directe (`Stream<String> s = Stream.of(1, 2).mapMulti(...);`) permet d'inférer `R` depuis le type cible." },
        { trap: "`takeWhile` et `dropWhile` ne sont pas des `filter` : ils ne réévaluent plus le prédicat après le premier élément qui le rend faux." },
        { tip: "`sorted(Comparator.reverseOrder())` est correct ; `sorted(Comparator::reverseOrder)` ne compile pas (une référence de méthode sans argument ne peut pas implémenter `compare(a, b)`)." }
      ]
    },
    {
      title: "Opérations terminales",
      blocks: [
        { table: { head: ["Opération", "Type de retour", "Sur un stream vide"], rows: [
          ["`forEach(Consumer<T>)`", "`void`", "ne fait rien"],
          ["`count()`", "`long`", "`0`"],
          ["`min(Comparator<T>)` / `max(Comparator<T>)`", "`Optional<T>`", "`Optional.empty`"],
          ["`findFirst()` / `findAny()`", "`Optional<T>`", "`Optional.empty`"],
          ["`anyMatch(Predicate<T>)`", "`boolean`", "`false`"],
          ["`allMatch(Predicate<T>)`", "`boolean`", "`true`"],
          ["`noneMatch(Predicate<T>)`", "`boolean`", "`true`"],
          ["`reduce(...)`", "`T`, `Optional<T>` ou `U`", "identité ou `Optional.empty`"],
          ["`collect(...)`", "selon le collector", "conteneur vide"],
          ["`toList()` (Java 16)", "`List<T>` **non modifiable**", "liste vide"],
          ["`toArray()`", "`Object[]` (ou `A[]` avec `toArray(String[]::new)`)", "tableau vide"]
        ] } },
        { list: [
          "`min` et `max` sur un `Stream<T>` exigent **toujours** un `Comparator` : `stream.min()` ne compile pas. Le résultat est un `Optional<T>`, jamais un `T`.",
          "`count()` renvoie un `long` : `int n = stream.count();` ne compile pas.",
          "`findFirst()` renvoie le premier élément dans l'ordre de rencontre ; `findAny()` peut renvoyer n'importe lequel (en séquentiel c'est en général le premier, mais ce n'est pas garanti).",
          "`forEach` n'est pas une boucle : pas de `break`, pas de `return` de la méthode englobante, et les variables locales capturées doivent être effectivement finales."
        ] },
        { trap: "`allMatch` et `noneMatch` renvoient `true` sur un stream vide, `anyMatch` renvoie `false`. Aucun ne lève d'exception." },
        { h: "toList() contre Collectors.toList()" },
        { table: { head: ["Forme", "Modifiable ?", "Éléments `null`"], rows: [
          ["`stream.toList()`", "non : `UnsupportedOperationException`", "acceptés"],
          ["`collect(Collectors.toList())`", "aucune garantie (en pratique une `ArrayList` modifiable)", "acceptés"],
          ["`collect(Collectors.toUnmodifiableList())`", "non", "`NullPointerException`"]
        ] } }
      ]
    },
    {
      title: "reduce et collect",
      blocks: [
        { h: "Les trois formes de reduce" },
        { table: { head: ["Signature", "Retour", "Stream vide"], rows: [
          ["`reduce(BinaryOperator<T> accumulator)`", "`Optional<T>`", "`Optional.empty`"],
          ["`reduce(T identity, BinaryOperator<T> accumulator)`", "`T`", "`identity`"],
          ["`reduce(U identity, BiFunction<U, ? super T, U> accumulator, BinaryOperator<U> combiner)`", "`U`", "`identity`"]
        ] } },
        { code: String.raw`Stream<String> s = Stream.of("a", "bb", "ccc");
Optional<String> o = s.reduce(String::concat);                 // forme 1
String str = s.reduce("", String::concat);                     // forme 2
int len = s.reduce(0, (acc, x) -> acc + x.length(), Integer::sum);  // forme 3
// int bad = s.reduce(0, (acc, x) -> acc + x.length());        // ne compile pas
// (chaque ligne suppose un stream neuf)` },
        { trap: "La forme à deux arguments impose que l'identité et le résultat soient du **même type que les éléments**. Pour réduire un `Stream<String>` en `int`, il faut la forme à trois arguments (ou `mapToInt(...).sum()`)." },
        { trap: "La forme à un argument renvoie un `Optional<T>` ; celle avec identité renvoie directement `T` (jamais un `Optional`)." },
        { h: "collect" },
        { list: [
          "`<R> R collect(Supplier<R> supplier, BiConsumer<R, ? super T> accumulator, BiConsumer<R, R> combiner)` : réduction **mutable** (le conteneur est modifié, les `BiConsumer` ne renvoient rien).",
          "`<R, A> R collect(Collector<? super T, A, R> collector)` : avec un collector de `Collectors`.",
          "Il n'existe pas de forme à un argument `Supplier` ni à deux arguments."
        ] },
        { code: String.raw`TreeSet<String> set = Stream.of("b", "a")
    .collect(TreeSet::new, TreeSet::add, TreeSet::addAll);
StringBuilder sb = Stream.of("a", "b")
    .collect(StringBuilder::new, StringBuilder::append, StringBuilder::append);` },
        { tip: "`reduce` combine des valeurs immuables et produit une nouvelle valeur à chaque étape ; `collect` remplit un conteneur mutable. Le troisième argument (combiner) ne sert qu'en parallèle, mais il est obligatoire dans la signature." }
      ]
    },
    {
      title: "Streams primitifs",
      blocks: [
        { p: "`IntStream`, `LongStream` et `DoubleStream` évitent le boxing et ajoutent des opérations numériques. Leurs interfaces fonctionnelles sont spécialisées (`IntPredicate`, `IntUnaryOperator`, `IntFunction<R>`, `ToIntFunction<T>`…)." },
        { table: { head: ["Opération", "IntStream", "LongStream", "DoubleStream"], rows: [
          ["`sum()`", "`int`", "`long`", "`double`"],
          ["`count()`", "`long`", "`long`", "`long`"],
          ["`average()`", "`OptionalDouble`", "`OptionalDouble`", "`OptionalDouble`"],
          ["`min()` / `max()` (sans comparateur)", "`OptionalInt`", "`OptionalLong`", "`OptionalDouble`"],
          ["`findFirst()` / `findAny()`", "`OptionalInt`", "`OptionalLong`", "`OptionalDouble`"],
          ["`summaryStatistics()`", "`IntSummaryStatistics`", "`LongSummaryStatistics`", "`DoubleSummaryStatistics`"],
          ["`boxed()`", "`Stream<Integer>`", "`Stream<Long>`", "`Stream<Double>`"]
        ] } },
        { list: [
          "Sur un stream primitif vide : `sum()` vaut `0`, `average()` vaut `OptionalDouble.empty`, `max()` vaut `OptionalInt.empty`.",
          "Les optionals primitifs se lisent avec `getAsInt()`, `getAsLong()`, `getAsDouble()` (pas `get()`).",
          "`Stream<T>` n'a **pas** de `sum()` ni d'`average()` : il faut d'abord `mapToInt`, `mapToLong` ou `mapToDouble`."
        ] },
        { h: "Passer d'un type de stream à un autre" },
        { table: { head: ["Depuis \\ Vers", "Stream<R>", "IntStream", "LongStream", "DoubleStream"], rows: [
          ["`Stream<T>`", "`map`", "`mapToInt`", "`mapToLong`", "`mapToDouble`"],
          ["`IntStream`", "`mapToObj`, `boxed`", "`map`", "`mapToLong`, `asLongStream`", "`mapToDouble`, `asDoubleStream`"],
          ["`LongStream`", "`mapToObj`, `boxed`", "`mapToInt`", "`map`", "`mapToDouble`, `asDoubleStream`"],
          ["`DoubleStream`", "`mapToObj`, `boxed`", "`mapToInt`", "`mapToLong`", "`map`"]
        ] } },
        { trap: "`map` reste toujours dans le **même** type de stream : `IntStream.of(1, 2).map(i -> i * 2)` est un `IntStream`, pas un `Stream<Integer>` ; `IntStream.of(1).map(i -> \"v\" + i)` ne compile pas (il faut `mapToObj`). De même `Stream.of(\"a\").map(String::length)` est un `Stream<Integer>`, pas un `IntStream`." },
        { trap: "Les conversions `asXxxStream` n'existent que dans le sens élargissant : `asLongStream`, `asDoubleStream`. Il n'y a pas de `asIntStream()` sur `LongStream`." },
        { code: String.raw`IntSummaryStatistics st = Stream.of("a", "bbb", "cc")
    .mapToInt(String::length).summaryStatistics();
st.getMin();      // 1   (int)
st.getMax();      // 3   (int)
st.getAverage();  // 2.0 (double)
st.getSum();      // 6   (long)
st.getCount();    // 3   (long)
// Stream vide : getMin() = Integer.MAX_VALUE, getMax() = Integer.MIN_VALUE,
//               getAverage() = 0.0, getSum() = 0, getCount() = 0` },
        { tip: "`summaryStatistics()` est une opération terminale qui donne min, max, moyenne, somme et nombre en **un seul** parcours ; ses getters renvoient des valeurs simples, pas des optionals." }
      ]
    },
    {
      title: "Collectors de base",
      blocks: [
        { table: { head: ["Collector", "Type du résultat", "Remarques"], rows: [
          ["`toList()` / `toSet()`", "`List<T>` / `Set<T>`", "sans argument ; aucune garantie sur l'implémentation"],
          ["`toCollection(Supplier<C>)`", "`C`", "pour choisir l'implémentation : `toCollection(TreeSet::new)`"],
          ["`joining()` / `joining(sep)` / `joining(sep, prefix, suffix)`", "`String`", "uniquement sur des `CharSequence`"],
          ["`counting()`", "`Long`", ""],
          ["`summingInt` / `summingLong` / `summingDouble`", "`Integer` / `Long` / `Double`", "prennent une `ToIntFunction`…"],
          ["`averagingInt` / `averagingLong` / `averagingDouble`", "**`Double`** dans tous les cas", "`0.0` si aucun élément"],
          ["`minBy(Comparator)` / `maxBy(Comparator)`", "`Optional<T>`", ""],
          ["`mapping(Function, downstream)`", "celui du downstream", "transforme avant de collecter"],
          ["`filtering(Predicate, downstream)`", "celui du downstream", "filtre avant de collecter"],
          ["`flatMapping(Function<T, Stream<U>>, downstream)`", "celui du downstream", "aplatit avant de collecter"],
          ["`teeing(c1, c2, BiFunction merger)`", "celui de `merger`", "deux collectors sur le même flux, puis fusion"]
        ] } },
        { code: String.raw`Stream.of("a", "b", "c").collect(Collectors.joining(", ", "[", "]"));  // [a, b, c]
Stream.<String>empty().collect(Collectors.joining("-", "<", ">"));     // <>

var r = Stream.of(3, 5, 11).collect(Collectors.teeing(
    Collectors.summingInt(n -> n),      // Integer 19
    Collectors.counting(),              // Long 3
    (sum, n) -> sum / n));              // Long 6 (division entière)` },
        { trap: "`Collectors.toSet(TreeSet::new)` n'existe pas : `toList()` et `toSet()` ne prennent aucun argument. `TreeSet<String> t = stream.collect(Collectors.toSet());` ne compile pas non plus (le résultat est un `Set<String>`)." },
        { trap: "`averagingInt` renvoie un `Double` et `counting` un `Long` : `int n = stream.collect(Collectors.counting());` ne compile pas." },
        { tip: "`mapping`, `filtering` et `flatMapping` n'ont d'intérêt que comme **downstream** de `groupingBy` ou `partitioningBy` : ils agissent à l'intérieur de chaque groupe, sans supprimer de clé." }
      ]
    },
    {
      title: "toMap, groupingBy, partitioningBy",
      blocks: [
        { h: "toMap" },
        { table: { head: ["Signature", "Résultat", "Clé en double"], rows: [
          ["`toMap(keyMapper, valueMapper)`", "`Map<K, U>`", "`IllegalStateException`"],
          ["`toMap(keyMapper, valueMapper, BinaryOperator<U> merge)`", "`Map<K, U>`", "valeurs fusionnées par `merge`"],
          ["`toMap(keyMapper, valueMapper, merge, Supplier<M> mapFactory)`", "`M` (ex. `TreeMap<K, U>`)", "valeurs fusionnées par `merge`"]
        ] } },
        { code: String.raw`Stream.of("ab", "cd", "e")
    .collect(Collectors.toMap(String::length, s -> s));
// IllegalStateException: Duplicate key 2 (attempted merging values ab and cd)

Stream.of("bb", "a", "cc", "d")
    .collect(Collectors.toMap(String::length, s -> s, (x, y) -> x + y, TreeMap::new));
// {1=ad, 2=bbcc}` },
        { trap: "Pour choisir le type de map avec `toMap`, il faut la forme à **quatre** arguments : la fonction de fusion est obligatoire avant le `Supplier`." },
        { h: "groupingBy" },
        { table: { head: ["Signature", "Type du résultat"], rows: [
          ["`groupingBy(classifier)`", "`Map<K, List<T>>`"],
          ["`groupingBy(classifier, downstream)`", "`Map<K, D>`"],
          ["`groupingBy(classifier, mapFactory, downstream)`", "`M` (ex. `TreeMap<K, D>`)"]
        ] } },
        { code: String.raw`Stream<String> s = Stream.of("a", "bb", "cc");
Map<Integer, List<String>> m1 = s.collect(Collectors.groupingBy(String::length));
Map<Integer, Set<String>> m2 =
    s.collect(Collectors.groupingBy(String::length, Collectors.toSet()));
TreeMap<Integer, Long> m3 =
    s.collect(Collectors.groupingBy(String::length, TreeMap::new, Collectors.counting()));
// (chaque ligne suppose un stream neuf)` },
        { list: [
          "L'ordre des arguments de la forme à trois arguments est : classifier, **fabrique de map**, downstream. Il n'existe pas de forme `groupingBy(classifier, mapFactory)`.",
          "Une clé n'apparaît que si au moins un élément y est classé (avant application du downstream).",
          "Le type déclaré par les formes à un et deux arguments est `Map` : l'affecter à une `HashMap` ou une `TreeMap` ne compile pas.",
          "`groupingBy(..., counting())` produit des valeurs `Long`, pas `Integer`."
        ] },
        { code: String.raw`var words = List.of("a", "bb", "b", "ccc");
words.stream().collect(Collectors.groupingBy(String::length, TreeMap::new,
    Collectors.filtering(s -> !s.startsWith("b"), Collectors.counting())));
// {1=1, 2=0, 3=1}   la clé 2 existe, avec un compte de 0

words.stream().filter(s -> !s.startsWith("b"))
    .collect(Collectors.groupingBy(String::length, TreeMap::new, Collectors.counting()));
// {1=1, 3=1}        filtré avant le regroupement : la clé 2 disparaît` },
        { h: "partitioningBy" },
        { list: [
          "`partitioningBy(Predicate<T>)` → `Map<Boolean, List<T>>` ; `partitioningBy(Predicate<T>, downstream)` → `Map<Boolean, D>`.",
          "La map contient **toujours les deux clés** `false` et `true`, même si une partition (ou le stream entier) est vide. Elle s'affiche dans l'ordre `false` puis `true`.",
          "Pas de forme permettant de choisir le type de map."
        ] },
        { code: String.raw`Stream.of(1, 3, 5).collect(Collectors.partitioningBy(n -> n % 2 == 0));
// {false=[1, 3, 5], true=[]}
Stream.of(1, 3, 5).collect(Collectors.groupingBy(n -> n % 2 == 0));
// {false=[1, 3, 5]}` },
        { trap: "`partitioningBy` prend un `Predicate`, `groupingBy` une `Function`. Avec un classifier booléen, `groupingBy` ne crée que les clés réellement rencontrées, alors que `partitioningBy` crée toujours les deux." }
      ]
    },
    {
      title: "Streams parallèles",
      blocks: [
        { list: [
          "Création : `collection.parallelStream()` ou l'opération intermédiaire `parallel()` sur un stream existant. `sequential()` fait l'inverse, `isParallel()` interroge.",
          "Un pipeline est **entièrement** parallèle ou entièrement séquentiel : c'est le dernier appel à `parallel()` / `sequential()` avant l'opération terminale qui décide pour tout le pipeline.",
          "L'exécution utilise par défaut le `ForkJoinPool` commun ; le résultat d'un pipeline correct est le même qu'en séquentiel, seul l'ordre d'exécution des lambdas change.",
          "Le parallélisme n'est pas toujours plus rapide : coût du découpage et de la fusion, petites collections, sources difficiles à découper (`LinkedList`, `Stream.iterate`), opérations qui dépendent de l'ordre (`limit`, `skip`, `findFirst`, `sorted`, `distinct`)."
        ] },
        { h: "Ordre" },
        { table: { head: ["Opération sur un stream parallèle ordonné", "Comportement"], rows: [
          ["`forEach`", "ordre **imprévisible**"],
          ["`forEachOrdered`", "ordre de rencontre respecté"],
          ["`findFirst`", "toujours le premier élément"],
          ["`findAny`", "n'importe quel élément"],
          ["`collect(Collectors.toList())`, `toList()`, `joining()`", "ordre de rencontre respecté"],
          ["`limit`, `skip`, `takeWhile`", "résultat identique au séquentiel (mais coûteux)"],
          ["`reduce` avec arguments corrects", "résultat identique au séquentiel"]
        ] } },
        { h: "Exigences de reduce" },
        { list: [
          "**Identité** : `combiner.apply(identity, u)` doit valoir `u` pour tout `u` (0 pour une somme, 1 pour un produit, chaîne vide pour une concaténation). En parallèle, l'identité est utilisée une fois **par segment**.",
          "**Accumulateur** et **combiner** : associatifs, sans état et sans interférence avec la source ; le combiner doit être compatible avec l'accumulateur.",
          "L'associativité suffit, la commutativité n'est pas requise : la concaténation de chaînes en parallèle donne toujours le même résultat."
        ] },
        { code: String.raw`List.of(1, 2, 3, 4).stream().reduce(1, Integer::sum);          // 11
List.of(1, 2, 3, 4).parallelStream().reduce(1, Integer::sum);  // imprévisible (ex. 14)
List.of(1, 2, 3, 4).parallelStream().reduce(0, (a, b) -> a - b);  // imprévisible
Stream.of("a", "b", "c", "d").parallel()
    .reduce("", (s, x) -> s + x, (s1, s2) -> s1 + s2);         // toujours abcd` },
        { h: "Lambdas avec état et effets de bord" },
        { code: String.raw`List<Integer> out = new ArrayList<>();
IntStream.range(0, 1000).parallel().forEach(out::add);   // data race
// taille imprévisible, éléments perdus, voire ArrayIndexOutOfBoundsException

List<Integer> ok = IntStream.range(0, 1000).parallel().boxed().toList();  // correct, ordonné` },
        { trap: "Modifier une collection non thread-safe depuis un lambda d'un stream parallèle donne un résultat imprévisible. La bonne réponse à l'examen est celle qui parle de résultat non déterministe, pas « 1000 » ni « ne compile pas »." },
        { trap: "`forEachOrdered` garantit l'ordre de l'action finale, pas celui des étapes précédentes : un `peek` ou un `map` avec effet de bord placé avant s'exécute toujours dans un ordre imprévisible en parallèle." },
        { tip: "Pour des regroupements parallèles efficaces il existe `Collectors.toConcurrentMap` et `Collectors.groupingByConcurrent` (résultat `ConcurrentMap`). `unordered()` relâche la contrainte d'ordre et peut accélérer `limit`, `skip` ou `distinct` en parallèle." }
      ]
    }
  ],
  questions: [
    {
      id: "streams-001",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`var list = List.of("a", "b", "c");
Stream<String> s = list.stream()
    .filter(x -> { System.out.print(x); return true; })
    .map(String::toUpperCase);
System.out.print("done");`,
      options: ["done", "abcdone", "ABCdone", "doneabc", "The code does not compile"],
      answer: [0],
      explain: "Le pipeline n'a **aucune opération terminale** : `filter` et `map` sont des opérations intermédiaires lazy, leurs lambdas ne sont donc jamais appelés. Seul `done` est affiché. `abcdone` serait l'affichage si une opération terminale (par exemple `count()` ou `forEach`) suivait `map`. Le code compile sans problème : rien n'oblige à terminer un stream."
    },
    {
      id: "streams-002",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`Stream.of(1, 2, 3, 4, 5)
    .filter(n -> { System.out.print("f" + n); return n % 2 == 0; })
    .map(n -> { System.out.print("m" + n); return n * 10; })
    .limit(1)
    .forEach(n -> System.out.print("e" + n));`,
      options: [
        "f1f2m2e20",
        "f1f2f3f4f5m2m4e20",
        "f1f2f3f4f5m2e20",
        "f1f2m2e20f3f4m4f5",
        "f1f2m2e20f3f4f5"
      ],
      answer: [0],
      explain: "Le traitement est **vertical** : chaque élément traverse tout le pipeline avant que le suivant ne soit tiré. 1 est rejeté par `filter` (`f1`), 2 passe (`f2`), est transformé (`m2`), franchit `limit(1)` et est affiché (`e20`). `limit` est short-circuit : une fois sa limite atteinte, plus aucun élément n'est tiré de la source, donc 3, 4 et 5 ne sont jamais filtrés. Les réponses commençant par `f1f2f3f4f5` supposent à tort un traitement horizontal (étape par étape)."
    },
    {
      id: "streams-003",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`Stream<Integer> s = Stream.of(1, 2, 3);
s.map(x -> x * 2);
s.forEach(System.out::print);`,
      options: [
        "123",
        "246",
        "The code does not compile",
        "An IllegalStateException is thrown at runtime",
        "Nothing is printed"
      ],
      answer: [3],
      explain: "Un stream ne peut être utilisé qu'**une seule fois**. L'appel `s.map(...)` lie déjà `s` à un pipeline, même si le stream renvoyé est ignoré. Le second appel sur le même objet, `s.forEach(...)`, lève donc `IllegalStateException` (stream has already been operated upon or closed). Le code compile. Pour obtenir `246`, il aurait fallu chaîner : `s.map(x -> x * 2).forEach(...)`. `123` supposerait que `map` est sans effet sur `s`, ce qui est faux."
    },
    {
      id: "streams-004",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`Stream.iterate(1, n -> n < 20, n -> n * 3)
    .forEach(System.out::print);`,
      options: ["139", "13927", "3927", "The code never terminates", "The code does not compile"],
      answer: [0],
      explain: "La forme à trois arguments `Stream.iterate(seed, hasNext, next)` se comporte comme une boucle `for` : le prédicat est testé **avant** d'émettre chaque élément, y compris le premier. On obtient 1, 3, 9 ; 27 échoue au test `n < 20` et le stream se termine sans l'émettre. `13927` est le piège d'un test effectué après l'émission. Seule la forme à deux arguments `iterate(seed, next)` est infinie."
    },
    {
      id: "streams-005",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`int[] data = {1, 2, 3};
System.out.print(Stream.of(data).count());
System.out.print(Arrays.stream(data).count());
System.out.print(IntStream.range(1, 3).count());
System.out.print(IntStream.rangeClosed(1, 3).count());`,
      options: ["1323", "3323", "1333", "3333", "The code does not compile"],
      answer: [0],
      explain: "`Stream.of(data)` avec un `int[]` crée un `Stream<int[]>` contenant **un seul** élément (le tableau lui-même) : les types primitifs ne peuvent pas servir d'argument de type pour le varargs `T...`. `Arrays.stream(int[])` renvoie un `IntStream` de 3 éléments. `IntStream.range(1, 3)` exclut la borne supérieure (1, 2 : 2 éléments), `rangeClosed(1, 3)` l'inclut (3 éléments). D'où `1323`."
    },
    {
      id: "streams-006",
      difficulty: 3,
      q: "Which of the following expressions never complete when evaluated? (Choose two.)",
      options: [
        String.raw`Stream.generate(() -> 1).noneMatch(n -> n > 5)`,
        String.raw`Stream.iterate(1, n -> n + 1).noneMatch(n -> n > 5)`,
        String.raw`Stream.generate(() -> 1).distinct().limit(2).count()`,
        String.raw`Stream.generate(() -> 1).limit(2).distinct().count()`,
        String.raw`Stream.iterate(1, n -> n + 1).filter(n -> n % 2 == 0).findFirst()`,
        String.raw`Stream.iterate(1, n -> n + 1).takeWhile(n -> n < 4).count()`
      ],
      answer: [0, 2],
      explain: "`noneMatch` ne s'arrête que lorsqu'un élément **correspond** au prédicat : avec un flux infini de 1, aucun n'est supérieur à 5, l'évaluation ne finit jamais. Avec `iterate(1, n -> n + 1)`, l'élément 6 correspond et `noneMatch` renvoie `false`. `distinct()` ne laisse passer qu'un seul 1 ; `limit(2)` attend indéfiniment un second élément, alors que `limit(2).distinct()` borne d'abord le flux (résultat 1). `filter(...).findFirst()` s'arrête au premier nombre pair (2) et `takeWhile(n -> n < 4)` coupe le flux à l'élément 4 (résultat 3)."
    },
    {
      id: "streams-007",
      difficulty: 2,
      q: "Which line, inserted at // n1, makes the code print 123?",
      code: String.raw`var data = List.of(List.of(1, 2), List.<Integer>of(), List.of(3));
data.stream()
    // n1
    .forEach(System.out::print);`,
      options: [
        ".flatMap(List::stream)",
        ".flatMap(l -> l)",
        ".map(List::stream)",
        ".flatMap(Stream::of)",
        ".map(l -> l)"
      ],
      answer: [0],
      explain: "`flatMap` attend une `Function<T, Stream<R>>` : `List::stream` transforme chaque liste en stream et les aplatit en 1, 2, 3 (la liste vide ne produit rien). `.flatMap(l -> l)` ne compile pas, car une `List` n'est pas un `Stream`. `.map(List::stream)` donne un `Stream<Stream<Integer>>` et affiche trois références d'objets stream. `.flatMap(Stream::of)` emballe chaque liste dans un stream d'un élément puis l'aplatit : on retrouve les trois listes et l'affichage est `[1, 2][][3]`, comme avec `.map(l -> l)`."
    },
    {
      id: "streams-008",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`Stream.of(1, 2, 3, 4)
    .<String>mapMulti((n, sink) -> {
        if (n % 2 == 0) {
            sink.accept("a" + n);
            sink.accept("b" + n);
        }
    })
    .forEach(System.out::print);`,
      options: ["a2b2a4b4", "a2a4b2b4", "24", "a1b1a2b2a3b3a4b4", "The code does not compile"],
      answer: [0],
      explain: "`mapMulti` (Java 16) reçoit un `BiConsumer<T, Consumer<R>>` : pour chaque élément, le lambda pousse zéro, un ou plusieurs résultats dans `sink`. Les impairs ne poussent rien (ils disparaissent), 2 pousse `a2` puis `b2`, 4 pousse `a4` puis `b4`, dans l'ordre de traitement des éléments : `a2b2a4b4`. Le témoin de type `<String>` est légal ; dans une chaîne d'appels comme celle-ci, sans lui, `R` serait inféré en `Object` et le résultat serait un `Stream<Object>` (ce qui compilerait encore ici et afficherait la même chose)."
    },
    {
      id: "streams-009",
      difficulty: 2,
      q: "Given the following record, what is the result of executing the code?",
      code: String.raw`record Item(String name) {}

// inside a method:
Stream.of(new Item("b"), new Item("a"))
    .sorted()
    .forEach(System.out::print);`,
      options: [
        "Item[name=a]Item[name=b]",
        "Item[name=b]Item[name=a]",
        "The code does not compile because Item does not implement Comparable",
        "A ClassCastException is thrown at runtime",
        "An IllegalStateException is thrown at runtime"
      ],
      answer: [3],
      explain: "`sorted()` sans argument trie selon l'ordre naturel, mais sa signature n'impose **aucune contrainte de type** : le code compile. À l'exécution de l'opération terminale, le tri tente de convertir les `Item` en `Comparable` et lève `ClassCastException`, car un record n'implémente pas `Comparable` automatiquement. Pour trier il faudrait `sorted(Comparator.comparing(Item::name))` ou faire implémenter `Comparable<Item>` au record."
    },
    {
      id: "streams-010",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`Stream.of(1, 2, 3, 1, 5).takeWhile(n -> n < 3).forEach(System.out::print);
System.out.print(" ");
Stream.of(1, 2, 3, 1, 5).dropWhile(n -> n < 3).forEach(System.out::print);`,
      options: ["12 315", "121 35", "12 35", "121 315"],
      answer: [0],
      explain: "`takeWhile` prend les éléments tant que le prédicat est vrai et **s'arrête définitivement** au premier échec (3) : `12`, le second 1 n'est jamais examiné. `dropWhile` ignore les éléments tant que le prédicat est vrai puis laisse passer **tout le reste** sans retester : `315`. Les réponses contenant `121` ou `35` confondent ces opérations avec `filter`, qui évalue le prédicat sur chaque élément."
    },
    {
      id: "streams-011",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`var m = Stream.of("bb", "a", "ccc")
    .min((x, y) -> y.length() - x.length());
System.out.println(m.get());`,
      options: ["a", "ccc", "bb", "Optional[ccc]", "The code does not compile"],
      answer: [1],
      explain: "`min(Comparator)` renvoie un `Optional<String>` contenant le plus petit élément **selon le comparateur fourni**. Ici le comparateur est inversé (`y.length() - x.length()`) : la chaîne la plus longue est considérée comme la plus petite, donc `min` renvoie `ccc`. `m.get()` extrait la valeur, l'affichage n'est donc pas `Optional[ccc]` (ce serait le cas en affichant `m`). `a` est la réponse si l'on oublie que le comparateur est inversé."
    },
    {
      id: "streams-012",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`Predicate<String> p = s -> s.length() > 3;
System.out.println(Stream.<String>empty().allMatch(p) + " "
    + Stream.<String>empty().anyMatch(p) + " "
    + Stream.<String>empty().noneMatch(p));`,
      options: [
        "true false true",
        "false false true",
        "false false false",
        "true true true",
        "A NoSuchElementException is thrown at runtime"
      ],
      answer: [0],
      explain: "Sur un stream vide, `allMatch` renvoie `true` (aucun élément ne contredit le prédicat), `anyMatch` renvoie `false` (aucun élément ne le satisfait) et `noneMatch` renvoie `true`. Ces opérations renvoient un `boolean` et ne lèvent jamais `NoSuchElementException`. Le piège classique est de croire que `allMatch` vaut `false` quand il n'y a rien à tester."
    },
    {
      id: "streams-013",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`System.out.print(Stream.<Integer>empty().reduce(Integer::sum));
System.out.print(" " + Stream.<Integer>empty().reduce(5, Integer::sum));
System.out.print(" " + Stream.of(1, 2, 3).reduce(5, Integer::sum));`,
      options: [
        "Optional.empty 5 11",
        "0 5 11",
        "Optional.empty Optional[5] Optional[11]",
        "Optional.empty 5 6",
        "Optional.empty 0 6"
      ],
      answer: [0],
      explain: "`reduce(BinaryOperator)` renvoie un `Optional<T>` : vide pour un stream vide, d'où `Optional.empty`. `reduce(identity, accumulator)` renvoie directement un `T` (pas un `Optional`) : l'identité 5 pour un stream vide, et 5 + 1 + 2 + 3 = 11 sinon, car l'identité sert de valeur de départ. `6` oublie que la valeur initiale 5 participe au calcul (5 n'est d'ailleurs pas une vraie identité pour l'addition, ce qui poserait problème en parallèle)."
    },
    {
      id: "streams-014",
      difficulty: 3,
      q: "Given the declaration below, which statements compile? Each statement is considered independently. (Choose two.)",
      code: String.raw`Stream<String> s = Stream.of("a", "bb", "ccc");`,
      options: [
        String.raw`int n = s.reduce(0, (acc, x) -> acc + x.length());`,
        String.raw`int n = s.reduce(0, (acc, x) -> acc + x.length(), Integer::sum);`,
        String.raw`String r = s.reduce((a, b) -> a + b);`,
        String.raw`String r = s.reduce("", String::concat);`,
        String.raw`Optional<String> r = s.reduce("", String::concat);`
      ],
      answer: [1, 3],
      explain: "La forme `reduce(T identity, BinaryOperator<T>)` exige que l'identité soit du type des éléments : avec `0` sur un `Stream<String>`, la première instruction ne compile pas. Pour produire un autre type il faut la forme à trois arguments `reduce(U identity, BiFunction<U, T, U>, BinaryOperator<U>)`, qui compile et renvoie un `Integer`. La forme à un argument renvoie un `Optional<String>` : l'affecter à un `String` ne compile pas. La forme avec identité renvoie un `String` : l'affectation à `String` compile, celle à `Optional<String>` non."
    },
    {
      id: "streams-015",
      difficulty: 2,
      q: "Which code fragments can replace /* INSERT */ so that the statement compiles? (Choose two.)",
      code: String.raw`TreeSet<String> set = Stream.of("b", "a", "c")/* INSERT */;`,
      options: [
        ".collect(TreeSet::new, TreeSet::add, TreeSet::addAll)",
        ".collect(TreeSet::new, TreeSet::add)",
        ".collect(Collectors.toCollection(TreeSet::new))",
        ".collect(Collectors.toSet(TreeSet::new))",
        ".collect(TreeSet::new)"
      ],
      answer: [0, 2],
      explain: "`collect` n'existe que sous deux formes : `collect(Supplier, BiConsumer accumulator, BiConsumer combiner)` et `collect(Collector)`. La première réponse fournit bien les trois arguments (le combiner est obligatoire même en séquentiel) ; les versions à un ou deux arguments de références de méthode ne compilent pas. `Collectors.toCollection(TreeSet::new)` est le collector qui permet de choisir l'implémentation. `Collectors.toSet()` ne prend aucun argument : `toSet(TreeSet::new)` ne compile pas."
    },
    {
      id: "streams-016",
      difficulty: 1,
      q: "What is the result of executing the following code?",
      code: String.raw`List<String> a = Stream.of("x", "y").collect(Collectors.toList());
List<String> b = Stream.of("x", "y").toList();
a.add("z");                                   // n1
b.add("z");                                   // n2
System.out.println(a.size() + " " + b.size());`,
      options: [
        "3 3",
        "An UnsupportedOperationException is thrown at line n1",
        "An UnsupportedOperationException is thrown at line n2",
        "The code does not compile",
        "3 2"
      ],
      answer: [2],
      explain: "`Stream.toList()` (Java 16) renvoie une liste **non modifiable** : `b.add(\"z\")` lève `UnsupportedOperationException` à la ligne n2. `Collectors.toList()` renvoie en pratique une `ArrayList` modifiable (la Javadoc ne garantit ni le type ni la mutabilité), donc la ligne n1 passe. Le code compile car `add` fait partie de l'interface `List` ; l'erreur n'apparaît qu'à l'exécution, et aucune ligne `3 2` n'est affichée puisque l'exception interrompt le programme."
    },
    {
      id: "streams-017",
      difficulty: 2,
      q: "Which line fails to compile?",
      code: String.raw`Stream<Integer> a = IntStream.of(1, 2).boxed();                // n1
Stream<String> b = IntStream.of(1, 2).mapToObj(i -> "v" + i);  // n2
Stream<Integer> c = IntStream.of(1, 2).map(i -> i * 2);        // n3
DoubleStream d = IntStream.of(1, 2).asDoubleStream();          // n4
LongStream e = IntStream.of(1, 2).mapToLong(i -> i);           // n5`,
      options: ["n1", "n2", "n3", "n4", "n5"],
      answer: [2],
      explain: "Sur un `IntStream`, `map` prend un `IntUnaryOperator` et renvoie toujours un **`IntStream`** : l'affecter à un `Stream<Integer>` ne compile pas (ligne n3). Pour passer à un stream d'objets il faut `boxed()` (n1) ou `mapToObj` (n2). `asDoubleStream()` (n4) et `mapToLong` (n5) sont les conversions prévues vers les autres streams primitifs."
    },
    {
      id: "streams-018",
      difficulty: 2,
      q: "Which statements compile? (Choose three.)",
      options: [
        String.raw`int s = IntStream.of(1, 2).sum();`,
        String.raw`double a = IntStream.of(1, 2).average();`,
        String.raw`OptionalDouble a = IntStream.of(1, 2).average();`,
        String.raw`OptionalInt m = IntStream.of(1, 2).max();`,
        String.raw`Optional<Integer> m = IntStream.of(1, 2).max();`,
        String.raw`int c = IntStream.of(1, 2).count();`
      ],
      answer: [0, 2, 3],
      explain: "Sur un `IntStream` : `sum()` renvoie un `int` (0 si le stream est vide), `average()` renvoie un `OptionalDouble` (jamais un `double`, car la moyenne d'un stream vide n'existe pas), `max()` et `min()` ne prennent pas de comparateur et renvoient un `OptionalInt`, qui n'est pas un `Optional<Integer>`. `count()` renvoie un `long` quel que soit le type de stream : l'affecter à un `int` sans cast ne compile pas."
    },
    {
      id: "streams-019",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`IntSummaryStatistics st = Stream.of("a", "bbb", "cc")
    .mapToInt(String::length)
    .summaryStatistics();
System.out.println(st.getMin() + " " + st.getMax() + " "
    + st.getAverage() + " " + st.getSum() + " " + st.getCount());`,
      options: [
        "1 3 2.0 6 3",
        "1 3 2 6 3",
        "1 3 2.0 6.0 3",
        "OptionalInt[1] OptionalInt[3] OptionalDouble[2.0] 6 3",
        "The code does not compile"
      ],
      answer: [0],
      explain: "`summaryStatistics()` est une opération terminale des streams primitifs qui calcule tout en un seul parcours. Les getters de `IntSummaryStatistics` renvoient des valeurs simples et non des optionals : `getMin()` et `getMax()` des `int` (1 et 3), `getAverage()` un `double` (2.0), `getSum()` et `getCount()` des `long` (6 et 3). `mapToInt(String::length)` est bien nécessaire : `Stream<String>` n'a pas de méthode `summaryStatistics()`."
    },
    {
      id: "streams-020",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`var list = List.of("a", "bb", "cc");
Object o1 = list.stream().collect(Collectors.counting());
Object o2 = list.stream().collect(Collectors.averagingInt(String::length));
Object o3 = list.stream().collect(Collectors.summingInt(String::length));
Object o4 = list.stream().collect(Collectors.minBy(Comparator.naturalOrder()));
System.out.println(o1.getClass().getSimpleName() + " "
    + o2.getClass().getSimpleName() + " "
    + o3.getClass().getSimpleName() + " "
    + o4.getClass().getSimpleName());`,
      options: [
        "Long Double Integer Optional",
        "Long Double Integer String",
        "Integer Double Integer Optional",
        "Long Integer Integer Optional",
        "Integer Integer Integer String"
      ],
      answer: [0],
      explain: "`counting()` produit un `Long` (pas un `Integer`). `averagingInt` produit un **`Double`** : le suffixe `Int` décrit le type des valeurs extraites, pas celui du résultat. `summingInt` produit un `Integer`. `minBy` et `maxBy` produisent un `Optional<T>`, puisque le stream peut être vide ; ici `Optional[a]`, et non directement la `String`."
    },
    {
      id: "streams-021",
      difficulty: 1,
      q: "What is the result of executing the following code?",
      code: String.raw`Map<Integer, String> m = Stream.of("ab", "cd", "e")
    .collect(Collectors.toMap(String::length, s -> s));
System.out.println(m);`,
      options: [
        "{1=e, 2=ab}",
        "{1=e, 2=cd}",
        "{1=e, 2=abcd}",
        "An IllegalStateException is thrown at runtime",
        "The code does not compile"
      ],
      answer: [3],
      explain: "`toMap(keyMapper, valueMapper)` à deux arguments ne tolère pas les clés en double : `ab` et `cd` produisent toutes deux la clé 2, ce qui lève `IllegalStateException` (Duplicate key 2). Contrairement à `Map.put`, la dernière valeur n'écrase pas la précédente, et la première n'est pas conservée non plus. Pour fusionner il faut un troisième argument, par exemple `(x, y) -> x + y`, qui donnerait `{1=e, 2=abcd}`."
    },
    {
      id: "streams-022",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`var m = Stream.of("bb", "a", "cc", "d")
    .collect(Collectors.toMap(
        String::length,
        s -> s,
        (x, y) -> x + y,
        TreeMap::new));
System.out.println(m);`,
      options: [
        "{1=ad, 2=bbcc}",
        "{2=bbcc, 1=ad}",
        "{1=d, 2=cc}",
        "{1=a, 2=bb}",
        "An IllegalStateException is thrown at runtime"
      ],
      answer: [0],
      explain: "La forme à quatre arguments de `toMap` reçoit une fonction de fusion et une fabrique de map. En cas de clé en double, la fonction de fusion reçoit la valeur déjà présente puis la nouvelle : `bb` + `cc` donne `bbcc`, `a` + `d` donne `ad`. Aucune exception n'est donc levée. La map étant une `TreeMap`, les clés sont triées : `{1=ad, 2=bbcc}`, et non dans l'ordre d'insertion `{2=..., 1=...}`."
    },
    {
      id: "streams-023",
      difficulty: 3,
      q: "Given the declaration below, which statements compile? Each statement is considered independently. (Choose three.)",
      code: String.raw`Stream<String> s = Stream.of("a", "bb", "cc");`,
      options: [
        String.raw`Map<Integer, List<String>> m =
    s.collect(Collectors.groupingBy(String::length));`,
        String.raw`Map<Integer, Set<String>> m =
    s.collect(Collectors.groupingBy(String::length, Collectors.toSet()));`,
        String.raw`TreeMap<Integer, List<String>> m =
    s.collect(Collectors.groupingBy(String::length, TreeMap::new));`,
        String.raw`TreeMap<Integer, Long> m =
    s.collect(Collectors.groupingBy(String::length, TreeMap::new, Collectors.counting()));`,
        String.raw`Map<Integer, Integer> m =
    s.collect(Collectors.groupingBy(String::length, Collectors.counting()));`,
        String.raw`HashMap<Integer, List<String>> m =
    s.collect(Collectors.groupingBy(String::length));`
      ],
      answer: [0, 1, 3],
      explain: "`groupingBy(classifier)` donne un `Map<K, List<T>>` ; avec un downstream `toSet()` on obtient `Map<K, Set<T>>`. La forme à trois arguments est `groupingBy(classifier, mapFactory, downstream)` et renvoie le type de map fourni, ici `TreeMap<Integer, Long>`. Il n'existe pas de forme à deux arguments avec une fabrique de map : `TreeMap::new` n'est pas un `Collector`. `counting()` produit des `Long`, pas des `Integer`. Enfin, les formes à un ou deux arguments déclarent un `Map` : l'affecter à une `HashMap` ne compile pas, même si c'est l'implémentation utilisée en pratique."
    },
    {
      id: "streams-024",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`var m = Stream.of("kiwi", "fig", "plum", "pear", "nut")
    .collect(Collectors.groupingBy(
        String::length,
        TreeMap::new,
        Collectors.mapping(s -> s.substring(0, 1), Collectors.joining())));
System.out.println(m);`,
      options: [
        "{3=fn, 4=kpp}",
        "{4=kpp, 3=fn}",
        "{3=[f, n], 4=[k, p, p]}",
        "{3=fignut, 4=kiwiplumpear}",
        "The code does not compile"
      ],
      answer: [0],
      explain: "Les mots sont regroupés par longueur dans une `TreeMap` (clés triées : 3 puis 4). Le downstream `mapping` transforme chaque mot en sa première lettre avant de le transmettre à `joining()`, qui concatène sans séparateur dans l'ordre de rencontre : `fn` pour fig et nut, `kpp` pour kiwi, plum et pear. La valeur est donc une `String` et non une liste ; `{4=kpp, 3=fn}` ignore le tri de la `TreeMap`."
    },
    {
      id: "streams-025",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`var p = Stream.of(1, 3, 5)
    .collect(Collectors.partitioningBy(n -> n % 2 == 0));
var g = Stream.of(1, 3, 5)
    .collect(Collectors.groupingBy(n -> n % 2 == 0));
System.out.println(p + " " + g);`,
      options: [
        "{false=[1, 3, 5], true=[]} {false=[1, 3, 5]}",
        "{false=[1, 3, 5]} {false=[1, 3, 5]}",
        "{false=[1, 3, 5], true=[]} {false=[1, 3, 5], true=[]}",
        "{false=[1, 3, 5]} {false=[1, 3, 5], true=[]}"
      ],
      answer: [0],
      explain: "`partitioningBy` renvoie un `Map<Boolean, List<T>>` qui contient **toujours les deux clés** `false` et `true`, même quand une partition est vide : `{false=[1, 3, 5], true=[]}`. `groupingBy`, même avec un classifier booléen, ne crée une clé que lorsqu'un élément y est classé : seule la clé `false` existe, d'où `{false=[1, 3, 5]}`."
    },
    {
      id: "streams-026",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`var words = List.of("a", "bb", "b", "ccc");
var m = words.stream().collect(Collectors.groupingBy(
    String::length,
    TreeMap::new,
    Collectors.filtering(s -> !s.startsWith("b"), Collectors.counting())));
System.out.println(m);`,
      options: [
        "{1=1, 2=0, 3=1}",
        "{1=1, 3=1}",
        "{1=2, 2=1, 3=1}",
        "{1=1, 2=1, 3=1}",
        "The code does not compile"
      ],
      answer: [0],
      explain: "`Collectors.filtering` filtre **à l'intérieur de chaque groupe**, après la classification. Les groupes sont créés pour les longueurs 1 (a, b), 2 (bb) et 3 (ccc) ; le filtre écarte ensuite `b` et `bb`, d'où les comptes 1, 0 et 1. La clé 2 subsiste avec la valeur 0. Avec un `filter(...)` placé avant `collect`, `bb` aurait été retiré avant le regroupement et la clé 2 n'existerait pas : `{1=1, 3=1}`. `{1=2, 2=1, 3=1}` ignore complètement le filtre."
    },
    {
      id: "streams-027",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`var r = Stream.of(3, 5, 11).collect(Collectors.teeing(
    Collectors.summingInt(n -> n),
    Collectors.counting(),
    (sum, n) -> sum / n));
System.out.println(r);`,
      options: [
        "6",
        "6.333333333333333",
        "6.0",
        "19",
        "The code does not compile"
      ],
      answer: [0],
      explain: "`Collectors.teeing` envoie chaque élément à deux collectors puis fusionne leurs résultats avec la `BiFunction`. `summingInt` donne un `Integer` (19) et `counting` un `Long` (3). `sum / n` est donc une division `int` / `long`, promue en `long` : une **division entière**, soit 6 (le type inféré de `r` est `Long`). Pour obtenir `6.333333333333333` il faudrait convertir un opérande en `double`, ou utiliser `averagingInt`."
    },
    {
      id: "streams-028",
      difficulty: 1,
      q: "Which statements about parallel streams are true? (Choose two.)",
      options: [
        "`parallel()` is an intermediate operation; the pipeline still needs a terminal operation to run",
        "If both `parallel()` and `sequential()` are called on a pipeline, the last call applies to the whole pipeline",
        "A parallel stream is always faster than the equivalent sequential stream",
        "`findFirst()` on a parallel stream created from a `List` may return any element",
        "`forEach` on a parallel stream created from a `List` processes the elements in encounter order"
      ],
      answer: [0, 1],
      explain: "`parallel()` et `sequential()` sont des opérations intermédiaires qui ne font que positionner un indicateur : le pipeline est exécuté entièrement dans le mode fixé par le **dernier** appel, et seulement lorsqu'une opération terminale est invoquée. Le parallélisme n'est pas toujours plus rapide (coût de découpage et de fusion, petites sources, opérations ordonnées). `findFirst()` respecte l'ordre de rencontre même en parallèle : c'est `findAny()` qui peut renvoyer n'importe quel élément. `forEach` ne garantit aucun ordre en parallèle ; c'est le rôle de `forEachOrdered`."
    },
    {
      id: "streams-029",
      difficulty: 3,
      q: "Which statements are true about the following code? (Choose three.)",
      code: String.raw`var list = List.of(1, 2, 3, 4, 5);
list.parallelStream().forEach(System.out::print);              // n1
System.out.println();
list.parallelStream().forEachOrdered(System.out::print);       // n2
System.out.println();
System.out.println(list.parallelStream().findFirst().get());   // n3
System.out.println(list.parallelStream().findAny().get());     // n4`,
      options: [
        "Line n1 always prints 12345",
        "Line n1 may print the five digits in a different order on each run",
        "Line n2 always prints 12345",
        "Line n3 always prints 1",
        "Line n3 may print any of the five elements",
        "Line n4 always prints 1"
      ],
      answer: [1, 2, 3],
      explain: "Sur un stream parallèle, `forEach` exécute l'action dans un ordre **non déterministe** : la ligne n1 affiche bien les cinq chiffres, mais dans un ordre qui peut changer d'une exécution à l'autre. `forEachOrdered` respecte l'ordre de rencontre de la liste, donc n2 affiche toujours `12345`. `findFirst()` renvoie toujours le premier élément dans l'ordre de rencontre (1), même en parallèle. `findAny()` peut renvoyer n'importe quel élément : on ne peut pas affirmer que n4 affiche toujours 1."
    },
    {
      id: "streams-030",
      difficulty: 2,
      q: "Which statement is true about the following code?",
      code: String.raw`String r = Stream.of("a", "b", "c", "d")
    .parallel()
    .reduce("", (s, x) -> s + x, (s1, s2) -> s1 + s2);
System.out.println(r);`,
      options: [
        "It always prints abcd",
        "It prints the four letters in an order that may change on each run",
        "It may print fewer than four letters",
        "It does not compile because a parallel stream cannot use the three-argument reduce",
        "It always prints dcba"
      ],
      answer: [0],
      explain: "Les exigences de `reduce` sont respectées : la chaîne vide est une vraie identité pour la concaténation, l'accumulateur et le combiner sont **associatifs**, sans état, et compatibles entre eux. La commutativité n'est pas requise : le framework combine les résultats partiels en respectant l'ordre de rencontre. Le résultat est donc toujours `abcd`, comme en séquentiel. Seul l'ordre d'exécution des lambdas varie, pas le résultat."
    },
    {
      id: "streams-031",
      difficulty: 3,
      q: "Which statement is true about the following code?",
      code: String.raw`System.out.println(
    List.of(1, 2, 3, 4).parallelStream().reduce(1, Integer::sum));`,
      options: [
        "It always prints 10",
        "It always prints 11",
        "The printed value is not guaranteed, because 1 is not an identity value for addition",
        "It does not compile because the two-argument reduce requires a combiner on a parallel stream",
        "It throws an IllegalStateException at runtime"
      ],
      answer: [2],
      explain: "L'identité passée à `reduce` doit vérifier `accumulator(identity, x) == x` pour tout `x` ; pour une addition c'est 0. Avec 1, un stream séquentiel donnerait 11, mais en parallèle l'identité est utilisée comme valeur de départ de **chaque segment** : le résultat dépend du découpage (par exemple 14 si les quatre éléments sont traités séparément). Aucune exception n'est levée et le code compile : la forme à deux arguments utilise l'accumulateur comme combiner."
    },
    {
      id: "streams-032",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`List<Integer> out = new ArrayList<>();
IntStream.range(0, 1000).parallel().forEach(out::add);
System.out.println(out.size());`,
      options: [
        "It always prints 1000, with the elements in encounter order",
        "It always prints 1000, but the elements may be in any order",
        "The result is unpredictable: elements may be lost or an exception may be thrown",
        "The code does not compile because the lambda modifies a local variable",
        "It always prints 0"
      ],
      answer: [2],
      explain: "Le lambda a un **effet de bord** sur une `ArrayList`, qui n'est pas thread-safe, depuis plusieurs threads du stream parallèle : c'est une data race. Des ajouts peuvent être perdus (taille inférieure à 1000) et une `ArrayIndexOutOfBoundsException` peut même survenir pendant un redimensionnement. Le code compile : `out` est effectivement finale, c'est l'objet référencé qui est modifié, pas la variable. La solution correcte est de laisser le stream construire le résultat : `IntStream.range(0, 1000).parallel().boxed().toList()`."
    }
  ]
});
