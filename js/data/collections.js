OCP.register({
  topic: 'collections',
  course: [
    {
      title: "Tableaux : déclaration, création, valeurs par défaut",
      blocks: [
        { p: "Un tableau est un **objet** de taille fixe. Sa taille se lit avec le champ `length` (pas de parenthèses), ses indices vont de `0` à `length - 1` ; tout accès hors bornes lève `ArrayIndexOutOfBoundsException`." },
        { h: "Position des crochets" },
        { code: String.raw`int[] p, q;     // p et q sont des int[]
int r[], s;     // r est un int[], s est un simple int
int[] t[], u;   // t est un int[][], u est un int[]` },
        { p: "Les crochets placés **après le type** s'appliquent à toutes les variables de la déclaration ; les crochets placés **après un nom** ne s'appliquent qu'à cette variable (et s'ajoutent à ceux du type)." },
        { h: "Formes de création" },
        { table: { head: ["Code", "Résultat"], rows: [
          ["`new int[3]`", "compile : 3 éléments à la valeur par défaut"],
          ["`new int[]{1, 2, 3}`", "compile : taille déduite"],
          ["`int[] a = {1, 2, 3};`", "compile : initialiseur court, **uniquement dans la déclaration**"],
          ["`new int[3]{1, 2, 3}`", "ne compile pas : taille **ou** initialiseur, jamais les deux"],
          ["`new int[]`", "ne compile pas : dimension manquante"],
          ["`a = {1, 2};` (affectation séparée)", "ne compile pas"],
          ["`var e = {1, 2};`", "ne compile pas : `var` ne peut pas inférer le type"],
          ["`var e = new int[]{1, 2};`", "compile (`var[] e` ne compile pas)"],
          ["`new int[0]`", "compile : tableau vide"],
          ["`new int[-1]`", "compile, mais `NegativeArraySizeException` à l'exécution"]
        ] } },
        { h: "Valeurs par défaut des éléments" },
        { list: [
          "`0` pour `byte`, `short`, `int`, `long` ; `0.0` pour `float` et `double`",
          "`'\\u0000'` pour `char` ; `false` pour `boolean`",
          "`null` pour tout type référence (`String[]`, `Integer[]`, tableaux de tableaux)"
        ] },
        { trap: "Les éléments d'un tableau sont toujours initialisés, même pour un tableau local. C'est la **variable** locale elle-même qui doit être affectée avant utilisation." },
        { trap: "`a.equals(b)` sur des tableaux compare les **références** (méthode héritée de `Object`), et `System.out.println(a)` affiche quelque chose comme `[I@1b6d3586`. Utilisez `Arrays.equals` et `Arrays.toString`." }
      ]
    },
    {
      title: "Tableaux multidimensionnels et covariance",
      blocks: [
        { p: "Un tableau à plusieurs dimensions est un **tableau de tableaux**. Seule la première dimension est obligatoire à la création ; les lignes peuvent avoir des longueurs différentes (tableau irrégulier, *jagged array*)." },
        { code: String.raw`int[][] m = new int[3][];      // 3 lignes, toutes null
m[0] = new int[2];             // {0, 0}
m[1] = new int[]{1, 2, 3};
int[][] n = {{1}, {2, 3}};     // n[1].length vaut 2
int[][] bad = new int[][3];    // ne compile pas` },
        { trap: "Avec `new int[3][]`, les lignes valent `null` : `m[2].length` ou `m[2][0]` lève `NullPointerException`. Avec `new int[3][2]`, toutes les lignes sont créées." },
        { h: "Covariance des tableaux" },
        { p: "Si `B` est un sous-type de `A`, alors `B[]` est un sous-type de `A[]`. Le compilateur accepte donc `Object[] o = new String[1];`, mais la JVM vérifie chaque écriture avec le type **réel** du tableau." },
        { code: String.raw`Number[] nums = new Integer[2];   // compile (covariance)
nums[0] = 10;                     // OK : Integer
nums[1] = 2.5;                    // compile, mais ArrayStoreException` },
        { list: [
          "La covariance ne concerne que les types référence : `long[] b = new int[2];` et `Object[] o = new int[2];` ne compilent pas (mais `Object o = new int[2];` compile).",
          "Les génériques ne sont **pas** covariants : `List<Object> l = new ArrayList<String>();` ne compile pas. Le problème est détecté à la compilation au lieu de l'exécution."
        ] }
      ]
    },
    {
      title: "La classe Arrays",
      blocks: [
        { table: { head: ["Méthode", "Comportement à retenir"], rows: [
          ["`Arrays.sort(a)`", "tri sur place, ordre naturel ; les éléments d'un tableau d'objets doivent être `Comparable`, sinon `ClassCastException`"],
          ["`Arrays.sort(a, comparator)`", "uniquement pour les tableaux d'objets (`Integer[]`, pas `int[]`)"],
          ["`Arrays.binarySearch(a, key)`", "index si trouvé ; sinon `-(point d'insertion) - 1` ; résultat **indéfini** si le tableau n'est pas trié"],
          ["`Arrays.equals(a, b)`", "même longueur et mêmes éléments dans le même ordre"],
          ["`Arrays.compare(a, b)`", "comparaison lexicographique : négatif, zéro ou positif"],
          ["`Arrays.mismatch(a, b)`", "index de la première différence, `-1` si les tableaux sont égaux"],
          ["`Arrays.fill(a, v)`", "affecte `v` à tous les éléments"],
          ["`Arrays.toString(a)`", "`[1, 2, 3]` ; `Arrays.deepToString` pour les tableaux de tableaux"],
          ["`Arrays.asList(a)`", "liste de **taille fixe** adossée au tableau"]
        ] } },
        { h: "binarySearch" },
        { code: String.raw`int[] a = {10, 20, 30, 40};
Arrays.binarySearch(a, 30);   //  2
Arrays.binarySearch(a, 25);   // -3 : s'insérerait à l'index 2 -> -(2) - 1
Arrays.binarySearch(a, 50);   // -5 : s'insérerait à l'index 4 -> -(4) - 1
Arrays.binarySearch(a, 5);    // -1 : s'insérerait à l'index 0` },
        { tip: "Élément absent : prenez l'index où il devrait s'insérer, changez le signe, retirez 1. Le résultat n'est donc jamais `0` pour un élément absent." },
        { h: "compare et mismatch" },
        { list: [
          "`compare` : on compare les éléments un à un ; à la première différence, le résultat est celui de la comparaison de ces deux éléments (`Integer.compare` pour un `int[]`).",
          "Si l'un des tableaux est un **préfixe** de l'autre, le plus court est le plus petit : le résultat a le signe de `a.length - b.length` (la Javadoc ne garantit que le signe ; en pratique c'est cette différence qui est renvoyée).",
          "Un tableau `null` est plus petit que tout tableau non `null`.",
          "`mismatch` : si l'un est préfixe de l'autre, renvoie la longueur du plus court ; `-1` signifie « aucune différence »."
        ] },
        { code: String.raw`int[] a = {1, 2, 3}, b = {1, 2, 3, 4}, c = {1, 5};
Arrays.compare(a, b);    // -1 (a est un préfixe de b : 3 - 4)
Arrays.mismatch(a, b);   //  3
Arrays.compare(c, a);    //  1 (5 > 2 à l'index 1, la longueur ne compte pas)
Arrays.mismatch(a, a);   // -1` },
        { h: "Arrays.asList" },
        { list: [
          "La liste est une **vue** du tableau : `set` et `sort` sont autorisés et modifient le tableau (et inversement).",
          "Sa taille est fixe : `add` et `remove` lèvent `UnsupportedOperationException`.",
          "Elle accepte les éléments `null`, contrairement à `List.of`.",
          "`Arrays.asList(new int[]{1, 2})` donne une `List<int[]>` de taille 1 (pas d'autoboxing d'un tableau de primitifs)."
        ] }
      ]
    },
    {
      title: "List, Set, Queue et Deque : méthodes clés",
      blocks: [
        { table: { head: ["Implémentation", "Ordre", "Doublons", "Particularité"], rows: [
          ["`ArrayList`", "index", "oui", "accès par index rapide"],
          ["`LinkedList`", "index", "oui", "implémente `List` **et** `Deque`"],
          ["`HashSet`", "aucun ordre garanti", "non", "s'appuie sur `hashCode` / `equals`"],
          ["`LinkedHashSet`", "ordre d'insertion", "non", "`SequencedSet` depuis Java 21"],
          ["`TreeSet`", "trié", "non", "`NavigableSet`, s'appuie sur `compareTo` / `compare`"],
          ["`ArrayDeque`", "file / pile", "oui", "refuse `null`"],
          ["`HashMap`", "aucun ordre garanti", "clés uniques", ""],
          ["`LinkedHashMap`", "ordre d'insertion des clés", "clés uniques", "`SequencedMap` depuis Java 21"],
          ["`TreeMap`", "clés triées", "clés uniques", "`NavigableMap`"]
        ] } },
        { h: "Valeurs de retour à connaître" },
        { list: [
          "`Collection.add(e)` renvoie un `boolean` : toujours `true` pour une `List`, `false` pour un `Set` si l'élément est déjà présent.",
          "`List.add(int index, E e)` renvoie `void` ; `List.set(int, E)` renvoie l'**ancien** élément.",
          "`List.remove(int index)` renvoie l'élément supprimé ; `remove(Object o)` renvoie un `boolean` et ne supprime que la **première** occurrence.",
          "`Map.put(k, v)` renvoie l'ancienne valeur (ou `null`) ; `Map.remove(k)` renvoie la valeur supprimée (ou `null`)."
        ] },
        { trap: "Sur une `List<Integer>`, `list.remove(1)` appelle `remove(int index)` : aucune conversion en `Integer`. Pour supprimer la valeur 1, écrivez `list.remove(Integer.valueOf(1))`. Dans une boucle `for (Integer i : list)`, `list.remove(i)` appelle au contraire `remove(Object)`." },
        { h: "Queue et Deque" },
        { table: { head: ["Opération", "Lève une exception", "Renvoie une valeur spéciale"], rows: [
          ["Ajouter en queue", "`add(e)` / `addLast(e)`", "`offer(e)` / `offerLast(e)`"],
          ["Ajouter en tête", "`addFirst(e)` / `push(e)`", "`offerFirst(e)`"],
          ["Retirer la tête", "`remove()` / `removeFirst()` / `pop()`", "`poll()` / `pollFirst()` (renvoie `null`)"],
          ["Lire la tête", "`element()` / `getFirst()`", "`peek()` / `peekFirst()` (renvoie `null`)"],
          ["Retirer / lire la queue", "`removeLast()` / `getLast()`", "`pollLast()` / `peekLast()` (renvoient `null`)"]
        ] } },
        { p: "Sur une file vide, la colonne « exception » lève `NoSuchElementException`. `push` et `pop` travaillent sur la **tête** (pile LIFO) ; `offer` et `add` ajoutent en **queue** (file FIFO) ; `peek` et `poll` lisent toujours la tête." },
        { code: String.raw`Deque<Integer> d = new ArrayDeque<>();
d.push(1);         // [1]
d.offer(2);        // [1, 2]
d.push(3);         // [3, 1, 2]
d.offerFirst(4);   // [4, 3, 1, 2]
d.peek();          // 4 (ne retire rien)
d.pollLast();      // 2` },
        { h: "Gestion de null" },
        { table: { head: ["Implémentation", "null accepté ?"], rows: [
          ["`ArrayList`, `LinkedList`", "oui"],
          ["`HashSet`, `LinkedHashSet`", "oui (un seul)"],
          ["`TreeSet`", "non avec l'ordre naturel : `NullPointerException`"],
          ["`HashMap`, `LinkedHashMap`", "une clé `null`, valeurs `null` autorisées"],
          ["`TreeMap`", "clé `null` interdite avec l'ordre naturel (`NullPointerException`), valeurs `null` autorisées"],
          ["`ArrayDeque`", "non : `NullPointerException`"],
          ["`List.of`, `Set.of`, `Map.of`, `copyOf`", "non : `NullPointerException`, y compris pour `contains(null)`"],
          ["`Arrays.asList`, `Stream.toList()`", "oui"]
        ] } },
        { trap: "`ArrayDeque` refuse `null` parce que `poll()` et `peek()` renvoient `null` pour signaler une file vide. `LinkedList`, elle, accepte `null` : un `poll()` qui renvoie `null` y est donc ambigu." }
      ]
    },
    {
      title: "TreeSet et TreeMap : navigation",
      blocks: [
        { table: { head: ["NavigableSet", "NavigableMap", "Renvoie"], rows: [
          ["`lower(e)`", "`lowerKey(k)` / `lowerEntry(k)`", "le plus grand élément **strictement inférieur**"],
          ["`floor(e)`", "`floorKey(k)` / `floorEntry(k)`", "le plus grand élément **inférieur ou égal**"],
          ["`ceiling(e)`", "`ceilingKey(k)` / `ceilingEntry(k)`", "le plus petit élément **supérieur ou égal**"],
          ["`higher(e)`", "`higherKey(k)` / `higherEntry(k)`", "le plus petit élément **strictement supérieur**"],
          ["`first()` / `last()`", "`firstKey()` / `lastKey()`", "les extrémités (`NoSuchElementException` si vide)"],
          ["`pollFirst()` / `pollLast()`", "`pollFirstEntry()` / `pollLastEntry()`", "retire et renvoie l'extrémité, `null` si vide"],
          ["`descendingSet()`", "`descendingMap()`", "vue en ordre inverse"]
        ] } },
        { p: "`lower`, `floor`, `ceiling` et `higher` renvoient `null` s'il n'existe aucun élément correspondant (pas d'exception)." },
        { tip: "`floor` et `ceiling` (sol et plafond) acceptent l'égalité ; `lower` et `higher` sont stricts." },
        { h: "Sous-ensembles (vues)" },
        { list: [
          "`headSet(to)` : éléments strictement inférieurs à `to` (borne **exclue**).",
          "`tailSet(from)` : éléments supérieurs ou égaux à `from` (borne **incluse**).",
          "`subSet(from, to)` : `from` inclus, `to` exclu.",
          "Surcharges avec booléen : `headSet(to, true)`, `tailSet(from, false)`, `subSet(from, true, to, true)`.",
          "Même logique pour `headMap`, `tailMap`, `subMap` sur les clés."
        ] },
        { code: String.raw`NavigableSet<Integer> set = new TreeSet<>(List.of(10, 20, 30, 40));
set.floor(20);      // 20
set.lower(20);      // 10
set.ceiling(25);    // 30
set.higher(40);     // null
set.headSet(30);    // [10, 20]
set.tailSet(30);    // [30, 40]` },
        { trap: "Ces sous-ensembles sont des **vues** : un ajout dans la collection d'origine apparaît dans la vue s'il est dans l'intervalle, et ajouter dans la vue un élément hors intervalle lève `IllegalArgumentException`." }
      ]
    },
    {
      title: "Collections immuables et non modifiables",
      blocks: [
        { table: { head: ["Création", "add / remove", "set", "null", "Lien avec la source"], rows: [
          ["`List.of(...)`, `Set.of(...)`, `Map.of(...)`", "UOE", "UOE", "refusé (NPE)", "aucun"],
          ["`List.copyOf(c)`, `Set.copyOf(c)`, `Map.copyOf(m)`", "UOE", "UOE", "refusé (NPE)", "copie indépendante"],
          ["`Collections.unmodifiableList(l)`", "UOE", "UOE", "selon la source", "**vue** : reflète les changements de `l`"],
          ["`Arrays.asList(...)`", "UOE", "autorisé", "accepté", "vue du tableau"],
          ["`stream.toList()`", "UOE", "UOE", "accepté", "aucun"],
          ["`collect(Collectors.toList())`", "aucune garantie sur le type renvoyé", "", "accepté", "aucun"]
        ] } },
        { p: "UOE = `UnsupportedOperationException`, NPE = `NullPointerException`. Toute méthode de modification est concernée : `add`, `remove`, `clear`, `sort`, `removeIf`, `replaceAll`, `put`, `merge`…" },
        { list: [
          "`Set.of(\"a\", \"a\")` et `Map.of(\"k\", 1, \"k\", 2)` lèvent `IllegalArgumentException` (doublon). `List.of(\"a\", \"a\")` est valide.",
          "`Set.copyOf(collection)` élimine les doublons sans lever d'exception.",
          "`Map.of` accepte au plus 10 paires clé/valeur ; au-delà, `Map.ofEntries(Map.entry(k1, v1), Map.entry(k2, v2), ...)`.",
          "`Map.entry(k, v)` crée une entrée immuable qui refuse `null` pour la clé comme pour la valeur.",
          "L'ordre d'itération de `Set.of` et `Map.of` n'est pas défini.",
          "`List.of(1, 2).equals(Arrays.asList(1, 2))` vaut `true` : l'égalité des listes ne dépend pas de l'implémentation."
        ] },
        { code: String.raw`List<String> src = new ArrayList<>(List.of("x", "y"));
List<String> view = Collections.unmodifiableList(src);
List<String> copy = List.copyOf(src);
src.add("z");
view.size();   // 3 : la vue suit la source
copy.size();   // 2 : la copie est indépendante
view.add("w"); // UnsupportedOperationException` },
        { trap: "Ces opérations **compilent** toujours : l'interface `List` déclare `add`. L'échec est une `UnsupportedOperationException` à l'exécution, jamais une erreur de compilation." },
        { trap: "« Immuable » concerne la collection, pas ses éléments : une `List.of(sb)` contenant un `StringBuilder` laisse modifier ce `StringBuilder`." }
      ]
    },
    {
      title: "API de Map",
      blocks: [
        { table: { head: ["Méthode", "Effet", "Valeur renvoyée"], rows: [
          ["`getOrDefault(k, def)`", "aucune modification", "la valeur associée, ou `def` si la clé est **absente**"],
          ["`putIfAbsent(k, v)`", "écrit si la clé est absente ou associée à `null`", "la valeur **précédente** (`null` si elle a écrit)"],
          ["`merge(k, v, (old, new) -> ...)`", "clé absente ou valeur `null` : écrit `v` sans appeler la fonction ; sinon écrit le résultat de la fonction ; résultat `null` : **supprime** la clé", "la nouvelle valeur (ou `null`)"],
          ["`compute(k, (k, old) -> ...)`", "toujours appelée (`old` vaut `null` si absent) ; résultat `null` : supprime la clé", "la nouvelle valeur (ou `null`)"],
          ["`computeIfAbsent(k, k -> ...)`", "appelée si la clé est absente ou associée à `null` ; résultat `null` : rien n'est ajouté", "la valeur courante (existante ou calculée)"],
          ["`computeIfPresent(k, (k, old) -> ...)`", "appelée si la clé est présente avec une valeur non `null` ; résultat `null` : supprime la clé", "la nouvelle valeur, ou `null` si absente"],
          ["`replaceAll((k, v) -> ...)`", "remplace **chaque valeur** par le résultat", "`void`"],
          ["`forEach((k, v) -> ...)`", "parcourt les entrées avec un `BiConsumer`", "`void`"]
        ] } },
        { code: String.raw`Map<String, Integer> m = new TreeMap<>(Map.of("a", 1, "b", 2));
m.merge("a", 10, Integer::sum);       // a=11
m.merge("c", 10, Integer::sum);       // c=10, fonction non appelée
m.merge("b", 10, (o, n) -> null);     // b est supprimée
m.putIfAbsent("a", 5);                // renvoie 11, ne change rien
m.computeIfAbsent("d", k -> 7);       // renvoie 7, ajoute d=7
m.computeIfPresent("z", (k, v) -> 8); // renvoie null, n'ajoute rien` },
        { trap: "`getOrDefault` renvoie `null` (et non la valeur par défaut) si la clé est présente avec la valeur `null`. `putIfAbsent`, lui, remplace une valeur `null` existante." },
        { h: "Vues keySet, values, entrySet" },
        { list: [
          "`keySet()` renvoie un `Set<K>`, `values()` une `Collection<V>` (doublons possibles), `entrySet()` un `Set<Map.Entry<K, V>>`.",
          "Ce sont des vues : `entry.setValue(v)` pendant un parcours d'`entrySet()` modifie la map sans `ConcurrentModificationException` (ce n'est pas une modification structurelle).",
          "Une `Map` n'est pas une `Collection` et n'est pas `Iterable` : `for (var e : map)` ne compile pas, il faut passer par `entrySet()`, `keySet()` ou `values()`.",
          "Pas de méthode `add` ni `contains` sur `Map` : `put`, `containsKey`, `containsValue`."
        ] }
      ]
    },
    {
      title: "Collections séquencées (Java 21)",
      blocks: [
        { p: "Java 21 ajoute trois interfaces pour les collections ayant un **ordre de parcours défini** : `SequencedCollection`, `SequencedSet` et `SequencedMap`." },
        { table: { head: ["Interface", "Méthodes", "Implémentée par"], rows: [
          ["`SequencedCollection<E>`", "`addFirst`, `addLast`, `getFirst`, `getLast`, `removeFirst`, `removeLast`, `reversed()`", "`List` (`ArrayList`, `LinkedList`), `Deque` (`ArrayDeque`, `LinkedList`), et tous les `SequencedSet`"],
          ["`SequencedSet<E>`", "les mêmes ; `reversed()` renvoie un `SequencedSet`", "`LinkedHashSet`, `SortedSet` / `NavigableSet` (`TreeSet`)"],
          ["`SequencedMap<K, V>`", "`firstEntry`, `lastEntry`, `pollFirstEntry`, `pollLastEntry`, `putFirst`, `putLast`, `reversed()`, `sequencedKeySet()`, `sequencedValues()`, `sequencedEntrySet()`", "`LinkedHashMap`, `SortedMap` / `NavigableMap` (`TreeMap`)"]
        ] } },
        { list: [
          "`HashSet`, `HashMap` et `PriorityQueue` ne sont **pas** séquencés.",
          "`getFirst`, `getLast`, `removeFirst`, `removeLast` lèvent `NoSuchElementException` sur une collection vide.",
          "`firstEntry`, `lastEntry`, `pollFirstEntry`, `pollLastEntry` renvoient `null` sur une map vide.",
          "`reversed()` renvoie une **vue** : écrire dans la vue modifie la collection d'origine, et `rev.addFirst(x)` ajoute `x` à la **fin** de l'original.",
          "Les entrées renvoyées par `firstEntry()`, `lastEntry()`, `pollFirstEntry()` sont des instantanés : `setValue` lève `UnsupportedOperationException`."
        ] },
        { code: String.raw`List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
list.addFirst(0);                    // [0, 1, 2, 3]
List<Integer> rev = list.reversed(); // vue [3, 2, 1, 0]
rev.addFirst(9);                     // list = [0, 1, 2, 3, 9]

SequencedMap<String, Integer> m = new LinkedHashMap<>();
m.put("a", 1);
m.put("b", 2);
m.putFirst("c", 3);                  // {c=3, a=1, b=2}
m.putLast("a", 4);                   // {c=3, b=2, a=4} : a est déplacée` },
        { trap: "`TreeSet.addFirst` / `addLast` et `TreeMap.putFirst` / `putLast` lèvent `UnsupportedOperationException` : la position est imposée par le tri. Les méthodes de lecture et de retrait (`getFirst`, `removeLast`, `firstEntry`, `pollFirstEntry`, `reversed`) fonctionnent." },
        { trap: "Sur un `LinkedHashSet`, `add(e)` d'un élément déjà présent ne change rien, alors que `addFirst(e)` / `addLast(e)` le **déplacent**. Même différence entre `put` et `putFirst` / `putLast` sur une `LinkedHashMap`." },
        { trap: "Les collections immuables restent immuables : `List.of(1, 2).addFirst(0)` et `List.of(1, 2).reversed().add(3)` lèvent `UnsupportedOperationException`." }
      ]
    },
    {
      title: "Génériques : classes, méthodes, bornes, effacement",
      blocks: [
        { code: String.raw`class Crate<T> {                      // classe générique
    private T item;
    T get() { return item; }
}
interface Shipper<T> { void ship(T t); }
class A implements Shipper<String> { public void ship(String s) { } }
class B<U> implements Shipper<U> { public void ship(U u) { } }
class C implements Shipper { public void ship(Object o) { } }   // type brut

class Util {
    static <T> T first(List<T> list) { return list.get(0); }    // méthode générique
}
String s = Util.<String>first(List.of("a"));   // témoin de type explicite` },
        { list: [
          "Le paramètre de type d'une méthode générique se déclare **avant le type de retour** : `static <T> T first(...)`.",
          "Un témoin de type explicite exige un qualificateur : `Util.<String>first(x)` ou `this.<String>m(x)` ; `<String>first(x)` seul ne compile pas.",
          "Une méthode `<T> void print(T t)` dans une classe `Box<T>` déclare un **nouveau** `T` qui masque celui de la classe : cela compile.",
          "Borne : `<T extends Number>`, plusieurs bornes avec `&` : `<T extends Number & Comparable<T>>`. `<T super Integer>` n'existe pas : `super` est réservé aux jokers.",
          "Opérateur diamant `<>` : uniquement à droite, dans un `new` : `List<String> l = new ArrayList<>();`. `ArrayList<> l` ne compile pas. `var l = new ArrayList<>();` compile et donne un `ArrayList<Object>`.",
          "Pas de primitifs : `List<int>` ne compile pas."
        ] },
        { h: "Jokers (wildcards)" },
        { table: { head: ["Déclaration", "Accepte", "Lecture", "Écriture"], rows: [
          ["`List<?>`", "n'importe quelle `List<X>`", "`Object`", "uniquement `null`"],
          ["`List<? extends Number>`", "`List<Number>`, `List<Integer>`, `List<Double>`…", "`Number`", "uniquement `null`"],
          ["`List<? super Integer>`", "`List<Integer>`, `List<Number>`, `List<Object>`", "`Object`", "`Integer` (et ses sous-types)"]
        ] } },
        { tip: "PECS : *Producer Extends, Consumer Super*. On **lit** dans un `? extends`, on **écrit** dans un `? super`." },
        { code: String.raw`List<Number> a = new ArrayList<Integer>();            // ne compile pas
List<? extends Number> b = new ArrayList<Integer>();  // OK
b.add(1);                                             // ne compile pas
Number n = b.get(0);                                  // OK
List<? super Integer> c = new ArrayList<Number>();    // OK
c.add(1);                                             // OK
Integer i = c.get(0);                                 // ne compile pas (Object)
List<?> d = new ArrayList<? extends Number>();        // ne compile pas` },
        { trap: "Un joker ne peut pas être l'argument de type direct d'un `new` (`new ArrayList<?>()` ne compile pas), ni servir de nom de paramètre de type d'une classe ou d'une méthode. Imbriqué, il est permis : `new ArrayList<List<?>>()` compile." },
        { h: "Effacement de type et types bruts" },
        { p: "À la compilation, les paramètres de type sont remplacés par leur borne (`Object` par défaut) et des casts sont insérés. À l'exécution, une `List<String>` et une `List<Integer>` ont la même classe." },
        { table: { head: ["Code", "Pourquoi cela ne compile pas"], rows: [
          ["`new T()` / `new T[3]`", "le type réel est inconnu à l'exécution"],
          ["`new List<String>[2]`", "création d'un tableau générique interdite"],
          ["`static T shared;` dans `class Box<T>`", "`T` appartient à l'instance, pas à la classe"],
          ["`o instanceof T`", "`T` n'est pas réifiable"],
          ["`void m(List<String> l)` et `void m(List<Integer> l)`", "même effacement : *name clash*"],
          ["`catch (T e)`", "un paramètre de type est interdit dans un `catch`"]
        ] } },
        { p: "Un **type brut** (`List raw`) compile avec un avertissement *unchecked*. On peut y ajouter n'importe quoi, puis l'affecter à une `List<String>` : la `ClassCastException` n'apparaît qu'au moment où un élément est lu comme `String` (cast inséré par le compilateur)." },
        { code: String.raw`List raw = new ArrayList<String>();
raw.add(1);              // avertissement, mais compile et s'exécute
List<String> s = raw;    // avertissement, mais compile
s.size();                // 1
String x = s.get(0);     // ClassCastException` }
      ]
    },
    {
      title: "Trier : Comparable et Comparator",
      blocks: [
        { table: { head: ["", "`Comparable<T>`", "`Comparator<T>`"], rows: [
          ["Package", "`java.lang`", "`java.util`"],
          ["Méthode", "`int compareTo(T o)`", "`int compare(T a, T b)`"],
          ["Rôle", "ordre **naturel**, implémenté par la classe elle-même", "ordre externe, souvent une lambda"],
          ["Lambda ?", "à éviter (elle n'a pas accès à `this`)", "oui, interface fonctionnelle"]
        ] } },
        { p: "Résultat négatif : le premier est avant le second ; zéro : égaux pour le tri ; positif : après. `String`, les wrappers, `LocalDate` et les enums sont `Comparable`. Un **record** ou une classe ordinaire ne l'est pas tant qu'il ne l'implémente pas." },
        { h: "Fabriques de Comparator" },
        { list: [
          "`Comparator.comparing(P::name)` : compare selon une clé `Comparable`. Variantes primitives : `comparingInt`, `comparingLong`, `comparingDouble`.",
          "`Comparator.comparing(P::name, Comparator.reverseOrder())` : clé + comparateur pour cette clé.",
          "`.thenComparing(...)` : critère suivant, utilisé seulement en cas d'égalité.",
          "`.reversed()` : inverse **tout** le comparateur construit jusque-là.",
          "`Comparator.naturalOrder()`, `Comparator.reverseOrder()` : pour des éléments `Comparable`.",
          "`Comparator.nullsFirst(c)`, `Comparator.nullsLast(c)` : rendent un comparateur tolérant aux `null`."
        ] },
        { code: String.raw`record P(String name, int age) { }
// âge décroissant, puis nom décroissant
list.sort(Comparator.comparing(P::age).reversed()
        .thenComparing(P::name, Comparator.reverseOrder()));` },
        { trap: "`Comparator.comparing(p -> p.name()).reversed()` ne compile pas : sans type cible, le paramètre de la lambda est inféré comme `Object`. Solutions : `P::name`, ou `(P p) -> p.name()`. Sans `.reversed()`, la lambda compile car l'appel reçoit directement le type cible." },
        { trap: "`nullsFirst(c).reversed()` inverse aussi la position des `null` : ils se retrouvent à la fin." },
        { h: "Où le tri s'applique" },
        { list: [
          "`Collections.sort(list)` exige des éléments `Comparable`, sinon **erreur de compilation**. `Collections.sort(list, comparator)` accepte tout.",
          "`list.sort(comparator)` : l'argument est obligatoire ; `list.sort(null)` signifie « ordre naturel » et lève `ClassCastException` si les éléments ne sont pas `Comparable`.",
          "`new TreeSet<>()` / `new TreeMap<>()` sans comparateur **compilent** quel que soit le type ; la `ClassCastException` survient dès le **premier** `add` / `put` d'un élément non `Comparable`.",
          "`new TreeSet<>(comparator)` : le comparateur définit aussi l'unicité. Deux éléments pour lesquels `compare` renvoie 0 sont des doublons, même si `equals` renvoie `false`.",
          "Trier une liste contenant `null` avec l'ordre naturel lève `NullPointerException`.",
          "`Collections.binarySearch(list, key)` suit les mêmes règles que `Arrays.binarySearch`."
        ] }
      ]
    },
    {
      title: "Modifier une collection : removeIf, replaceAll, itération",
      blocks: [
        { list: [
          "`Collection.removeIf(Predicate)` : supprime les éléments qui vérifient le prédicat ; renvoie `true` si au moins un élément a été supprimé.",
          "`List.replaceAll(UnaryOperator)` : remplace chaque élément par le résultat ; renvoie `void`.",
          "`Iterable.forEach(Consumer)` : parcourt sans modifier la structure.",
          "`Map.replaceAll(BiFunction)` : remplace chaque valeur."
        ] },
        { code: String.raw`List<String> list = new ArrayList<>(List.of("ab", "c", "def", "g"));
boolean changed = list.removeIf(s -> s.length() == 1);   // true
list.replaceAll(String::toUpperCase);                    // [AB, DEF]` },
        { h: "ConcurrentModificationException" },
        { p: "Les itérateurs d'`ArrayList`, `HashMap`, `TreeSet`… sont *fail-fast* : si la collection est modifiée **structurellement** (ajout ou suppression) pendant un parcours autrement que par l'itérateur lui-même, le `next()` suivant lève `ConcurrentModificationException`. Aucun thread supplémentaire n'est nécessaire." },
        { code: String.raw`List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4));
for (Integer i : list) {
    if (i == 2) list.remove(i);      // ConcurrentModificationException au tour suivant
}
// Correct :
list.removeIf(i -> i == 2);
// ou
Iterator<Integer> it = list.iterator();
while (it.hasNext()) {
    if (it.next() == 2) it.remove();
}` },
        { list: [
          "`list.set(i, x)` et `entry.setValue(x)` ne sont pas des modifications structurelles : pas d'exception.",
          "Même problème avec `for (K k : map.keySet()) map.remove(k);`.",
          "`removeIf`, `replaceAll`, `sort` sur une collection immuable lèvent `UnsupportedOperationException`."
        ] },
        { trap: "Cas particulier : supprimer l'**avant-dernier** élément d'une `ArrayList` dans un for-each ne lève pas d'exception, car `hasNext()` renvoie `false` avant le contrôle (le dernier élément est alors ignoré). Ne comptez pas dessus : la règle générale reste `ConcurrentModificationException`." }
      ]
    }
  ],
  questions: [
    {
      id: "collections-001",
      difficulty: 1,
      q: "Given the following declarations, which statement is true?",
      code: String.raw`int[] p, q;
int r[], s;
int[] t[], u;`,
      options: [
        "p, q, r and u are of type int[]; s is of type int; t is of type int[][]",
        "p, r and t are of type int[]; q, s and u are of type int",
        "p, q, r and s are of type int[]; t and u are of type int[][]",
        "p, q and r are of type int[]; s is of type int; t and u are of type int[][]",
        "The code does not compile because of the declaration of t"
      ],
      answer: [0],
      explain: "Les crochets placés après le **type** s'appliquent à toutes les variables de la déclaration : `p`, `q` sont des `int[]`, et `u` aussi. Les crochets placés après un **nom** ne concernent que cette variable : `r` est un `int[]` mais `s` reste un `int`. Pour `t`, les deux s'additionnent : `int[] t[]` est un `int[][]`, alors que `u` ne reçoit que les crochets du type. Mélanger les deux syntaxes est légal, la déclaration compile."
    },
    {
      id: "collections-002",
      difficulty: 1,
      q: "Which of the following statements compile? (Choose three.)",
      options: [
        "int[] a = new int[3]{1, 2, 3};",
        "int[] b = {1, 2, 3};",
        "int[][] c = new int[][3];",
        "int[][] d = new int[2][];",
        "var e = {1, 2};",
        "int f[] = new int[]{};"
      ],
      answer: [1, 3, 5],
      explain: "`int[] b = {1, 2, 3};` est l'initialiseur court, autorisé dans une déclaration. `new int[2][]` est valide : seule la première dimension est obligatoire. `new int[]{}` crée un tableau vide et `int f[]` est une syntaxe de déclaration légale. En revanche, on ne peut pas donner à la fois une taille et un initialiseur (`new int[3]{1, 2, 3}`), ni omettre la première dimension en donnant la seconde (`new int[][3]`), et `var` ne peut pas inférer un type à partir d'un initialiseur de tableau seul (`var e = {1, 2};`)."
    },
    {
      id: "collections-003",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`int[][] m = new int[3][];
m[0] = new int[2];
m[1] = new int[]{1, 2, 3};
System.out.print(m[0][1] + " " + m[1].length + " ");
System.out.print(m[2].length);`,
      options: [
        "0 3 0",
        "0 3 is printed, then a NullPointerException is thrown",
        "0 3 is printed, then an ArrayIndexOutOfBoundsException is thrown",
        "null 3 is printed, then a NullPointerException is thrown",
        "The code does not compile"
      ],
      answer: [1],
      explain: "`new int[3][]` crée un tableau de 3 références de lignes, toutes à `null` : le code compile, c'est un tableau irrégulier. `m[0]` est un `int[2]` rempli de `0`, donc `m[0][1]` vaut `0` (et non `null` : ce sont des `int`). `m[1].length` vaut 3. La ligne `m[2]` n'a jamais été créée : `m[2].length` déréférence `null` et lève `NullPointerException`, pas `ArrayIndexOutOfBoundsException` puisque l'index 2 est valide pour `m`."
    },
    {
      id: "collections-004",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`Number[] nums = new Integer[2];   // n1
nums[0] = 10;                     // n2
nums[1] = 2.5;                    // n3
System.out.println(nums[0]);`,
      options: [
        "10",
        "Compilation fails at n1",
        "Compilation fails at n3",
        "A ClassCastException is thrown at n3",
        "An ArrayStoreException is thrown at n3"
      ],
      answer: [4],
      explain: "Les tableaux sont covariants : `Integer[]` est un sous-type de `Number[]`, donc n1 compile. Pour le compilateur, `nums` est un `Number[]` : y ranger un `Double` (n3) est accepté. À l'exécution, la JVM vérifie le type réel du tableau (`Integer[]`) à chaque écriture et lève `ArrayStoreException` en n3 ; ce n'est pas une `ClassCastException`. Rien n'est affiché car l'exception survient avant le `println`."
    },
    {
      id: "collections-005",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`int[] a = {10, 20, 30, 40};
System.out.print(Arrays.binarySearch(a, 30) + " ");
System.out.print(Arrays.binarySearch(a, 25) + " ");
System.out.print(Arrays.binarySearch(a, 50));`,
      options: [
        "2 -3 -5",
        "2 -2 -4",
        "2 -1 -1",
        "3 -3 -5",
        "2 -3 is printed, then an ArrayIndexOutOfBoundsException is thrown"
      ],
      answer: [0],
      explain: "Le tableau est trié, le résultat est donc défini. `30` est à l'index 2. Pour un élément absent, `binarySearch` renvoie `-(point d'insertion) - 1` : `25` s'insérerait à l'index 2, soit `-3` ; `50` s'insérerait à l'index 4 (fin du tableau), soit `-5`. Oublier le `- 1` donne `-2 -4`, et la méthode ne renvoie pas simplement `-1` ni ne lève d'exception pour un élément absent."
    },
    {
      id: "collections-006",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`int[] a = {1, 2, 3};
int[] b = {1, 2, 3, 4};
int[] c = {1, 5};
System.out.print(Arrays.compare(a, b) + " " + Arrays.mismatch(a, b) + " ");
System.out.print(Arrays.compare(c, a) + " " + Arrays.mismatch(a, a) + " ");
System.out.print(a.equals(a.clone()) + " " + Arrays.equals(a, a.clone()));`,
      options: [
        "-1 3 1 -1 false true",
        "-1 3 -1 -1 false true",
        "-1 -1 1 0 false true",
        "-1 3 1 -1 true true",
        "-4 3 3 0 false true"
      ],
      answer: [0],
      explain: "`a` est un préfixe de `b` : `Arrays.compare` renvoie la différence des longueurs, `3 - 4 = -1`, et `mismatch` renvoie la longueur du plus court, `3`. Pour `compare(c, a)`, la première différence est à l'index 1 (`5` contre `2`) : le résultat est `Integer.compare(5, 2)`, soit `1` ; la longueur plus courte de `c` ne compte pas. `mismatch(a, a)` vaut `-1` (aucune différence, pas `0`). Enfin `a.equals(...)` est la méthode d'`Object` et compare les références : `false`, alors que `Arrays.equals` compare les contenus : `true`."
    },
    {
      id: "collections-007",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`String[] arr = {"c", "a", "b"};
List<String> list = Arrays.asList(arr);
list.set(0, "z");
Collections.sort(list);
System.out.print(Arrays.toString(arr));
list.add("d");
System.out.print(list.size());`,
      options: [
        "[c, a, b]4",
        "[a, b, z]4",
        "[a, b, z] is printed, then an UnsupportedOperationException is thrown",
        "[c, a, b] is printed, then an UnsupportedOperationException is thrown",
        "An UnsupportedOperationException is thrown and nothing is printed"
      ],
      answer: [2],
      explain: "`Arrays.asList(arr)` renvoie une liste de taille fixe **adossée au tableau**. `set` et le tri sont autorisés (ils ne changent pas la taille) et s'écrivent directement dans `arr` : le tableau devient `[z, a, b]` puis `[a, b, z]`. En revanche `add` modifierait la taille : `UnsupportedOperationException`, après l'affichage du tableau. La liste n'est pas une copie indépendante, d'où l'erreur de répondre `[c, a, b]`."
    },
    {
      id: "collections-008",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`List<Integer> list = new ArrayList<>(List.of(3, 1, 2, 1));
list.remove(1);
list.remove(Integer.valueOf(1));
System.out.print(list + " " + list.remove(Integer.valueOf(9)));`,
      options: [
        "[3, 2] false",
        "[3, 2, 1] false",
        "[3, 2] is printed, then an IndexOutOfBoundsException is thrown",
        "[2, 1] false",
        "[3, 2] null"
      ],
      answer: [0],
      explain: "`list.remove(1)` appelle `remove(int index)` : l'élément d'index 1 (la valeur `1`) est retiré, il reste `[3, 2, 1]`. `list.remove(Integer.valueOf(1))` appelle `remove(Object)` et retire la première occurrence de la valeur 1 : `[3, 2]`. Enfin `remove(Integer.valueOf(9))` est encore `remove(Object)` : la valeur est absente, la méthode renvoie `false` sans lever d'exception (c'est `remove(9)` avec un `int` qui lèverait `IndexOutOfBoundsException`)."
    },
    {
      id: "collections-009",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`Deque<Integer> d = new ArrayDeque<>();
d.push(1);
d.offer(2);
d.push(3);
d.offerFirst(4);
System.out.print(d.peek() + " " + d.poll() + " " + d.pollLast() + " ");
System.out.print(d.pop() + " " + d);`,
      options: [
        "4 4 2 3 [1]",
        "4 3 2 1 []",
        "1 1 4 2 [3]",
        "4 4 1 3 [2]",
        "2 2 4 3 [1]"
      ],
      answer: [0],
      explain: "`push` et `offerFirst` ajoutent en **tête**, `offer` ajoute en **queue**. Le contenu évolue ainsi : `[1]`, `[1, 2]`, `[3, 1, 2]`, `[4, 3, 1, 2]`. `peek()` lit la tête sans la retirer (`4`), `poll()` retire la tête (`4`), `pollLast()` retire la queue (`2`), `pop()` retire la nouvelle tête (`3`). Il reste `[1]`. L'erreur classique est de croire que `peek` consomme l'élément ou que `offer` ajoute en tête."
    },
    {
      id: "collections-010",
      difficulty: 3,
      q: "Which of the following statements throw a NullPointerException? (Choose three.)",
      options: [
        "new TreeSet<String>().add(null);",
        "new HashSet<String>().add(null);",
        "new ArrayDeque<String>().offer(null);",
        "new HashMap<String, String>().put(null, null);",
        String.raw`new TreeMap<String, String>().put("k", null);`,
        String.raw`List.of("a").contains(null);`,
        "new LinkedList<String>().add(null);"
      ],
      answer: [0, 2, 5],
      explain: "Un `TreeSet` en ordre naturel doit comparer l'élément ajouté : `null` provoque `NullPointerException`, même dans un ensemble vide. `ArrayDeque` refuse tout élément `null` (car `poll`/`peek` renvoient `null` pour une file vide), y compris via `offer`. Les collections immuables de `List.of` refusent `null` jusque dans `contains(null)`. À l'inverse, `HashSet` et `LinkedList` acceptent `null`, `HashMap` accepte une clé `null` et des valeurs `null`, et `TreeMap` n'interdit que la **clé** `null`, pas la valeur."
    },
    {
      id: "collections-011",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`NavigableSet<Integer> set = new TreeSet<>(List.of(10, 20, 30, 40));
System.out.print(set.floor(20) + " " + set.lower(20) + " ");
System.out.print(set.ceiling(25) + " " + set.higher(40) + " ");
System.out.print(set.headSet(30) + " " + set.tailSet(30));`,
      options: [
        "20 10 30 null [10, 20] [30, 40]",
        "10 10 30 null [10, 20] [30, 40]",
        "20 10 30 null [10, 20, 30] [40]",
        "20 10 30 40 [10, 20] [30, 40]",
        "20 10 30 is printed, then a NoSuchElementException is thrown"
      ],
      answer: [0],
      explain: "`floor(20)` accepte l'égalité : `20`. `lower(20)` est strict : `10`. `ceiling(25)` renvoie le plus petit élément supérieur ou égal : `30`. `higher(40)` est strict et il n'existe rien au-dessus : `null`, sans exception. `headSet(30)` **exclut** la borne : `[10, 20]`, alors que `tailSet(30)` l'**inclut** : `[30, 40]`."
    },
    {
      id: "collections-012",
      difficulty: 3,
      q: "What is the result of executing the following code?",
      code: String.raw`TreeMap<String, Integer> map = new TreeMap<>();
map.put("b", 2);
map.put("d", 4);
map.put("f", 6);
NavigableMap<String, Integer> head = map.headMap("d", true);
map.put("a", 1);
System.out.print(head.size() + " " + map.floorKey("c") + " ");
System.out.print(map.higherEntry("d").getValue() + " ");
head.put("e", 5);
System.out.print(head.size());`,
      options: [
        "2 b 6 3",
        "3 b 6 4",
        "3 b 6 is printed, then an IllegalArgumentException is thrown",
        "2 b 6 is printed, then an UnsupportedOperationException is thrown",
        "3 d 4 is printed, then an IllegalArgumentException is thrown"
      ],
      answer: [2],
      explain: "`headMap(\"d\", true)` est une **vue** des clés inférieures ou égales à `d`. L'ajout de `a` dans la map d'origine est visible dans la vue : elle contient `a`, `b`, `d`, taille 3. `floorKey(\"c\")` renvoie la plus grande clé inférieure ou égale à `c` : `b`. `higherEntry(\"d\")` est strict : l'entrée `f=6`. Enfin, la vue accepte les écritures, mais uniquement dans son intervalle : `e` est supérieure à `d`, d'où `IllegalArgumentException` (*key out of range*), et non `UnsupportedOperationException`."
    },
    {
      id: "collections-013",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`List<String> src = new ArrayList<>(List.of("x", "y"));
List<String> view = Collections.unmodifiableList(src);
List<String> copy = List.copyOf(src);
src.add("z");
System.out.print(view.size() + " " + copy.size());`,
      options: [
        "2 2",
        "3 2",
        "3 3",
        "2 3",
        "An UnsupportedOperationException is thrown"
      ],
      answer: [1],
      explain: "`Collections.unmodifiableList(src)` renvoie une **vue** en lecture seule : on ne peut pas la modifier, mais elle reflète toute modification de la liste sous-jacente, d'où une taille de 3. `List.copyOf(src)` crée une **copie** immuable indépendante, figée à 2 éléments. Aucune exception : c'est `src`, une `ArrayList` modifiable, qui reçoit le `add`."
    },
    {
      id: "collections-014",
      difficulty: 2,
      q: "Which of the following statements throw an exception at runtime? (Choose three.)",
      options: [
        String.raw`Set.of("a", "b", "a");`,
        String.raw`List.of("a", null);`,
        String.raw`Map.of("k", 1, "k", 2);`,
        String.raw`List.of("a", "a");`,
        String.raw`Arrays.asList("a", null);`,
        String.raw`Map.entry("k", 1);`
      ],
      answer: [0, 1, 2],
      explain: "`Set.of` et `Map.of` refusent les doublons (éléments ou clés) avec une `IllegalArgumentException` ; ils ne les ignorent pas silencieusement comme le ferait un `HashSet`. Toutes les fabriques `of` refusent `null` : `List.of(\"a\", null)` lève `NullPointerException`. En revanche une liste peut contenir des doublons (`List.of(\"a\", \"a\")`), `Arrays.asList` accepte `null`, et `Map.entry(\"k\", 1)` crée simplement une entrée immuable valide."
    },
    {
      id: "collections-015",
      difficulty: 3,
      q: "What is the result of executing the following code?",
      code: String.raw`List<String> a = Stream.of("b", null, "a").toList();   // n1
System.out.print(a.size());
List<String> c = Arrays.asList("b", null);             // n2
c.set(1, "z");                                         // n3
System.out.print(c);
a.set(0, "q");                                         // n4
List<String> b = List.copyOf(a);                       // n5`,
      options: [
        "3[b, z] is printed, then an UnsupportedOperationException is thrown at n4",
        "A NullPointerException is thrown at n1",
        "3 is printed, then an UnsupportedOperationException is thrown at n3",
        "3[b, z] is printed, then a NullPointerException is thrown at n5",
        "3 is printed, then a NullPointerException is thrown at n2"
      ],
      answer: [0],
      explain: "`Stream.toList()` renvoie une liste **non modifiable qui accepte les `null`** : n1 réussit et la taille est 3. `Arrays.asList` accepte aussi `null` (n2) et autorise `set` (n3), puisque la taille ne change pas : `[b, z]` est affiché. En n4, `set` sur la liste issue de `toList()` lève `UnsupportedOperationException`. La ligne n5 lèverait bien une `NullPointerException` (`List.copyOf` refuse les `null`), mais elle n'est jamais atteinte."
    },
    {
      id: "collections-016",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`Map<String, Integer> m = new TreeMap<>();
m.put("a", 1);
m.put("b", 2);
m.merge("a", 10, Integer::sum);
m.merge("c", 10, Integer::sum);
m.merge("b", 10, (o, n) -> null);
System.out.print(m);`,
      options: [
        "{a=11, c=10}",
        "{a=11, b=null, c=10}",
        "{a=11, b=2, c=10}",
        "{a=10, b=10, c=10}",
        "{a=11, b=10, c=10}",
        "A NullPointerException is thrown"
      ],
      answer: [0],
      explain: "`merge(k, v, f)` : si la clé est absente, `v` est simplement associé à la clé sans appeler la fonction (`c=10`). Si elle est présente, la fonction reçoit l'ancienne et la nouvelle valeur et son résultat remplace l'ancienne : `1 + 10 = 11`. Si la fonction renvoie `null`, l'entrée est **supprimée** : `b` disparaît, sans valeur `null` stockée ni exception. `TreeMap` garantit l'affichage dans l'ordre des clés."
    },
    {
      id: "collections-017",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`Map<String, Integer> m = new HashMap<>();
m.put("a", 1);
m.put("b", null);
System.out.print(m.putIfAbsent("a", 5) + " ");
System.out.print(m.putIfAbsent("b", 6) + " ");
System.out.print(m.computeIfAbsent("c", k -> 7) + " ");
System.out.print(m.computeIfPresent("d", (k, v) -> 8) + " ");
System.out.print(m.getOrDefault("b", 9) + " " + m.getOrDefault("d", 9));`,
      options: [
        "1 null 7 null 6 9",
        "5 6 7 8 6 9",
        "1 null 7 null null 9",
        "1 6 7 null 6 9",
        "1 null null null 6 9",
        "1 null 7 8 6 8"
      ],
      answer: [0],
      explain: "`putIfAbsent` renvoie la valeur **précédente** : `1` pour `a` (rien n'est modifié), et `null` pour `b` — une clé associée à `null` est traitée comme absente, donc `6` est écrit. `computeIfAbsent` renvoie la valeur calculée et stockée : `7`. `computeIfPresent` sur une clé absente n'appelle pas la fonction et renvoie `null`. `getOrDefault(\"b\", 9)` renvoie `6` (valeur écrite par `putIfAbsent`), et `9` pour `d`, qui n'a jamais été ajoutée."
    },
    {
      id: "collections-018",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`Map<String, Integer> m = new LinkedHashMap<>();
m.put("x", 1);
m.put("y", 2);
m.replaceAll((k, v) -> v * 10);
for (Map.Entry<String, Integer> e : m.entrySet()) {
    e.setValue(e.getValue() + 1);
}
m.compute("x", (k, v) -> v == null ? 0 : v + 1);
m.compute("z", (k, v) -> v == null ? 0 : v + 1);
System.out.print(m);`,
      options: [
        "{x=12, y=21, z=0}",
        "{x=11, y=20, z=0}",
        "{x=12, y=21}",
        "{x=12, y=21, z=1}",
        "A ConcurrentModificationException is thrown",
        "A NullPointerException is thrown"
      ],
      answer: [0],
      explain: "`replaceAll` remplace chaque valeur : `x=10, y=20`. `setValue` sur une entrée d'`entrySet()` écrit dans la map ; ce n'est pas une modification structurelle, donc pas de `ConcurrentModificationException` : `x=11, y=21`. `compute` est toujours appelée : pour `x`, `v` vaut 11 et devient 12 ; pour `z`, absente, `v` vaut `null` et la fonction renvoie `0`, qui est ajouté. `LinkedHashMap` conserve l'ordre d'insertion."
    },
    {
      id: "collections-019",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
list.addFirst(0);
List<Integer> rev = list.reversed();
rev.addFirst(9);
System.out.print(list.getLast() + " " + rev.getLast() + " ");
System.out.print(list.removeFirst() + " " + rev);`,
      options: [
        "9 0 0 [9, 3, 2, 1]",
        "3 0 0 [9, 3, 2, 1]",
        "3 0 0 [3, 2, 1]",
        "9 0 9 [3, 2, 1, 0]",
        "An UnsupportedOperationException is thrown",
        "The code does not compile"
      ],
      answer: [0],
      explain: "Depuis Java 21, `List` étend `SequencedCollection` : `addFirst`, `getLast`, `removeFirst` et `reversed()` existent, le code compile. `reversed()` renvoie une **vue** inversée, pas une copie : `rev.addFirst(9)` ajoute `9` à la **fin** de `list`, qui devient `[0, 1, 2, 3, 9]`. `list.getLast()` vaut `9`, `rev.getLast()` vaut le premier de `list`, `0`. `list.removeFirst()` retire et renvoie `0` ; la vue affiche alors `[9, 3, 2, 1]`."
    },
    {
      id: "collections-020",
      difficulty: 3,
      q: "What is the result of executing the following code?",
      code: String.raw`SequencedSet<String> set = new LinkedHashSet<>(List.of("a", "b", "c"));
set.addFirst("c");
set.add("a");
set.addLast("a");
System.out.print(set + " ");
SequencedSet<String> sorted = new TreeSet<>(set);
System.out.print(sorted.getFirst() + " ");
sorted.addFirst("0");
System.out.print(sorted);`,
      options: [
        "[c, b, a] a [0, a, b, c]",
        "[c, b, a] a is printed, then an UnsupportedOperationException is thrown",
        "[a, b, c] a is printed, then an UnsupportedOperationException is thrown",
        "[c, a, b] a is printed, then an UnsupportedOperationException is thrown",
        "[c, b, a] c is printed, then an UnsupportedOperationException is thrown",
        "The code does not compile because TreeSet is not a SequencedSet"
      ],
      answer: [1],
      explain: "Sur un `LinkedHashSet`, `addFirst` d'un élément déjà présent le **déplace** en tête : `[c, a, b]`. `add(\"a\")` ne change rien (élément déjà présent, position conservée). `addLast(\"a\")` le déplace en fin : `[c, b, a]`. `TreeSet` implémente bien `SequencedSet` (via `SortedSet`) : `getFirst()` renvoie le plus petit élément, `a`. Mais la position dans un ensemble trié est dictée par le comparateur : `addFirst` lève `UnsupportedOperationException`."
    },
    {
      id: "collections-021",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`SequencedMap<String, Integer> m = new LinkedHashMap<>();
m.put("a", 1);
m.put("b", 2);
m.putFirst("c", 3);
m.putLast("a", 4);
var e = m.pollFirstEntry();
System.out.print(e.getKey() + " " + m.firstEntry() + " ");
System.out.print(m.lastEntry() + " " + m.reversed());`,
      options: [
        "c b=2 a=4 {a=4, b=2}",
        "c a=4 b=2 {b=2, a=4}",
        "a b=2 c=3 {c=3, b=2}",
        "c a=1 b=2 {b=2, a=1}",
        "c b=2 a=4 {a=4, b=2, c=3}"
      ],
      answer: [0],
      explain: "`putFirst(\"c\", 3)` insère en tête : `{c=3, a=1, b=2}`. `putLast(\"a\", 4)` met à jour la valeur **et déplace** l'entrée en fin : `{c=3, b=2, a=4}` (un simple `put` aurait gardé `a` à sa place). `pollFirstEntry()` retire et renvoie `c=3`. Il reste `b=2` en tête et `a=4` en queue ; `reversed()` donne la vue inversée `{a=4, b=2}`, sans `c` puisqu'elle a été retirée."
    },
    {
      id: "collections-022",
      difficulty: 1,
      q: "Which of the following classes implement java.util.SequencedCollection in Java 21? (Choose three.)",
      options: [
        "ArrayList",
        "ArrayDeque",
        "LinkedHashSet",
        "HashSet",
        "PriorityQueue",
        "HashMap"
      ],
      answer: [0, 1, 2],
      explain: "`SequencedCollection` regroupe les collections dont l'ordre de parcours est défini : toutes les `List` (`ArrayList`), tous les `Deque` (`ArrayDeque`) et les `SequencedSet` (`LinkedHashSet`, ainsi que `TreeSet`). `HashSet` n'a aucun ordre garanti. `PriorityQueue` est une `Queue` mais pas un `Deque` et son ordre de parcours n'est pas défini. `HashMap` n'est même pas une `Collection` ; côté maps, ce sont `LinkedHashMap` et `TreeMap` qui implémentent `SequencedMap`."
    },
    {
      id: "collections-023",
      difficulty: 2,
      q: "Which lines fail to compile? (Choose two.)",
      code: String.raw`List<? extends Number> a = new ArrayList<Integer>();   // n1
a.add(1);                                              // n2
Number n = a.get(0);                                   // n3
List<? super Integer> b = new ArrayList<Number>();     // n4
b.add(1);                                              // n5
Integer i = b.get(0);                                  // n6`,
      options: ["n1", "n2", "n3", "n4", "n5", "n6"],
      answer: [1, 5],
      explain: "Avec `? extends Number`, le type réel de la liste est inconnu (`Integer` ? `Double` ?) : on peut **lire** des `Number` (n3) mais rien y ajouter sauf `null`, donc n2 ne compile pas. Avec `? super Integer`, la liste est au moins capable de contenir des `Integer` : `add(1)` compile (n5), mais une lecture ne garantit que `Object`, donc n6 ne compile pas. Les affectations n1 et n4 sont valides : `Integer` est un sous-type de `Number`, et `Number` un super-type d'`Integer`."
    },
    {
      id: "collections-024",
      difficulty: 2,
      q: "Which of the following declarations compile? (Choose three.)",
      options: [
        "List<Number> a = new ArrayList<Integer>();",
        "List<? extends Number> b = new ArrayList<Integer>();",
        "List<?> c = new ArrayList<? extends Number>();",
        "List<int> d = new ArrayList<>();",
        "var e = new ArrayList<>();",
        "List<? super Number> f = new ArrayList<Object>();",
        "ArrayList<> g = new ArrayList<String>();"
      ],
      answer: [1, 4, 5],
      explain: "Les génériques ne sont pas covariants : une `ArrayList<Integer>` n'est pas une `List<Number>`, il faut un joker `? extends Number`. `? super Number` accepte `Number` et ses super-types, donc `ArrayList<Object>`. `var e = new ArrayList<>();` compile et infère `ArrayList<Object>`. Ne compilent pas : un joker dans un `new`, un type primitif comme argument de type (`List<int>`), et le diamant du côté gauche (`ArrayList<> g`), qui n'est permis que dans l'expression `new`."
    },
    {
      id: "collections-025",
      difficulty: 3,
      q: "Which lines fail to compile? (Choose two.)",
      code: String.raw`public class Box<T extends Comparable<T>> {
    private T value;
    private static T shared;                               // n1
    Box(T value) { this.value = value; }
    static <U extends Comparable<U>> Box<U> of(U u) {      // n2
        return new Box<>(u);
    }
    boolean bigger(Box<? extends T> other) {               // n3
        return value.compareTo(other.value) > 0;
    }
    T[] toArray() { return new T[] { value }; }            // n4
    <T> void print(T t) { System.out.println(t); }         // n5
}`,
      options: ["n1", "n2", "n3", "n4", "n5"],
      answer: [0, 3],
      explain: "n1 : un paramètre de type de classe appartient à chaque instance ; il ne peut pas être utilisé dans un contexte `static`. n4 : à cause de l'effacement de type, `new T[]` est interdit (*generic array creation*), même si déclarer le type de retour `T[]` est permis. n2 compile : une méthode statique peut déclarer son **propre** paramètre de type borné. n3 compile : `other.value` est un sous-type de `T`, accepté par `compareTo(T)`. n5 compile : la méthode déclare un nouveau `T` qui masque celui de la classe."
    },
    {
      id: "collections-026",
      difficulty: 2,
      q: "What is the result of compiling and executing the following code?",
      code: String.raw`List raw = new ArrayList<String>();
raw.add(1);                    // n1
List<String> s = raw;          // n2
System.out.print(s.size());    // n3
String x = s.get(0);           // n4
System.out.print(x);`,
      options: [
        "Compilation fails at n1",
        "Compilation fails at n2",
        "A ClassCastException is thrown at n1",
        "1 is printed, then a ClassCastException is thrown at n4",
        "11"
      ],
      answer: [3],
      explain: "Un type brut désactive les vérifications génériques : n1 et n2 ne produisent que des avertissements *unchecked*, pas d'erreur. À l'exécution, les types génériques sont effacés : la liste est une simple `ArrayList` qui accepte l'`Integer`, donc aucune exception en n1 et `size()` affiche `1`. C'est en n4 que le compilateur a inséré un cast vers `String` : l'élément est un `Integer`, d'où `ClassCastException`."
    },
    {
      id: "collections-027",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`record Point(int x, int y) { }

Set<Point> set = new TreeSet<>();   // n1
set.add(new Point(1, 2));           // n2
set.add(new Point(1, 2));           // n3
System.out.print(set.size());`,
      options: [
        "1",
        "2",
        "Compilation fails at n1",
        "A ClassCastException is thrown at n2",
        "A ClassCastException is thrown at n3"
      ],
      answer: [3],
      explain: "Un record fournit `equals` et `hashCode`, mais n'implémente pas `Comparable`. Le constructeur `new TreeSet<>()` n'impose aucune borne sur le type : n1 compile. Sans comparateur, le `TreeSet` convertit chaque élément en `Comparable` : la `ClassCastException` survient dès le **premier** ajout (n2), même si l'ensemble est vide, et non au second. La réponse `1` serait correcte avec un `HashSet`."
    },
    {
      id: "collections-028",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`record P(String name, int age) { }

List<P> list = new ArrayList<>(List.of(new P("Bob", 30), new P("Al", 25),
        new P("Cy", 30), new P("Di", 25)));
list.sort(Comparator.comparing(P::age).reversed()
        .thenComparing(P::name, Comparator.reverseOrder()));
list.forEach(p -> System.out.print(p.name() + " "));`,
      options: [
        "Cy Bob Di Al",
        "Bob Cy Al Di",
        "Di Al Cy Bob",
        "Al Di Bob Cy",
        "Bob Cy Di Al"
      ],
      answer: [0],
      explain: "`comparing(P::age).reversed()` trie par âge **décroissant** : les deux personnes de 30 ans d'abord, puis celles de 25 ans. `thenComparing(P::name, Comparator.reverseOrder())` départage les égalités par nom **décroissant** : `Cy` avant `Bob`, puis `Di` avant `Al`. Le `reversed()` placé avant `thenComparing` n'inverse que le critère d'âge ; l'ordre inverse des noms vient uniquement du second argument."
    },
    {
      id: "collections-029",
      difficulty: 3,
      q: "Which statements, inserted independently at // INSERT, sort the list by name in descending order (Cy, Bob, Al)? (Choose two.)",
      code: String.raw`record P(String name, int age) { }

List<P> list = new ArrayList<>(List.of(new P("Bob", 30), new P("Al", 25),
        new P("Cy", 30)));
// INSERT
System.out.print(list);`,
      options: [
        "list.sort(Comparator.comparing(P::name).reversed());",
        "list.sort(Comparator.comparing(p -> p.name()).reversed());",
        "list.sort(Comparator.comparing(P::name, Comparator.reverseOrder()));",
        "Collections.sort(list, Comparator.reverseOrder());",
        "list.sort(null);",
        "list.sort((a, b) -> a.name().compareTo(b.name()));"
      ],
      answer: [0, 2],
      explain: "`comparing(P::name).reversed()` et `comparing(P::name, Comparator.reverseOrder())` trient tous deux par nom décroissant. Avec la lambda `p -> p.name()` suivie de `.reversed()`, le compilateur n'a pas de type cible et infère `Object` pour `p` : `name()` est introuvable, erreur de compilation. `Collections.sort(list, Comparator.reverseOrder())` ne compile pas car `P` n'est pas `Comparable`. `list.sort(null)` compile mais demande l'ordre naturel : `ClassCastException`. La dernière lambda trie par nom **croissant**."
    },
    {
      id: "collections-030",
      difficulty: 3,
      q: "What is the result of executing the following code?",
      code: String.raw`List<String> list = Arrays.asList("b", null, "a");
Comparator<String> c = Comparator.nullsFirst(Comparator.naturalOrder());
list.sort(c);
System.out.print(list + " ");
list.sort(c.reversed());
System.out.print(list);`,
      options: [
        "[null, a, b] [b, a, null]",
        "[null, a, b] [null, b, a]",
        "[a, b, null] [null, b, a]",
        "A NullPointerException is thrown",
        "An UnsupportedOperationException is thrown"
      ],
      answer: [0],
      explain: "`Arrays.asList` accepte `null` et autorise le tri (la taille ne change pas) : pas d'`UnsupportedOperationException`. `nullsFirst(naturalOrder())` place `null` en premier puis applique l'ordre naturel, sans `NullPointerException` : `[null, a, b]`. `reversed()` inverse le comparateur **entier**, y compris la règle sur les `null`, qui passent donc à la fin : `[b, a, null]`, et non `[null, b, a]`."
    },
    {
      id: "collections-031",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4));
for (Integer i : list) {
    if (i == 2) list.remove(i);
}
System.out.print(list);`,
      options: [
        "[1, 3, 4]",
        "[1, 2, 4]",
        "A ConcurrentModificationException is thrown",
        "An UnsupportedOperationException is thrown",
        "An IndexOutOfBoundsException is thrown"
      ],
      answer: [2],
      explain: "`i` est un `Integer` : `list.remove(i)` appelle `remove(Object)` et supprime bien la valeur `2` (ni `IndexOutOfBoundsException`, ni suppression de l'index 2). Mais la liste est modifiée structurellement pendant un for-each, en dehors de son itérateur : l'appel suivant à `next()` détecte la modification et lève `ConcurrentModificationException`. La liste est une `ArrayList` modifiable, donc pas d'`UnsupportedOperationException`. La bonne approche est `list.removeIf(i -> i == 2)` ou `Iterator.remove()`."
    },
    {
      id: "collections-032",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`List<String> list = new ArrayList<>(List.of("ab", "c", "def", "g"));
boolean r = list.removeIf(s -> s.length() == 1);
list.replaceAll(String::toUpperCase);
System.out.print(r + " " + list);`,
      options: [
        "true [AB, DEF]",
        "true [C, G]",
        "2 [AB, DEF]",
        "true [ab, def]",
        "A ConcurrentModificationException is thrown"
      ],
      answer: [0],
      explain: "`removeIf` supprime les éléments qui **vérifient** le prédicat (ici ceux de longueur 1, `c` et `g`) et renvoie un `boolean` indiquant si la liste a changé, pas le nombre d'éléments supprimés. `replaceAll` remplace ensuite chaque élément restant par le résultat de la fonction : `[AB, DEF]` ; la liste est bien modifiée sur place. Ces méthodes gèrent elles-mêmes l'itération : aucune `ConcurrentModificationException`."
    }
  ]
});
