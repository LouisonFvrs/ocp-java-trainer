OCP.register({
  topic: 'oop',
  course: [
    {
      title: "Héritage : extends, super et chaînage des constructeurs",
      blocks: [
        { p: "Une classe hérite d'**une seule** classe (`extends`), mais peut implémenter plusieurs interfaces. Toute classe sans `extends` hérite implicitement de `Object`. Sont hérités les membres `public` et `protected`, ainsi que les membres package-private si la sous-classe est dans le même package. Les membres `private` et les **constructeurs** ne sont jamais hérités." },
        { h: "Règles des constructeurs" },
        { list: [
          "La première instruction d'un constructeur est soit `this(...)`, soit `super(...)`, jamais les deux. En Java 21, aucune instruction ne peut les précéder.",
          "Si le constructeur ne commence par aucun des deux, le compilateur insère `super();` (sans argument).",
          "Une classe sans constructeur reçoit un constructeur par défaut sans argument, qui appelle lui aussi `super();`.",
          "Si la classe parente n'a pas de constructeur sans argument accessible, tout constructeur enfant (y compris le constructeur par défaut) doit appeler explicitement `super(args)`, sinon erreur de compilation.",
          "Une chaîne de `this(...)` qui boucle (`A()` appelle `A(int)` qui appelle `A()`) est une erreur de compilation : `recursive constructor invocation`.",
          "Les arguments de `super(...)` ou `this(...)` ne peuvent pas utiliser de membre d'instance de l'objet en cours de construction (les membres `static` sont autorisés)."
        ] },
        { code: String.raw`class Animal {
    Animal(String name) { }
}
class Dog extends Animal {
    Dog() { }                 // DOES NOT COMPILE: implicit super() not found
    Dog(String n) { super(n); }   // OK
    Dog(int age) { this("rex"); } // OK: delegates to Dog(String)
}
class Cat extends Animal { }      // DOES NOT COMPILE: default constructor calls super()` },
        { trap: "Dès qu'une classe déclare un constructeur avec paramètres, elle perd son constructeur par défaut. Une sous-classe apparemment vide (`class Cat extends Animal { }`) peut donc ne pas compiler." },
        { h: "Le mot-clé super" },
        { list: [
          "`super.method()` appelle la version de la classe parente d'une méthode redéfinie ; `super.field` accède au champ masqué du parent.",
          "`super` et `this` sont interdits dans un contexte `static`.",
          "`super.super.method()` n'existe pas."
        ] }
      ]
    },
    {
      title: "Ordre d'initialisation dans une hiérarchie",
      blocks: [
        { p: "À la première utilisation d'une classe, celle-ci est initialisée (une seule fois), parent d'abord. À chaque `new`, l'instance est construite en remontant jusqu'à `Object` puis en redescendant." },
        { list: [
          "**1.** Champs et blocs `static` de la classe parente, dans l'ordre du source (une seule fois).",
          "**2.** Champs et blocs `static` de la classe enfant (une seule fois).",
          "**3.** Champs et blocs d'instance du parent, dans l'ordre du source.",
          "**4.** Corps du constructeur du parent.",
          "**5.** Champs et blocs d'instance de l'enfant, dans l'ordre du source.",
          "**6.** Corps du ou des constructeurs de l'enfant (si `this(...)` est utilisé : le constructeur ciblé d'abord, puis le reste de l'appelant)."
        ] },
        { code: String.raw`class Base {
    static { System.out.print("1"); }
    { System.out.print("2"); }
    Base() { System.out.print("3"); }
}
class Derived extends Base {
    static { System.out.print("4"); }
    { System.out.print("5"); }
    Derived() { this(0); System.out.print("6"); }
    Derived(int x) { System.out.print("7"); }
}
// new Derived(); new Derived();  prints 142357623576` },
        { trap: "Les blocs d'instance de l'enfant s'exécutent **après** l'appel à `super(...)` et **avant** le reste du corps du constructeur. Avec `this(...)`, ils ne s'exécutent qu'une seule fois (dans le constructeur qui appelle réellement `super`)." },
        { h: "Appeler une méthode redéfinissable depuis un constructeur" },
        { p: "L'appel est polymorphe même pendant la construction : c'est la version de l'enfant qui s'exécute, alors que les champs de l'enfant ne sont pas encore initialisés. Ils valent donc leur valeur par défaut (`0`, `null`, `false`)." },
        { code: String.raw`class Parent {
    Parent() { show(); }
    void show() { System.out.print("P "); }
}
class Child extends Parent {
    private int size = 5;
    private final int max = 9;          // constant variable: inlined by the compiler
    void show() { System.out.print(size + " " + max + " "); }
}
// new Child().show();  prints 0 9 5 9` },
        { trap: "Un champ `final` de type primitif ou `String` initialisé par une expression constante est une *constant variable* : sa valeur est recopiée à la compilation, il n'apparaît donc jamais à `0`/`null`, même vu depuis le constructeur parent." }
      ]
    },
    {
      title: "Redéfinition (overriding) : les règles",
      blocks: [
        { p: "Une méthode d'instance redéfinit une méthode héritée si elle a le même nom et la même liste de paramètres (même signature). Les règles ci-dessous sont vérifiées à la compilation." },
        { table: { head: ["Élément", "Règle pour la méthode redéfinissante"], rows: [
          ["Signature", "Même nom, mêmes types de paramètres (sinon c'est une surcharge)"],
          ["Type de retour", "Identique pour `void` et les primitifs ; identique ou **sous-type** pour les références (retour covariant)"],
          ["Accès", "Identique ou **plus large** (`private` < package < `protected` < `public`)"],
          ["Exceptions vérifiées", "Aucune nouvelle ni plus large : les mêmes, des sous-classes, moins, ou aucune"],
          ["Exceptions non vérifiées", "Libres (`RuntimeException` et `Error`)"],
          ["`final`", "Une méthode `final` ne peut être ni redéfinie ni masquée"],
          ["`static`", "Une méthode d'instance ne peut pas redéfinir une méthode `static`, et inversement : erreur de compilation"]
        ] } },
        { code: String.raw`class Source {
    protected Number read(List<String> l) throws IOException { return 1; }
}
class X extends Source {
    // OK: wider access, covariant return, narrower checked exception
    public Integer read(List<String> l) throws FileNotFoundException { return 1; }
}
// Number read(List<String> l)                    -> weaker access (package < protected)
// protected Object read(List<String> l) ...      -> return type not a subtype
// protected int read(List<String> l) ...         -> int is not compatible with Number
// protected Number read(...) throws Exception    -> broader checked exception` },
        { trap: "Le retour covariant ne concerne que les références : `long` ne peut pas remplacer `int`, et `int` ne peut pas remplacer `Integer` ou `Number`." },
        { trap: "Changer un type de paramètre (`eat(Cat)` au lieu de `eat(Animal)`) crée une **surcharge**, pas une redéfinition. La surcharge est choisie à la compilation d'après le type des **références**, la redéfinition à l'exécution d'après le type de l'**objet**." },
        { h: "@Override" },
        { p: "`@Override` est facultative. Si la méthode annotée ne redéfinit (ou n'implémente) rien, c'est une erreur de compilation. Elle est donc refusée sur une méthode `static` qui en masque une autre, sur une méthode qui porte le nom d'une méthode `private` du parent, et sur une simple surcharge." },
        { tip: "Méthode mentale : vérifier dans l'ordre **signature, retour, accès, exceptions, final/static**." }
      ]
    },
    {
      title: "Masquage : méthodes static, champs et méthodes private",
      blocks: [
        { table: { head: ["Membre", "Mécanisme", "Résolu d'après"], rows: [
          ["Méthode d'instance", "Redéfinition (override)", "le type de l'**objet**, à l'exécution"],
          ["Méthode `static`", "Masquage (hiding)", "le type de la **référence**, à la compilation"],
          ["Champ (d'instance ou `static`)", "Masquage (hiding)", "le type de la **référence**, à la compilation"],
          ["Méthode `private`", "Non héritée : aucune relation", "la classe où l'appel est écrit"]
        ] } },
        { code: String.raw`class A {
    String name = "A";
    static String id() { return "sA"; }
    String get() { return name; }
}
class B extends A {
    String name = "B";
    static String id() { return "sB"; }
    String get() { return name; }
}
A a = new B();
// a.name -> "A"   a.id() -> "sA"   a.get() -> "B"   ((B) a).name -> "B"` },
        { list: [
          "Les champs ne sont **jamais** polymorphes : `a.name` dépend uniquement du type déclaré de `a`.",
          "Une méthode `static` peut être appelée via une référence (même `null`) : seul le type de la référence compte.",
          "Le masquage d'une méthode `static` obéit aux mêmes règles que la redéfinition pour le retour, l'accès et les exceptions.",
          "Une sous-classe peut déclarer une méthode de même signature qu'une méthode `private` du parent : c'est une méthode nouvelle, sans contrainte de retour ni d'accès."
        ] },
        { trap: "Si la classe parente appelle sa propre méthode `private` (par exemple depuis `main` avec `Parent p = new Child(); p.start();`), c'est la version du parent qui s'exécute : il n'y a pas de liaison dynamique sur une méthode `private`." }
      ]
    },
    {
      title: "Classes et méthodes abstraites",
      blocks: [
        { list: [
          "Une classe `abstract` ne peut pas être instanciée avec `new`, mais elle peut avoir des constructeurs (appelés par les sous-classes), des champs, des méthodes concrètes, des méthodes `static` et même un `main`.",
          "Elle peut ne contenir **aucune** méthode abstraite. À l'inverse, une méthode `abstract` ne peut exister que dans une classe `abstract` ou une interface.",
          "Une méthode `abstract` n'a pas de corps : `abstract void run();` (pas d'accolades).",
          "Une classe abstraite peut hériter d'une classe concrète, et peut implémenter une interface sans en implémenter les méthodes.",
          "La première sous-classe **concrète** doit implémenter toutes les méthodes abstraites héritées qui ne le sont pas encore (celles des classes abstraites et des interfaces)."
        ] },
        { table: { head: ["Combinaison", "Valide ?", "Raison"], rows: [
          ["`abstract final` (classe ou méthode)", "non", "`final` interdit l'héritage ou la redéfinition"],
          ["`abstract private` (méthode)", "non", "une méthode `private` n'est pas héritée"],
          ["`abstract static` (méthode)", "non", "une méthode `static` n'est pas redéfinie"],
          ["`abstract protected` / `abstract public`", "oui", ""],
          ["`abstract` package-private", "oui", "mais implémentable seulement dans le même package"]
        ] } },
        { code: String.raw`interface Playable { void play(); }
abstract class Instrument implements Playable {   // OK: play() stays abstract
    abstract void tune();
}
class Violin extends Instrument {
    public void play() { }   // must be public: interface methods are public
    void tune() { }
}` },
        { trap: "Implémenter une méthode d'interface sans écrire `public` ne compile pas : la méthode de l'interface est implicitement `public`, et l'accès ne peut pas être réduit." }
      ]
    },
    {
      title: "Interfaces : membres et modificateurs implicites",
      blocks: [
        { p: "Une interface est implicitement `abstract`. Elle ne peut pas être `final`, n'a ni constructeur ni bloc d'initialisation ni champ d'instance. Une interface hérite d'autres interfaces avec `extends` (plusieurs possibles) ; une classe les implémente avec `implements`." },
        { table: { head: ["Membre", "Modificateurs implicites", "Corps", "Remarques"], rows: [
          ["Champ", "`public static final`", "", "doit être initialisé à la déclaration"],
          ["Méthode abstraite", "`public abstract`", "non", ""],
          ["Méthode `default`", "`public`", "oui", "ne peut être ni `static`, ni `final`, ni `abstract`"],
          ["Méthode `static`", "`public`", "oui", "non héritée par les classes qui implémentent"],
          ["Méthode `private`", "aucun", "oui", "utilisable par les méthodes `default` et `private`"],
          ["Méthode `private static`", "aucun", "oui", "utilisable par toutes les méthodes de l'interface"]
        ] } },
        { list: [
          "`protected` est interdit sur tous les membres d'une interface et `final` sur toutes ses méthodes (sur un champ, `final` est permis mais redondant) ; il n'existe pas d'accès package-private (l'absence de modificateur signifie `public`).",
          "Une méthode sans corps ne peut être ni `private`, ni `default`, ni `static`.",
          "Une constante d'interface ne peut pas être réaffectée : `MAX++` dans une classe qui implémente l'interface ne compile pas.",
          "Une méthode `static` d'interface ne peut pas appeler une méthode d'instance (abstraite, `default` ou `private` non statique) sans référence d'objet."
        ] },
        { code: String.raw`interface Logger {
    String level();                                                // public abstract
    private String prefix() { return "[" + level() + "]"; }
    private static String sep() { return ":"; }
    default String log(String m) { return prefix() + sep() + m; }
    static String raw(String m) { return sep() + m; }              // prefix() not allowed here
}` },
        { h: "Interface fonctionnelle" },
        { p: "Une interface fonctionnelle possède **exactement une** méthode abstraite (SAM). Les méthodes `default`, `static` et `private` ne comptent pas, pas plus que les méthodes abstraites qui redéclarent une méthode `public` de `Object` (`equals`, `hashCode`, `toString`). `@FunctionalInterface` est facultative ; si elle est posée sur un type qui ne respecte pas la règle, la compilation échoue." },
        { trap: "`interface Check { boolean equals(Object o); }` n'est **pas** fonctionnelle (zéro méthode abstraite comptée). `Comparator` l'est, bien qu'elle déclare `compare` et `equals`." }
      ]
    },
    {
      title: "Méthodes default et static : héritage multiple",
      blocks: [
        { p: "Une classe peut hériter de plusieurs interfaces. Quand la même signature arrive par plusieurs chemins, trois règles s'appliquent dans l'ordre :" },
        { list: [
          "**1. La classe gagne** : une méthode héritée d'une super-classe (même abstraite) l'emporte sur toute méthode `default`.",
          "**2. L'interface la plus spécifique gagne** : si `B extends A` et que les deux fournissent `hi()`, c'est celle de `B` qui est retenue.",
          "**3. Sinon, conflit** : la classe doit redéfinir la méthode, faute de quoi elle ne compile pas. Cela vaut aussi quand une interface fournit un `default` et l'autre une méthode abstraite de même signature."
        ] },
        { code: String.raw`interface Walk { default String move() { return "walk"; } }
interface Swim { default String move() { return "swim"; } }
class Duck implements Walk, Swim {
    public String move() { return Swim.super.move() + "!"; }   // choose one explicitly
}` },
        { list: [
          "`Interface.super.method()` appelle la version `default` d'une interface **directement** implémentée (ou étendue). `super.move()` seul désigne la super-classe, pas une interface.",
          "Une méthode `default` ne peut pas redéfinir une méthode de `Object` (`equals`, `hashCode`, `toString`) : erreur de compilation.",
          "Une classe peut redéfinir une méthode `default`, et une classe abstraite ou une sous-interface peut la redéclarer abstraite.",
          "Deux interfaces qui déclarent la même méthode **abstraite** ne posent aucun conflit : une seule implémentation suffit (les types de retour doivent être compatibles)."
        ] },
        { h: "Méthodes static d'interface" },
        { code: String.raw`interface Util {
    static int twice(int x) { return 2 * x; }
}
class Impl implements Util {
    void test() {
        Util.twice(1);    // OK: the only valid form
        twice(1);         // DOES NOT COMPILE: not inherited
        Impl.twice(1);    // DOES NOT COMPILE
    }
}` },
        { trap: "Contrairement aux méthodes `static` d'une classe, celles d'une interface ne sont pas héritées et ne s'appellent ni par le nom de la classe qui implémente, ni par une référence d'instance : uniquement `NomInterface.methode()`." }
      ]
    },
    {
      title: "Classes et interfaces scellées (sealed)",
      blocks: [
        { p: "Un type `sealed` limite la liste de ses sous-types directs. `sealed`, `non-sealed` et `permits` sont des mots-clés contextuels. La clause `permits` se place en dernier : `sealed class A extends B implements C permits D, E { }`." },
        { list: [
          "Chaque sous-type autorisé doit **étendre directement** le type scellé et porter exactement un des modificateurs `final`, `sealed` ou `non-sealed`.",
          "`final` : la branche est fermée. `sealed` : la branche est de nouveau restreinte (avec ses propres sous-types). `non-sealed` : la branche est rouverte à tout le monde.",
          "Un **record** est implicitement `final` et un **enum** est implicitement `final` (ou scellé si ses constantes ont un corps) : aucun modificateur à ajouter. Un record ne peut hériter d'aucune classe, il ne peut donc figurer que dans le `permits` d'une **interface** scellée.",
          "Une **interface** autorisée ne peut pas être `final` : elle est `sealed` ou `non-sealed`.",
          "Les sous-types doivent être dans le **même module** que le type scellé ; dans le module sans nom (pas de `module-info`), dans le **même package**.",
          "`permits` peut être **omise** si tous les sous-types autorisés sont déclarés dans le **même fichier source** (classes de premier niveau ou imbriquées) : ils sont alors déduits.",
          "Un type scellé peut être `abstract`. Une classe `sealed` sans aucun sous-type autorisé ne compile pas.",
          "`non-sealed` n'est permis que sur un type dont un super-type direct est scellé.",
          "Les classes locales et anonymes ne peuvent pas être des sous-types d'un type scellé."
        ] },
        { code: String.raw`sealed interface Shape permits Circle, Square, Polygon { }
record Circle(double r) implements Shape { }       // implicitly final
final class Square implements Shape { }
non-sealed interface Polygon extends Shape { }     // open again
class Hexagon implements Polygon { }               // no modifier required
enum Unit implements Polygon { ONE }` },
        { trap: "Une classe listée dans `permits` sans `final`, `sealed` ni `non-sealed` ne compile pas. Une classe qui étend un type scellé sans figurer dans `permits` ne compile pas non plus." },
        { tip: "Un type scellé rend un `switch` à motifs exhaustif sans `default` : le compilateur connaît tous les sous-types. Ajouter un sous-type sans mettre à jour le `switch` provoque une erreur de compilation." }
      ]
    },
    {
      title: "Polymorphisme, casting et instanceof",
      blocks: [
        { list: [
          "Le **type de la référence** détermine, à la compilation, quels membres sont accessibles, quel champ est lu et quelle surcharge est retenue.",
          "Le **type de l'objet** détermine, à l'exécution, quelle implémentation d'une méthode d'instance redéfinie est exécutée (*virtual method invocation*).",
          "L'objet ne change jamais de type : un cast ne change que le type de la référence."
        ] },
        { table: { head: ["Cast", "Compilation", "Exécution"], rows: [
          ["Upcast (enfant vers parent ou interface)", "implicite", "toujours valide"],
          ["Downcast (parent vers enfant)", "cast explicite obligatoire", "`ClassCastException` si l'objet n'est pas du type visé"],
          ["Entre classes sans lien d'héritage", "erreur de compilation", ""],
          ["Classe non `final` vers une interface non implémentée", "autorisé (une sous-classe pourrait l'implémenter)", "`ClassCastException` possible"],
          ["Classe `final` vers une interface non implémentée", "erreur de compilation", ""],
          ["`null` vers n'importe quel type référence", "autorisé", "jamais d'exception"]
        ] } },
        { code: String.raw`interface Flyer { }
class Bird { }
final class Rock { }
class Eagle extends Bird implements Flyer { }

Bird b = new Eagle();
Flyer f1 = (Flyer) b;               // compiles, succeeds: the object is an Eagle
Eagle e = (Eagle) b;                // compiles, succeeds
Flyer f2 = (Flyer) new Rock();      // DOES NOT COMPILE: Rock is final
String s = (String) b;              // DOES NOT COMPILE: unrelated classes
Integer i = (Integer) (Object) b;   // compiles, ClassCastException at runtime` },
        { h: "instanceof" },
        { list: [
          "`x instanceof T` est `false` si `x` vaut `null`, sans jamais lever d'exception.",
          "Si le compilateur peut prouver que le cast est impossible (`Integer` vers `String`), `instanceof` ne compile pas : mêmes règles que pour le cast.",
          "Le test porte sur le type de l'objet : il est `true` pour la classe de l'objet, ses super-classes et toutes ses interfaces."
        ] },
        { trap: "Une `ClassCastException` est levée à la ligne du cast, pas à la déclaration de l'objet. Tout ce qui est affiché avant reste affiché." }
      ]
    },
    {
      title: "Pattern matching pour instanceof et record patterns",
      blocks: [
        { p: "`if (o instanceof String s)` teste le type et déclare la variable de motif `s`, déjà castée. `s` n'existe que là où le compilateur est certain que le test a réussi (*flow scoping*)." },
        { code: String.raw`if (o instanceof String s && s.length() > 2) { }   // OK: s is definitely matched
if (o instanceof String s || s.length() > 2) { }   // DOES NOT COMPILE

if (!(o instanceof String s)) {
    return;
}
System.out.println(s.length());                    // OK: s is in scope here` },
        { list: [
          "Avec `&&`, la variable est utilisable à droite. Avec `||`, elle ne l'est pas (`o instanceof String s || s.isEmpty()`), sauf si le test est **nié** : `!(o instanceof String s) || s.isEmpty()` compile, car la partie droite n'est évaluée que si le motif a réussi.",
          "Après un `if (!(o instanceof T t))` dont le corps se termine toujours par `return`/`throw`, la variable est visible dans la suite de la méthode.",
          "La variable de motif n'est pas `final` par défaut (elle peut être réaffectée) ; elle ne peut pas porter le nom d'une variable locale déjà visible.",
          "Depuis Java 21, le type du motif peut être le même type ou un super-type de l'expression (`Number n` ... `n instanceof Number x` compile). Avant Java 21, c'était une erreur.",
          "Le type du motif doit rester compatible : `n instanceof String s` avec `n` de type `Number` ne compile pas.",
          "Génériques : `o instanceof List<String> l` avec `o` de type `Object` ne compile pas (cast non vérifiable)."
        ] },
        { h: "Record patterns (Java 21)" },
        { code: String.raw`record Box<T>(T value) { }
record Pair(Object a, Object b) { }

Object o = new Pair(new Box<>("hi"), new Box<>(7));
if (o instanceof Pair(Box(String s), Box(var v)) && v instanceof Integer i) {
    System.out.print(s.length() + i);    // 9
}` },
        { list: [
          "Un record pattern déconstruit le record en appelant ses accesseurs ; il faut autant de sous-motifs que de composants, dans le même ordre.",
          "Chaque sous-motif est un motif de type (`String s`), `var x` (type inféré) ou un autre record pattern (imbrication).",
          "Les arguments de type peuvent être omis : `Box(var v)` est inféré d'après le type testé.",
          "Un record pattern ne correspond **jamais** à `null`. En revanche, un sous-motif `var x` ou un motif de type qui couvre tout le type du composant accepte un composant `null`.",
          "Pour un composant primitif, le type du sous-motif doit être exactement le même (`int` pour un composant `int`), ou `var`.",
          "Un record pattern ne peut pas être suivi d'un identifiant : `Pair(var a, var b) p` ne compile pas en Java 21."
        ] },
        { trap: "`b instanceof Box<String>(String s)` est vrai pour `new Box<String>(null)` et `s` vaut alors `null` : le sous-motif couvre tout le type du composant. Par contre il est faux si `b` lui-même est `null`." }
      ]
    },
    {
      title: "Méthodes de Object : equals, hashCode, toString",
      blocks: [
        { table: { head: ["Méthode", "Signature exacte", "Comportement hérité de `Object`"], rows: [
          ["`equals`", "`public boolean equals(Object obj)`", "compare les références (`==`)"],
          ["`hashCode`", "`public int hashCode()`", "valeur liée à l'identité de l'objet"],
          ["`toString`", "`public String toString()`", "`NomDeClasse@hashEnHexadécimal`"]
        ] } },
        { h: "Contrat de equals" },
        { list: [
          "**Réflexive** : `x.equals(x)` est `true`.",
          "**Symétrique** : `x.equals(y)` si et seulement si `y.equals(x)`.",
          "**Transitive** : si `x.equals(y)` et `y.equals(z)`, alors `x.equals(z)`.",
          "**Cohérente** : le résultat ne change pas tant que les objets ne changent pas.",
          "`x.equals(null)` renvoie `false` (et ne lève pas d'exception)."
        ] },
        { h: "Contrat de hashCode" },
        { list: [
          "Deux objets égaux selon `equals` **doivent** avoir le même `hashCode`.",
          "Deux objets différents **peuvent** avoir le même `hashCode` (collision autorisée).",
          "`hashCode` doit rester constant tant que les champs utilisés par `equals` ne changent pas ; il ne doit utiliser que des champs utilisés par `equals` (ou un sous-ensemble)."
        ] },
        { code: String.raw`class Point {
    final int x;
    Point(int x) { this.x = x; }
    public boolean equals(Point p) { return p != null && x == p.x; }   // OVERLOAD
    public int hashCode() { return x; }
}
Point a = new Point(1), b = new Point(1);
Object c = b;
// a.equals(b) -> true (overload)   a.equals(c) -> false (Object.equals)
// List.of(a).contains(b) -> false: collections call equals(Object)` },
        { trap: "`equals(Point)` est une **surcharge**, pas une redéfinition. Les collections appellent `equals(Object)`, donc la version héritée de `Object`. Avec `@Override`, l'erreur serait détectée à la compilation." },
        { list: [
          "`toString()` est appelée implicitement par la concaténation de chaînes et par `System.out.print(Object)` ; pour une référence `null`, le texte `null` est affiché sans exception.",
          "Redéfinir `equals`, `hashCode` ou `toString` avec un accès plus faible que `public` ne compile pas.",
          "Un record génère automatiquement `equals`, `hashCode` et `toString` à partir de ses composants ; un enum hérite d'`equals` et `hashCode` `final`."
        ] }
      ]
    }
  ],
  questions: [
    {
      id: "oop-inheritance-001",
      difficulty: 2,
      q: "Given the following classes, which code fragments can replace // INSERT so that the code compiles? (Choose two.)",
      code: String.raw`class Animal {
    Animal(String name) { System.out.print("A"); }
}
class Dog extends Animal {
    // INSERT
}`,
      options: [
        String.raw`Dog() { }`,
        String.raw`Dog() { super("x"); }`,
        String.raw`Dog(String n) { this(); }`,
        String.raw`Dog(String n) { System.out.print(n); super(n); }`,
        String.raw`Dog() { this("rex"); }
Dog(String n) { super(n); }`
      ],
      answer: [1, 4],
      explain: "`Animal` n'a pas de constructeur sans argument. `Dog() { }` reçoit un `super();` implicite qui ne correspond à aucun constructeur : erreur. `Dog() { super(\"x\"); }` appelle explicitement le bon constructeur : OK. Le couple `Dog() { this(\"rex\"); }` / `Dog(String n) { super(n); }` est valide : un seul des deux appelle `super`. `Dog(String n) { this(); }` référence un constructeur `Dog()` qui n'existe pas. Enfin, en Java 21, `super(...)` doit être la **première** instruction du constructeur : un `print` avant ne compile pas."
    },
    {
      id: "oop-inheritance-002",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`class Base {
    static { System.out.print("1"); }
    { System.out.print("2"); }
    Base() { System.out.print("3"); }
}
class Derived extends Base {
    static { System.out.print("4"); }
    { System.out.print("5"); }
    Derived() { this(0); System.out.print("6"); }
    Derived(int x) { System.out.print("7"); }
}
public class Main {
    public static void main(String[] args) {
        new Derived();
        new Derived();
    }
}`,
      options: ["142357623576", "14235761423576", "123457623576", "142375623576", "142356723567"],
      answer: [0],
      explain: "Les blocs `static` s'exécutent une seule fois, parent puis enfant : `14`. Chaque `new Derived()` exécute ensuite : bloc d'instance du parent (`2`), constructeur du parent (`3`), bloc d'instance de l'enfant (`5`), puis le constructeur ciblé par `this(0)` (`7`) et enfin le reste de `Derived()` (`6`). D'où `14` + `23576` + `23576`. Les blocs `static` ne sont pas rejoués au second `new`, et le bloc d'instance de l'enfant passe avant le corps de ses constructeurs."
    },
    {
      id: "oop-inheritance-003",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`class Parent {
    Parent() { show(); }
    void show() { System.out.print("P "); }
}
class Child extends Parent {
    private int size = 5;
    private final int max = 9;
    void show() { System.out.print(size + " " + max + " "); }
}
public class Main {
    public static void main(String[] args) {
        new Child().show();
    }
}`,
      options: ["0 9 5 9", "5 9 5 9", "0 0 5 9", "P 5 9", "The code does not compile"],
      answer: [0],
      explain: "L'appel `show()` dans le constructeur de `Parent` est polymorphe : c'est `Child.show()` qui s'exécute, alors que les champs de `Child` ne sont pas encore initialisés. `size` vaut donc `0`. En revanche `max` est un champ `final` initialisé par une constante (*constant variable*) : le compilateur remplace sa lecture par `9`, il n'est jamais vu à `0`. Le second appel, après la construction, affiche `5 9`. `P` n'est jamais affiché car `Parent.show()` est redéfinie."
    },
    {
      id: "oop-inheritance-004",
      difficulty: 2,
      q: "Given the class below (with java.io.* and java.util.* imported), which methods can be declared in a subclass of Source? (Choose two.)",
      code: String.raw`class Source {
    protected Number read(List<String> l) throws IOException { return 1; }
}`,
      options: [
        String.raw`public Integer read(List<String> l) throws FileNotFoundException { return 1; }`,
        String.raw`Number read(List<String> l) { return 1; }`,
        String.raw`protected Number read(List<String> l) throws Exception { return 1; }`,
        String.raw`protected Object read(List<String> l) throws IOException { return 1; }`,
        String.raw`protected Number read(List<String> l) throws IllegalStateException, EOFException { return 1; }`
      ],
      answer: [0, 4],
      explain: "La première option élargit l'accès (`public`), utilise un retour covariant (`Integer` est un sous-type de `Number`) et une exception vérifiée plus étroite (`FileNotFoundException` hérite d'`IOException`) : valide. La dernière ajoute une exception non vérifiée (libre) et `EOFException`, sous-classe d'`IOException` : valide. Sans modificateur, l'accès package-private est plus faible que `protected` : erreur. `throws Exception` élargit l'exception vérifiée : erreur. `Object` n'est pas un sous-type de `Number` : type de retour incompatible."
    },
    {
      id: "oop-inheritance-005",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`class A {
    String name = "A";
    static String id() { return "sA"; }
    String get() { return name; }
}
class B extends A {
    String name = "B";
    static String id() { return "sB"; }
    String get() { return name; }
}
public class Main {
    public static void main(String[] args) {
        A a = new B();
        System.out.print(a.name + a.id() + a.get() + ((B) a).name);
    }
}`,
      options: ["AsABB", "BsBBB", "AsBBB", "AsAAB", "BsABB", "The code does not compile"],
      answer: [0],
      explain: "Les champs et les méthodes `static` sont **masqués**, pas redéfinis : ils sont résolus d'après le type de la référence. `a.name` donne `A` et `a.id()` donne `sA` car `a` est déclarée `A`. Seule la méthode d'instance `get()` est polymorphe : c'est `B.get()` qui s'exécute et qui lit le champ `name` de `B`, d'où `B`. Après le cast en `B`, `name` désigne le champ de `B`. Appeler une méthode `static` via une référence compile (avec un simple avertissement)."
    },
    {
      id: "oop-inheritance-006",
      difficulty: 2,
      q: "What is the result of compiling and running the following code?",
      code: String.raw`public class Main {
    private void start() { System.out.print("M"); }
    public static void main(String[] args) {
        Main m = new Sub();
        m.start();
    }
}
class Sub extends Main {
    void start() { System.out.print("S"); }
}`,
      options: [
        "M",
        "S",
        "The code does not compile because Sub cannot override a private method",
        "The code does not compile because start() is not accessible in main",
        "An IllegalAccessError is thrown at runtime"
      ],
      answer: [0],
      explain: "Une méthode `private` n'est pas héritée : `Sub.start()` est une méthode nouvelle, sans lien avec `Main.start()`, ce qui est parfaitement légal. L'appel `m.start()` est écrit dans `Main`, où la méthode `private` est accessible, et il est lié statiquement à `Main.start()` : pas de liaison dynamique sur une méthode `private`. Le résultat est donc `M`, pas `S`."
    },
    {
      id: "oop-inheritance-007",
      difficulty: 2,
      q: "Which line fails to compile?",
      code: String.raw`class Shape {
    final void draw() { }
    static void info() { }
    void area() { }
    private void id() { }
}
class Circle extends Shape {
    void draw(int x) { }        // n1
    void info() { }             // n2
    @Override void area() { }   // n3
    void id() { }               // n4
}`,
      options: ["n1", "n2", "n3", "n4", "The code compiles without error"],
      answer: [1],
      explain: "`n2` : une méthode d'instance ne peut pas redéfinir une méthode `static` de même signature (`overridden method is static`). `n1` compile : `draw(int)` est une **surcharge** de la méthode `final` `draw()`, pas une redéfinition. `n3` est une redéfinition correcte, `@Override` est donc acceptée. `n4` compile : `id()` est `private` dans `Shape`, donc non héritée, et `Circle.id()` est une méthode indépendante."
    },
    {
      id: "oop-inheritance-008",
      difficulty: 1,
      q: "Which statements about abstract classes and methods are true? (Choose two.)",
      options: [
        "An abstract class can declare constructors",
        "An abstract class can extend a concrete class",
        "An abstract class must declare at least one abstract method",
        "An abstract method can be declared private",
        "An abstract class can be declared final",
        "An abstract method can be declared static"
      ],
      answer: [0, 1],
      explain: "Une classe abstraite peut avoir des constructeurs (appelés via `super(...)` par les sous-classes) et peut hériter d'une classe concrète. Elle n'est pas obligée de contenir une méthode abstraite. Les combinaisons `abstract private`, `abstract static` et `abstract final` sont toutes des erreurs de compilation : une méthode abstraite doit pouvoir être redéfinie, ce que `private`, `static` et `final` empêchent ; une classe `abstract final` ne pourrait jamais être étendue."
    },
    {
      id: "oop-inheritance-009",
      difficulty: 2,
      q: "Which line fails to compile?",
      code: String.raw`interface Playable { void play(); }
abstract class Instrument implements Playable {   // n1
    abstract void tune();                         // n2
}
class Violin extends Instrument {
    void play() { }                               // n3
    void tune() { }                               // n4
}`,
      options: ["n1", "n2", "n3", "n4", "The code compiles without error"],
      answer: [2],
      explain: "`play()` est implicitement `public abstract` dans l'interface. En `n3`, `Violin` l'implémente avec un accès package-private, plus faible que `public` : erreur (`attempting to assign weaker access privileges`). `n1` est valide : une classe abstraite peut implémenter une interface sans en implémenter les méthodes. `n2` déclare une méthode abstraite package-private, autorisée. `n4` l'implémente avec le même accès : valide."
    },
    {
      id: "oop-inheritance-010",
      difficulty: 1,
      q: "Which declarations are legal inside an interface? (Choose three.)",
      options: [
        String.raw`int SIZE = 1;`,
        String.raw`private int count = 0;`,
        String.raw`protected void run();`,
        String.raw`private void helper() { }`,
        String.raw`static void util() { }`,
        String.raw`final void stop() { }`,
        String.raw`default void go();`
      ],
      answer: [0, 3, 4],
      explain: "`int SIZE = 1;` est implicitement `public static final`. Les méthodes `private` (avec corps) et `static` (avec corps) sont autorisées. Un champ d'interface ne peut pas être `private`. `protected` et `final` sont interdits sur les méthodes d'interface. Une méthode `default` doit avoir un corps : `default void go();` ne compile pas."
    },
    {
      id: "oop-inheritance-011",
      difficulty: 2,
      q: "What is the result of compiling and running the following code?",
      code: String.raw`interface Walk { default String move() { return "walk"; } }
interface Swim { default String move() { return "swim"; } }
class Duck implements Walk, Swim {
    public String move() { return Swim.super.move() + "!"; }
}
public class Main {
    public static void main(String[] args) {
        Walk w = new Duck();
        System.out.print(w.move());
    }
}`,
      options: [
        "swim!",
        "walk!",
        "walk",
        "The code does not compile because Duck inherits two default methods with the same signature",
        "The code does not compile because Swim.super.move() is not a valid expression"
      ],
      answer: [0],
      explain: "Hériter de deux méthodes `default` de même signature depuis deux interfaces sans lien est un conflit, mais `Duck` le résout en redéfinissant `move()`. La syntaxe `Swim.super.move()` appelle la version `default` de l'interface `Swim` directement implémentée. L'appel `w.move()` est polymorphe : le type de la référence (`Walk`) n'a aucune influence, c'est `Duck.move()` qui s'exécute et renvoie `swim!`."
    },
    {
      id: "oop-inheritance-012",
      difficulty: 3,
      q: "What is the result of compiling and running the following code?",
      code: String.raw`interface A { default void hi() { System.out.print("A"); } }
interface B extends A { default void hi() { System.out.print("B"); } }
class C implements A { public void hi() { System.out.print("C"); } }
class D extends C implements B { }
class E implements A, B { }
public class Main {
    public static void main(String[] args) {
        new D().hi();
        new E().hi();
    }
}`,
      options: [
        "CB",
        "BB",
        "CA",
        "The code does not compile because of class D",
        "The code does not compile because of class E"
      ],
      answer: [0],
      explain: "Pour `D` : une méthode héritée d'une **super-classe** l'emporte toujours sur une méthode `default` ; `C.hi()` gagne contre `B.hi()`, d'où `C`. Pour `E` : `B` étend `A` et redéfinit `hi()`, l'interface la plus spécifique gagne, d'où `B`. Il n'y a de conflit (erreur de compilation) que lorsque deux interfaces **sans lien d'héritage** fournissent chacune un `default` et que la classe ne redéfinit pas la méthode."
    },
    {
      id: "oop-inheritance-013",
      difficulty: 2,
      q: "Which lines fail to compile? (Choose two.)",
      code: String.raw`interface Util {
    static int twice(int x) { return 2 * x; }
    default int thrice(int x) { return 3 * x; }
}
class Impl implements Util {
    void test() {
        System.out.print(Util.twice(1));    // n1
        System.out.print(twice(1));         // n2
        System.out.print(thrice(1));        // n3
        System.out.print(Impl.twice(1));    // n4
        Util u = this;
        System.out.print(u.thrice(1));      // n5
    }
}`,
      options: ["n1", "n2", "n3", "n4", "n5"],
      answer: [1, 3],
      explain: "Les méthodes `static` d'une interface ne sont **pas héritées** par les classes qui l'implémentent. Elles ne s'appellent que par le nom de l'interface : `Util.twice(1)` (`n1`) est la seule forme valide. `twice(1)` (`n2`) et `Impl.twice(1)` (`n4`) ne compilent pas. Les méthodes `default`, elles, sont héritées comme des méthodes d'instance : `n3` et `n5` compilent."
    },
    {
      id: "oop-inheritance-014",
      difficulty: 2,
      q: "Which line fails to compile?",
      code: String.raw`interface Logger {
    String level();
    private String prefix() { return "[" + level() + "]"; }           // n1
    private static String sep() { return ":"; }                       // n2
    default String log(String m) { return prefix() + sep() + m; }     // n3
    static String raw(String m) { return prefix() + m; }              // n4
}`,
      options: ["n1", "n2", "n3", "n4", "The code compiles without error"],
      answer: [3],
      explain: "`n4` : une méthode `static` n'a pas d'instance courante, elle ne peut donc pas appeler la méthode d'instance `prefix()` (`non-static method cannot be referenced from a static context`). Les méthodes `private` (`n1`) et `private static` (`n2`) sont autorisées dans une interface depuis Java 9, à condition d'avoir un corps. Une méthode `default` (`n3`) peut appeler aussi bien les méthodes `private` d'instance que les méthodes `private static`."
    },
    {
      id: "oop-inheritance-015",
      difficulty: 2,
      q: "Which of the following types are functional interfaces? (Choose two.)",
      options: [
        String.raw`interface Check { boolean equals(Object o); }`,
        String.raw`interface Task { void run(); default void stop() { } static void log() { } }`,
        String.raw`interface Cmp { int compare(String a, String b); boolean equals(Object o); }`,
        String.raw`interface Pair { void first(); void second(); }`,
        String.raw`interface Marker { }`,
        String.raw`abstract class Job { abstract void run(); }`
      ],
      answer: [1, 2],
      explain: "Une interface fonctionnelle a exactement **une** méthode abstraite, sans compter les méthodes `default`/`static` ni les méthodes abstraites qui redéclarent une méthode `public` de `Object`. `Task` a une seule méthode abstraite (`run`). `Cmp` aussi : `equals(Object)` ne compte pas (c'est le cas de `Comparator`). `Check` n'en a donc aucune, `Marker` non plus, `Pair` en a deux. Une classe abstraite n'est jamais une interface fonctionnelle."
    },
    {
      id: "oop-inheritance-016",
      difficulty: 2,
      q: "All the following types are declared in the same source file. Which line fails to compile?",
      code: String.raw`sealed interface Shape permits Circle, Square, Polygon { }
record Circle(double r) implements Shape { }       // n1
class Square implements Shape { }                  // n2
non-sealed interface Polygon extends Shape { }     // n3
class Hexagon implements Polygon { }               // n4
enum Unit implements Polygon { ONE }               // n5`,
      options: ["n1", "n2", "n3", "n4", "n5", "The code compiles without error"],
      answer: [1],
      explain: "Tout sous-type autorisé d'un type scellé doit être `final`, `sealed` ou `non-sealed`. `Square` (`n2`) n'a aucun de ces modificateurs : erreur. Un record (`n1`) est implicitement `final`, donc rien à ajouter. Une interface autorisée (`n3`) ne peut pas être `final` ; `non-sealed` rouvre la hiérarchie, si bien que `Hexagon` (`n4`) et l'enum `Unit` (`n5`) peuvent l'implémenter librement, sans modificateur et sans figurer dans une clause `permits`."
    },
    {
      id: "oop-inheritance-017",
      difficulty: 1,
      q: "Which statements about sealed classes are true? (Choose two.)",
      options: [
        "The permits clause may be omitted when all permitted subclasses are declared in the same source file as the sealed class",
        "Every permitted subclass must directly extend the sealed class",
        "A permitted subclass may be declared in any module, provided the sealed class is public and exported",
        "A sealed class cannot be declared abstract",
        "A record may be declared sealed to restrict which records extend it",
        "A class without a sealed supertype may be declared non-sealed"
      ],
      answer: [0, 1],
      explain: "Si les sous-classes sont dans le même fichier source, le compilateur les déduit et `permits` devient facultative. Les sous-classes listées doivent étendre **directement** la classe scellée. Elles doivent se trouver dans le même module (ou le même package dans le module sans nom), pas dans un module quelconque. Une classe scellée peut tout à fait être `abstract`. Un record est implicitement `final` : il ne peut être ni `sealed` ni étendu. `non-sealed` n'est autorisé que sur un type dont un super-type direct est scellé."
    },
    {
      id: "oop-inheritance-018",
      difficulty: 3,
      q: "What is the result of compiling and running the following code?",
      code: String.raw`sealed interface Expr permits Num, Add, Neg { }
record Num(int v) implements Expr { }
record Add(Expr l, Expr r) implements Expr { }
record Neg(Expr e) implements Expr { }

public class Main {
    static int eval(Expr e) {
        return switch (e) {
            case Num n -> n.v();
            case Add(Num(var a), Num(var b)) -> a + b;
            case Add(Expr l, Expr r) -> eval(l) + eval(r);
            case Neg(var x) -> -eval(x);
        };
    }
    public static void main(String[] args) {
        Expr e = new Add(new Neg(new Num(3)), new Add(new Num(1), new Num(2)));
        System.out.print(eval(e));
    }
}`,
      options: [
        "0",
        "6",
        "The code does not compile because the switch has no default branch",
        "The code does not compile because case Add(Expr l, Expr r) is dominated",
        "A MatchException is thrown at runtime"
      ],
      answer: [0],
      explain: "`Expr` est scellée et ses trois sous-types sont couverts (`Num`, `Add` par le motif général `Add(Expr l, Expr r)`, `Neg`) : le `switch` est exhaustif sans `default`. Le motif spécifique `Add(Num(var a), Num(var b))` est placé **avant** le motif général, il n'y a donc pas de domination (l'ordre inverse ne compilerait pas). L'`Add` externe a un `Neg` à gauche : il passe par le motif général, soit `eval(Neg(Num(3)))` = `-3`, plus `Add(Num(1), Num(2))` = `3` via le motif imbriqué. Résultat : `0`."
    },
    {
      id: "oop-inheritance-019",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`class Animal {
    void eat(Animal a) { System.out.print("AA "); }
}
class Cat extends Animal {
    void eat(Animal a) { System.out.print("CA "); }
    void eat(Cat c) { System.out.print("CC "); }
}
public class Main {
    public static void main(String[] args) {
        Animal a = new Cat();
        Cat c = new Cat();
        a.eat(c);
        c.eat(a);
        c.eat(c);
    }
}`,
      options: ["CA CA CC", "CC CA CC", "AA CA CC", "CC CC CC", "AA AA CC", "The code does not compile"],
      answer: [0],
      explain: "La **surcharge** est choisie à la compilation d'après les types des références ; la **redéfinition** est résolue à l'exécution. `a.eat(c)` : `a` est de type `Animal`, qui ne connaît que `eat(Animal)` ; à l'exécution c'est la version redéfinie dans `Cat` : `CA` (et non `CC` : `eat(Cat)` n'existe pas dans `Animal`). `c.eat(a)` : l'argument est de type déclaré `Animal`, donc `eat(Animal)` : `CA`, même si l'objet est un `Cat`. `c.eat(c)` : la surcharge la plus spécifique `eat(Cat)` : `CC`."
    },
    {
      id: "oop-inheritance-020",
      difficulty: 1,
      q: "What is the result of compiling and running the following code?",
      code: String.raw`class Fruit {
    public String toString() { return "Fruit"; }
}
class Apple extends Fruit {
    public String toString() { return "Apple:" + super.toString(); }
}
class Pear extends Fruit { }
public class Main {
    public static void main(String[] args) {
        Fruit f = new Apple();
        Fruit g = new Pear();
        System.out.print(f + " " + g + " ");
        Pear p = (Pear) f;
        System.out.print(p);
    }
}`,
      options: [
        "Apple:Fruit Fruit is printed, then a ClassCastException is thrown",
        "Fruit Fruit is printed, then a ClassCastException is thrown",
        "Apple:Fruit Pear is printed, then a ClassCastException is thrown",
        "Apple:Fruit Fruit Apple:Fruit is printed",
        "The code does not compile because of the cast to Pear"
      ],
      answer: [0],
      explain: "La concaténation appelle `toString()` de façon polymorphe : `Apple.toString()` renvoie `Apple:` suivi du résultat de `Fruit.toString()`, et `Pear` hérite de `Fruit.toString()` (`Fruit`, pas le nom de la classe). Le cast `(Pear) f` compile car `Pear` est une sous-classe de `Fruit` (downcast autorisé), mais l'objet est un `Apple` : `ClassCastException` à l'exécution, après le premier affichage."
    },
    {
      id: "oop-inheritance-021",
      difficulty: 3,
      q: "Which lines fail to compile? (Choose two.)",
      code: String.raw`interface Flyer { }
class Bird { }
final class Rock { }
class Eagle extends Bird implements Flyer { }
public class Main {
    public static void main(String[] args) {
        Bird b = new Eagle();
        Rock r = new Rock();
        Flyer f1 = (Flyer) b;              // n1
        Flyer f2 = (Flyer) r;              // n2
        Eagle e = (Eagle) b;               // n3
        String s = (String) b;             // n4
        Integer i = (Integer) (Object) b;  // n5
    }
}`,
      options: ["n1", "n2", "n3", "n4", "n5"],
      answer: [1, 3],
      explain: "`n2` : `Rock` est `final` et n'implémente pas `Flyer` ; aucune sous-classe ne pourra jamais le faire, le compilateur rejette donc le cast. `n4` : `Bird` et `String` sont deux classes sans lien d'héritage, cast impossible. `n1` compile car `Bird` n'est pas `final` : une sous-classe (ici `Eagle`) peut implémenter `Flyer`. `n3` est un downcast classique. `n5` compile grâce au passage par `Object` (il lèverait une `ClassCastException` à l'exécution, mais la question porte sur la compilation)."
    },
    {
      id: "oop-inheritance-022",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) {
        String s = null;
        Object o = s;
        Number n = 5;
        System.out.print((o instanceof String) + " " + (n instanceof Integer)
            + " " + (n instanceof Comparable));
    }
}`,
      options: [
        "false true true",
        "true true true",
        "false true false",
        "A NullPointerException is thrown at runtime",
        "The code does not compile"
      ],
      answer: [0],
      explain: "`instanceof` renvoie toujours `false` pour `null`, quel que soit le type déclaré de la référence, et ne lève jamais d'exception. `n` référence un `Integer` (autoboxing de `5`) : `n instanceof Integer` est `true`. `Integer` implémente `Comparable<Integer>`, donc le troisième test est `true` ; il compile car `Number` n'est pas `final`, une sous-classe peut donc implémenter `Comparable`."
    },
    {
      id: "oop-inheritance-023",
      difficulty: 2,
      q: "What is the result of compiling and running the following code?",
      code: String.raw`public class Main {
    static String describe(Object o) {
        if (!(o instanceof String s) || s.isEmpty()) {
            return "other";
        }
        return s.toUpperCase();
    }
    public static void main(String[] args) {
        System.out.print(describe("ab") + "-" + describe(4) + "-" + describe(""));
    }
}`,
      options: [
        "AB-other-other",
        "AB-other-",
        "The code does not compile because s is not in scope in s.isEmpty()",
        "The code does not compile because s is not in scope in the last return statement",
        "A ClassCastException is thrown at runtime"
      ],
      answer: [0],
      explain: "Portée par flot (*flow scoping*) : dans `!(o instanceof String s) || s.isEmpty()`, la partie droite du `||` n'est évaluée que si la partie gauche est fausse, c'est-à-dire si `o` **est** une `String` ; `s` y est donc définie. Comme le bloc du `if` se termine par `return`, le code qui suit n'est atteint que si le motif a réussi : `s` est visible dans le dernier `return`. `\"ab\"` donne `AB`, `4` n'est pas une `String` (`other`), et la chaîne vide satisfait `s.isEmpty()` (`other`)."
    },
    {
      id: "oop-inheritance-024",
      difficulty: 3,
      q: "Given the declarations below, which statements compile with Java 21? (Choose two.)",
      code: String.raw`Number n = 4;
Object o = new ArrayList<String>();`,
      options: [
        String.raw`if (n instanceof Integer i && i > 3) { }`,
        String.raw`if (n instanceof Integer i || i > 3) { }`,
        String.raw`if (n instanceof Number x) { }`,
        String.raw`if (n instanceof String s) { }`,
        String.raw`if (o instanceof List<String> l) { }`
      ],
      answer: [0, 2],
      explain: "Avec `&&`, la variable de motif `i` est définie à droite : valide. Avec `||`, la partie droite s'exécute quand le test a échoué : `i` n'existe pas, erreur. Depuis Java 21, un motif dont le type est identique au type de l'expression (`Number` pour un `Number`) est accepté ; c'était une erreur dans les versions précédentes. `Number` vers `String` : types incompatibles (`String` est `final` et n'hérite pas de `Number`). `Object` vers `List<String>` : le cast ne peut pas être vérifié à l'exécution à cause de l'effacement de type, le compilateur le refuse."
    },
    {
      id: "oop-inheritance-025",
      difficulty: 2,
      q: "What is the result of compiling and running the following code?",
      code: String.raw`record Box<T>(T value) { }
record Pair(Object a, Object b) { }
public class Main {
    public static void main(String[] args) {
        Object o = new Pair(new Box<>("hi"), new Box<>(7));
        if (o instanceof Pair(Box(String s), Box(var v)) && v instanceof Integer i) {
            System.out.print(s.length() + i);
        } else {
            System.out.print("no match");
        }
    }
}`,
      options: [
        "9",
        "27",
        "no match",
        "The code does not compile because Box is used without a type argument in the pattern",
        "The code does not compile because var cannot be used in a record pattern"
      ],
      answer: [0],
      explain: "Les record patterns s'imbriquent : `Pair(...)` déconstruit le `Pair`, puis chaque composant (de type `Object`) est testé contre un record pattern `Box(...)`. Les arguments de type peuvent être omis, ils sont inférés. `Box(String s)` réussit car la valeur est la `String` `hi` ; `Box(var v)` accepte n'importe quelle valeur, `v` est alors de type `Object`, d'où le test supplémentaire `v instanceof Integer i`. `s.length() + i` est une addition entière : `2 + 7 = 9` (pas de concaténation)."
    },
    {
      id: "oop-inheritance-026",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`record Box<T>(T value) { }
public class Main {
    public static void main(String[] args) {
        Box<String> b = new Box<>(null);
        Box<String> nb = null;
        if (b instanceof Box<String>(String s)) System.out.print("A" + s);
        if (b instanceof Box<String>(var s) && s == null) System.out.print("B");
        if (nb instanceof Box<String>(var s)) System.out.print("C");
        else System.out.print("D");
    }
}`,
      options: [
        "AnullBD",
        "BD",
        "AnullBC",
        "D",
        "A NullPointerException is thrown at runtime",
        "The code does not compile"
      ],
      answer: [0],
      explain: "Un record pattern ne correspond jamais à une référence `null` : pour `nb`, le test est faux et `D` est affiché, sans `NullPointerException`. En revanche, un sous-motif qui couvre tout le type du composant accepte un composant `null` : `String s` face à un composant de type `String` (comme `var s`) réussit avec `s == null`. D'où `Anull` puis `B`. Le piège est de croire que `String s` imbriqué se comporte comme `x instanceof String s`, qui lui rejette `null`."
    },
    {
      id: "oop-inheritance-027",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`import java.util.List;

class Point {
    final int x;
    Point(int x) { this.x = x; }
    public boolean equals(Point p) { return p != null && x == p.x; }
    public int hashCode() { return x; }
}
public class Main {
    public static void main(String[] args) {
        Point a = new Point(1);
        Point b = new Point(1);
        Object c = b;
        System.out.print(a.equals(b) + " " + a.equals(c) + " " + List.of(a).contains(b));
    }
}`,
      options: ["true false false", "true true true", "true false true", "true true false", "false false false"],
      answer: [0],
      explain: "`equals(Point)` est une **surcharge** d'`equals(Object)`, pas une redéfinition. `a.equals(b)` : l'argument est de type déclaré `Point`, la surcharge est choisie : `true`. `a.equals(c)` : l'argument est de type déclaré `Object`, le compilateur choisit `equals(Object)` héritée de `Object`, qui compare les références : `false`. `List.contains` appelle `equals(Object)` : `false` également, même si `hashCode` est cohérent. Avec `@Override`, le compilateur aurait signalé l'erreur."
    },
    {
      id: "oop-inheritance-028",
      difficulty: 1,
      q: "Which statements about the contracts of equals and hashCode are true? (Choose two.)",
      options: [
        "If a.equals(b) returns true, then a.hashCode() and b.hashCode() must return the same value",
        "For any non-null reference a, a.equals(null) must return false",
        "If a.hashCode() and b.hashCode() return the same value, then a.equals(b) must return true",
        "If a.equals(b) returns false, then a.hashCode() and b.hashCode() must return different values",
        "A class that overrides toString() must also override hashCode()",
        "equals must throw a NullPointerException when its argument is null"
      ],
      answer: [0, 1],
      explain: "Le contrat impose que deux objets égaux selon `equals` aient le même `hashCode`, et que `x.equals(null)` renvoie `false` sans lever d'exception. La réciproque n'est pas exigée : deux objets différents peuvent partager le même `hashCode` (collision), donc un `hashCode` identique ne prouve pas l'égalité et des objets inégaux ne sont pas obligés d'avoir des `hashCode` distincts. `toString()` n'a aucun lien contractuel avec `hashCode()`."
    }
  ]
});
