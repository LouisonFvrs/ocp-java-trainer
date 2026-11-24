OCP.register({
  topic: 'exceptions',
  course: [
    {
      title: "Hiérarchie des exceptions : checked et unchecked",
      blocks: [
        { p: "Tout ce qui peut être lancé avec `throw` hérite de `java.lang.Throwable`. Deux branches : `Error` (problème grave de la JVM, on ne le traite pas) et `Exception`. Sous `Exception`, la branche `RuntimeException` regroupe les erreurs de programmation." },
        { code: String.raw`Throwable                         // checked
├── Error                         // unchecked
│   ├── StackOverflowError, OutOfMemoryError        (VirtualMachineError)
│   └── ExceptionInInitializerError, NoClassDefFoundError  (LinkageError)
└── Exception                     // checked
    ├── IOException, SQLException, ParseException...       // checked
    └── RuntimeException          // unchecked
        └── NullPointerException, ArithmeticException...` },
        { list: [
          "**Checked** : `Throwable`, `Exception` et toutes leurs sous-classes qui ne passent ni par `RuntimeException` ni par `Error`. Le compilateur impose la règle **handle or declare**.",
          "**Unchecked** : `RuntimeException`, `Error` et leurs sous-classes. Aucune obligation de les attraper ou de les déclarer (mais c'est permis).",
          "Une `Error` peut techniquement être attrapée (`catch (Error e)` ou `catch (Throwable t)`), mais `catch (Exception e)` ne l'attrape **pas**."
        ] },
        { h: "Exceptions à connaître par cœur" },
        { table: { head: ["Classe", "Catégorie", "Parent direct", "Cause typique"], rows: [
          ["`ArithmeticException`", "unchecked", "`RuntimeException`", "division ou modulo **entier** par zéro (`5 / 0`, `5 % 0`)"],
          ["`ArrayIndexOutOfBoundsException`", "unchecked", "`IndexOutOfBoundsException`", "indice de tableau négatif ou >= `length`"],
          ["`ClassCastException`", "unchecked", "`RuntimeException`", "cast vers un type que l'objet n'a pas"],
          ["`NullPointerException`", "unchecked", "`RuntimeException`", "appel de méthode ou accès à un champ sur `null`, unboxing de `null`"],
          ["`IllegalArgumentException`", "unchecked", "`RuntimeException`", "lancée par le code : argument invalide"],
          ["`NumberFormatException`", "unchecked", "`IllegalArgumentException`", "`Integer.parseInt(\"abc\")`"],
          ["`IllegalStateException`, `UnsupportedOperationException`", "unchecked", "`RuntimeException`", "état invalide, opération non supportée (collections immuables)"],
          ["`IOException`", "**checked**", "`Exception`", "problème d'entrée/sortie"],
          ["`FileNotFoundException`", "**checked**", "`IOException`", "fichier introuvable"],
          ["`NotSerializableException`", "**checked**", "`ObjectStreamException` (sous `IOException`)", "sérialisation d'un objet non `Serializable`"],
          ["`ParseException` (`java.text`)", "**checked**", "`Exception`", "`NumberFormat.parse`, `DateFormat.parse`"],
          ["`SQLException`", "**checked**", "`Exception`", "accès JDBC"],
          ["`StackOverflowError`", "Error", "`VirtualMachineError`", "récursion infinie"],
          ["`ExceptionInInitializerError`", "Error", "`LinkageError`", "exception dans un initialiseur `static`"],
          ["`NoClassDefFoundError`", "Error", "`LinkageError`", "classe absente à l'exécution, ou dont l'initialisation a déjà échoué"]
        ] } },
        { trap: "`1.0 / 0` ne lance rien (résultat `Infinity`) : seule l'arithmétique **entière** lance `ArithmeticException`. `DateTimeParseException` (`java.time`) est unchecked, alors que `ParseException` (`java.text`) est checked." },
        { trap: "`NumberFormatException` EST une `IllegalArgumentException` : un `catch (IllegalArgumentException e)` l'attrape, et la placer après ce `catch` dans la même chaîne est une erreur de compilation." },
        { tip: "Checked à retenir : tout ce qui touche à l'extérieur du programme (fichiers, base de données, texte à analyser avec `java.text`, threads avec `InterruptedException`, `ClassNotFoundException`, `CloneNotSupportedException`). Le reste de la liste d'examen est unchecked." }
      ]
    },
    {
      title: "Handle or declare, throw et throws",
      blocks: [
        { list: [
          "`throw` : instruction qui lance **un objet** `Throwable` : `throw new IOException(\"msg\");`. Sans `new`, il faut une référence existante (`throw e;`).",
          "`throws` : clause de la **signature** qui déclare les exceptions qu'une méthode ou un constructeur peut laisser sortir : `void m() throws IOException, SQLException`.",
          "Règle **handle or declare** : tout code qui peut lancer une exception checked doit l'attraper (`try`/`catch`) ou la déclarer (`throws`). Elle ne concerne pas les unchecked."
        ] },
        { code: String.raw`void a() throws Exception { }                  // OK : déclarer sans lancer est permis
void b() throws IOException {
    throw new FileNotFoundException();         // OK : sous-classe de IOException
}
void c() { throw new RuntimeException(); }     // OK : unchecked
void d() { throw new Exception(); }            // KO : ni attrapée ni déclarée
void e() throws FileNotFoundException {
    throw new IOException();                   // KO : IOException est plus large
}` },
        { trap: "Appeler une méthode déclarée `throws Exception` oblige l'appelant à traiter ou déclarer `Exception`, même si le corps de la méthode ne lance jamais rien. Le compilateur ne regarde que la signature." },
        { trap: "Du code placé juste après un `throw` (dans le même bloc) est inatteignable : erreur de compilation `unreachable statement`. Même chose après un `return`." },
        { trap: "`throw null;` compile (le type `null` est compatible avec `Throwable`) et lance une `NullPointerException` à l'exécution." },
        { h: "Rethrow précis" },
        { p: "Quand un `catch (Exception e)` relance `e` **sans l'avoir réaffectée** (paramètre effectivement final), le compilateur sait que seules les exceptions réellement possibles dans le `try` peuvent sortir. La méthode peut donc ne déclarer que celles-ci." },
        { code: String.raw`void copy() throws IOException {       // et non "throws Exception"
    try {
        read();                        // déclare throws IOException
    } catch (Exception e) {
        log(e);
        throw e;                       // OK : rethrow précis
    }
}` },
        { trap: "Si le paramètre du `catch` est réaffecté (`e = new IOException();`), l'analyse précise est perdue : `throw e;` lance alors le type déclaré `Exception`, et la méthode doit déclarer `throws Exception`." }
      ]
    },
    {
      title: "try, catch et finally",
      blocks: [
        { list: [
          "Les accolades sont obligatoires pour `try`, `catch` et `finally`, même pour une seule instruction.",
          "Un `try` classique exige **au moins** un `catch` ou un `finally`. Ordre imposé : `try`, puis les `catch`, puis `finally` (un seul).",
          "Les `catch` sont examinés dans l'ordre ; le premier compatible est exécuté, et un seul.",
          "Une exception lancée **dans un bloc `catch`** n'est pas rattrapée par les `catch` suivants du même `try` ; le `finally` s'exécute quand même, puis l'exception se propage."
        ] },
        { h: "Erreurs de compilation liées aux catch" },
        { table: { head: ["Situation", "Résultat"], rows: [
          ["`catch` d'une super-classe placé avant celui d'une sous-classe (`IOException` puis `FileNotFoundException`)", "erreur sur le second : `exception FileNotFoundException has already been caught`"],
          ["`catch` d'une exception **checked** que le `try` ne peut pas lancer (`catch (IOException e)` sans code d'E/S)", "erreur : `exception IOException is never thrown in body of corresponding try statement`"],
          ["`catch (Exception e)`, `catch (Throwable t)`, `catch (RuntimeException e)`, `catch (Error e)` sur un `try` qui ne lance rien", "**autorisé** (ils couvrent des exceptions unchecked toujours possibles)"],
          ["`try { ... }` seul, sans `catch` ni `finally`", "erreur (sauf try-with-resources)"]
        ] } },
        { h: "finally" },
        { list: [
          "`finally` s'exécute **toujours** : après un `try` normal, après un `catch`, après un `return`, et même si une exception non attrapée se propage.",
          "Exceptions : `System.exit(...)` (la JVM s'arrête, `finally` n'est pas exécuté), arrêt brutal de la JVM, boucle infinie.",
          "Un `return` dans `finally` **remplace** la valeur renvoyée par `try`/`catch` et **fait disparaître** une exception en cours de propagation.",
          "Une exception lancée dans `finally` remplace celle du `try` ou du `catch` (qui est perdue, sans être ajoutée aux exceptions supprimées).",
          "La valeur d'un `return x;` du `try` est évaluée **avant** `finally` : modifier ensuite la variable `x` dans `finally` ne change pas la valeur renvoyée (mais modifier l'objet référencé reste visible)."
        ] },
        { code: String.raw`static int m() {
    int x = 1;
    try {
        return x;          // valeur 1 mémorisée
    } finally {
        x = 2;             // sans effet sur le résultat : m() renvoie 1
    }
}
static int n() {
    try {
        throw new IllegalStateException();
    } finally {
        return 2;          // l'exception est avalée : n() renvoie 2
    }
}` },
        { tip: "Pour une question « What is the output? », déroulez dans l'ordre : `try` jusqu'à l'exception, premier `catch` compatible, `finally`, puis soit la suite du programme (exception traitée), soit la stack trace (exception non traitée ou relancée)." }
      ]
    },
    {
      title: "Multi-catch",
      blocks: [
        { code: String.raw`try {
    load();
} catch (IOException | IllegalStateException e) {   // une seule variable, à la fin
    System.out.println(e.getMessage());
}` },
        { list: [
          "Syntaxe : types séparés par `|`, **une seule variable** : `catch (A | B e)`. `catch (A e1 | B e2)` et `catch (A e | B e)` ne compilent pas.",
          "Les types ne doivent **pas être liés par héritage** : `catch (FileNotFoundException | IOException e)` ne compile pas, quel que soit l'ordre (`Alternatives in a multi-catch statement cannot be related by subclassing`).",
          "La variable d'un multi-catch est **implicitement `final`** : la réaffecter (`e = ...`) est une erreur de compilation. Dans un `catch` à un seul type, la réaffectation est permise.",
          "Chaque alternative checked doit pouvoir être lancée par le `try` (même règle que pour un `catch` simple).",
          "Le type statique de `e` est le super-type commun des alternatives : seules les méthodes de ce type commun sont accessibles."
        ] },
        { trap: "`catch (Exception | RuntimeException e)` ne compile pas (types liés), mais `catch (Error | Exception e)` compile : `Error` et `Exception` sont deux branches distinctes de `Throwable`." }
      ]
    },
    {
      title: "try-with-resources",
      blocks: [
        { p: "Le try-with-resources ferme automatiquement les ressources déclarées entre parenthèses. Il n'exige **ni `catch` ni `finally`** : un bloc `finally` implicite appelle `close()`." },
        { table: { head: ["Interface", "Paquet", "Signature de close()", "Remarque"], rows: [
          ["`AutoCloseable`", "`java.lang`", "`void close() throws Exception`", "exigée par try-with-resources"],
          ["`Closeable`", "`java.io`", "`void close() throws IOException`", "`extends AutoCloseable`, doit être idempotente"]
        ] } },
        { code: String.raw`try (var in = new FileInputStream("a.txt");       // 1re ressource
     var out = new FileOutputStream("b.txt")) {   // 2e (";" final optionnel)
    out.write(in.read());
} catch (IOException e) {      // exécuté APRÈS la fermeture de out puis de in
    ...
} finally {                    // exécuté en dernier
    ...
}` },
        { list: [
          "Le type de la ressource doit implémenter `AutoCloseable` (sinon erreur de compilation : `String`, par exemple, est refusé).",
          "Fermeture dans l'**ordre inverse** des déclarations, **avant** tout bloc `catch` ou `finally` explicite.",
          "Portée : une ressource déclarée dans les parenthèses n'existe que dans le bloc `try`. Elle est inaccessible dans `catch`, `finally` et après.",
          "Une ressource déclarée dans les parenthèses est implicitement `final` : la réaffecter dans le bloc ne compile pas.",
          "Depuis Java 9, on peut citer une variable déclarée **avant** le `try` : `try (r1; r2) { }`, à condition qu'elle soit `final` ou **effectivement finale**. Cette variable reste visible après le `try`, mais elle désigne alors une ressource fermée.",
          "Si la ressource vaut `null`, `close()` n'est pas appelée et aucune exception n'est lancée.",
          "L'implémentation de `close()` peut réduire la clause `throws` (aucune exception, ou `IOException`...). C'est la signature du **type déclaré** de la ressource qui compte pour handle or declare."
        ] },
        { trap: "Si `close()` du type de la ressource déclare `throws Exception` (cas d'une variable de type `AutoCloseable`, ou d'une classe qui recopie la signature), le try-with-resources doit attraper ou déclarer `Exception`, même si le bloc `try` est vide. L'erreur est signalée sur la déclaration de la ressource." },
        { trap: "Une variable réaffectée avant le `try` n'est plus effectivement finale : `try (r) { }` ne compile pas. Vérifiez toujours les lignes qui précèdent ET qui suivent le `try`." },
        { h: "Exceptions supprimées" },
        { list: [
          "Si le bloc `try` lance une exception puis que `close()` en lance une autre, l'exception du `try` est l'exception **principale** ; celles de `close()` lui sont attachées et se lisent avec `Throwable[] getSuppressed()`.",
          "Les exceptions supprimées sont ajoutées dans l'ordre de fermeture, donc en ordre inverse des déclarations.",
          "Si seul `close()` lance une exception, c'est elle qui se propage (pour plusieurs ressources : la première lancée est principale, les suivantes sont supprimées).",
          "Les `catch` explicites du try-with-resources attrapent aussi bien l'exception du bloc que celle de `close()`.",
          "Si le `finally` explicite lance une exception, elle **remplace** tout le reste : l'exception précédente est perdue et n'apparaît pas dans `getSuppressed()` (les exceptions supprimées n'existent que pour la fermeture automatique)."
        ] },
        { code: String.raw`try (Res a = new Res("A"); Res b = new Res("B")) {   // close() lance ISE(nom)
    throw new RuntimeException("T");
} catch (Exception e) {
    e.getMessage();          // "T"   (exception principale)
    e.getSuppressed();       // [ISE("B"), ISE("A")]  : b est fermée en premier
}` }
      ]
    },
    {
      title: "Exceptions personnalisées et chaînage",
      blocks: [
        { list: [
          "Étendre `Exception` (ou une sous-classe checked) crée une exception **checked** ; étendre `RuntimeException` crée une exception **unchecked**.",
          "Les constructeurs ne sont **pas hérités** : sans constructeur déclaré, seule la forme sans argument existe. `new MyException(\"msg\")` ne compile que si la classe déclare un constructeur `(String)`.",
          "Constructeurs usuels de `Exception` et `RuntimeException` : `()`, `(String message)`, `(Throwable cause)`, `(String message, Throwable cause)`."
        ] },
        { code: String.raw`public class OrderException extends Exception {           // checked
    public OrderException() { super(); }
    public OrderException(String message) { super(message); }
    public OrderException(Throwable cause) { super(cause); }
    public OrderException(String message, Throwable cause) { super(message, cause); }
}

try {
    Integer.parseInt(input);
} catch (NumberFormatException e) {
    throw new OrderException("bad quantity", e);   // chaînage : e devient la cause
}` },
        { table: { head: ["Méthode de Throwable", "Résultat"], rows: [
          ["`getMessage()`", "le message, ou `null` si aucun n'a été fourni"],
          ["`getCause()`", "la cause, ou `null`"],
          ["`toString()`", "nom **qualifié** de la classe, suivi de `: message` si le message n'est pas `null`"],
          ["`getSuppressed()`", "tableau des exceptions supprimées (vide, jamais `null`)"],
          ["`printStackTrace()`", "écrit `toString()` puis la pile d'appels sur `System.err`, puis `Caused by: ...`"],
          ["`getStackTrace()`", "`StackTraceElement[]`, élément 0 = méthode où l'exception a été créée"]
        ] } },
        { trap: "Avec le constructeur `(Throwable cause)`, le message n'est pas `null` : il vaut `cause.toString()`. `new RuntimeException(new IOException(\"disk\")).getMessage()` renvoie `java.io.IOException: disk`." },
        { tip: "Envelopper une exception checked dans une `RuntimeException` (`throw new RuntimeException(e);`) permet de la laisser sortir d'une méthode qui ne peut rien déclarer (lambda d'une interface fonctionnelle standard, redéfinition...)." }
      ]
    },
    {
      title: "Redéfinition, constructeurs et initialiseurs",
      blocks: [
        { h: "Méthodes redéfinies" },
        { list: [
          "Une redéfinition ne peut pas déclarer d'exception checked **nouvelle ou plus large** que celles de la méthode redéfinie.",
          "Elle peut en déclarer moins, aucune, ou des **sous-classes** de celles du parent.",
          "Elle peut toujours ajouter des exceptions **unchecked**.",
          "Même règle pour l'implémentation d'une méthode d'interface ou abstraite."
        ] },
        { code: String.raw`class Reader {
    void read() throws IOException { }
}
class A extends Reader { void read() { } }                               // OK
class B extends Reader { void read() throws FileNotFoundException { } }  // OK
class C extends Reader {
    void read() throws IOException, IllegalStateException { }            // OK
}
class D extends Reader { void read() throws Exception { } }  // KO : plus large
class E extends Reader {
    void read() throws IOException, SQLException { }               // KO : nouvelle
}` },
        { trap: "Handle or declare s'applique selon le type de la **référence** : avec `Parent p = new Child();`, l'appel `p.run()` doit traiter les exceptions checked déclarées par `Parent.run()`, même si `Child.run()` n'en déclare aucune. À l'inverse, entourer `child.run()` d'un `catch (IOException e)` ne compile pas si `Child.run()` ne déclare rien." },
        { h: "Constructeurs" },
        { list: [
          "Un constructeur dont le constructeur parent appelé (explicitement ou implicitement) déclare une exception checked doit la **déclarer** lui aussi (ou une super-classe). Il n'y a pas de règle de redéfinition : un constructeur enfant peut déclarer des exceptions plus larges ou supplémentaires.",
          "Il est impossible de l'attraper : en Java 21, `super(...)` doit être la première instruction, donc ne peut pas être dans un `try`.",
          "Le constructeur par défaut généré par le compilateur ne déclare rien : si le constructeur sans argument du parent déclare une exception checked, la classe enfant sans constructeur explicite ne compile pas."
        ] },
        { h: "Initialiseurs" },
        { table: { head: ["Emplacement", "Exception checked", "Exception unchecked à l'exécution"], rows: [
          ["Initialiseur `static` ou initialisation d'un champ `static`", "**interdite** (doit être attrapée dans le bloc)", "enveloppée dans `ExceptionInInitializerError` (cause = l'exception d'origine)"],
          ["Initialiseur d'instance ou initialisation d'un champ d'instance", "autorisée si **tous** les constructeurs la déclarent", "se propage telle quelle depuis `new`"],
          ["Constructeur", "autorisée si déclarée avec `throws`", "se propage telle quelle"]
        ] } },
        { trap: "Après un échec d'initialisation statique, la classe est inutilisable : la première utilisation lance `ExceptionInInitializerError`, toute utilisation suivante lance `NoClassDefFoundError`. Ce sont des `Error` : `catch (Exception e)` et `catch (RuntimeException e)` ne les attrapent pas." },
        { trap: "Un initialiseur doit pouvoir se terminer normalement : `static { throw new RuntimeException(); }` ne compile pas (`initializer must be able to complete normally`), alors qu'un `throw` conditionnel compile." }
      ]
    },
    {
      title: "Affichage, stack trace et NullPointerException utiles",
      blocks: [
        { code: String.raw`Exception e = new IllegalArgumentException("neg");
System.out.println(e);               // java.lang.IllegalArgumentException: neg
System.out.println(e.getMessage());  // neg
e.printStackTrace();                 // sur System.err :
// java.lang.IllegalArgumentException: neg
//     at Main.check(Main.java:12)
//     at Main.main(Main.java:5)` },
        { list: [
          "Trois façons d'afficher : l'objet lui-même (`toString()` : classe qualifiée et message), `getMessage()` (message seul), `printStackTrace()` (classe, message et pile).",
          "Une exception non attrapée dans `main` termine le thread : la JVM affiche `Exception in thread \"main\"` suivi de la stack trace sur `System.err`. Ce qui a été affiché avant (y compris par `finally`) reste affiché.",
          "La stack trace se lit de haut en bas : la première ligne `at` est la méthode où l'exception a été créée, la dernière est `main`.",
          "Une exception chaînée ajoute une section `Caused by: ...` ; les exceptions supprimées apparaissent sous `Suppressed: ...`."
        ] },
        { h: "Helpful NullPointerExceptions" },
        { p: "Depuis Java 15 (activé par défaut, donc en Java 21), le message d'une `NullPointerException` créée par la JVM décrit précisément ce qui était `null`." },
        { code: String.raw`String name = person.name().toUpperCase();
// Cannot invoke "String.toUpperCase()" because the return value of
// "Person.name()" is null

Object o = null;                 // première variable locale après args
o.toString();
// Cannot invoke "Object.toString()" because "<local1>" is null
// (nom réel de la variable locale seulement si la classe est compilée avec -g)` },
        { list: [
          "Le message nomme les champs, les méthodes et les indices de tableau ; les variables locales et paramètres n'apparaissent par leur nom que si le code est compilé avec `javac -g` (sinon `<local1>`, `<local2>`...).",
          "Ce message n'existe que pour les NPE lancées par la JVM. Une NPE créée par le code (`throw new NullPointerException()`, `Objects.requireNonNull(x)`) garde le message fourni, éventuellement `null`.",
          "Concaténer ou afficher une référence `null` ne lance rien : `System.out.println(obj)` et `\"\" + obj` donnent `null`."
        ] },
        { trap: "L'unboxing d'un wrapper `null` (`int i = integerRef;`) et le `switch` sur une référence `null` sans `case null` lancent aussi une `NullPointerException`." }
      ]
    }
  ],
  questions: [
    {
      id: "exceptions-001",
      difficulty: 1,
      q: "Which of the following are checked exceptions? (Choose three.)",
      options: [
        "java.io.IOException",
        "java.text.ParseException",
        "java.sql.SQLException",
        "java.lang.NumberFormatException",
        "java.lang.ClassCastException",
        "java.lang.ExceptionInInitializerError",
        "java.lang.ArithmeticException"
      ],
      answer: [0, 1, 2],
      explain: "Une exception est checked si elle hérite de `Exception` sans passer par `RuntimeException`. `IOException`, `ParseException` (`java.text`) et `SQLException` héritent directement de `Exception` : elles sont checked. `NumberFormatException` (sous `IllegalArgumentException`), `ClassCastException` et `ArithmeticException` sont des `RuntimeException`, donc unchecked. `ExceptionInInitializerError` est une `Error` (sous `LinkageError`), unchecked elle aussi."
    },
    {
      id: "exceptions-002",
      difficulty: 1,
      q: "Which statements about the exception hierarchy are true? (Choose two.)",
      options: [
        "RuntimeException is a subclass of Exception",
        "Error and Exception are both direct subclasses of Throwable",
        "Exception is a subclass of Error",
        "A method that may throw an Error must declare it in its throws clause",
        "A class that directly extends Throwable is an unchecked exception",
        "A catch (Exception e) block also catches StackOverflowError"
      ],
      answer: [0, 1],
      explain: "`Throwable` a deux sous-classes directes, `Error` et `Exception`, et `RuntimeException` hérite de `Exception`. `Exception` n'hérite pas de `Error` : ce sont deux branches séparées, donc `catch (Exception e)` n'attrape jamais une `Error` comme `StackOverflowError`. Les `Error` sont unchecked : rien n'oblige à les déclarer. En revanche `Throwable` lui-même (et une classe qui l'étend directement) est **checked**, car seules les branches `RuntimeException` et `Error` sont unchecked."
    },
    {
      id: "exceptions-003",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) {
        try {
            Integer.parseInt("4.0");
            System.out.print("A");
        } catch (ArithmeticException e) {
            System.out.print("B");
        } catch (IllegalArgumentException e) {
            System.out.print("C");
        } catch (RuntimeException e) {
            System.out.print("D");
        } finally {
            System.out.print("E");
        }
    }
}`,
      options: [
        "CE",
        "DE",
        "AE",
        "BE",
        "CDE",
        "E followed by the stack trace of a NumberFormatException"
      ],
      answer: [0],
      explain: "`Integer.parseInt(\"4.0\")` lance une `NumberFormatException` (le point n'est pas accepté), donc `A` n'est pas affiché. `NumberFormatException` hérite de `IllegalArgumentException` : le premier `catch` compatible est le deuxième, qui affiche `C`. Un seul `catch` s'exécute, donc pas de `D`, puis `finally` affiche `E`. Ce n'est pas une `ArithmeticException` (réservée à la division entière par zéro). L'ordre des `catch` est valide car aucun type n'est précédé de l'un de ses super-types."
    },
    {
      id: "exceptions-004",
      difficulty: 2,
      q: "What is the result of compiling and running the following code?",
      code: String.raw`import java.io.*;

public class Main {
    static void open(String name) throws IOException {
        if (name.isEmpty()) throw new FileNotFoundException();
    }
    public static void main(String[] args) {
        try {
            open("");                              // n1
        } catch (IOException e) {                  // n2
            System.out.print("IO");
        } catch (FileNotFoundException e) {        // n3
            System.out.print("FNF");
        } catch (Exception e) {                    // n4
            System.out.print("E");
        }
    }
}`,
      options: [
        "It prints IO",
        "It prints FNF",
        "It prints IOFNF",
        "Compilation fails because of line n3",
        "Compilation fails because of line n4",
        "Compilation fails because of line n1"
      ],
      answer: [3],
      explain: "`FileNotFoundException` est une sous-classe de `IOException`. Le `catch (IOException e)` placé avant attrape déjà toutes les `FileNotFoundException` : le bloc n3 est inatteignable et le compilateur signale `exception FileNotFoundException has already been caught`. La ligne n4 est correcte : `Exception` est plus large que `IOException` et vient après. Il faut toujours aller du plus spécifique au plus général ; en inversant n2 et n3, le programme afficherait `FNF`."
    },
    {
      id: "exceptions-005",
      difficulty: 2,
      q: "Which catch clauses, inserted independently at line n1, allow the code to compile? (Choose three.)",
      code: String.raw`import java.io.*;
import java.sql.*;

public class Main {
    public static void main(String[] args) {
        try {
            System.out.println("Hello");
        } /* n1 */ {
            System.out.println("Caught");
        }
    }
}`,
      options: [
        "catch (Exception e)",
        "catch (Throwable e)",
        "catch (NumberFormatException e)",
        "catch (IOException e)",
        "catch (FileNotFoundException e)",
        "catch (SQLException e)"
      ],
      answer: [0, 1, 2],
      explain: "Attraper une exception **checked** que le bloc `try` ne peut pas lancer est une erreur de compilation (`exception IOException is never thrown in body of corresponding try statement`). `println` ne déclare aucune exception checked : `IOException`, `FileNotFoundException` et `SQLException` sont donc refusées. La règle ne s'applique ni aux exceptions unchecked (`NumberFormatException`) ni à `Exception` et `Throwable`, qui englobent des exceptions unchecked toujours possibles."
    },
    {
      id: "exceptions-006",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`public class Main {
    static int compute() {
        try {
            throw new IllegalStateException();
        } catch (IllegalArgumentException e) {
            return 1;
        } finally {
            return 2;
        }
    }
    public static void main(String[] args) {
        System.out.print(compute());
    }
}`,
      options: [
        "1",
        "2",
        "12",
        "An IllegalStateException is thrown and nothing is printed",
        "The code does not compile"
      ],
      answer: [1],
      explain: "`IllegalStateException` n'a aucun lien d'héritage avec `IllegalArgumentException` : le `catch` ne s'applique pas et l'exception commence à se propager. Mais `finally` s'exécute toujours, et son `return 2` **remplace** la sortie anormale : l'exception est purement abandonnée et la méthode renvoie `2`. Le code compile (javac émet au plus un avertissement de lint sur le `finally` qui ne se termine pas normalement). Répondre « exception » revient à oublier qu'un `return` dans `finally` avale l'exception en cours."
    },
    {
      id: "exceptions-007",
      difficulty: 2,
      q: "What is printed by the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) {
        try {
            System.out.print("A");
            Object o = "x";
            Integer i = (Integer) o;
            System.out.print("B");
        } catch (ClassCastException e) {
            System.out.print("C");
            throw new IllegalStateException();
        } catch (RuntimeException e) {
            System.out.print("D");
        } finally {
            System.out.print("E");
        }
        System.out.print("F");
    }
}`,
      options: [
        "ACE followed by the stack trace of an IllegalStateException",
        "ACDEF",
        "ACDE followed by the stack trace of an IllegalStateException",
        "AC followed by the stack trace of an IllegalStateException",
        "ACEF",
        "The code does not compile"
      ],
      answer: [0],
      explain: "`A` est affiché, puis le cast d'une `String` en `Integer` lance `ClassCastException` (le code compile car `Object` peut être casté en `Integer`). Le premier `catch` affiche `C` et lance une `IllegalStateException`. Une exception lancée depuis un bloc `catch` n'est **pas** examinée par les `catch` suivants du même `try` : `D` n'est jamais affiché. `finally` s'exécute quand même (`E`), puis l'exception se propage hors de `main` : `F` n'est pas affiché et la stack trace apparaît."
    },
    {
      id: "exceptions-008",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) {
        try {
            System.out.print("1");
            System.exit(0);
            System.out.print("2");
        } catch (Exception e) {
            System.out.print("3");
        } finally {
            System.out.print("4");
        }
        System.out.print("5");
    }
}`,
      options: [
        "1",
        "14",
        "145",
        "1245",
        "The code does not compile because the statement after System.exit(0) is unreachable"
      ],
      answer: [0],
      explain: "`System.exit(0)` arrête immédiatement la JVM : c'est le cas classique où le bloc `finally` n'est **pas** exécuté. Seul `1` est affiché. Le code compile : pour le compilateur, `System.exit` est un appel de méthode ordinaire, donc l'instruction suivante n'est pas considérée comme inatteignable (contrairement à ce qui suit un `throw` ou un `return`)."
    },
    {
      id: "exceptions-009",
      difficulty: 2,
      q: "Which catch clauses, inserted independently at line n1, allow the code to compile? (Choose two.)",
      code: String.raw`import java.io.*;
import java.sql.*;

public class Main {
    static void load() throws IOException { }

    public static void main(String[] args) {
        try {
            load();
        } /* n1 */ {
            System.out.println("Caught");
        }
    }
}`,
      options: [
        "catch (IOException | IllegalArgumentException e)",
        "catch (Error | Exception e)",
        "catch (FileNotFoundException | IOException e)",
        "catch (IOException e1 | RuntimeException e2)",
        "catch (IOException | SQLException e)",
        "catch (Exception | NumberFormatException e)"
      ],
      answer: [0, 1],
      explain: "Un multi-catch liste des types séparés par `|` avec **une seule** variable, ce qui exclut `IOException e1 | RuntimeException e2`. Les alternatives ne doivent pas être liées par héritage : `FileNotFoundException | IOException` et `Exception | NumberFormatException` sont refusées (`Alternatives in a multi-catch statement cannot be related by subclassing`). `IOException | SQLException` échoue pour une autre raison : `SQLException` est checked et n'est jamais lancée dans le `try`. `IOException | IllegalArgumentException` et `Error | Exception` combinent des types indépendants et sont valides."
    },
    {
      id: "exceptions-010",
      difficulty: 2,
      q: "Which line, if any, causes a compilation error?",
      code: String.raw`import java.io.*;

public class Main {
    static void load() throws IOException { }

    public static void main(String[] args) {
        try {
            load();
        } catch (IOException e) {
            e = new FileNotFoundException();            // n1
            System.out.print(e);
        }
        try {
            load();
        } catch (IOException | IllegalStateException e) {
            System.out.print(e.getMessage());           // n2
            e = new IllegalStateException();            // n3
        }
    }
}`,
      options: [
        "Line n1",
        "Line n2",
        "Line n3",
        "Lines n1 and n3",
        "The code compiles without error"
      ],
      answer: [2],
      explain: "Le paramètre d'un **multi-catch** est implicitement `final` : la réaffectation de la ligne n3 est refusée (`multi-catch parameter e may not be assigned`). Dans un `catch` à un seul type, le paramètre est une variable locale ordinaire : n1 compile, et `FileNotFoundException` est bien une `IOException`. La ligne n2 compile car `getMessage()` appartient au super-type commun des deux alternatives."
    },
    {
      id: "exceptions-011",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    static class Res implements AutoCloseable {
        private final String name;
        Res(String name) { this.name = name; }
        public void close() { System.out.print(name); }
    }
    public static void main(String[] args) {
        try (Res a = new Res("1"); Res b = new Res("2")) {
            System.out.print("T");
            throw new RuntimeException();
        } catch (RuntimeException e) {
            System.out.print("C");
        } finally {
            System.out.print("F");
        }
    }
}`,
      options: [
        "T21CF",
        "T12CF",
        "TC21F",
        "TCF21",
        "TCF12",
        "T21 followed by the stack trace of a RuntimeException"
      ],
      answer: [0],
      explain: "Dans un try-with-resources, les ressources sont fermées dès la sortie du bloc `try`, **avant** l'exécution des blocs `catch` et `finally` explicites, et dans l'**ordre inverse** de leur déclaration : `b` (`2`) puis `a` (`1`). On obtient donc `T`, `21`, puis `C` (l'exception est attrapée) et `F`. Les réponses `TC21F` et `TCF21` correspondent à l'erreur classique qui consiste à croire que la fermeture a lieu dans le `finally` ou après lui."
    },
    {
      id: "exceptions-012",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    static class Res implements AutoCloseable {
        private final String name;
        Res(String name) { this.name = name; }
        public void close() { throw new IllegalStateException(name); }
    }
    public static void main(String[] args) {
        try (Res a = new Res("A"); Res b = new Res("B")) {
            throw new RuntimeException("T");
        } catch (Exception e) {
            System.out.print(e.getMessage());
            for (Throwable t : e.getSuppressed()) {
                System.out.print(t.getMessage());
            }
        }
    }
}`,
      options: [
        "TBA",
        "TAB",
        "T",
        "BA",
        "AT",
        "BTA"
      ],
      answer: [0],
      explain: "L'exception lancée dans le bloc `try` (`T`) reste l'exception **principale**. Les exceptions lancées ensuite par les appels automatiques à `close()` ne la remplacent pas : elles lui sont ajoutées comme exceptions supprimées, dans l'ordre de fermeture, donc en ordre inverse des déclarations (`B` puis `A`). Le `catch` reçoit l'exception `T`, dont `getSuppressed()` contient `B` et `A` : affichage `TBA`. Répondre `BA` ou `AT` revient à croire que la dernière exception lancée l'emporte, ce qui n'est vrai que pour un `finally` écrit à la main."
    },
    {
      id: "exceptions-013",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    static class Door implements AutoCloseable {
        public void close() { throw new RuntimeException("close"); }
    }
    static void enter() {
        try (Door d = new Door()) {
            throw new IllegalStateException("try");
        } finally {
            throw new RuntimeException("finally");
        }
    }
    public static void main(String[] args) {
        try {
            enter();
        } catch (Exception e) {
            System.out.print(e.getMessage() + " " + e.getSuppressed().length);
        }
    }
}`,
      options: [
        "finally 0",
        "finally 1",
        "finally 2",
        "try 1",
        "try 2",
        "close 1"
      ],
      answer: [0],
      explain: "Le bloc `try` lance `try`, puis la fermeture automatique lance `close`, qui est ajoutée comme exception supprimée de `try`. Mais le `finally` **explicite** s'exécute ensuite et lance sa propre exception : comme pour un `try` classique, elle remplace complètement l'exception en cours, qui est perdue. L'exception `finally` est un objet neuf sans aucune exception supprimée, d'où `finally 0`. Le mécanisme des exceptions supprimées ne concerne que les `close()` implicites, jamais un `finally` écrit à la main."
    },
    {
      id: "exceptions-014",
      difficulty: 2,
      q: "What is the result of compiling and running the following code?",
      code: String.raw`public class Main {
    static class Res implements AutoCloseable {
        public void close() throws Exception {            // n1
            System.out.print("closed");
        }
    }
    public static void main(String[] args) {
        try (Res r = new Res()) {                         // n2
            System.out.print("open ");
        }                                                 // n3
    }
}`,
      options: [
        "It prints open closed",
        "It prints open",
        "Compilation fails: the exception declared by close() must be caught or declared by main",
        "Compilation fails: a try statement requires at least one catch or finally block",
        "Compilation fails at line n1: close() cannot declare a checked exception",
        "It prints open and then throws an Exception at runtime"
      ],
      answer: [2],
      explain: "Le try-with-resources appelle implicitement `r.close()`, et `Res.close()` déclare `throws Exception` (checked). La règle handle or declare s'applique à cet appel implicite : sans `catch (Exception e)` ni `throws Exception` sur `main`, la compilation échoue (`unreported exception Exception ... thrown from implicit call to close() on resource variable 'r'`). Un try-with-resources n'a besoin ni de `catch` ni de `finally`, et `AutoCloseable.close()` déclare bien `throws Exception`, donc n1 est légale. Si `close()` ne déclarait rien, le programme afficherait `open closed`."
    },
    {
      id: "exceptions-015",
      difficulty: 3,
      q: "Which lines cause a compilation error? (Choose two.)",
      code: String.raw`public class Main {
    static class Res implements AutoCloseable {
        void use() { }
        public void close() { }
    }
    public static void main(String[] args) {
        Res r1 = new Res();
        Res r2 = new Res();
        r2 = new Res();
        try (r1) {                      // n1
            System.out.print("a");
        }
        try (r2) {                      // n2
            System.out.print("b");
        }
        try (Res r3 = new Res()) {      // n3
            System.out.print("c");
        } finally {
            r3.use();                   // n4
        }
        r1.use();                       // n5
    }
}`,
      options: [
        "Line n1",
        "Line n2",
        "Line n3",
        "Line n4",
        "Line n5"
      ],
      answer: [1, 3],
      explain: "Depuis Java 9, un try-with-resources peut utiliser une variable déclarée avant lui, à condition qu'elle soit `final` ou effectivement finale. `r1` n'est jamais réaffectée : n1 compile. `r2` est réaffectée, elle n'est plus effectivement finale : n2 ne compile pas. Une ressource déclarée dans les parenthèses (`r3`) n'est visible que dans le bloc `try` : elle est hors de portée dans `finally`, donc n4 ne compile pas. La ligne n5 compile : `r1` est déclarée dans `main` et reste visible après le `try` (elle désigne simplement une ressource déjà fermée)."
    },
    {
      id: "exceptions-016",
      difficulty: 1,
      q: "Which statements about try-with-resources are true? (Choose two.)",
      options: [
        "java.io.Closeable extends java.lang.AutoCloseable",
        "Resources are closed in the reverse order of their declaration",
        "AutoCloseable.close() is declared with throws IOException",
        "A try-with-resources statement requires at least one catch or finally block",
        "A resource declared in the try header can be used in the catch blocks of the same statement",
        "An explicit finally block runs before the resources are closed"
      ],
      answer: [0, 1],
      explain: "`Closeable` (paquet `java.io`) étend `AutoCloseable` (paquet `java.lang`) et restreint `close()` à `throws IOException` ; c'est `AutoCloseable.close()` qui déclare `throws Exception`. Les ressources sont fermées en ordre inverse de leur déclaration, et cette fermeture a lieu **avant** les blocs `catch` et `finally` explicites. Un try-with-resources peut n'avoir ni `catch` ni `finally`. Enfin, la portée d'une ressource se limite au bloc `try` : elle n'est visible ni dans `catch` ni dans `finally`."
    },
    {
      id: "exceptions-017",
      difficulty: 2,
      q: "Given the import java.io.*; which method declarations compile? (Choose three.)",
      options: [
        "void a() { throw new RuntimeException(); }",
        "void c() throws Exception { }",
        "void e() throws IOException { throw new FileNotFoundException(); }",
        "void b() { throw new Exception(); }",
        "void d() { throws new IOException(); }",
        "void f() throws FileNotFoundException { throw new IOException(); }",
        "void g() throw IOException { }"
      ],
      answer: [0, 1, 2],
      explain: "`throw` est l'instruction qui lance un objet, `throws` est la clause de signature : `throws new IOException()` dans un corps et `throw IOException` dans une signature sont des erreurs de syntaxe. Une `RuntimeException` peut être lancée sans déclaration. Déclarer `throws Exception` sans jamais rien lancer est permis. `throws IOException` couvre la sous-classe `FileNotFoundException`. En revanche `throw new Exception()` sans `throws` viole handle or declare, et `throws FileNotFoundException` ne couvre pas la super-classe `IOException`."
    },
    {
      id: "exceptions-018",
      difficulty: 3,
      q: "Which statement about the following class is true?",
      code: String.raw`import java.io.*;

