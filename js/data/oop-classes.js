OCP.register({
  topic: 'oop',
  course: [
    {
      title: "Cycle de vie des objets et références",
      blocks: [
        { p: "Un objet est créé par `new` (ou par un littéral, un boxing, une fabrique…) et vit sur le tas (heap). Une variable de type objet ne contient jamais l'objet lui-même mais une **référence** vers lui. Plusieurs références peuvent désigner le même objet." },
        { list: [
          "Un objet devient **éligible** au garbage collector dès qu'il n'est plus atteignable depuis un thread vivant : toutes ses références ont été réaffectées, mises à `null` ou sont sorties de portée.",
          "Éligible ne veut pas dire collecté : la JVM décide du moment. `System.gc()` n'est qu'une **suggestion**, rien ne garantit qu'un objet sera un jour collecté.",
          "Deux objets qui ne se référencent que l'un l'autre (îlot isolé) sont tous deux éligibles.",
          "Mettre une référence à `null` ne rend l'objet éligible que si c'était la **dernière** référence vers lui.",
          "Une variable locale non initialisée ne peut pas être lue (erreur de compilation) ; un champ reçoit une valeur par défaut (`0`, `false`, `null`)."
        ] },
        { code: String.raw`Main a = new Main("a");   // objet A
Main b = new Main("b");   // objet B
Main c = a;               // A est référencé par a et c
a = b;                    // A : c seulement ; B : a et b
b = null;                 // B : a seulement
c = null;                 // A n'est plus référencé -> éligible` },
        { tip: "Pour une question de GC, dessinez les objets et les flèches, puis rayez les flèches au fil des affectations. On compte les **objets** sans flèche entrante, pas les variables." },
        { h: "Passage par valeur" },
        { p: "Java passe **toujours** les arguments par valeur. Pour un type objet, la valeur copiée est la référence : la méthode peut modifier l'objet désigné (l'appelant le voit), mais réaffecter le paramètre n'a aucun effet chez l'appelant." },
        { code: String.raw`static void change(StringBuilder sb, int[] arr, int n) {
    sb.append("b");               // modifie l'objet de l'appelant
    sb = new StringBuilder("z");  // ne change que la copie locale de la référence
    arr[0]++;                     // modifie le tableau de l'appelant
    arr = new int[] { 9 };        // sans effet pour l'appelant
    n++;                          // sans effet pour l'appelant
}` },
        { trap: "Après `sb = new StringBuilder(...)` dans la méthode, tous les appels suivants sur `sb` touchent le nouvel objet local : l'appelant ne voit que les modifications faites **avant** la réaffectation." }
      ]
    },
    {
      title: "Fichier source, packages et imports",
      blocks: [
        { list: [
          "Ordre obligatoire dans un fichier : `package` (0 ou 1), puis les `import`, puis les déclarations de types.",
          "Au plus **un** type top-level `public` par fichier, et son nom doit être celui du fichier. Un fichier peut ne contenir aucun type public et autant de types non publics que l'on veut.",
          "Un type top-level est soit `public`, soit package-private : `private` et `protected` y sont interdits.",
          "`java.lang` est importé implicitement, ainsi que le package courant.",
          "`import java.util.*;` importe les types du package `java.util` uniquement, **pas** ceux des sous-packages (`java.util.function`, `java.util.stream`…).",
          "Les imports redondants ou inutilisés sont autorisés."
        ] },
        { h: "Conflits de noms" },
        { table: { head: ["Imports", "Utilisation de `Date`"], rows: [
          ["`import java.util.*; import java.sql.*;`", "erreur seulement si `Date` est utilisé : « reference to Date is ambiguous »"],
          ["`import java.util.Date; import java.sql.*;`", "OK : l'import explicite l'emporte sur le joker"],
          ["`import java.util.Date; import java.sql.Date;`", "erreur de compilation sur les imports eux-mêmes"]
        ] } },
        { h: "Imports statiques" },
        { p: "`import static` importe des **membres statiques** (champs, méthodes, types imbriqués statiques) d'une classe ou interface, pour les utiliser sans le nom de la classe." },
        { code: String.raw`import static java.util.Arrays.asList;   // un membre
import static java.lang.Math.*;          // tous les membres statiques de Math

List<Integer> list = asList(3, 1, 2);
double d = PI + max(1, 2);` },
        { trap: "L'ordre des mots est `import static`, jamais `static import`. On importe un **membre** : `import static java.util.Arrays;` ne compile pas, pas plus que `import static java.util.Arrays.asList();` (pas de parenthèses)." },
        { trap: "`import java.util.Arrays.asList;` (sans `static`) ne compile pas : un import classique ne peut désigner qu'un type. Et un import statique n'importe pas la classe elle-même : avec `import static java.util.Arrays.*;` seul, `Arrays.sort(x)` ne compile pas." },
        { tip: "Une méthode déclarée dans la classe masque la méthode de même nom importée statiquement. Deux imports statiques d'un même nom (`List.of` et `Set.of`) ne posent problème qu'à l'appel, s'il est ambigu." }
      ]
    },
    {
      title: "Membres, modificateurs d'accès et static",
      blocks: [
        { table: { head: ["Modificateur", "Même classe", "Même package", "Sous-classe d'un autre package", "Partout"], rows: [
          ["`private`", "oui", "non", "non", "non"],
          ["(aucun) package-private", "oui", "oui", "non", "non"],
          ["`protected`", "oui", "oui", "oui, par héritage", "non"],
          ["`public`", "oui", "oui", "oui", "oui"]
        ] } },
        { p: "`private` s'entend au niveau de la **classe top-level** : une classe peut lire les champs privés d'une autre instance de la même classe, et une classe englobante et ses classes imbriquées accèdent mutuellement à leurs membres privés." },
        { trap: "`protected` depuis un autre package : la sous-classe n'accède au membre que par héritage, c'est-à-dire via `this` ou via une référence dont le type est **la sous-classe elle-même** (ou un de ses sous-types). Via une référence du type parent (`Bird b = new Eagle(); b.fly();`), l'appel ne compile pas, même si l'objet est bien une instance de la sous-classe." },
        { h: "static ou instance" },
        { list: [
          "Un membre `static` appartient à la classe : une seule copie partagée par toutes les instances.",
          "Un contexte statique (méthode statique, initialiseur statique) n'a pas de `this` : il ne peut pas utiliser directement un champ ou une méthode d'instance (« non-static … cannot be referenced from a static context »). Il lui faut une référence d'objet.",
          "Un membre d'instance peut utiliser librement les membres statiques.",
          "Un membre statique s'appelle normalement par le nom de la classe (`Counter.total()`), mais une référence fonctionne aussi : le compilateur ne regarde que le **type déclaré** de la variable."
        ] },
        { code: String.raw`Counter c = null;
System.out.println(c.total());   // compile et s'exécute : appel statique
System.out.println(c.count);     // idem pour un champ statique, pas de NPE` },
        { trap: "Appeler un membre statique via une référence `null` ne lève **pas** de `NullPointerException` : l'objet n'est jamais déréférencé." },
        { h: "Méthodes : signature et retour" },
        { list: [
          "Ordre d'une déclaration : modificateurs, type de retour, nom, paramètres, `throws`, corps. Le type de retour est obligatoire (`void` sinon).",
          "Une méthode non `void` doit retourner une valeur sur tous les chemins ; la valeur doit être affectable au type de retour (`long m() { return 1; }` compile, `int m() { return 1L; }` non).",
          "Dans une méthode `void`, `return;` seul est permis.",
          "Une méthode peut porter le nom de la classe : avec un type de retour, ce n'est **pas** un constructeur."
        ] }
      ]
    },
    {
      title: "Champs final et règles d'initialisation",
      blocks: [
        { p: "Un champ `final` doit être affecté **exactement une fois**. Il ne reçoit pas de valeur par défaut exploitable : l'oublier est une erreur de compilation." },
        { table: { head: ["Champ", "Où l'affecter"], rows: [
          ["`final` d'instance", "à la déclaration, **ou** dans un initialiseur d'instance, **ou** dans chaque constructeur (directement ou via `this(...)`)"],
          ["`static final`", "à la déclaration **ou** dans un initialiseur statique"],
          ["variable locale `final`", "à la déclaration ou plus tard, mais une seule fois et avant toute lecture"]
        ] } },
        { code: String.raw`public class Config {
    private final int a;
    private static final int B;
    static { B = 2; }
    { a = 1; }                        // a est affecté pour tous les constructeurs
    Config() { }                      // OK
    Config(int a) { this.a = a; }     // ERREUR : a might already have been assigned
}` },
        { list: [
          "Constructeur qui n'affecte pas un champ `final` non initialisé ailleurs : « variable k might not have been initialized ».",
          "Constructeur qui commence par `this(...)` : le champ est déjà affecté par l'autre constructeur, le réaffecter est une erreur.",
          "Aucun constructeur écrit et champ `final` non affecté : « variable k not initialized in the default constructor ».",
          "`final` fige la **référence**, pas l'objet : `final int[] a = {1}; a[0] = 2;` compile."
        ] },
        { trap: "Un champ `final` ne peut pas être affecté dans une méthode ordinaire, même privée et appelée depuis le constructeur." }
      ]
    },
    {
      title: "Constructeurs et ordre d'initialisation",
      blocks: [
        { list: [
          "Un constructeur porte le nom de la classe et n'a **aucun** type de retour.",
          "Le **constructeur par défaut** (sans paramètre, même accès que la classe) n'est généré que si la classe ne déclare aucun constructeur. Dès qu'on en écrit un, `new A()` ne compile plus s'il n'existe pas de constructeur sans argument.",
          "Les constructeurs se surchargent comme les méthodes.",
          "`this(...)` appelle un autre constructeur de la même classe. En Java 21, ce doit être la **première instruction** du constructeur, et il ne peut y en avoir qu'un.",
          "Un cycle d'appels `this(...)` est détecté à la compilation : « recursive constructor invocation ».",
          "Les arguments de `this(...)` ne peuvent pas utiliser de membre d'instance (l'objet n'est pas encore construit) ; les membres statiques et les paramètres sont permis."
        ] },
        { code: String.raw`public class Box {
    int w, h;
    Box() { this(2); System.out.print("a"); }
    Box(int w) { this(w, w + 1); System.out.print("b"); }
    Box(int w, int h) { this.w = w; this.h = h; System.out.print("c"); }
}
// new Box() affiche cba : le constructeur appelé termine en dernier` },
        { trap: "`void Point() { x = 5; }` est une **méthode** : la classe garde son constructeur par défaut, `new Point()` compile et `x` vaut `0`." },
        { h: "Ordre complet d'initialisation" },
        { list: [
          "**Une seule fois, au premier usage de la classe** : champs statiques et blocs `static { }`, dans l'ordre du texte.",
          "**À chaque `new`** : (1) champs d'instance et blocs d'instance `{ }`, dans l'ordre du texte ; (2) le corps du constructeur.",
          "Quand un constructeur commence par `this(...)`, les initialiseurs d'instance ne s'exécutent qu'une fois, avant le corps du constructeur le plus profond.",
          "Si la classe contient `main`, son initialisation statique a lieu **avant** la première instruction de `main`."
        ] },
        { code: String.raw`public class Init {
    static { System.out.print("A"); }
    private String s = print("B");
    { System.out.print("C"); }
    static String t = print("D");
    Init() { System.out.print("E"); }
    static String print(String x) { System.out.print(x); return x; }
    public static void main(String[] args) {
        System.out.print("F");
        new Init();
        new Init();
    }
}
// ADFBCEBCE` },
        { h: "Références en avant (forward references)" },
        { table: { head: ["Code", "Résultat"], rows: [
          ["`int a = b + 1; int b = 2;`", "erreur : illegal forward reference"],
          ["`int a = this.b + 1; int b = 2;`", "compile ; `a` vaut `1` (b a encore sa valeur par défaut)"],
          ["`static int x = init(); static int y = 10;` avec `init()` qui lit `y`", "compile ; `init()` voit `y == 0`"],
          ["`{ c = 5; } int c = 1;`", "compile (affectation simple permise) ; `c` vaut finalement `1`"],
          ["`{ c = 5; int z = c; } int c = 1;`", "erreur : lecture par nom simple avant la déclaration"]
        ] } },
        { trap: "Lire un champ **à travers une méthode** ou avec `this.` / `Classe.` avant sa déclaration compile : on obtient la valeur par défaut (`0`, `null`, `false`), pas la valeur de l'initialiseur qui n'a pas encore été exécuté." }
      ]
    },
    {
      title: "Surcharge, varargs et résolution des appels",
      blocks: [
        { p: "Deux méthodes sont surchargées si elles ont le même nom et des **listes de paramètres différentes** (nombre, types ou ordre). Le type de retour, les modificateurs, `static`, les exceptions et le nom des paramètres ne comptent pas." },
        { list: [
          "`void m(int a)` et `int m(int b)` : erreur, même signature.",
          "`m(int[] a)` et `m(int... a)` : erreur, même signature (un varargs est un tableau).",
          "`m(List<String>)` et `m(List<Integer>)` : erreur, même effacement de type (erasure)."
        ] },
        { h: "Ordre de résolution" },
        { p: "Le compilateur choisit la méthode à la compilation, d'après le type **déclaré** des arguments, en trois phases. Il s'arrête à la première phase qui trouve une méthode applicable." },
        { table: { head: ["Phase", "Conversions permises", "Exemple pour `m(b)` avec `byte b`"], rows: [
          ["1", "correspondance exacte, élargissement primitif (widening), sous-typage", "`m(byte)` puis `m(short)`, `m(int)`, `m(long)`…"],
          ["2", "phase 1 + boxing / unboxing", "`m(Byte)`, `m(Object)`"],
          ["3", "phase 2 + varargs", "`m(byte...)`, `m(int...)`"]
        ] } },
        { code: String.raw`static void m(long x) { }
static void m(Integer x) { }
static void m(int... x) { }
static void m(Object x) { }

m(7);      // long : l'élargissement passe avant le boxing en Integer
m('a');    // long : char -> long
m(2.0);    // Object : aucun élargissement possible, boxing en Double
m();       // varargs` },
        { list: [
          "Boxing puis élargissement de **référence** : permis (`int` → `Integer` → `Object`).",
          "Unboxing puis élargissement primitif : permis (`Integer` → `int` → `long`).",
          "Élargissement puis boxing : **interdit** (`int` → `long` → `Long`) : `void a(Long x)` refuse `a(5)`.",
          "Entre plusieurs candidates de la même phase, la plus **spécifique** gagne (`String` avant `Object` pour `null`). S'il n'y en a pas : « reference to … is ambiguous »."
        ] },
        { trap: "`d(int, long)` et `d(long, int)` coexistent sans problème, mais l'appel `d(5, 5)` est ambigu. De même, `w(String)` et `w(Integer)` rendent `w(null)` ambigu." },
        { h: "Varargs" },
        { list: [
          "Syntaxe `Type... nom` : les trois points suivent le **type**. `int n...` ne compile pas.",
          "Un seul paramètre varargs par méthode, obligatoirement en **dernière** position.",
          "Dans la méthode, c'est un tableau : `nom.length`, `nom[0]`.",
          "Appel sans argument : tableau **vide**, pas `null`. On peut aussi passer directement un tableau.",
          "`int[]... n` est permis (varargs de tableaux)."
        ] },
        { code: String.raw`static int count(String... s) { return s.length; }

count();                        // 0
count("a", "b");                // 2
count(new String[3]);           // 3 : le tableau est utilisé tel quel
count((String) null);           // 1 : un élément null
count((String[]) null);         // NullPointerException sur s.length` }
      ]
    },
    {
      title: "Variables locales, portée et var",
      blocks: [
        { list: [
          "Une variable locale existe de sa déclaration jusqu'à la fin du **bloc** qui la contient. Un paramètre a pour portée toute la méthode.",
          "Elle doit être affectée avant d'être lue : pas de valeur par défaut.",
          "Une variable locale ou un paramètre peut **masquer** un champ (on retrouve le champ avec `this.x` ou `Classe.x`), mais ne peut pas redéclarer une autre variable locale encore en portée : `int x = 1; { int x = 2; }` ne compile pas.",
          "Après la fin d'un bloc, son nom peut être réutilisé : `{ int y = 2; } int y = 3;` compile."
        ] },
        { h: "var : inférence de type des variables locales" },
        { p: "`var` demande au compilateur de déduire le type **statique** de la variable à partir de son initialiseur. Ce type est fixé définitivement : `var a = 1; a = \"s\";` ne compile pas." },
        { table: { head: ["Autorisé", "Interdit"], rows: [
          ["variable locale avec initialiseur : `var n = 10;`", "champ, paramètre de méthode ou de constructeur, type de retour"],
          ["boucles `for (var i = 0; …)` et `for (var s : list)`", "sans initialiseur : `var x;`"],
          ["try-with-resources : `try (var r = …)`", "`var x = null;`"],
          ["paramètres de lambda : `(var a, var b) -> a + b`", "plusieurs variables : `var a = 1, b = 2;`"],
          ["`var arr = new int[] {1, 2};`", "initialiseur de tableau seul : `var arr = {1, 2};` et crochets : `var a[] = …`"],
          ["`final var x = 1;`", "lambda ou référence de méthode sans type cible : `var f = () -> 1;`"]
        ] } },
        { list: [
          "`var` n'est pas un mot-clé réservé mais un nom de type réservé : `var var = \"var\";` compile ; une classe, une interface ou un record nommé `var` ne compile pas.",
          "`var list = new ArrayList<>();` compile : le type inféré est `ArrayList<Object>`.",
          "Dans une lambda, `var` s'applique à **tous** les paramètres ou à aucun : `(var a, b) -> …` ne compile pas."
        ] },
        { trap: "`var` n'apporte aucun typage dynamique. `var d = 'a' + 1;` déclare un `int`, `var x = 1L;` un `long` : c'est le type de l'expression de droite qui décide, rien d'autre." }
      ]
    },
    {
      title: "Encapsulation et objets immuables",
      blocks: [
        { p: "**Encapsuler**, c'est rendre les champs `private` et n'exposer l'état que par des méthodes qui contrôlent les invariants. Un objet **immuable** est un objet dont l'état ne peut plus changer après la construction (`String`, `LocalDate`, les wrappers…)." },
        { h: "Recette d'une classe immuable" },
        { list: [
          "Classe `final` (ou constructeurs privés + fabriques) : aucune sous-classe ne peut ajouter d'état modifiable ni redéfinir les accesseurs.",
          "Tous les champs `private final`.",
          "Aucun setter ni méthode modifiant l'état.",
          "**Copie défensive en entrée** : le constructeur copie les arguments modifiables (collections, tableaux, `StringBuilder`, `Date`…).",
          "**Copie défensive en sortie** : les accesseurs ne renvoient jamais la référence interne d'un objet modifiable (copie ou vue non modifiable)."
        ] },
        { code: String.raw`public final class Team {
    private final String name;
    private final List<String> members;
    public Team(String name, List<String> members) {
        this.name = name;                          // String est immuable
        this.members = new ArrayList<>(members);   // copie en entrée
    }
    public String getName() { return name; }
    public List<String> getMembers() {
        return new ArrayList<>(members);           // copie en sortie
    }
}` },
        { trap: "`private final List<String> members` ne suffit pas : `final` empêche de réaffecter le champ, pas de modifier la liste. Sans copie, l'appelant qui garde la liste passée au constructeur, ou qui reçoit la liste du getter, modifie l'état interne." },
        { tip: "`List.copyOf(members)` crée en une fois une copie **non modifiable** : stockée dans le constructeur, elle peut être renvoyée telle quelle par le getter." }
      ]
    },
    {
      title: "Records",
      blocks: [
        { p: "Un record est une classe concise et immuable en surface : `record Point(int x, int y) { }` déclare deux **composants**. Le compilateur génère pour chacun un champ `private final` et un accesseur public **sans préfixe get** (`x()`, `y()`), ainsi que le constructeur canonique, `equals`, `hashCode` et `toString`." },
        { list: [
          "`toString()` : `Point[x=1, y=2]`.",
          "`equals()` compare tous les composants (`equals` pour les objets, donc **référence** pour un composant tableau) ; `hashCode()` est cohérent.",
          "Un record est implicitement `final` et étend `java.lang.Record` : pas de clause `extends`, pas de `abstract`, et aucune classe ne peut en hériter.",
          "Il peut **implémenter** des interfaces, être générique, être imbriqué ou local.",
          "Un record imbriqué ou local est implicitement `static` : il n'accède ni aux champs d'instance de la classe englobante ni aux variables locales de la méthode."
        ] },
        { table: { head: ["Permis dans le corps", "Interdit"], rows: [
          ["champs, méthodes et initialiseurs `static`", "champ d'instance supplémentaire (« field declaration must be static »)"],
          ["méthodes d'instance", "initialiseur d'instance `{ }`"],
          ["constructeurs (canonique, compact, autres)", "réaffecter un composant : `this.qty = q;` (champ final)"],
          ["types imbriqués (classes, records, enums, interfaces)", "méthode `abstract` ou `native`"],
          ["redéfinition d'un accesseur, de `equals`, `hashCode`, `toString`", "accesseur redéfini non `public` ou avec un autre type de retour"]
        ] } },
        { h: "Constructeurs" },
        { code: String.raw`record Range(int lo, int hi) {
    Range {                                 // constructeur compact : pas de parenthèses
        if (lo > hi) {
            int t = lo; lo = hi; hi = t;    // on modifie les PARAMÈTRES
        }
    }                                       // this.lo = lo; this.hi = hi; ajoutés ici
    Range(int hi) { this(0, hi); }          // constructeur non canonique
}` },
        { list: [
          "**Canonique** explicite : même liste de paramètres (types et noms) que l'en-tête ; il doit affecter tous les champs.",
          "**Compact** : pas de liste de paramètres ; sert à valider ou normaliser. Les champs sont affectés automatiquement **à la fin** à partir des paramètres. Y écrire `this.lo = …` est une erreur de compilation, tout comme `return`.",
          "On ne peut pas déclarer à la fois le canonique explicite et le compact.",
          "Tout autre constructeur doit commencer par `this(...)` et aboutir au canonique.",
          "Le constructeur canonique (compact ou non) doit être au moins aussi accessible que le record et ne peut pas avoir de clause `throws`."
        ] },
        { trap: "Dans un constructeur compact, les champs ne sont pas encore affectés : `this.lo` ne peut y être ni écrit ni lu (erreur de compilation dans les deux cas). On travaille uniquement sur les paramètres `lo` et `hi`." },
        { trap: "Un record n'est pas profondément immuable : un composant `int[]` ou `List` reste modifiable par qui en détient la référence. Il faut des copies défensives dans le constructeur et l'accesseur. Et deux records contenant des tableaux distincts au contenu identique ne sont **pas** `equals`." }
      ]
    },
    {
      title: "Enums",
      blocks: [
        { p: "Un enum définit un ensemble fixe de constantes, chacune étant une instance unique (`public static final`) du type. Il étend implicitement `java.lang.Enum` : il ne peut étendre aucune classe, mais peut implémenter des interfaces. Les constantes se comparent avec `==`." },
        { table: { head: ["Méthode", "Rôle"], rows: [
          ["`static E[] values()`", "nouveau tableau des constantes, dans l'ordre de déclaration"],
          ["`static E valueOf(String)`", "constante de ce nom exact ; sinon `IllegalArgumentException` (sensible à la casse)"],
          ["`int ordinal()`", "position, à partir de `0`"],
          ["`String name()`", "nom exact de la constante (`final`) ; `toString()` renvoie la même chose mais peut être redéfini"],
          ["`int compareTo(E)`", "différence des ordinaux : ordre de déclaration"]
        ] } },
        { h: "Règles de syntaxe" },
        { list: [
          "La liste des constantes vient **en premier** dans le corps.",
          "Le point-virgule après la liste est facultatif si l'enum ne contient que des constantes (`enum A { X, Y }`), **obligatoire** dès qu'un membre suit.",
          "Les constructeurs sont implicitement `private` : `private` ou rien ; `public` et `protected` ne compilent pas. `new Level()` est interdit partout.",
          "Arguments du constructeur à la suite de la constante : `LOW(1), MID(5);`.",
          "Un enum ne peut être déclaré ni `final` ni `abstract`, et ne peut pas être étendu."
        ] },
        { code: String.raw`enum Level {
    LOW(1), MID(5) { String tag() { return "m"; } }, HIGH(10);
    private final int w;
    Level(int w) { this.w = w; }
    String tag() { return name().toLowerCase() + w; }
}
// Level.MID.tag() -> "m" ; Level.HIGH.tag() -> "high10"` },
        { h: "Corps propres à une constante et méthodes abstraites" },
        { p: "Une constante peut avoir un corps `{ … }` qui redéfinit des méthodes de l'enum (classe anonyme). Si l'enum déclare une méthode `abstract`, **chaque** constante doit l'implémenter dans son corps, sinon l'enum ne compile pas." },
        { code: String.raw`enum Op {
    ADD { int apply(int a, int b) { return a + b; } },
    SUB { int apply(int a, int b) { return a - b; } };
    abstract int apply(int a, int b);
}` },
        { h: "Initialisation" },
        { p: "Les constantes sont les premiers champs statiques de l'enum : au premier usage du type, **tous** les constructeurs s'exécutent, dans l'ordre de déclaration, avant les autres initialiseurs statiques. Un seul passage, quel que soit le nombre de constantes utilisées ensuite." },
        { trap: "Un constructeur d'enum ne peut pas lire un champ statique non constant de l'enum (« illegal reference to static field from initializer ») : ce champ n'est pas encore initialisé quand les constantes sont construites." },
        { h: "Enums dans un switch" },
        { list: [
          "Les `case` utilisent le nom simple de la constante (`case SAT`). Depuis **Java 21**, le nom qualifié (`case Day.SUN`) est aussi accepté.",
          "Une **expression** switch sur un enum doit être exhaustive : toutes les constantes ou un `default`. Si toutes les constantes sont couvertes, `default` est inutile.",
          "Une **instruction** switch classique sur un enum n'a pas à être exhaustive."
        ] },
        { code: String.raw`String kind = switch (day) {
    case SAT, SUN -> "weekend";
    case MON -> "work";          // toutes les constantes : pas de default requis
};` }
      ]
    },
    {
      title: "Classes imbriquées",
      blocks: [
        { table: { head: ["Type", "Déclaration", "Lien avec une instance englobante", "Modificateurs d'accès"], rows: [
          ["static nested", "membre `static class`", "aucun", "les quatre niveaux"],
          ["inner (classe interne)", "membre non statique", "oui : `Outer.this`", "les quatre niveaux"],
          ["locale", "dans un bloc ou une méthode", "oui si le contexte est d'instance", "aucun (`abstract` ou `final` seulement)"],
          ["anonyme", "`new Type(...) { … }`", "oui si le contexte est d'instance", "aucun"]
        ] } },
        { h: "Classe imbriquée statique" },
        { list: [
          "S'instancie sans instance englobante : `new Outer.Nested()` (ou `new Nested()` depuis `Outer`).",
          "Accède aux membres **statiques** de la classe englobante, y compris privés ; pour les membres d'instance il lui faut une référence explicite (`b.balance`).",
          "`o.new Nested()` ne compile pas (« qualified new of static class »)."
        ] },
        { h: "Classe interne (inner)" },
        { code: String.raw`public class Outer {
    int x = 1;
    class Inner {
        int x = 2;
        void show(int x) {
            System.out.println(x);             // paramètre
            System.out.println(this.x);        // champ de Inner
            System.out.println(Outer.this.x);  // champ de Outer
        }
    }
    public static void main(String[] args) {
        Outer o = new Outer();
        Outer.Inner i = o.new Inner();         // instance englobante obligatoire
        Inner j = new Outer().new Inner();
    }
}` },
        { list: [
          "Chaque instance d'une classe interne est attachée à une instance de la classe englobante, dont elle voit tous les membres, même privés.",
          "Depuis une méthode d'instance de `Outer`, `new Inner()` suffit (`this` implicite). Depuis un contexte **statique**, il faut `outerRef.new Inner()`.",
          "Depuis Java 16, une classe interne peut déclarer des membres `static` (champs, méthodes, records…)."
        ] },
        { trap: "`new Outer.Inner()` et `new Inner()` dans `main` ne compilent pas si `Inner` n'est pas statique. `Outer.new Inner()` et `o.Inner()` non plus : la seule forme valide est `référence.new Inner()`." },
        { h: "Classe locale" },
        { list: [
          "Déclarée dans un bloc, visible seulement dans ce bloc, après sa déclaration.",
          "Pas de modificateur d'accès ni de `static` : seuls `abstract` et `final` sont permis.",
          "Elle ne peut utiliser que les variables locales et paramètres **final ou effectivement final** de la méthode. L'erreur est signalée à l'endroit où la variable est utilisée dans la classe.",
          "Dans une méthode statique, elle n'a pas d'instance englobante et ne voit pas les champs d'instance.",
          "Records, enums et interfaces locaux sont permis (Java 16+) et sont implicitement statiques : ils ne capturent aucune variable locale."
        ] },
        { tip: "Effectivement final = la variable n'est jamais réaffectée après son initialisation, ni avant ni **après** la déclaration de la classe locale. Un `step++` placé plus bas dans la méthode suffit à tout casser." },
        { h: "Classe anonyme" },
        { list: [
          "Déclare et instancie en une expression une sous-classe d'une classe (éventuellement abstraite) ou une implémentation d'**une** interface : `new Shape(\"sq\") { … };`, avec le point-virgule de l'instruction.",
          "Les arguments entre parenthèses vont au constructeur de la super-classe ; elle ne peut pas déclarer de constructeur (elle n'a pas de nom), mais peut avoir des champs, des méthodes et un initialiseur d'instance.",
          "Mêmes règles de capture que la classe locale : variables locales effectivement finales.",
          "Elle ne peut pas à la fois étendre une classe et implémenter une interface, ni implémenter deux interfaces."
        ] },
        { trap: "Les méthodes ajoutées dans une classe anonyme sont invisibles à travers une référence du type parent : seules les méthodes déclarées dans ce type peuvent être appelées, sauf si la variable est déclarée avec `var`." }
      ]
    }
  ],
  questions: [
    {
      id: "oop-classes-001",
      difficulty: 2,
      q: "How many Main objects are eligible for garbage collection when line n1 is reached?",
      code: String.raw`public class Main {
    String name;
    Main(String n) { name = n; }
    public static void main(String[] args) {
        Main a = new Main("a");
        Main b = new Main("b");
        Main c = a;
        a = b;
        b = null;
        c = null;
        // n1
    }
}`,
      options: ["0", "1", "2", "3"],
      answer: [1],
      explain: "Deux objets `Main` sont créés. Le premier (\"a\") est référencé par `a` puis aussi par `c` ; après `a = b`, seul `c` le désigne, et `c = null` supprime sa dernière référence : il est éligible. Le second (\"b\") est référencé par `b` puis par `a` ; `b = null` ne retire qu'une des deux références, `a` le désigne toujours. Un seul objet est donc éligible. Répondre 2 revient à compter les variables mises à `null` au lieu des objets devenus inatteignables."
    },
    {
      id: "oop-classes-002",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    static void change(StringBuilder sb, int[] arr, int n) {
        sb.append("b");
        sb = new StringBuilder("z");
        sb.append("c");
        arr[0]++;
        arr = new int[] { 9 };
        n++;
    }
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder("a");
        int[] arr = { 1 };
        int n = 1;
        change(sb, arr, n);
        System.out.println(sb + " " + arr[0] + " " + n);
    }
}`,
      options: ["ab 2 1", "zc 9 2", "abc 2 1", "ab 1 1", "zc 2 1", "a 1 1"],
      answer: [0],
      explain: "Java passe tout par valeur ; pour un objet, c'est la référence qui est copiée. `sb.append(\"b\")` modifie l'objet de l'appelant, puis `sb = new StringBuilder(\"z\")` ne réaffecte que la copie locale : le `append(\"c\")` suivant touche le nouvel objet, invisible pour `main` (d'où `ab` et non `abc`). `arr[0]++` modifie le tableau partagé (2), alors que `arr = new int[] { 9 }` est sans effet à l'extérieur. `n++` incrémente une copie du primitif : `n` reste à 1."
    },
    {
      id: "oop-classes-003",
      difficulty: 3,
      q: "Given the following two source files, which lines fail to compile? (Choose two.)",
      code: String.raw`// a/Bird.java
package a;
public class Bird {
    protected void fly() { }
}

// b/Eagle.java
package b;
import a.Bird;
public class Eagle extends Bird {
    void test() {
        fly();                    // n1
        Bird b = new Bird();
        b.fly();                  // n2
        Eagle e = new Eagle();
        e.fly();                  // n3
        Bird b2 = new Eagle();
        b2.fly();                 // n4
    }
}`,
      options: ["n1", "n2", "n3", "n4"],
      answer: [1, 3],
      explain: "Depuis un autre package, un membre `protected` n'est accessible à la sous-classe que par héritage : via `this` (n1) ou via une référence dont le type déclaré est la sous-classe elle-même (n3, type `Eagle`). En n2 et n4, la référence est de type `Bird` : le compilateur répond « fly() has protected access in Bird ». Le piège est n4 : l'objet est bien un `Eagle`, mais seul le type déclaré de la variable (`Bird`) compte."
    },
    {
      id: "oop-classes-004",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    static int count;
    int id;
    Main() { id = ++count; }
    static int total() { return count; }
    public static void main(String[] args) {
        Main c1 = new Main();
        Main c2 = new Main();
        c1 = null;
        System.out.println(c1.total() + " " + c2.id + " " + c1.count);
    }
}`,
      options: [
        "2 2 2",
        "2 2 0",
        "1 2 2",
        "The code does not compile",
        "A NullPointerException is thrown at runtime"
      ],
      answer: [0],
      explain: "`count` est statique : il est partagé et vaut 2 après les deux constructions ; `c2.id` vaut 2. `c1.total()` et `c1.count` désignent des membres statiques : le compilateur n'utilise que le type déclaré de `c1` (`Main`) et l'objet n'est jamais déréférencé, donc aucune `NullPointerException` malgré `c1 == null`. Accéder à un membre statique par une référence est déconseillé mais compile."
    },
    {
      id: "oop-classes-005",
      difficulty: 1,
      q: "Which statements, inserted independently at line n1, allow the code to compile? (Choose two.)",
      code: String.raw`import java.util.List;
// n1
public class Main {
    public static void main(String[] args) {
        List<Integer> list = asList(3, 1, 2);
        System.out.println(list);
    }
}`,
      options: [
        "import static java.util.Arrays.asList;",
        "import static java.util.Arrays.*;",
        "static import java.util.Arrays.asList;",
        "import java.util.Arrays.asList;",
        "import static java.util.Arrays;",
        "import static java.util.Arrays.asList();"
      ],
      answer: [0, 1],
      explain: "Un import statique s'écrit `import static` suivi d'un membre statique précis (`Arrays.asList`) ou du joker `Arrays.*`. `static import` inverse les mots-clés. Sans `static`, `import java.util.Arrays.asList;` cherche un type nommé `asList` qui n'existe pas. `import static java.util.Arrays;` désigne une classe et non un membre. Enfin, on n'écrit jamais de parenthèses dans un import."
    },
    {
      id: "oop-classes-006",
      difficulty: 3,
      q: "Which statement is true about the following class?",
      code: String.raw`public class Config {
    private final int a;
    private static final int B;       // n1
    private final int c = 3;
    static { B = 2; }
    { a = 1; }
    Config() { }                      // n2
    Config(int a) { this.a = a; }     // n3
}`,
      options: [
        "The class compiles without error",
        "Line n1 fails to compile because a static final field must be initialized in its declaration",
        "Line n2 fails to compile because this constructor does not assign the field a",
        "Line n3 fails to compile because the field a may already have been assigned",
        "The instance initializer fails to compile because a final field cannot be assigned there"
      ],
      answer: [3],
      explain: "Un champ `final` doit être affecté exactement une fois. `B` peut l'être dans un initialiseur statique (n1 est correct) et `a` dans un initialiseur d'instance. Comme cet initialiseur s'exécute avant le corps de **chaque** constructeur, `a` est déjà affecté quand n3 exécute `this.a = a` : « variable a might already have been assigned ». Pour la même raison, le constructeur n2 n'a rien à affecter et compile."
    },
    {
      id: "oop-classes-007",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`public class Init {
    static { System.out.print("A"); }
    private String s = print("B");
    { System.out.print("C"); }
    static String t = print("D");
    Init() { System.out.print("E"); }
    static String print(String x) { System.out.print(x); return x; }
    public static void main(String[] args) {
        System.out.print("F");
        new Init();
        new Init();
    }
}`,
      options: ["ADFBCEBCE", "FADBCEBCE", "ADFBCEE", "ABCDFEE", "FABCDEBCE", "ADFEBCEBC"],
      answer: [0],
      explain: "La classe est initialisée avant l'exécution de `main` : les initialiseurs statiques s'exécutent une seule fois, dans l'ordre du texte, soit `A` puis `D` (le champ statique `t` est déclaré plus bas mais reste statique). `main` affiche ensuite `F`. Chaque `new Init()` exécute les initialiseurs d'instance dans l'ordre du texte (`B` puis `C`), puis le corps du constructeur (`E`) : `BCE` deux fois. Les réponses commençant par `F` oublient que l'initialisation statique précède `main` ; `ADFBCEE` oublie que les initialiseurs d'instance sont rejoués à chaque instanciation."
    },
    {
      id: "oop-classes-008",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`public class Box {
    int w, h;
    Box() { this(2); System.out.print("a"); }
    Box(int w) { this(w, w + 1); System.out.print("b"); }
    Box(int w, int h) { this.w = w; this.h = h; System.out.print("c"); }
    public static void main(String[] args) {
        Box b = new Box();
        System.out.print(b.w * b.h);
    }
}`,
      options: ["cba6", "abc6", "cba4", "abc0", "The code does not compile"],
      answer: [0],
      explain: "`this(...)` est la première instruction de chaque constructeur : `Box()` appelle `Box(2)`, qui appelle `Box(2, 3)`. Le constructeur à deux paramètres se termine en premier (`c`), puis l'exécution remonte : `b`, puis `a`. Les champs valent `w = 2` et `h = 3`, d'où 6. `abc` correspondrait à un affichage placé avant l'appel `this(...)`, ce qui est impossible en Java 21."
    },
    {
      id: "oop-classes-009",
      difficulty: 2,
      q: "Which lines fail to compile with Java 21? (Choose two.)",
      code: String.raw`public class Robot {
    private String name;
    public Robot(String name) { this.name = name; }
    public Robot() {
        System.out.println("new");
        this("anon");                         // n1
    }
    private Robot(int n) { this("r" + n); }   // n2
    Robot(Robot r) { this(r.name); }          // n3
    Robot(double d) { this(d); }              // n4
}`,
      options: ["n1", "n2", "n3", "n4"],
      answer: [0, 3],
      explain: "En Java 21, l'appel `this(...)` doit être la **première instruction** du constructeur : en n1 il suit un `println`, erreur de compilation. En n4, le constructeur `Robot(double)` s'appelle lui-même : « recursive constructor invocation ». n2 est valide (un constructeur peut être `private` et l'argument de `this(...)` peut être une expression sur ses paramètres). n3 aussi : `r.name` est le champ privé d'un **autre** objet de la même classe, ce qui est permis."
    },
    {
      id: "oop-classes-010",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    static int x = init();
    static int y = 10;
    static int init() { return y + 1; }
    public static void main(String[] args) {
        System.out.println(x + " " + y);
    }
}`,
      options: [
        "1 10",
        "11 10",
        "0 10",
        "The code does not compile because of an illegal forward reference",
        "An ExceptionInInitializerError is thrown at runtime"
      ],
      answer: [0],
      explain: "Les champs statiques sont initialisés dans l'ordre du texte. Quand `x = init()` s'exécute, `y` n'a pas encore reçu 10 : il a sa valeur par défaut `0`, donc `init()` renvoie 1. Ensuite `y` reçoit 10. La règle de « illegal forward reference » ne vise que la lecture **directe par nom simple** dans un initialiseur (`static int x = y + 1;` placé avant `y`) ; passer par une méthode compile."
    },
    {
      id: "oop-classes-011",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    static void m(long x) { System.out.print("long "); }
    static void m(Integer x) { System.out.print("Integer "); }
    static void m(int... x) { System.out.print("varargs "); }
    static void m(Object x) { System.out.print("Object "); }
    public static void main(String[] args) {
        byte b = 1;
        m(b);
        m('a');
        m(2.0);
        m();
        m(7);
    }
}`,
      options: [
        "long long Object varargs long",
        "long long Object varargs Integer",
        "long Object Object varargs Integer",
        "varargs varargs Object varargs varargs",
        "The code does not compile because the call m(7) is ambiguous"
      ],
      answer: [0],
      explain: "La résolution se fait en trois phases : élargissement primitif d'abord, boxing ensuite, varargs en dernier. `m(b)`, `m('a')` et `m(7)` trouvent `m(long)` dès la première phase (`byte`, `char` et `int` s'élargissent en `long`) : le boxing en `Integer` n'est jamais envisagé pour `m(7)`. `m(2.0)` : un `double` ne s'élargit vers aucun paramètre, il est boxé en `Double`, compatible avec `Object`. `m()` ne correspond qu'à la version varargs."
    },
    {
      id: "oop-classes-012",
      difficulty: 3,
      q: "Given the following methods, which calls compile? (Choose three.)",
      code: String.raw`static void a(Long x) { }
static void b(long x) { }
static void c(Object x) { }
static void d(int x, long y) { }
static void d(long x, int y) { }`,
      options: [
        "a(5);",
        "b(5);",
        "c(5);",
        "d(5, 5);",
        "b(Integer.valueOf(5));",
        "a(Integer.valueOf(5));"
      ],
      answer: [1, 2, 4],
      explain: "`b(5)` : élargissement `int` → `long`. `c(5)` : boxing en `Integer` puis élargissement de référence vers `Object`. `b(Integer.valueOf(5))` : unboxing puis élargissement en `long`. En revanche `a(5)` exigerait un élargissement **suivi** d'un boxing (`int` → `long` → `Long`), ce que Java ne fait jamais ; et `Integer` n'est pas un sous-type de `Long`, donc `a(Integer.valueOf(5))` échoue aussi. `d(5, 5)` est ambigu : chaque version demande un élargissement, aucune n'est plus spécifique que l'autre."
    },
    {
      id: "oop-classes-013",
      difficulty: 1,
      q: "Which method declarations compile? (Choose two.)",
      options: [
        "void a(int... n, String s) { }",
        "void b(String s, int... n) { }",
        "void c(int... n, String... s) { }",
        "void d(int[]... n) { }",
        "void e(int n...) { }"
      ],
      answer: [1, 3],
      explain: "Un paramètre varargs doit être le **dernier** de la liste, et il ne peut y en avoir qu'un : `a` et `c` échouent avec « varargs parameter must be the last parameter ». Les trois points se placent après le type, pas après le nom : `int n...` est une erreur de syntaxe. `int[]... n` est valide : c'est un varargs dont chaque élément est un tableau d'`int`."
    },
    {
      id: "oop-classes-014",
      difficulty: 2,
      q: "Which statements compile when placed inside a method? (Choose three.)",
      options: [
        "var x = null;",
        "var list = new java.util.ArrayList<>();",
        "var a = 1, b = 2;",
        "var arr = {1, 2};",
        "var arr2 = new int[] {1, 2};",
        "var var = \"var\";",
        "var f = () -> 1;"
      ],
      answer: [1, 4, 5],
      explain: "`var` exige un initialiseur dont le type est déterminable seul. `new ArrayList<>()` convient (type inféré `ArrayList<Object>`), tout comme `new int[] {1, 2}`. `var var = \"var\";` compile car `var` n'est pas un mot-clé réservé : il peut servir de nom de variable. À l'inverse, `null` n'a pas de type, un initialiseur de tableau `{1, 2}` et une lambda ont besoin d'un type cible, et `var` est interdit dans une déclaration multiple (« 'var' is not allowed in a compound declaration »)."
    },
    {
      id: "oop-classes-015",
      difficulty: 2,
      q: "Which two changes, applied together, make the Team class immutable? (Choose two.)",
      code: String.raw`import java.util.ArrayList;
import java.util.List;

public final class Team {
    private final String name;
    private final List<String> members;
    public Team(String name, List<String> members) {
        this.name = name;
        this.members = members;                              // n1
    }
    public String getName() { return name; }
    public List<String> getMembers() { return members; }     // n2
}`,
      options: [
        "Replace the statement at n1 with: this.members = new ArrayList<>(members);",
        "Replace the body of the method at n2 with: return new ArrayList<>(members);",
        "Declare both getter methods final",
        "Replace the body of getName() with: return new String(name);",
        "Declare the constructor private",
        "Declare the field members static"
      ],
      answer: [0, 1],
      explain: "La classe est déjà `final` et ses champs `private final`, mais `final` ne protège que la référence, pas la liste. Sans copie à n1, l'appelant garde la liste passée au constructeur et peut la modifier ; sans copie à n2, celui qui reçoit la liste interne peut y ajouter des éléments. Il faut donc une copie défensive en entrée **et** en sortie. Les getters d'une classe `final` ne peuvent déjà pas être redéfinis, `String` est immuable (copie inutile), un constructeur privé rendrait la classe inutilisable et un champ `static` serait partagé par toutes les équipes."
    },
    {
      id: "oop-classes-016",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`record Range(int lo, int hi) {
    Range {
        if (lo > hi) {
            int t = lo;
            lo = hi;
            hi = t;
        }
    }
    Range(int hi) { this(0, hi); }
    int size() { return hi - lo; }
}
public class Main {
    public static void main(String[] args) {
        var r = new Range(5, 2);
        System.out.println(r + " " + r.size() + " "
            + new Range(3).equals(new Range(0, 3)));
    }
}`,
      options: [
        "Range[lo=2, hi=5] 3 true",
        "Range[lo=5, hi=2] -3 true",
        "Range[lo=2, hi=5] 3 false",
        "The code does not compile because a compact constructor cannot reassign its parameters",
        "The code does not compile because a record cannot declare a second constructor"
      ],
      answer: [0],
      explain: "Dans un constructeur compact, `lo` et `hi` sont les **paramètres** : on peut les réaffecter, et les champs sont initialisés automatiquement à la fin avec leurs valeurs finales, donc `lo=2, hi=5`. Ce qui est interdit, c'est d'écrire `this.lo = ...`. Un record peut déclarer d'autres constructeurs à condition qu'ils commencent par `this(...)`. `toString()` généré donne `Range[lo=2, hi=5]`, et `equals()` généré compare les composants : `Range(3)` et `Range(0, 3)` sont égaux."
    },
    {
      id: "oop-classes-017",
      difficulty: 3,
      q: "Which lines fail to compile? (Choose three.)",
      code: String.raw`record Item(String name, int qty) implements Comparable<Item> {
    static int created;                                    // n1
    private int discount;                                  // n2
    Item { this.name = name.trim(); }                      // n3
    public String name() { return name.toUpperCase(); }    // n4
    void setQty(int q) { this.qty = q; }                   // n5
    public int compareTo(Item o) { return qty - o.qty; }
    record Tag(String v) { }                               // n6
}`,
      options: ["n1", "n2", "n3", "n4", "n5", "n6"],
      answer: [1, 2, 4],
      explain: "n2 : un record ne peut pas déclarer de champ d'instance en dehors de ses composants (« field declaration must be static »). n3 : dans un constructeur compact, on ne peut pas affecter `this.name` ; il faut écrire `name = name.trim();` pour modifier le paramètre. n5 : les champs des composants sont `final`, les réaffecter est interdit. Sont valides : un champ statique (n1), la redéfinition `public` d'un accesseur (n4), l'implémentation d'une interface et un record imbriqué (n6)."
    },
    {
      id: "oop-classes-018",
      difficulty: 1,
      q: "Which statements about records are true? (Choose two.)",
      options: [
        "A record is implicitly final",
        "A record can implement interfaces",
        "A record can extend another class as long as that class is abstract",
        "A record can declare additional private instance fields in its body",
        "A record nested in a class can read the instance fields of the enclosing object directly",
        "A record cannot declare static methods"
      ],
      answer: [0, 1],
      explain: "Un record est implicitement `final` (on ne peut ni en hériter ni le déclarer `abstract`) et peut implémenter des interfaces. Il étend déjà `java.lang.Record` : la clause `extends` est interdite. Son état se limite à ses composants : tout champ supplémentaire doit être `static`. Un record imbriqué est implicitement `static`, il n'a donc pas d'instance englobante. Les méthodes, champs et initialiseurs statiques sont autorisés."
    },
    {
      id: "oop-classes-019",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`enum Level {
    LOW(1), MID(5) { String tag() { return "m"; } }, HIGH(10);
    private final int w;
    Level(int w) { this.w = w; }
    String tag() { return name().toLowerCase() + w; }
}
public class Main {
    public static void main(String[] args) {
        Level l = Level.valueOf("MID");
        System.out.println(l.ordinal() + " " + l.tag() + " " + Level.HIGH.tag()
            + " " + Level.values().length + " " + l.compareTo(Level.HIGH));
    }
}`,
      options: [
        "1 m high10 3 -1",
        "1 mid5 high10 3 -1",
        "2 m high10 3 -1",
        "1 m high10 3 1",
        "1 m HIGH10 3 -1",
        "The code does not compile"
      ],
      answer: [0],
      explain: "`valueOf(\"MID\")` renvoie la constante `MID`, dont l'`ordinal()` est 1 (numérotation à partir de 0). `MID` a un corps propre qui redéfinit `tag()` : `m`. `HIGH` utilise la version de l'enum : `name()` vaut `HIGH`, passé en minuscules, suivi de `w`, soit `high10`. `values()` contient 3 constantes. `compareTo` compare les ordinaux : 1 - 2 = -1. Le constructeur sans modificateur est implicitement `private`, le code compile."
    },
    {
      id: "oop-classes-020",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`enum Coin {
    PENNY, DIME;
    static { System.out.print("s "); }
    Coin() { System.out.print("c "); }
}
public class Main {
    public static void main(String[] args) {
        System.out.print("m ");
        Coin c = Coin.DIME;
        Coin d = Coin.PENNY;
        System.out.print(c.compareTo(d));
    }
}`,
      options: ["m c c s 1", "m s c c 1", "c c s m 1", "m c s c 1", "m c c s -1", "m c s 1"],
      answer: [0],
      explain: "L'enum `Coin` n'est initialisé qu'à son premier usage, donc après l'affichage de `m`. Les constantes sont les premiers champs statiques : **toutes** sont construites, dans l'ordre de déclaration (`c c`), avant le bloc `static` (`s`). Le second accès (`Coin.PENNY`) ne relance rien : chaque constante est une instance unique. `DIME` (ordinal 1) comparé à `PENNY` (ordinal 0) donne 1."
    },
    {
      id: "oop-classes-021",
      difficulty: 2,
      q: "Which enum declarations compile? (Choose two.)",
      options: [
        "enum A { X, Y }",
        "enum B { X, Y; public B() { } }",
        "enum C { private int n; X, Y; }",
        "enum D { X, Y; private D() { } int n; }",
        "enum E { X, Y int n; }",
        "enum F extends Enum<F> { X }"
      ],
      answer: [0, 3],
      explain: "Le point-virgule après les constantes est facultatif quand l'enum ne contient rien d'autre (`A`), mais obligatoire dès qu'un membre suit (`E` ne compile pas). La liste des constantes doit venir en premier (`C` échoue : « enum constant expected here »). Un constructeur d'enum est `private`, explicitement ou implicitement : `public` est refusé (`B`), alors que `D` est correct. Un enum étend implicitement `Enum` et n'accepte aucune clause `extends` (`F`)."
    },
    {
      id: "oop-classes-022",
      difficulty: 2,
      q: "What is the result of compiling and running the following code with Java 21?",
      code: String.raw`enum Day { SAT, SUN, MON }
public class Main {
    static int score(Day d) {
        switch (d) {
            case SAT: return 1;
            case Day.SUN: return 2;        // n1
            default: return 0;
        }
    }
    static String kind(Day d) {
        return switch (d) {                // n2
            case SAT, SUN -> "weekend";
            case MON -> "work";
        };
    }
    public static void main(String[] args) {
        System.out.println(score(Day.SUN) + kind(Day.MON));
    }
}`,
      options: [
        "2work",
        "0work",
        "Line n1 fails to compile because an enum constant in a case label cannot be qualified",
        "The switch at n2 fails to compile because it has no default branch",
        "A MatchException is thrown at runtime"
      ],
      answer: [0],
      explain: "Depuis Java 21, une constante d'enum peut être écrite sous forme qualifiée dans un `case` (`case Day.SUN`) ; c'était une erreur dans les versions précédentes, d'où le distracteur sur n1. L'expression switch en n2 couvre les trois constantes de `Day` : elle est exhaustive et n'a pas besoin de `default`. `score(Day.SUN)` renvoie 2, concaténé à `work`."
    },
    {
      id: "oop-classes-023",
      difficulty: 2,
      q: "Which statements, inserted independently at line n1, compile? (Choose two.)",
      code: String.raw`public class Outer {
    class Inner { }
    static class Nested { }
    public static void main(String[] args) {
        Outer o = new Outer();
        // n1
    }
}`,
      options: [
        "Inner i = o.new Inner();",
        "Outer.Inner i = new Outer().new Inner();",
        "Inner i = new Inner();",
        "Outer.Inner i = new Outer.Inner();",
        "Inner i = o.Inner();",
        "Outer.Inner i = Outer.new Inner();"
      ],
      answer: [0, 1],
      explain: "`Inner` est une classe interne non statique : chaque instance doit être rattachée à une instance de `Outer`. Dans la méthode statique `main` il n'y a pas de `this`, il faut donc la forme `référence.new Inner()`. `new Inner()` et `new Outer.Inner()` échouent (« non-static variable this cannot be referenced from a static context ») ; ces syntaxes ne conviendraient que pour la classe statique `Nested`. `o.Inner()` est un appel de méthode inexistante, et dans `Outer.new Inner()` le qualificateur doit être une **expression** désignant un objet, pas un nom de classe : « cannot find symbol » dans les deux cas."
    },
    {
      id: "oop-classes-024",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class A {
    int x = 1;
    class B {
        int x = 2;
        class C {
            int x = 3;
            void show(int x) {
                System.out.println(x + " " + this.x + " "
                    + B.this.x + " " + A.this.x);
            }
        }
    }
    public static void main(String[] args) {
        A a = new A();
        A.B b = a.new B();
        A.B.C c = b.new C();
        c.show(4);
    }
}`,
      options: ["4 3 2 1", "4 4 2 1", "3 3 2 1", "1 2 3 4", "The code does not compile"],
      answer: [0],
      explain: "Le nom simple `x` désigne la déclaration la plus proche : le paramètre (4). `this.x` est le champ de la classe courante `C` (3). `B.this.x` et `A.this.x` remontent aux instances englobantes : 2 puis 1. L'instanciation en chaîne `a.new B()` puis `b.new C()` est correcte, chaque classe interne ayant besoin de son instance englobante."
    },
    {
      id: "oop-classes-025",
      difficulty: 2,
      q: "What is the result of compiling and running the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) {
        int base = 10;
        int step = 2;
        class Adder {
            int add(int v) { return base + step + v; }
        }
        step++;
        System.out.println(new Adder().add(1));
    }
}`,
      options: ["13", "14", "The code does not compile", "An exception is thrown at runtime"],
      answer: [2],
      explain: "Une classe locale ne peut utiliser que des variables locales `final` ou **effectivement finales**. `base` l'est, mais `step` est modifié par `step++` : peu importe que cette modification soit placée après la déclaration de la classe, la variable n'est plus effectivement finale. Le compilateur signale l'erreur à l'endroit où `step` est utilisé dans `Adder` : « local variables referenced from an inner class must be final or effectively final »."
    },
    {
      id: "oop-classes-026",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    static abstract class Shape {
        final String name;
        Shape(String name) { this.name = name; }
        abstract double area();
    }
    public static void main(String[] args) {
        int side = 3;
        Shape s = new Shape("sq") {
            int calls;
            double area() { calls++; return side * side; }
            public String toString() { return name + calls; }
        };
        s.area();
        s.area();
        System.out.println(s + " " + s.area());
    }
}`,
      options: [
        "sq2 9.0",
        "sq3 9.0",
        "sq2 9",
        "sq0 9.0",
        "The code does not compile because an anonymous class cannot declare a field",
        "The code does not compile because side is not declared final"
      ],
      answer: [0],
      explain: "Une classe anonyme peut étendre une classe abstraite, transmettre des arguments au constructeur parent (`\"sq\"`) et déclarer ses propres champs. `side` n'est jamais réaffecté : il est effectivement final et peut être capturé. Après deux appels, `calls` vaut 2. La concaténation est évaluée de gauche à droite : `s.toString()` donne `sq2` **avant** le troisième appel à `area()`, qui renvoie le `double` 9.0 (l'`int` 9 est élargi par le type de retour)."
    },
    {
      id: "oop-classes-027",
      difficulty: 3,
      q: "Which lines fail to compile? (Choose two.)",
      code: String.raw`public class House {
    private int rooms = 3;
    static class Garage {
        int size() { return rooms; }          // n1
    }
    class Kitchen {
        static int count = 0;                 // n2
        int size() { return rooms; }          // n3
    }
    void build() {
        private class Door { }                // n4
        abstract class Roof { }               // n5
        record Key(int id) { }                // n6
    }
}`,
      options: ["n1", "n2", "n3", "n4", "n5", "n6"],
      answer: [0, 3],
      explain: "n1 : une classe imbriquée **statique** n'a pas d'instance englobante, elle ne peut pas lire le champ d'instance `rooms` sans référence à un `House`. n4 : une classe locale n'accepte aucun modificateur d'accès (ni `static`) ; seuls `abstract` et `final` sont permis, d'où la validité de n5. n2 compile : depuis Java 16, une classe interne peut déclarer des membres statiques. n3 compile : une classe interne accède aux membres, même privés, de l'instance englobante. n6 compile : les records locaux sont autorisés."
    },
    {
      id: "oop-classes-028",
      difficulty: 1,
      q: "Which statements about a Java source file are true? (Choose two.)",
      options: [
        "A package statement, if present, must appear before any import statement",
        "A source file can declare at most one public top-level type, and its name must match the file name",
        "A source file must declare at least one public class",
        "The statement import java.util.*; also imports the types of java.util.function",
        "Classes of the java.lang package must be imported explicitly",
        "A top-level class can be declared private to hide it from other packages"
      ],
      answer: [0, 1],
      explain: "L'ordre imposé est `package`, puis `import`, puis les types. Un fichier contient au plus un type top-level `public`, nommé comme le fichier, mais il peut très bien n'en contenir aucun. Un import avec joker ne couvre que le package indiqué, jamais ses sous-packages. `java.lang` est importé automatiquement. Un type top-level ne peut être que `public` ou package-private : `private` et `protected` y sont refusés (« modifier private not allowed here »)."
    }
  ]
});
