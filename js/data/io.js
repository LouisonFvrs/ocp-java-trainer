OCP.register({
  topic: 'io',
  course: [
    {
      title: "Flux java.io : familles et logique de nommage",
      blocks: [
        { p: "Un flux (`stream`) `java.io` lit ou écrit des données séquentiellement. Deux axes à connaître : **octets ou caractères**, et **bas niveau ou haut niveau**. Le nom de la classe suffit presque toujours à la classer." },
        { table: { head: ["Suffixe / préfixe", "Signification", "Exemples"], rows: [
          ["`InputStream` / `OutputStream`", "flux d'**octets** (binaire, images, objets)", "`FileInputStream`, `BufferedOutputStream`, `ObjectInputStream`"],
          ["`Reader` / `Writer`", "flux de **caractères** (texte, encodage géré)", "`FileReader`, `BufferedWriter`, `PrintWriter`"],
          ["`File*`", "bas niveau : se connecte directement à un fichier", "`FileInputStream`, `FileOutputStream`, `FileReader`, `FileWriter`"],
          ["`Buffered*`", "haut niveau : ajoute un tampon (performance)", "`BufferedInputStream`, `BufferedReader` (+ `readLine()`)"],
          ["`Object*`", "haut niveau : sérialisation d'objets et de primitives", "`ObjectInputStream`, `ObjectOutputStream` (octets uniquement)"],
          ["`Print*`", "haut niveau : `print`, `println`, `printf`, `format`", "`PrintStream` (octets, `System.out`), `PrintWriter` (caractères)"],
          ["`InputStreamReader` / `OutputStreamWriter`", "**pont** octets vers caractères", "`new InputStreamReader(System.in)`"]
        ] } },
        { list: [
          "Un flux **bas niveau** se branche sur la source (fichier, tableau, `String`). Un flux **haut niveau** enveloppe un autre flux reçu dans son constructeur.",
          "Les quatre classes mères `InputStream`, `OutputStream`, `Reader`, `Writer` sont **abstraites** : on ne les instancie pas.",
          "`PrintStream` et `PrintWriter` n'ont pas d'équivalent en lecture, et il n'existe ni `ObjectReader` ni `ObjectWriter`.",
          "`PrintWriter` accepte dans son constructeur un `Writer`, un `OutputStream`, un `File` ou un nom de fichier."
        ] },
        { h: "Combinaisons valides" },
        { code: String.raw`var r = new BufferedReader(new FileReader("a.txt"));              // OK
var o = new ObjectInputStream(
        new BufferedInputStream(new FileInputStream("a.dat")));    // OK
var b = new BufferedReader(
        new InputStreamReader(new FileInputStream("a.txt")));      // OK : pont
var w = new PrintWriter(new FileOutputStream("a.txt"));            // OK

var x = new BufferedInputStream(new FileReader("a.txt"));    // DOES NOT COMPILE
var y = new BufferedWriter(new FileOutputStream("a.txt"));   // DOES NOT COMPILE
var z = new ObjectOutputStream(new FileWriter("a.dat"));     // DOES NOT COMPILE
var k = new InputStreamReader(new FileReader("a.txt"));      // DOES NOT COMPILE` },
        { trap: "On ne mélange jamais octets et caractères : un `Buffered*Stream` enveloppe un `InputStream`/`OutputStream`, un `BufferedReader`/`BufferedWriter` enveloppe un `Reader`/`Writer`. Le pont se fait avec `InputStreamReader` et `OutputStreamWriter`, qui enveloppent un flux d'**octets** pour offrir un flux de caractères, jamais l'inverse. Seule autre exception : `PrintWriter`, dont un constructeur accepte directement un `OutputStream`." },
        { tip: "Pour valider un empilement : lire de l'intérieur vers l'extérieur et vérifier que chaque constructeur reçoit bien le type (`InputStream`, `Reader`…) qu'il attend." }
      ]
    },
    {
      title: "Lire et écrire : méthodes clés des flux",
      blocks: [
        { table: { head: ["Méthode", "Comportement à retenir"], rows: [
          ["`int read()`", "lit **un** octet (ou caractère) et le renvoie dans un `int` ; renvoie **`-1`** en fin de flux"],
          ["`int read(byte[] b)` / `read(char[] c)`", "lit **au plus** `b.length` éléments dans le tableau, renvoie le **nombre** d'éléments réellement lus, ou `-1` en fin de flux"],
          ["`int read(byte[] b, int off, int len)`", "idem, sur une portion du tableau"],
          ["`void write(int b)`", "écrit un seul octet (les 8 bits de poids faible)"],
          ["`void write(byte[] b, int off, int len)`", "écrit `len` octets à partir de `off`"],
          ["`byte[] readAllBytes()`", "lit tout ce qui reste ; tableau vide si le flux est déjà épuisé"],
          ["`long transferTo(OutputStream out)`", "copie tout ce qui reste, renvoie le nombre d'octets transférés (`Reader.transferTo(Writer)` existe aussi)"],
          ["`String readLine()`", "`BufferedReader` uniquement : la ligne **sans** son terminateur, ou **`null`** en fin de flux"],
          ["`Stream<String> lines()`", "`BufferedReader` : flux paresseux des lignes"],
          ["`long skip(long n)`", "saute jusqu'à `n` éléments, renvoie le nombre réellement sauté"],
          ["`void flush()`", "force l'écriture du tampon vers la destination"],
          ["`void close()`", "libère la ressource ; fermer le flux externe ferme les flux enveloppés ; `close()` fait un `flush()`"]
        ] } },
        { h: "Boucles de lecture types" },
        { code: String.raw`int b;
while ((b = in.read()) != -1) {        // un octet à la fois
    out.write(b);
}

byte[] buffer = new byte[1024];
int n;
while ((n = in.read(buffer)) > 0) {    // par blocs
    out.write(buffer, 0, n);           // seulement les n octets lus
}

String line;
while ((line = reader.readLine()) != null) {   // ligne par ligne
    System.out.println(line);
}` },
        { trap: "`out.write(buffer)` sans `0, n` écrit **tout** le tableau : au dernier tour, la fin du tampon contient encore les octets du tour précédent, qui sont réécrits. `\"ABCDE\"` copié avec un tampon de 2 donne `ABCDED`." },
        { trap: "`read()` renvoie un `int`, pas un `byte` ni un `char` : il faut un cast `(char)` pour afficher la lettre. Fin de flux : `-1` pour `read()`, `null` pour `readLine()`, jamais d'exception." },
        { h: "mark, reset, skip" },
        { list: [
          "`markSupported()` indique si le flux sait revenir en arrière (`BufferedInputStream`, `BufferedReader`, `ByteArrayInputStream`, `StringReader` : oui ; `FileInputStream` : non).",
          "`mark(int readLimit)` mémorise la position ; `reset()` y revient. Les données lues entre les deux seront **relues**.",
          "`reset()` sur un flux qui ne supporte pas `mark` lève une `IOException` : toujours tester `markSupported()` d'abord.",
          "`skip(n)` avance sans rien renvoyer d'utile au contenu : les éléments sautés sont perdus."
        ] },
        { code: String.raw`var in = new ByteArrayInputStream("ABCDEF".getBytes());
in.read();              // A
in.mark(10);
in.read();              // B
in.read();              // C
in.reset();             // retour juste après A
in.skip(2);             // saute B et C
char c = (char) in.read();   // D` },
        { trap: "Sans `flush()` ni `close()`, les données restées dans le tampon d'un `BufferedWriter` ou d'un `BufferedOutputStream` ne sont jamais écrites : le fichier peut être vide ou tronqué." }
      ]
    },
    {
      title: "Console et flux standard",
      blocks: [
        { table: { head: ["Flux", "Type", "Rôle"], rows: [
          ["`System.in`", "`InputStream`", "entrée standard (octets)"],
          ["`System.out`", "`PrintStream`", "sortie standard"],
          ["`System.err`", "`PrintStream`", "sortie d'erreur"]
        ] } },
        { list: [
          "Lire une ligne au clavier avec `java.io` : `new BufferedReader(new InputStreamReader(System.in)).readLine()` (lève `IOException`). Avec `Scanner` : `new Scanner(System.in).nextLine()` (aucune exception contrôlée).",
          "`PrintStream` et `PrintWriter` **ne lèvent jamais d'`IOException`** dans `print`, `println`, `printf`, `format` ni `close()` : l'erreur est avalée et consultable par `checkError()`.",
          "`printf(String, Object...)` et `format(String, Object...)` sont strictement équivalents ; `%n` est le saut de ligne portable, `%s` une chaîne, `%d` un entier, `%f` un décimal."
        ] },
        { trap: "Fermer `System.out` (par exemple en le déclarant dans un try-with-resources) est légal. Tout ce qui est écrit ensuite est **silencieusement ignoré** : pas d'exception, pas d'affichage. Ne jamais fermer `System.in`, `System.out` ou `System.err`." },
        { h: "java.io.Console" },
        { code: String.raw`Console console = System.console();      // pas de constructeur public
if (console != null) {
    String name = console.readLine("Name: ");
    char[] pwd = console.readPassword("Password: ");
    console.printf("Hello %s%n", name);  // format(...) est équivalent
    console.writer().println("done");    // writer() : PrintWriter
    Arrays.fill(pwd, 'x');               // effacer le mot de passe
}` },
        { list: [
          "`System.console()` renvoie **`null`** si la JVM n'a pas de console interactive (entrée ou sortie redirigée, lancement depuis certains IDE) : appeler une méthode dessus donne une `NullPointerException`.",
          "`readLine()` renvoie un `String` ; `readPassword()` renvoie un **`char[]`** (saisie non affichée) pour pouvoir effacer le mot de passe de la mémoire, ce qu'un `String` immuable ne permet pas.",
          "Les méthodes de `Console` ne déclarent **aucune exception contrôlée**. `reader()` renvoie un `Reader`, `writer()` un `PrintWriter`.",
          "`Console` n'implémente pas `AutoCloseable` : on ne peut pas la mettre dans un try-with-resources."
        ] }
      ]
    },
    {
      title: "Sérialisation",
      blocks: [
        { p: "Sérialiser = transformer un objet en suite d'octets avec `ObjectOutputStream.writeObject(Object)` ; désérialiser = le reconstruire avec `ObjectInputStream.readObject()`, qui renvoie un `Object` (cast nécessaire) et déclare `IOException` **et** `ClassNotFoundException`." },
        { list: [
          "`java.io.Serializable` est une interface **marqueur** : aucune méthode à implémenter.",
          "Sont écrits : les champs d'instance non `transient`, y compris les `private` et les `final`, et tout le graphe d'objets référencés.",
          "Ne sont **pas** écrits : les champs **`static`** (ils appartiennent à la classe) et les champs **`transient`**.",
          "Chaque objet référencé par un champ sérialisé doit lui-même être `Serializable`, sinon `writeObject` lève **`java.io.NotSerializableException`** à l'exécution (le code compile). Une référence `null` ne pose pas de problème.",
          "`String`, les wrappers, les tableaux, les collections standard (`ArrayList`, `HashMap`…), les enums et les records marqués sont sérialisables."
        ] },
        { h: "serialVersionUID" },
        { list: [
          "Déclaration recommandée : `private static final long serialVersionUID = 1L;`. C'est le seul champ `static` qui voyage avec le flux.",
          "Il est **facultatif** : s'il est absent, la JVM en calcule un à partir de la structure de la classe.",
          "À la désérialisation, si l'UID du flux diffère de celui de la classe chargée : **`InvalidClassException`**."
        ] },
        { h: "Ce qui s'exécute à la désérialisation" },
        { table: { head: ["Élément", "Désérialisation d'une classe `Serializable`"], rows: [
          ["Constructeur et initialiseurs de la classe sérialisable", "**non exécutés**"],
          ["Initialisation à la déclaration (`int age = 5;`)", "**non exécutée** : la valeur vient du flux"],
          ["Constructeur **sans argument** de la première superclasse **non** sérialisable", "**exécuté** (ainsi que ses initialiseurs et ceux de ses ancêtres)"],
          ["Champs hérités de cette superclasse non sérialisable", "non sauvegardés : ils prennent la valeur donnée par ce constructeur"],
          ["Champ `transient`", "valeur par défaut du type : `null`, `0`, `false`"],
          ["Champ `static`", "inchangé : valeur courante dans la JVM"]
        ] } },
        { code: String.raw`class Animal {                                   // non sérialisable
    int legs = 2;
    Animal() { legs = 4; System.out.print("A"); }
}
class Dog extends Animal implements Serializable {
    String name = "Rex";
    transient String nick = "none";
    { System.out.print("I"); }
    Dog() { System.out.print("D"); }
}
// new Dog()        affiche AID
// désérialisation  affiche A seulement ; legs vaut 4, nick vaut null` },
        { trap: "Un champ `transient String nick = \"none\";` vaut `null` après désérialisation, pas `\"none\"` : ni l'initialisation à la déclaration ni le constructeur ne sont rejoués pour la classe sérialisable." },
        { trap: "Si la première superclasse non sérialisable n'a pas de constructeur sans argument accessible, le code compile et la sérialisation fonctionne, mais la **désérialisation** échoue avec `InvalidClassException`." },
        { h: "Lire plusieurs objets" },
        { code: String.raw`try (var in = new ObjectInputStream(new FileInputStream("data.ser"))) {
    while (true) {
        Object o = in.readObject();
        System.out.println(o);
    }
} catch (EOFException e) {
    // fin normale du fichier
}` },
        { trap: "`readObject()` ne renvoie **pas** `null` en fin de flux et il n'existe pas de méthode fiable du type `hasNext()` : la fin se détecte par une **`EOFException`** (sous-classe d'`IOException`). `null` n'est renvoyé que si `null` a réellement été écrit." },
        { h: "Records" },
        { list: [
          "Un record n'est sérialisable que s'il déclare `implements Serializable`.",
          "Ses composants sont écrits ; à la désérialisation, le **constructeur canonique est appelé** avec les valeurs lues : les validations du constructeur compact sont donc rejouées, contrairement à une classe ordinaire.",
          "L'objet obtenu est un **nouvel** objet : `equals` renvoie `true`, `==` renvoie `false`."
        ] }
      ]
    },
    {
      title: "File et Path : créer et décomposer un chemin",
      blocks: [
        { p: "`java.io.File` est l'ancienne API ; `java.nio.file.Path` (interface) et la classe utilitaire `Files` forment NIO.2. Un `File` ou un `Path` représente un **chemin**, pas un fichier : il peut désigner quelque chose qui n'existe pas." },
        { table: { head: ["Besoin", "`java.io.File`", "NIO.2"], rows: [
          ["Créer", "`new File(\"a/b.txt\")`, `new File(\"a\", \"b.txt\")`", "`Path.of(\"a\", \"b.txt\")`, `Paths.get(\"a/b.txt\")`"],
          ["Existence", "`file.exists()`", "`Files.exists(path)`"],
          ["Type", "`isDirectory()`, `isFile()`", "`Files.isDirectory(p)`, `Files.isRegularFile(p)`"],
          ["Taille", "`length()`", "`Files.size(p)`"],
          ["Supprimer", "`delete()` renvoie un `boolean`", "`Files.delete(p)` lève une exception"],
          ["Créer un dossier", "`mkdir()`, `mkdirs()`", "`Files.createDirectory(p)`, `Files.createDirectories(p)`"],
          ["Lister", "`listFiles()` renvoie `File[]`", "`Files.list(p)` renvoie `Stream<Path>`"],
          ["Nom / parent", "`getName()`, `getParent()` (des `String`)", "`getFileName()`, `getParent()` (des `Path`)"]
        ] } },
        { h: "Obtenir un Path" },
        { code: String.raw`Path p1 = Path.of("/home/user/a.txt");
Path p2 = Path.of("/home", "user", "a.txt");          // varargs
Path p3 = Paths.get("/home/user/a.txt");               // ancienne fabrique
Path p4 = FileSystems.getDefault().getPath("/home/user/a.txt");
Path p5 = new File("/home/user/a.txt").toPath();
File f = p1.toFile();                                  // conversion inverse` },
        { trap: "`Path` est une **interface** : `new Path(\"a\")` ne compile pas. `Path.get(...)` et `Files.path(...)` n'existent pas. La fabrique s'appelle `Paths.get` (classe `Paths`, avec un s) ou `Path.of`." },
        { h: "Décomposer un chemin" },
        { p: "Pour `Path p = Path.of(\"/home/user/docs/report.txt\")` sur un système de type Unix :" },
        { table: { head: ["Appel", "Résultat"], rows: [
          ["`p.getFileName()`", "`report.txt`"],
          ["`p.getParent()`", "`/home/user/docs`"],
          ["`p.getRoot()`", "`/`"],
          ["`p.getNameCount()`", "`4` (la racine ne compte pas)"],
          ["`p.getName(0)`", "`home` (index à partir de 0, racine exclue)"],
          ["`p.subpath(1, 3)`", "`user/docs` (fin **exclue**, résultat toujours relatif)"],
          ["`p.isAbsolute()`", "`true`"],
          ["`p.getName(4)`", "`IllegalArgumentException`"],
          ["`p.subpath(1, 1)`", "`IllegalArgumentException` (intervalle vide)"]
        ] } },
        { list: [
          "Pour un chemin relatif, `getRoot()` renvoie **`null`**. Pour `Path.of(\"a.txt\")`, `getParent()` renvoie `null`.",
          "Pour la racine `/` : `getNameCount()` vaut `0` et `getFileName()` renvoie `null`.",
          "`toAbsolutePath()` préfixe un chemin relatif par le répertoire courant, sans accéder au système de fichiers et sans normaliser.",
          "Un `Path` est **immuable** : `p.normalize();` seul ne change rien, il faut récupérer la valeur renvoyée.",
          "`toString()` renvoie le chemin tel qu'il a été construit (ni normalisé ni rendu absolu)."
        ] },
        { trap: "`getName(int)` et `subpath` ignorent la racine et ne renvoient que des chemins relatifs : `Path.of(\"/a/b\").getName(0)` vaut `a`, jamais `/`." }
      ]
    },
    {
      title: "Path : resolve, relativize, normalize, toRealPath",
      blocks: [
        { table: { head: ["Méthode", "Règle", "Exemple"], rows: [
          ["`a.resolve(b)`", "colle `b` derrière `a` ; si `b` est **absolu**, renvoie `b`", "`/data/in` + `out/y.txt` donne `/data/in/out/y.txt`"],
          ["`a.resolveSibling(b)`", "résout `b` par rapport au **parent** de `a`", "`/data/in` + `z` donne `/data/z`"],
          ["`a.relativize(b)`", "chemin à suivre pour aller de `a` à `b`", "`docs/java/io` vers `docs/notes.txt` donne `../../notes.txt`"],
          ["`a.normalize()`", "supprime les `.` et simplifie les couples `nom/..`", "`./a/../b/./c` donne `b/c`"],
          ["`a.toRealPath()`", "chemin absolu, normalisé, liens suivis ; **accède au disque**", "`NoSuchFileException` si le fichier n'existe pas"]
        ] } },
        { list: [
          "`resolve` ne normalise **pas** : `Path.of(\"/data/in\").resolve(\"../q\")` donne `/data/in/../q`.",
          "`relativize` exige deux chemins **de même nature** : tous deux absolus ou tous deux relatifs. Sinon : `IllegalArgumentException`.",
          "`relativize` considère chaque nom comme un dossier : depuis `docs/java/io`, il faut deux `..` pour revenir à `docs`.",
          "`normalize` conserve les `..` en tête d'un chemin relatif (rien à annuler) : `../a/./b/../../c` donne `../c`.",
          "`a.resolve(a.relativize(b)).normalize()` redonne `b` (pour des chemins normalisés).",
          "`resolve`, `relativize`, `normalize`, `subpath`, `getParent`, `toAbsolutePath` sont purement **syntaxiques** : aucune `IOException`, aucun accès au disque."
        ] },
        { trap: "Seule `toRealPath()` déclare `IOException` et exige que le fichier existe. `normalize()` et `toAbsolutePath()` fonctionnent sur des chemins totalement fictifs." },
        { h: "equals et Files.isSameFile" },
        { code: String.raw`Path p1 = Path.of("data/./f.txt");
Path p2 = Path.of("data", "f.txt");
p1.equals(p2);               // false : comparaison des chemins, sans normaliser
p1.normalize().equals(p2);   // true
Files.isSameFile(p1, p2);    // interroge le disque : true si même fichier,
                             // NoSuchFileException si le fichier est absent` },
        { list: [
          "`Path.equals` compare les chemins textuellement, sans normalisation et sans accès au système de fichiers.",
          "`Files.isSameFile(a, b)` déclare `IOException`. Si `a.equals(b)`, il renvoie `true` **sans vérifier** l'existence ; sinon il doit localiser les deux fichiers (liens symboliques suivis) et lève une exception s'ils n'existent pas."
        ] }
      ]
    },
    {
      title: "Files : tester, créer, copier, déplacer, supprimer",
      blocks: [
        { p: "Presque toutes les méthodes de `Files` déclarent `IOException`. Exceptions notables : `exists`, `notExists`, `isDirectory`, `isRegularFile`, `isSymbolicLink`, `isReadable`, `isWritable`, `isExecutable` renvoient simplement `false` en cas de problème." },
        { table: { head: ["Méthode", "Comportement", "Exceptions typiques"], rows: [
          ["`createDirectory(p)`", "crée **un** dossier ; le parent doit exister", "`FileAlreadyExistsException`, `NoSuchFileException` (parent absent)"],
          ["`createDirectories(p)`", "crée le dossier et tous les parents manquants", "aucune si le dossier existe déjà"],
          ["`copy(src, dst, options...)`", "copie un fichier ; un dossier est copié **vide**", "`FileAlreadyExistsException` si `dst` existe sans `REPLACE_EXISTING`"],
          ["`move(src, dst, options...)`", "déplace ou renomme (fichier ou dossier)", "`FileAlreadyExistsException`, `AtomicMoveNotSupportedException`"],
          ["`delete(p)`", "supprime un fichier ou un dossier **vide**", "`NoSuchFileException`, `DirectoryNotEmptyException`"],
          ["`deleteIfExists(p)`", "idem mais renvoie `false` si absent", "`DirectoryNotEmptyException`"],
          ["`size(p)`", "taille en octets (`long`)", "`NoSuchFileException`"],
          ["`mismatch(a, b)`", "position (`long`) du premier octet différent, **`-1`** si contenus identiques", "`NoSuchFileException`"]
        ] } },
        { h: "Options de copie et de déplacement" },
        { list: [
          "`StandardCopyOption.REPLACE_EXISTING` : écrase la cible si elle existe (un dossier cible doit être vide).",
          "`StandardCopyOption.COPY_ATTRIBUTES` : copie aussi les métadonnées (dates…). Valable pour `copy` seulement.",
          "`StandardCopyOption.ATOMIC_MOVE` : déplacement atomique, valable pour `move` seulement ; `AtomicMoveNotSupportedException` si le système ne le permet pas.",
          "`LinkOption.NOFOLLOW_LINKS` : copie le lien symbolique lui-même plutôt que sa cible.",
          "Surcharges avec flux : `Files.copy(InputStream, Path, CopyOption...)` et `Files.copy(Path, OutputStream)` renvoient le nombre d'octets copiés."
        ] },
        { code: String.raw`Files.copy(Path.of("/src"), Path.of("/dst"));          // /dst créé, mais VIDE
Files.copy(a, b);                                       // échoue si b existe
Files.copy(a, b, StandardCopyOption.REPLACE_EXISTING);  // écrase b
Files.move(a, c, StandardCopyOption.ATOMIC_MOVE);       // a n'existe plus` },
        { trap: "`Files.copy` sur un dossier est une copie **superficielle** : le dossier cible est créé sans son contenu. Pour une copie récursive, il faut parcourir l'arborescence avec `Files.walk`." },
        { trap: "La cible de `copy` et `move` est le **chemin complet du nouveau fichier**, pas le dossier de destination : `Files.copy(Path.of(\"a.txt\"), Path.of(\"/backup\"))` tente de créer un fichier nommé `/backup`." },
        { trap: "`deleteIfExists` ne protège que de l'absence du fichier : sur un dossier non vide, il lève quand même `DirectoryNotEmptyException`. `Files.delete` ne renvoie rien (`void`), contrairement à `File.delete()` qui renvoie un `boolean`." },
        { tip: "`mismatch` : `\"hello\"` contre `\"help\"` donne `3` (index du premier octet différent). Si l'un des fichiers est le préfixe de l'autre, le résultat est la taille du plus petit." }
      ]
    },
    {
      title: "Files : lire, écrire, attributs et parcours",
      blocks: [
        { table: { head: ["Méthode", "Type de retour", "À savoir"], rows: [
          ["`readString(p)`", "`String`", "tout le fichier, UTF-8 par défaut"],
          ["`readAllLines(p)`", "`List<String>`", "tout est chargé en mémoire"],
          ["`lines(p)`", "`Stream<String>`", "**paresseux**, garde le fichier ouvert : à fermer"],
          ["`readAllBytes(p)`", "`byte[]`", "contenu binaire"],
          ["`writeString(p, text, options...)`", "`Path`", "écrase par défaut"],
          ["`write(p, bytes, options...)` / `write(p, lines, options...)`", "`Path`", "octets ou `Iterable` de lignes"],
          ["`newBufferedReader(p)`", "`BufferedReader`", "UTF-8 par défaut"],
          ["`newBufferedWriter(p, options...)`", "`BufferedWriter`", "écrase par défaut"]
        ] } },
        { code: String.raw`List<String> all = Files.readAllLines(path);       // List
try (Stream<String> s = Files.lines(path)) {       // Stream à fermer
    s.filter(l -> !l.isBlank()).forEach(System.out::println);
}
// Files.lines(path).forEach(...) compile mais laisse le fichier ouvert
// Files.readAllLines(path).filter(...)   DOES NOT COMPILE : List n'a pas filter
// for (String l : Files.lines(path))     DOES NOT COMPILE : Stream non Iterable` },
        { h: "StandardOpenOption" },
        { table: { head: ["Option", "Effet"], rows: [
          ["`READ` / `WRITE`", "ouvre en lecture / en écriture"],
          ["`APPEND`", "écrit à la fin ; le fichier doit exister (sauf si `CREATE` est ajouté)"],
          ["`CREATE`", "crée le fichier s'il n'existe pas, sinon l'ouvre"],
          ["`CREATE_NEW`", "crée le fichier ; **`FileAlreadyExistsException`** s'il existe déjà"],
          ["`TRUNCATE_EXISTING`", "vide le fichier existant à l'ouverture"],
          ["`DELETE_ON_CLOSE`", "supprime le fichier à la fermeture"]
        ] } },
        { trap: "Sans option, `writeString`, `write` et `newBufferedWriter` utilisent `CREATE`, `TRUNCATE_EXISTING`, `WRITE` : le contenu précédent est **écrasé**. Dès qu'on passe une option, ces valeurs par défaut disparaissent : avec `APPEND` seul sur un fichier inexistant, on obtient `NoSuchFileException`." },
        { h: "Attributs" },
        { code: String.raw`BasicFileAttributes attrs =
        Files.readAttributes(path, BasicFileAttributes.class);
attrs.isDirectory();      attrs.isRegularFile();   attrs.isSymbolicLink();
attrs.size();             attrs.creationTime();    attrs.lastModifiedTime();` },
        { list: [
          "`Files.readAttributes` lit tous les attributs en **un seul accès** disque et déclare `IOException` : plus efficace que plusieurs appels `Files.isDirectory`, `Files.size`…",
          "`BasicFileAttributes` est en lecture seule ; pour modifier les dates on passe par `Files.getFileAttributeView(path, BasicFileAttributeView.class).setTimes(...)`.",
          "`Files.getLastModifiedTime(p)` renvoie un `FileTime`."
        ] },
        { h: "Parcourir une arborescence" },
        { table: { head: ["Méthode", "Parcours", "Détails"], rows: [
          ["`Files.list(dir)`", "un seul niveau", "enfants directs, sans `dir` lui-même ; `NotDirectoryException` si ce n'est pas un dossier"],
          ["`Files.walk(start)`", "récursif, **en profondeur d'abord**", "inclut `start` ; profondeur par défaut `Integer.MAX_VALUE`"],
          ["`Files.walk(start, maxDepth)`", "limité", "`0` : seulement `start` ; `1` : `start` et ses enfants directs"],
          ["`Files.find(start, maxDepth, (path, attrs) -> ...)`", "récursif filtré", "`maxDepth` **obligatoire** ; `BiPredicate<Path, BasicFileAttributes>`"]
        ] } },
        { list: [
          "Les trois renvoient un `Stream<Path>` **paresseux** qui détient des ressources : à déclarer dans un try-with-resources.",
          "Par défaut, `walk` et `find` **ne suivent pas** les liens symboliques. Avec `FileVisitOption.FOLLOW_LINKS`, un lien formant un cycle provoque une `FileSystemLoopException`.",
          "Le parcours est paresseux : les entrées sont lues au fur et à mesure de la consommation du flux. Le point de départ, lui, est ouvert **dès l'appel** : `Files.list`, `Files.walk` et `Files.find` lèvent immédiatement `NoSuchFileException` s'il n'existe pas."
        ] },
        { trap: "`Files.walk(root).count()` compte aussi `root` et tous les dossiers intermédiaires, pas seulement les fichiers. `Files.list(root).count()` ne compte que les enfants directs." }
      ]
    },
    {
      title: "IOException et try-with-resources",
      blocks: [
        { list: [
          "`IOException` est une exception **contrôlée** : elle doit être attrapée ou déclarée. Sous-classes à connaître : `FileNotFoundException`, `EOFException`, `NotSerializableException`, `InvalidClassException` (java.io), `NoSuchFileException`, `FileAlreadyExistsException`, `DirectoryNotEmptyException`, `NotDirectoryException` (java.nio.file).",
          "Les constructeurs `FileInputStream`, `FileReader`, `FileOutputStream`, `FileWriter`, `PrintWriter(String)` déclarent déjà une exception contrôlée (`FileNotFoundException` ou `IOException`).",
          "L'ancienne API signale un fichier absent par `java.io.FileNotFoundException`, NIO.2 par `java.nio.file.NoSuchFileException`."
        ] },
        { code: String.raw`try (var in = new BufferedReader(new FileReader("in.txt"));
     var out = new BufferedWriter(new FileWriter("out.txt"))) {
    String line;
    while ((line = in.readLine()) != null) {
        out.write(line);
        out.newLine();
    }
} catch (IOException e) {
    System.err.println(e.getMessage());
}   // out est fermé en premier, puis in (ordre inverse de déclaration)` },
        { list: [
          "Le `close()` implicite fait partie du bloc : si `close()` déclare `IOException`, il faut la gérer **même si le corps du try est vide**.",
          "Les ressources sont fermées dans l'ordre inverse de leur déclaration, **avant** l'exécution des blocs `catch` et `finally`.",
          "Une exception levée par `close()` alors que le corps a déjà échoué devient une exception **supprimée** (`getSuppressed()`).",
          "Un `catch (FileNotFoundException e)` seul ne suffit pas pour un flux fichier : `read`, `write` et `close` lèvent `IOException`, plus générale."
        ] },
        { trap: "`StringWriter`, `ByteArrayInputStream` ou `BufferedReader` ont un `close()` déclarant `IOException` : dans un try-with-resources, il faut la gérer même si rien ne peut réellement échouer. `PrintWriter`, `PrintStream` et `Scanner` redéfinissent `close()` **sans** exception contrôlée." },
        { trap: "Attraper `IOException` dans un `try` dont le corps ne peut en lever aucune est une erreur de compilation (exception contrôlée jamais levée), sauf si une ressource du try-with-resources la déclare dans son `close()`." }
      ]
    }
  ],
  questions: [
    {
      id: "io-001",
      difficulty: 1,
      q: "Which of the following statements compile, assuming they are placed in a method that declares throws IOException? (Choose two.)",
      options: [
        String.raw`var a = new BufferedReader(new FileReader("a.txt"));`,
        String.raw`var b = new BufferedInputStream(new FileReader("a.txt"));`,
        String.raw`var c = new ObjectInputStream(
        new BufferedInputStream(new FileInputStream("a.dat")));`,
        String.raw`var d = new BufferedWriter(new FileOutputStream("a.txt"));`,
        String.raw`var e = new InputStreamReader(new FileReader("a.txt"));`
      ],
      answer: [0, 2],
      explain: "Un flux haut niveau doit envelopper un flux de la même famille. `BufferedReader` attend un `Reader` : `FileReader` convient. `ObjectInputStream` attend un `InputStream`, et `BufferedInputStream` enveloppant un `FileInputStream` en est un. Les trois autres mélangent octets et caractères : `BufferedInputStream` ne peut pas recevoir un `FileReader`, `BufferedWriter` ne peut pas recevoir un `FileOutputStream`, et `InputStreamReader` (le pont octets vers caractères) attend un `InputStream`, pas un `Reader`. Dans les trois cas : erreur de compilation `incompatible types`."
    },
    {
      id: "io-002",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`var in = new ByteArrayInputStream("ABCDEF".getBytes());
System.out.print((char) in.read());
if (in.markSupported()) {
    in.mark(10);
    in.read();
    in.read();
    in.reset();
}
in.skip(2);
System.out.print((char) in.read());
in.skip(5);
System.out.print(in.read());`,
      options: ["AD-1", "AF-1", "AB-1", "AD0", "ADF", "An IOException is thrown at runtime"],
      answer: [0],
      explain: "Le premier `read()` consomme `A`. `ByteArrayInputStream` supporte `mark` : la marque est posée après `A`, deux octets (`B`, `C`) sont lus, puis `reset()` revient juste après `A`. `skip(2)` saute alors `B` et `C`, et `read()` renvoie `D`. Il ne reste que `E` et `F` : `skip(5)` n'en saute que deux (il renvoie le nombre réellement sauté, sans exception), et le dernier `read()` renvoie `-1`, valeur de fin de flux, affichée telle quelle car elle n'est pas castée en `char`. Résultat : `AD-1`. `AF-1` oublie l'effet de `reset()`, `AB-1` oublie le `skip(2)`."
    },
    {
      id: "io-003",
      difficulty: 2,
      q: "What is the output of the following code, placed in a method declaring throws IOException?",
      code: String.raw`var in = new ByteArrayInputStream("ABCDE".getBytes());
var out = new ByteArrayOutputStream();
byte[] buf = new byte[2];
while (in.read(buf) != -1) {
    out.write(buf);
}
System.out.print(out);`,
      options: ["ABCDE", "ABCDED", "ABCDEE", "ABCD", "ABCDE followed by a space", "An ArrayIndexOutOfBoundsException is thrown at runtime"],
      answer: [1],
      explain: "`read(byte[])` renvoie le nombre d'octets lus et ne vide pas le tableau. Tours 1 et 2 : `AB` puis `CD` sont lus et écrits. Tour 3 : un seul octet (`E`) est lu et placé en `buf[0]` ; `buf[1]` contient toujours le `D` du tour précédent. Comme `out.write(buf)` écrit tout le tableau, `ED` est écrit : résultat `ABCDED`. Le code correct mémorise le retour (`n = in.read(buf)`) et appelle `out.write(buf, 0, n)`, ce qui donnerait `ABCDE`."
    },
    {
      id: "io-004",
      difficulty: 2,
      q: "What is the output of the following code, placed in a method declaring throws IOException?",
      code: String.raw`try (var r = new BufferedReader(new StringReader("one\n\ntwo\n"))) {
    int count = 0;
    String line;
    while ((line = r.readLine()) != null) {
        if (line.isEmpty()) continue;
        count++;
    }
    System.out.print(count + " " + r.readLine() + " " + r.read());
}`,
      options: ["2 null -1", "3 null -1", "2 null 0", "2  -1", "The loop never ends", "An EOFException is thrown at runtime"],
      answer: [0],
      explain: "`readLine()` renvoie chaque ligne sans son terminateur : `one`, puis une chaîne vide (ligne vide, à ne pas confondre avec la fin), puis `two`. Le `\\n` final ne crée pas de quatrième ligne. La ligne vide est ignorée par `continue`, donc `count` vaut 2. En fin de flux, `readLine()` renvoie `null` (la boucle se termine, et les appels suivants renvoient encore `null`) tandis que `read()` renvoie `-1`. Aucune exception n'est levée en fin de flux : `EOFException` concerne les flux de données et d'objets."
    },
    {
      id: "io-005",
      difficulty: 2,
      q: "What is the output of the following code, placed in a method declaring throws IOException?",
      code: String.raw`var in = new ByteArrayInputStream(new byte[] {1, 2, 3, 4, 5});
in.read();
var out = new ByteArrayOutputStream();
long n = in.transferTo(out);
System.out.print(n + " " + in.readAllBytes().length + " " + in.read());`,
      options: ["4 0 -1", "5 0 -1", "4 4 -1", "5 5 -1", "4 0 0", "A NullPointerException is thrown at runtime"],
      answer: [0],
      explain: "Le premier `read()` consomme un octet. `transferTo(out)` copie tout ce qui **reste** (4 octets) et renvoie ce nombre ; il ne repart pas du début du flux. Le flux est alors épuisé : `readAllBytes()` renvoie un tableau vide (longueur 0, jamais `null`) et `read()` renvoie `-1`. D'où `4 0 -1`."
    },
    {
      id: "io-006",
      difficulty: 3,
      q: "Each option is the complete body of a method declared as public static void main(String[] args), without a throws clause. Which bodies compile? (Choose two.)",
      options: [
        String.raw`try (var w = new PrintWriter(System.out)) {
    w.println("x");
}`,
        String.raw`try (var w = new StringWriter()) {
    w.write("x");
}`,
        String.raw`try (var s = new Scanner(System.in)) {
    System.out.println(s.nextLine());
}`,
        String.raw`try (var r = new BufferedReader(new InputStreamReader(System.in))) {
    System.out.println(r.readLine());
}`,
        String.raw`try (var w = new PrintWriter("out.txt")) {
    w.println("x");
}`
      ],
      answer: [0, 2],
      explain: "Dans un try-with-resources, le `close()` implicite compte : s'il déclare une exception contrôlée, elle doit être gérée. `PrintWriter` et `Scanner` redéfinissent `close()` sans exception contrôlée, et `println`/`nextLine` n'en lèvent pas : ces deux corps compilent. `StringWriter.write(String)` ne lève rien, mais `StringWriter.close()` déclare `IOException` : erreur `unreported exception IOException`. Avec `BufferedReader`, `readLine()` et `close()` déclarent tous deux `IOException`. Enfin le constructeur `PrintWriter(String fileName)` déclare `FileNotFoundException`, exception contrôlée non gérée."
    },
    {
      id: "io-007",
      difficulty: 1,
      q: "Which statements are true about the following code? (Choose two.)",
      code: String.raw`Console c = System.console();                 // n1
String name = c.readLine("Name: ");           // n2
char[] pwd = c.readPassword("Password: ");    // n3
c.printf("Hello %s%n", name);                 // n4`,
      options: [
        "Line n2 may throw a NullPointerException at runtime",
        "Changing the type of pwd to String makes line n3 fail to compile",
        "Line n1 throws an IOException when no console is available",
        "The code compiles only if it is enclosed in a try block that catches IOException",
        "Line n4 does not compile because Console declares format but not printf"
      ],
      answer: [0, 1],
      explain: "`System.console()` ne lève jamais d'exception : il renvoie `null` quand la JVM n'a pas de console interactive (entrées/sorties redirigées, par exemple), et c'est l'appel `c.readLine(...)` qui provoque alors une `NullPointerException`. `readPassword` renvoie un `char[]` (pour pouvoir effacer le mot de passe de la mémoire) : l'affecter à un `String` donne `incompatible types`. Les méthodes de `Console` ne déclarent aucune exception contrôlée, donc aucun `try` n'est requis. `Console` propose à la fois `printf` et `format`, équivalentes."
    },
    {
      id: "io-008",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`public static void main(String[] args) {
    try (var out = System.out) {
        out.print("A");
    }
    System.out.print("B");
}`,
      options: [
        "A",
        "AB",
        "A is printed, then an IOException is thrown",
        "A is printed, then an IllegalStateException is thrown",
        "The code does not compile"
      ],
      answer: [0],
      explain: "`System.out` est un `PrintStream`, donc `AutoCloseable`, et `PrintStream.close()` ne déclare aucune exception contrôlée : le code compile sans `catch`. À la sortie du bloc, la sortie standard est **fermée**. Le `System.out.print(\"B\")` suivant ne lève aucune exception : `PrintStream` avale les erreurs d'écriture (consultables via `checkError()`), et `B` n'est simplement jamais affiché. Seul `A` apparaît."
    },
    {
      id: "io-009",
      difficulty: 2,
      q: "Given the following class and code fragment, and assuming serialization and deserialization succeed, what is the output?",
      code: String.raw`class Pet implements Serializable {
    private static final long serialVersionUID = 1L;
    static int count = 1;
    transient String nick = "none";
    String name;
    int age = 5;
    Pet(String name) { this.name = name; count++; }
}

// in a method declaring throws Exception:
Pet p = new Pet("Tom");
p.nick = "T";
p.age = 9;
var bos = new ByteArrayOutputStream();
try (var out = new ObjectOutputStream(bos)) {
    out.writeObject(p);
}
Pet.count = 10;
try (var in = new ObjectInputStream(
        new ByteArrayInputStream(bos.toByteArray()))) {
    Pet q = (Pet) in.readObject();
    System.out.print(q.name + " " + q.nick + " " + q.age + " " + Pet.count);
}`,
      options: ["Tom null 9 10", "Tom none 9 10", "Tom T 9 2", "Tom null 5 10", "Tom null 9 2", "Tom null 9 11"],
      answer: [0],
      explain: "`name` et `age` sont des champs d'instance ordinaires : leurs valeurs au moment de l'écriture (`Tom`, `9`) sont restaurées. `nick` est `transient` : il n'est pas écrit et vaut `null` après lecture, pas `none`, car ni les initialisations à la déclaration ni le constructeur de la classe sérialisable ne sont exécutés à la désérialisation (c'est aussi pourquoi `age` ne revient pas à 5 et `count` n'est pas incrémenté à 11). `count` est `static` : il n'est pas sérialisé et conserve sa valeur courante dans la JVM, soit 10."
    },
    {
      id: "io-010",
      difficulty: 3,
      q: "Given the following classes and code fragment, what is the output?",
      code: String.raw`class Animal {
    int legs = 2;
    Animal() { legs = 4; System.out.print("A"); }
}
class Dog extends Animal implements Serializable {
    String name = "Rex";
    { System.out.print("I"); }
    Dog() { System.out.print("D"); legs = 3; name = "Max"; }
}

// in a method declaring throws Exception:
Dog d = new Dog();
d.legs = 1;
d.name = "Bo";
System.out.print("-");
var bos = new ByteArrayOutputStream();
try (var out = new ObjectOutputStream(bos)) {
    out.writeObject(d);
}
try (var in = new ObjectInputStream(
        new ByteArrayInputStream(bos.toByteArray()))) {
    Dog e = (Dog) in.readObject();
    System.out.print("-" + e.legs + e.name);
}`,
      options: [
        "AID-A-4Bo",
        "AID-AID-3Max",
        "AID--1Bo",
        "AID-A-1Bo",
        "AID-A-4Rex",
        "AID- followed by a NotSerializableException"
      ],
      answer: [0],
      explain: "`new Dog()` affiche `AID` : constructeur d'`Animal`, puis initialiseur d'instance de `Dog`, puis corps du constructeur de `Dog`. La sérialisation réussit : seule `Dog` doit être `Serializable`, mais les champs hérités d'`Animal` (non sérialisable) ne sont **pas** écrits. À la désérialisation, le constructeur et les initialiseurs de `Dog` ne sont pas exécutés ; en revanche le constructeur sans argument de la première superclasse non sérialisable, `Animal`, l'est : il affiche `A` et fixe `legs` à 4 (la valeur 1 est perdue). `name`, champ de la classe sérialisable, est restauré depuis le flux : `Bo`. D'où `AID-A-4Bo`."
    },
    {
      id: "io-011",
      difficulty: 1,
      q: "Given the following classes and code fragment, what is the result?",
      code: String.raw`class Customer {
    String name = "Ann";
}
class Order implements Serializable {
    int id = 7;
    Customer customer = new Customer();
}

// in a method declaring throws IOException:
var bos = new ByteArrayOutputStream();
try (var out = new ObjectOutputStream(bos)) {
    out.writeObject(new Order());
    System.out.print("saved");
}`,
      options: [
        "A java.io.NotSerializableException is thrown at runtime",
        "saved",
        "The code does not compile because Customer does not implement Serializable",
        "saved is printed and the customer field is written as null",
        "A java.io.InvalidClassException is thrown at runtime"
      ],
      answer: [0],
      explain: "Le compilateur ne vérifie pas que les champs d'une classe `Serializable` sont eux-mêmes sérialisables : le code compile. À l'exécution, `writeObject` parcourt le graphe d'objets, rencontre une instance de `Customer`, qui n'implémente pas `Serializable`, et lève `NotSerializableException` avant l'affichage de `saved`. Le champ n'est pas remplacé silencieusement par `null`. Pour corriger : rendre `Customer` sérialisable ou déclarer le champ `transient`. `InvalidClassException` concerne la désérialisation (par exemple un `serialVersionUID` incompatible)."
    },
    {
      id: "io-012",
      difficulty: 3,
      q: "Given the following record and code fragment, what is the output?",
      code: String.raw`record Point(int x, int y) implements Serializable {
    Point {
        System.out.print("C");
        if (x < 0) throw new IllegalArgumentException();
    }
}

// in a method declaring throws Exception:
Point p = new Point(1, 2);
var bos = new ByteArrayOutputStream();
try (var out = new ObjectOutputStream(bos)) {
    out.writeObject(p);
}
try (var in = new ObjectInputStream(
        new ByteArrayInputStream(bos.toByteArray()))) {
    Point q = (Point) in.readObject();
    System.out.print(" " + p.equals(q) + " " + (p == q));
}`,
      options: ["CC true false", "C true false", "CC true true", "C false false", "CC false false", "C true true"],
      answer: [0],
      explain: "Contrairement à une classe ordinaire, un record est désérialisé en appelant son **constructeur canonique** avec les valeurs lues dans le flux : le constructeur compact s'exécute donc une seconde fois et `C` est affiché deux fois (les validations sont rejouées). L'objet lu est une nouvelle instance : `==` renvoie `false`, mais l'`equals` généré pour un record compare les composants, donc `true`. Résultat : `CC true false`. La réponse `C true false` applique à tort la règle des classes (constructeur non exécuté)."
    },
    {
      id: "io-013",
      difficulty: 2,
      q: "The variable data holds the bytes produced by an ObjectOutputStream to which the strings \"a\" and \"b\" were written, in this order, with writeObject. What is the output of the following code, placed in a method declaring throws Exception?",
      code: String.raw`try (var in = new ObjectInputStream(new ByteArrayInputStream(data))) {
    while (true) {
        Object o = in.readObject();
        System.out.print(o);
    }
} catch (EOFException e) {
    System.out.print("E");
}`,
      options: [
        "abE",
        "ab and the program then never terminates",
        "abnullE",
        "ab followed by null printed endlessly",
        "ab followed by a ClassNotFoundException",
        "The code does not compile"
      ],
      answer: [0],
      explain: "`readObject()` renvoie successivement `a` puis `b`. Au troisième appel il n'y a plus rien à lire : la méthode ne renvoie pas `null` (elle ne renvoie `null` que si `null` a été écrit) mais lève une `EOFException`, sous-classe d'`IOException`, qui fait sortir de la boucle infinie et est attrapée : `E` est affiché. Le code compile : `ClassNotFoundException` et les autres `IOException` sont couvertes par le `throws Exception` de la méthode."
    },
    {
      id: "io-014",
      difficulty: 2,
      q: "Assume a Unix-like file system. What is the output of the following code?",
      code: String.raw`Path p = Path.of("/home/user/docs/report.txt");
System.out.print(p.getNameCount() + " " + p.getName(0) + " " + p.subpath(1, 3));`,
      options: [
        "4 home user/docs",
        "5 / home/user",
        "4 home user/docs/report.txt",
        "5 home user/docs",
        "4 /home user/docs",
        "4 home /user/docs"
      ],
      answer: [0],
      explain: "La racine `/` n'est pas un élément de nom : `getNameCount()` compte `home`, `user`, `docs`, `report.txt`, soit 4. `getName(0)` renvoie le premier élément après la racine, `home`, sous forme de chemin relatif (jamais `/` ni `/home`). `subpath(1, 3)` prend les index 1 inclus à 3 **exclu** : `user/docs`, toujours relatif donc sans `/` initial. Inclure la borne de fin donnerait à tort `user/docs/report.txt`."
    },
    {
      id: "io-015",
      difficulty: 2,
      q: "Assume a Unix-like file system. What is the output of the following code?",
      code: String.raw`Path base = Path.of("/data/in");
System.out.println(base.resolve(Path.of("/tmp/x.txt")));
System.out.println(base.resolve("out/y.txt"));
System.out.println(base.resolveSibling("z"));`,
      options: [
        String.raw`/tmp/x.txt
/data/in/out/y.txt
/data/z`,
        String.raw`/data/in/tmp/x.txt
/data/in/out/y.txt
/data/z`,
        String.raw`/tmp/x.txt
/data/in/out/y.txt
/data/in/z`,
        String.raw`/data/in/tmp/x.txt
/data/in/out/y.txt
/data/in/z`,
        String.raw`/tmp/x.txt
/data/out/y.txt
/data/z`
      ],
      answer: [0],
      explain: "`resolve` avec un argument **absolu** renvoie simplement cet argument : `/tmp/x.txt` (il n'est pas concaténé à `/data/in`). Avec un argument relatif, il est ajouté à la suite : `/data/in/out/y.txt`. `resolveSibling` résout l'argument par rapport au **parent** du chemin (`/data`), ce qui remplace le dernier élément : `/data/z`, et non `/data/in/z`."
    },
    {
      id: "io-016",
      difficulty: 2,
      q: "Assume a Unix-like file system and that none of the paths exist. What is the output of the following code?",
      code: String.raw`Path p1 = Path.of("docs/java/io");
Path p2 = Path.of("docs/notes.txt");
Path r = p1.relativize(p2);
System.out.println(r);
System.out.println(p1.resolve(r).normalize());`,
      options: [
        String.raw`../../notes.txt
docs/notes.txt`,
        String.raw`../notes.txt
docs/java/notes.txt`,
        String.raw`../../notes.txt
docs/java/io/../../notes.txt`,
        String.raw`../java/io
docs/notes.txt`,
        "An IllegalArgumentException is thrown at runtime",
        "A NoSuchFileException is thrown at runtime"
      ],
      answer: [0],
      explain: "`p1.relativize(p2)` donne le chemin pour aller **de p1 vers p2**. Les deux chemins partagent `docs` ; depuis `docs/java/io` il faut remonter de deux niveaux (`io`, puis `java`) avant de descendre vers `notes.txt` : `../../notes.txt`. `p1.resolve(r)` vaut `docs/java/io/../../notes.txt` (resolve ne simplifie pas), et `normalize()` annule chaque couple `nom/..` : `docs/notes.txt`. Les deux chemins étant relatifs, aucune `IllegalArgumentException` ; ces méthodes sont purement syntaxiques, donc l'inexistence des fichiers n'a aucune importance. `../java/io` serait le résultat de `p2.relativize(p1)`."
    },
    {
      id: "io-017",
      difficulty: 3,
      q: "Assume a Unix-like file system on which the directory zz does not exist, neither in the current directory nor at the root. Which lines throw an exception at runtime when executed independently of each other? (Choose two.)",
      code: String.raw`// in a method declaring throws IOException:
Path a = Path.of("zz/b").toAbsolutePath();          // n1
Path b = Path.of("zz/b").toRealPath();              // n2
Path c = Path.of("/zz").relativize(Path.of("b"));   // n3
Path d = Path.of("zz/../../b").normalize();         // n4
Path e = Path.of("zz").getParent();                 // n5`,
      options: ["n1", "n2", "n3", "n4", "n5"],
      answer: [1, 2],
      explain: "`toRealPath()` (n2) est la seule de ces méthodes qui interroge le système de fichiers : le fichier n'existant pas, elle lève `NoSuchFileException`. `relativize` (n3) exige deux chemins de même nature ; ici l'un est absolu et l'autre relatif : `IllegalArgumentException`. Les autres lignes sont purement syntaxiques : `toAbsolutePath()` (n1) préfixe le répertoire courant sans rien vérifier ; `normalize()` (n4) renvoie `../b` en conservant le `..` qu'il ne peut pas annuler ; `getParent()` (n5) renvoie simplement `null` pour un chemin à un seul élément, sans exception puisque le résultat n'est pas déréférencé."
    },
    {
      id: "io-018",
      difficulty: 3,
      q: "Assume that the current directory does not contain any file or directory named data. What is the result of executing the following code, placed in a method declaring throws IOException?",
      code: String.raw`Path p1 = Path.of("data/./f.txt");
Path p2 = Path.of("data", "f.txt");
System.out.print(p1.equals(p2));
System.out.print(p1.normalize().equals(p2));
System.out.print(Files.isSameFile(p1, p2));`,
      options: [
        "falsetrue is printed, then a NoSuchFileException is thrown",
        "falsetruetrue",
        "falsetruefalse",
        "truetrue is printed, then a NoSuchFileException is thrown",
        "truetruetrue",
        "falsefalsefalse"
      ],
      answer: [0],
      explain: "`Path.equals` compare les chemins tels quels, sans normalisation : `data/./f.txt` et `data/f.txt` sont différents (`false`). Après `normalize()`, le `.` disparaît et les chemins sont égaux (`true`) ; `Path.of(\"data\", \"f.txt\")` construit bien `data/f.txt`. `Files.isSameFile` ne renvoie `true` sans toucher au disque que si les deux `Path` sont égaux au sens de `equals` ; ce n'est pas le cas ici, il doit donc localiser les fichiers, qui n'existent pas : `NoSuchFileException`. Il ne renvoie pas `false` pour un fichier absent."
    },
    {
      id: "io-019",
      difficulty: 1,
      q: "Which of the following statements compile and create a Path? (Choose three.)",
      options: [
        String.raw`Path p = Paths.get("a/b.txt");`,
        String.raw`Path p = new File("a/b.txt").toPath();`,
        String.raw`Path p = FileSystems.getDefault().getPath("a", "b.txt");`,
        String.raw`Path p = new Path("a/b.txt");`,
        String.raw`Path p = Path.get("a/b.txt");`,
        String.raw`Path p = Files.path("a/b.txt");`,
        String.raw`Path p = new File("a/b.txt").getPath();`
      ],
      answer: [0, 1, 2],
      explain: "Les fabriques valides sont `Path.of(...)`, `Paths.get(...)` (classe utilitaire `Paths`, avec un s), `FileSystems.getDefault().getPath(...)` et la conversion `File.toPath()`. `Path` est une interface : `new Path(...)` ne compile pas. `Path.get` n'existe pas (confusion avec `Paths.get`), pas plus que `Files.path`. Enfin `File.getPath()` existe mais renvoie un `String`, non un `Path` : `incompatible types`."
    },
    {
      id: "io-020",
      difficulty: 2,
      q: "Assume a Unix-like file system where /tmp/app is an existing, empty directory and the program has all required permissions. What is the result of executing the following code, placed in a method declaring throws IOException?",
      code: String.raw`Path base = Path.of("/tmp/app");
Files.createDirectories(base);                    // n1
Files.createDirectory(base.resolve("a/b"));       // n2
Files.createDirectories(base.resolve("a/b"));     // n3
Files.createDirectory(base);                      // n4`,
      options: [
        "Line n1 throws a FileAlreadyExistsException",
        "Line n2 throws a NoSuchFileException",
        "Line n2 throws a FileAlreadyExistsException",
        "Line n4 throws a FileAlreadyExistsException and the directory /tmp/app/a/b has been created",
        "The code completes normally and the directory /tmp/app/a/b has been created"
      ],
      answer: [1],
      explain: "`createDirectories` (n1) ne lève rien si le dossier existe déjà. `createDirectory` (n2) ne crée qu'**un seul** niveau : le parent `/tmp/app/a` n'existe pas, d'où `NoSuchFileException`, et l'exécution s'arrête là. Si n2 était absente, n3 créerait `a` puis `b` sans problème, et n4 lèverait `FileAlreadyExistsException` car `createDirectory`, contrairement à `createDirectories`, refuse un dossier existant."
    },
    {
      id: "io-021",
      difficulty: 2,
      q: "Assume a Unix-like file system where the directory /src contains the single file a.txt, /dst does not exist and the program has all required permissions. What is the result of executing the following code, placed in a method declaring throws IOException?",
      code: String.raw`Path src = Path.of("/src");
Path dst = Path.of("/dst");
Files.copy(src, dst);
try (Stream<Path> s = Files.list(dst)) {
    System.out.print(s.count() + " ");
}
System.out.print(Files.deleteIfExists(dst.resolve("a.txt")) + " ");
Files.delete(dst);
Files.delete(src);
System.out.print("done");`,
      options: [
        "0 false is printed, then a DirectoryNotEmptyException is thrown",
        "1 true is printed, then a DirectoryNotEmptyException is thrown",
        "0 false done",
        "1 true done",
        "0 is printed, then a NoSuchFileException is thrown",
        "A DirectoryNotEmptyException is thrown before anything is printed"
      ],
      answer: [0],
      explain: "`Files.copy` sur un dossier est une copie superficielle : `/dst` est créé **vide**, `a.txt` n'est pas copié, donc `Files.list(dst)` compte 0 élément. `deleteIfExists` sur `/dst/a.txt`, inexistant, renvoie `false` sans exception (là où `delete` lèverait `NoSuchFileException`). `Files.delete(dst)` réussit car le dossier est vide. `Files.delete(src)` échoue avec `DirectoryNotEmptyException` : `/src` contient toujours `a.txt`, et `done` n'est jamais affiché."
    },
    {
      id: "io-022",
      difficulty: 2,
      q: "Assume that the directory referenced by dir exists and does not contain log.txt. What is the result of executing the following code, placed in a method declaring throws IOException?",
      code: String.raw`Path p = dir.resolve("log.txt");
Files.writeString(p, "ab");
Files.writeString(p, "cd", StandardOpenOption.APPEND);
Files.writeString(p, "e");
System.out.print(Files.readString(p) + Files.size(p));
Files.writeString(p, "f", StandardOpenOption.CREATE_NEW);`,
      options: [
        "e1 is printed, then a FileAlreadyExistsException is thrown",
        "abcde5 is printed, then a FileAlreadyExistsException is thrown",
        "e1 is printed and the file finally contains f",
        "abcde5 is printed and the file finally contains abcdef",
        "e1 is printed and the file finally contains ef",
        "A NoSuchFileException is thrown by the first call to writeString"
      ],
      answer: [0],
      explain: "Sans option, `writeString` utilise `CREATE`, `TRUNCATE_EXISTING`, `WRITE` : le premier appel crée le fichier (`ab`), le deuxième ajoute `cd` grâce à `APPEND` (`abcd`), mais le troisième, de nouveau sans option, **écrase** tout : le fichier contient `e`, taille 1 octet, d'où `e1`. `CREATE_NEW` exige que le fichier n'existe pas : comme il existe, `FileAlreadyExistsException` est levée et le contenu reste `e`."
    },
    {
      id: "io-023",
      difficulty: 1,
      q: "Given that p is a Path referencing an existing text file, which lines fail to compile? (Choose two.)",
      code: String.raw`// in a method declaring throws IOException:
List<String> a = Files.readAllLines(p);       // n1
Stream<String> b = Files.lines(p);            // n2
List<String> c = Files.lines(p);              // n3
String d = Files.readString(p);               // n4
Stream<String> e = Files.readAllLines(p);     // n5`,
      options: ["n1", "n2", "n3", "n4", "n5"],
      answer: [2, 4],
      explain: "`Files.readAllLines` charge tout le fichier et renvoie une `List<String>` (n1 correct, n5 incorrect : une `List` n'est pas un `Stream`). `Files.lines` renvoie un `Stream<String>` paresseux, à fermer avec un try-with-resources (n2 correct, n3 incorrect : `incompatible types`). `Files.readString` renvoie tout le contenu dans un seul `String` (n4 correct)."
    },
    {
      id: "io-024",
      difficulty: 3,
      q: "Assume a Unix-like file system that contains exactly the following files below the directory /root and no symbolic links: /root/a.txt, /root/sub/b.txt and /root/sub/deep/c.txt. What is the output of the following code, placed in a method declaring throws IOException?",
      code: String.raw`Path root = Path.of("/root");
try (var s = Files.walk(root)) {
    System.out.print(s.count() + " ");
}
try (var s = Files.walk(root, 1)) {
    System.out.print(s.count() + " ");
}
try (var s = Files.find(root, 2, (p, attrs) -> attrs.isRegularFile())) {
    System.out.print(s.count());
}`,
      options: ["6 3 2", "5 2 2", "3 1 2", "6 3 3", "6 2 2", "5 3 3"],
      answer: [0],
      explain: "`Files.walk(root)` parcourt toute l'arborescence et inclut le point de départ ainsi que les dossiers : `/root`, `a.txt`, `sub`, `b.txt`, `deep`, `c.txt`, soit 6. Avec `maxDepth` 1 : le départ (profondeur 0) et ses enfants directs `a.txt` et `sub`, soit 3. `Files.find` avec une profondeur de 2 visite jusqu'à `/root/sub/b.txt` et `/root/sub/deep`, mais pas `c.txt` (profondeur 3) ; le prédicat ne retient que les fichiers ordinaires : `a.txt` et `b.txt`, soit 2. `5 2 2` oublie que le point de départ est compté ; `6 3 3` oublie la limite de profondeur de `find`."
    },
    {
      id: "io-025",
      difficulty: 2,
      q: "Assume that x and y are Path objects referencing two files that do not exist yet in an existing, writable directory. What is the output of the following code, placed in a method declaring throws IOException?",
      code: String.raw`Files.writeString(x, "hello");
Files.writeString(y, "help");
System.out.print(Files.mismatch(x, y) + " ");
Files.move(x, y, StandardCopyOption.REPLACE_EXISTING);
System.out.print(Files.exists(x) + " " + Files.size(y));`,
      options: [
        "3 false 5",
        "4 false 5",
        "3 true 5",
        "3 false 4",
        "-1 false 5",
        "3 is printed, then a FileAlreadyExistsException is thrown"
      ],
      answer: [0],
      explain: "`Files.mismatch` renvoie la position (à partir de 0) du premier octet différent, ou `-1` si les contenus sont identiques : `hello` et `help` ont `hel` en commun et diffèrent à l'index 3. `Files.move` avec `REPLACE_EXISTING` remplace `y` par `x` sans exception (sans cette option, `FileAlreadyExistsException`). Après un déplacement la source n'existe plus : `Files.exists(x)` vaut `false`, et `y` contient désormais `hello`, soit 5 octets."
    }
  ]
});