public class Main {
    static void read() throws IOException { }

    static void a() throws IOException {
        try {
            read();
        } catch (Exception e) {
            throw e;                             // n1
        }
    }
    static void b() throws IOException {
        try {
            read();
        } catch (Exception e) {
            e = new IOException();
            throw e;                             // n2
        }
    }
    static void c() {
        try {
            read();
        } catch (Exception e) {
            throw new RuntimeException(e);       // n3
        }
    }
}`,
      options: [
        "The class compiles without error",
        "Only line n1 fails to compile",
        "Only line n2 fails to compile",
        "Lines n1 and n2 fail to compile",
        "Only line n3 fails to compile",
        "Lines n1, n2 and n3 fail to compile"
      ],
      answer: [2],
      explain: "Ligne n1 : le paramètre `e` n'est jamais réaffecté, donc le compilateur applique le **rethrow précis** : il sait que `e` ne peut être qu'une `IOException` (seule checked possible dans le `try`) ou une unchecked, et `throws IOException` suffit. Ligne n2 : `e` est réaffecté, il n'est plus effectivement final ; `throw e` lance alors le type déclaré `Exception`, qui n'est ni attrapé ni déclaré (`unreported exception Exception`). Ligne n3 : envelopper la cause dans une `RuntimeException` (unchecked) ne nécessite aucune clause `throws`."
    },
    {
      id: "exceptions-019",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) {
        Exception e1 = new IllegalArgumentException("neg");
        Exception e2 = new IllegalStateException();
        Exception e3 = new RuntimeException(new IOException("disk"));
        System.out.println(e1);
        System.out.println(e2.getMessage());
        System.out.println(e3.getMessage());
    }
}`,
      options: [
        String.raw`java.lang.IllegalArgumentException: neg
null
java.io.IOException: disk`,
        String.raw`java.lang.IllegalArgumentException: neg
null
null`,
        String.raw`neg
null
disk`,
        String.raw`IllegalArgumentException: neg
java.lang.IllegalStateException
disk`,
        String.raw`java.lang.IllegalArgumentException: neg
null
disk`,
        "The first line is printed, then a NullPointerException is thrown"
      ],
      answer: [0],
      explain: "Afficher une exception appelle `toString()` : nom **qualifié** de la classe suivi de `: message`, soit `java.lang.IllegalArgumentException: neg`. Sans message, `getMessage()` renvoie `null` et `println` affiche `null` sans lancer d'exception. Le piège est `e3` : le constructeur `RuntimeException(Throwable cause)` initialise le message avec `cause.toString()`, donc `getMessage()` renvoie `java.io.IOException: disk` et non `null` ni `disk`."
    },
    {
      id: "exceptions-020",
      difficulty: 2,
      q: "What is the result of compiling and running the following code?",
      code: String.raw`public class Main {
    static class TooHotException extends Exception { }                // n1

    static class Oven {
        void heat(int t) throws TooHotException {                     // n2
            if (t > 250) throw new TooHotException("Too hot: " + t);  // n3
        }
    }
    public static void main(String[] args) {
        try {
            new Oven().heat(300);
        } catch (TooHotException e) {                                 // n4
            System.out.print(e.getMessage());
        }
    }
}`,
      options: [
        "It prints Too hot: 300",
        "It prints null",
        "Compilation fails because of line n1",
        "Compilation fails because of line n3",
        "Compilation fails because of line n4",
        "The stack trace of a TooHotException is printed"
      ],
      answer: [3],
      explain: "Les constructeurs ne sont **pas hérités**. `TooHotException` ne déclare aucun constructeur : le compilateur ne génère que le constructeur par défaut sans argument. L'appel `new TooHotException(\"Too hot: \" + t)` de la ligne n3 ne correspond à aucun constructeur et ne compile pas. La ligne n1 est valide (une exception personnalisée checked sans corps est légale), tout comme n2 et n4. Il aurait fallu déclarer `TooHotException(String message) { super(message); }`."
    },
    {
      id: "exceptions-021",
      difficulty: 2,
      q: "Given the following class, which methods can be placed in a subclass of Reader as a valid override of read()? (Choose three.)",
      code: String.raw`import java.io.*;
import java.sql.*;

class Reader {
    void read() throws IOException { }
}`,
      options: [
        "void read() { }",
        "void read() throws FileNotFoundException { }",
        "void read() throws IOException, IllegalStateException { }",
        "void read() throws Exception { }",
        "void read() throws IOException, SQLException { }",
        "void read() throws Throwable { }"
      ],
      answer: [0, 1, 2],
      explain: "Une redéfinition ne peut déclarer aucune exception checked nouvelle ou plus large que celles de la méthode redéfinie. Elle peut n'en déclarer aucune, déclarer une sous-classe (`FileNotFoundException`), et ajouter librement des exceptions unchecked (`IllegalStateException`). `Exception` et `Throwable` sont plus larges que `IOException`, et `SQLException` est une checked sans rapport avec `IOException` : ces trois redéfinitions sont refusées (`overridden method does not throw ...`)."
    },
    {
      id: "exceptions-022",
      difficulty: 2,
      q: "What is the result of compiling and running the following code?",
      code: String.raw`import java.io.*;

class Task {
    void run() throws IOException {
        System.out.print("task ");
    }
}
class QuickTask extends Task {
    @Override
    void run() {
        System.out.print("quick ");
    }
}
public class Main {
    public static void main(String[] args) {
        QuickTask q = new QuickTask();
        q.run();                    // n1
        Task t = q;                 // n2
        t.run();                    // n3
    }
}`,
      options: [
        "It prints quick quick",
        "It prints quick task",
        "Compilation fails because of line n1",
        "Compilation fails because of line n3",
        "Compilation fails because of lines n1 and n3",
        "Compilation fails because QuickTask.run() must declare throws IOException"
      ],
      answer: [3],
      explain: "Le compilateur applique handle or declare d'après le type de la **référence**. `q` est de type `QuickTask`, dont `run()` ne déclare aucune exception : n1 compile. `t` est de type `Task`, dont `run()` déclare `throws IOException` : l'appel n3 doit être dans un `try`/`catch` ou `main` doit déclarer l'exception, même si l'objet réel est un `QuickTask`. Une redéfinition a le droit de supprimer la clause `throws`. Si `main` déclarait `throws IOException`, le programme afficherait `quick quick` (polymorphisme)."
    },
    {
      id: "exceptions-023",
      difficulty: 3,
      q: "Given the following class, which subclass declarations compile? (Choose two.)",
      code: String.raw`import java.io.*;

class Base {
    Base() throws IOException { }
}`,
      options: [
        "class B extends Base { B() throws IOException { } }",
        "class C extends Base { C() throws Exception { } }",
        "class A extends Base { }",
        "class D extends Base { D() { try { super(); } catch (IOException e) { } } }",
        "class E extends Base { E() throws FileNotFoundException { } }",
        "class F extends Base { F() { } }"
      ],
      answer: [0, 1],
      explain: "Chaque constructeur de la sous-classe appelle `super()` (explicitement ou non), et cet appel peut lancer `IOException` : le constructeur doit donc la **déclarer**, elle ou une super-classe (`Exception`). Les constructeurs ne sont pas des redéfinitions, élargir la clause `throws` est permis. `FileNotFoundException` est trop étroite. Le constructeur par défaut généré pour `A` et le constructeur `F()` ne déclarent rien : erreur. Attraper l'exception est impossible : en Java 21, `super()` doit être la première instruction du constructeur et ne peut pas figurer dans un `try`."
    },
    {
      id: "exceptions-024",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    static class Config {
        static int size = Integer.parseInt("ten");
        static void show() { System.out.print("show "); }
    }
    static void call() {
        try {
            Config.show();
        } catch (RuntimeException e) {
            System.out.print("R ");
        } catch (Error e) {
            System.out.print(e.getClass().getSimpleName() + " ");
        }
    }
    public static void main(String[] args) {
        call();
        call();
    }
}`,
      options: [
        "ExceptionInInitializerError NoClassDefFoundError",
        "ExceptionInInitializerError ExceptionInInitializerError",
        "R R",
        "R show",
        "ExceptionInInitializerError show",
        "NoClassDefFoundError NoClassDefFoundError"
      ],
      answer: [0],
      explain: "Le premier appel à `Config.show()` déclenche l'initialisation de la classe. `Integer.parseInt(\"ten\")` lance une `NumberFormatException` dans un initialiseur statique : la JVM l'enveloppe dans une `ExceptionInInitializerError` (la `NumberFormatException` devient sa cause). C'est une `Error`, donc `catch (RuntimeException e)` ne l'attrape pas. La classe est alors marquée comme inutilisable : le second appel ne relance pas l'initialisation et lance `NoClassDefFoundError`. `show` n'est jamais affiché."
    },
    {
      id: "exceptions-025",
      difficulty: 2,
      q: "What is the result of executing the following code on Java 21 with default JVM options?",
      code: String.raw`public class Main {
    record Person(String name) { }

    public static void main(String[] args) {
        Person p = new Person(null);
        System.out.println(p);                       // n1
        System.out.println(p.name().length());       // n2
    }
}`,
      options: [
        "Line n1 prints Person[name=null], then line n2 throws a NullPointerException whose message says that the return value of name() is null",
        "Line n1 prints Person[name=null], then line n2 throws a NullPointerException whose message is null",
        "Line n1 throws a NullPointerException",
        "The constructor call throws a NullPointerException because a record component cannot be null",
        "Line n1 prints Person[name=null], then line n2 prints 0",
        "Line n1 prints Person[name=null], then line n2 prints null"
      ],
      answer: [0],
      explain: "Un composant de record peut valoir `null`, et le `toString()` généré affiche `Person[name=null]` sans erreur. À la ligne n2, `p.name()` renvoie `null` et l'appel de `length()` lance une `NullPointerException`. Depuis Java 15 les *helpful NullPointerExceptions* sont actives par défaut : le message généré par la JVM est `Cannot invoke \"String.length()\" because the return value of \"Main$Person.name()\" is null`. Le message n'est `null` que pour une NPE créée par le code avec `new NullPointerException()`."
    }
  ]
});
