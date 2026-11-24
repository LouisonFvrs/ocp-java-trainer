OCP.register({
  topic: 'values',
  course: [
    {
      title: "Primitifs et littéraux",
      blocks: [
        { table: {
          head: ["Type", "Taille", "Valeur par défaut", "Littéral"],
          rows: [
            ["`byte`", "8 bits (-128 à 127)", "`0`", "pas de suffixe"],
            ["`short`", "16 bits", "`0`", "pas de suffixe"],
            ["`int`", "32 bits", "`0`", "`42`, `0x2A`, `0b101010`, `052`"],
            ["`long`", "64 bits", "`0L`", "suffixe `L` (ou `l`)"],
            ["`float`", "32 bits", "`0.0f`", "suffixe `f` ou `F` obligatoire pour un littéral décimal (`float f = 1;` compile)"],
            ["`double`", "64 bits", "`0.0`", "`3.14`, `1e3`, suffixe `d` facultatif"],
            ["`char`", "16 bits non signé (0 à 65535)", "`'\\u0000'`", "`'a'`, `'\\n'`, `97`"],
            ["`boolean`", "non spécifiée", "`false`", "`true`, `false`"]
          ]
        } },
        { list: [
          "Un littéral entier est un `int`, un littéral décimal est un `double` : `float f = 3.14;` et `long l = 3_000_000_000;` ne compilent pas (il faut `3.14f` et `3_000_000_000L`).",
          "Bases : préfixe `0x` (hexadécimal), `0b` (binaire), `0` (octal) : `017` vaut 15, `0x10` vaut 16, `0b10` vaut 2.",
          "Underscore : autorisé uniquement **entre deux chiffres**. Interdit au début, à la fin, à côté du point décimal, juste après `0x`/`0b` ou avant le suffixe `L`/`f` : `1_.5`, `0x_FF`, `100_L`, `_1` (c'est un identifiant) sont invalides. `1__0` et `0_7` sont valides.",
          "Valeurs par défaut : uniquement pour les **champs** (d'instance ou `static`) et les éléments de tableau. Les références (dont `String` et les wrappers) valent `null`.",
          "Une variable **locale** n'a pas de valeur par défaut : la lire avant une affectation certaine est une erreur de compilation."
        ] },
        { trap: "`Integer.parseInt(\"1_000\")` et `Integer.parseInt(\"42L\")` lèvent `NumberFormatException` : les underscores et les suffixes n'existent que dans le code source." },
        { trap: "Un champ `static Integer w;` vaut `null`, pas `0`. Un champ `char` vaut `'\\u0000'` (il s'affiche comme un caractère invisible, pas comme `0`)." }
      ]
    },
    {
      title: "Promotion numérique, casts et dépassement",
      blocks: [
        { h: "Règles de promotion des opérateurs binaires" },
        { list: [
          "`byte`, `short` et `char` sont **toujours** promus en `int` avant une opération arithmétique, même entre eux : `short + short` donne un `int`.",
          "Si un opérande est `double`, le résultat est `double` ; sinon s'il est `float`, `float` ; sinon s'il est `long`, `long` ; sinon `int`.",
          "`long * float` donne un `float` ; `char + 1.0` donne un `double` ; `'a' + 1` donne l'`int` 98."
        ] },
        { h: "Conversions" },
        { list: [
          "Élargissement implicite : `byte → short → int → long → float → double`, et `char → int`. `long → float` est implicite (avec perte de précision possible).",
          "Rétrécissement : cast explicite obligatoire, `int i = (int) 3.99;` tronque vers zéro (3, et -3 pour -3.99).",
          "Exception : une **constante de compilation** de type `int` qui tient dans la cible peut être affectée à un `byte`, `short` ou `char` sans cast : `byte b = 10;`, `final byte c = 10; byte d = c + 5;`.",
          "Affectations composées (`+=`, `-=`, `*=`, `/=`…) et `++`/`--` : **cast implicite** vers le type de la variable. `b += 5;` équivaut à `b = (byte) (b + 5);`."
        ] },
        { code: String.raw`byte b = 10;
b += 5;          // OK : cast implicite
b++;             // OK
b = b + 5;       // ne compile pas : b + 5 est un int
short s = 3;
s = s * 2;       // ne compile pas : int vers short` },
        { h: "Dépassement (overflow)" },
        { list: [
          "Les entiers bouclent silencieusement : `Integer.MAX_VALUE + 1` vaut `Integer.MIN_VALUE` (-2147483648). Aucune exception.",
          "`long l = Integer.MAX_VALUE + 1;` : le calcul se fait en `int` **avant** l'élargissement, donc `l` vaut -2147483648. Il faut `Integer.MAX_VALUE + 1L`.",
          "`(byte) 200` vaut -56 (200 - 256) ; `(byte) 128` vaut -128.",
          "`Math.addExact`, `Math.multiplyExact`, `Math.toIntExact` lèvent `ArithmeticException` en cas de dépassement."
        ] },
        { trap: "`var x = 'x' + 1;` déclare un `int` (121), pas un `char` ni une `String`. Mais `char c = 'a'; c += 1;` compile et donne `'b'`." }
      ]
    },
    {
      title: "Wrappers, autoboxing et cache",
      blocks: [
        { table: {
          head: ["Méthode", "Retour", "Exemple"],
          rows: [
            ["`Integer.parseInt(String)`", "primitif `int`", "`int i = Integer.parseInt(\"42\");`"],
            ["`Integer.valueOf(String ou int)`", "wrapper `Integer`", "`Integer w = Integer.valueOf(\"42\");`"],
            ["`Integer.parseInt(String, int radix)`", "`int`", "`Integer.parseInt(\"1010\", 2)` vaut 10"],
            ["`w.intValue()`, `w.doubleValue()`…", "primitif", "conversion explicite depuis un wrapper"],
            ["`Boolean.parseBoolean(String)`", "`boolean`", "`true` seulement pour \"true\" (insensible à la casse), jamais d'exception"]
          ]
        } },
        { list: [
          "Autoboxing : primitif vers **son** wrapper uniquement. `Long l = 5;` et `Double d = 5;` ne compilent pas (un `int` se boxe en `Integer`, jamais en `Long` ou `Double`). `Long l = 5L;` compile.",
          "Unboxing puis élargissement : autorisé. `long c = Integer.valueOf(42);` et `double f = Integer.valueOf(5);` compilent.",
          "Unboxing d'une référence `null` : `NullPointerException` à l'exécution.",
          "`==` entre deux wrappers compare les **références**. `Integer.valueOf` (donc l'autoboxing) met en cache les valeurs de **-128 à 127** : `Integer a = 127, b = 127; a == b` vaut `true`, mais avec 128 c'est `false`.",
          "`==` entre un wrapper et un primitif : unboxing, comparaison des valeurs.",
          "`equals` compare le type **et** la valeur : `Long.valueOf(127).equals(127)` vaut `false` (l'argument est boxé en `Integer`)."
        ] },
        { trap: "Opérateur ternaire avec un `Integer` et un `int` : le type de l'expression est `int`, donc le wrapper est déballé. `Integer r = flag ? 1 : count;` lève une `NullPointerException` si `count` est `null` et `flag` est `false`." },
        { trap: "`Integer a = 1000; Long b = 1000L; a == b` ne compile pas (types incomparables), alors que `a.equals(b)` compile et vaut `false`." }
      ]
    },
    {
      title: "Opérateurs et expressions",
      blocks: [
        { table: {
          head: ["Priorité (de la plus forte à la plus faible)", "Opérateurs"],
          rows: [
            ["Post-unaires", "`x++`, `x--`"],
            ["Pré-unaires et unaires", "`++x`, `--x`, `+`, `-`, `!`, `~`, cast"],
            ["Multiplicatifs", "`*`, `/`, `%`"],
            ["Additifs", "`+`, `-`"],
            ["Décalages", "`<<`, `>>`, `>>>`"],
            ["Relationnels", "`<`, `>`, `<=`, `>=`, `instanceof`"],
            ["Égalité", "`==`, `!=`"],
            ["Bit à bit / logiques", "`&` puis `^` puis `|`"],
            ["Logiques court-circuit", "`&&` puis `||`"],
            ["Ternaire", "`? :`"],
            ["Affectations", "`=`, `+=`, `-=`… (associatives à droite)"]
          ]
        } },
        { list: [
          "Les opérandes sont **évalués de gauche à droite**, quelle que soit la priorité. `x++` renvoie l'ancienne valeur, `++x` la nouvelle.",
          "`&&` et `||` court-circuitent : l'opérande droit n'est pas évalué si le gauche suffit. `&`, `|` et `^` évaluent **toujours** les deux côtés.",
          "Division entière : tronquée vers zéro (`7 / 2` vaut 3, `-7 / 2` vaut -3). Si un opérande est flottant, division réelle (`7 / 2.0` vaut 3.5).",
          "Modulo `%` : le signe du résultat est celui du **dividende** (`-7 % 2` vaut -1, `7 % -2` vaut 1). Fonctionne sur les flottants (`5.5 % 2` vaut 1.5).",
          "Division ou modulo entier par zéro : `ArithmeticException`. En flottant : `5.0 / 0` vaut `Infinity`, `0.0 / 0` vaut `NaN`, sans exception.",
          "Ternaire : `cond ? a : b` n'évalue qu'une seule des deux branches. `5 > 3 ? 1 : 2.0` vaut `1.0` (promotion numérique des deux branches).",
          "Bit à bit : `6 & 3` vaut 2, `6 | 3` vaut 7, `6 ^ 3` vaut 5, `~6` vaut -7. Décalages : `6 << 2` vaut 24, `-8 >> 1` vaut -4 (signe conservé), `>>>` remplit avec des zéros.",
          "`==` sur des numériques de types différents : promotion (`10 == 10.0` et `'a' == 97` valent `true`). `boolean` n'est comparable ni convertible à aucun type numérique."
        ] },
        { code: String.raw`int x = 5;
int y = x++ + ++x * 2 - x--;   // 5 + 7 * 2 - 7 = 12, x vaut 6
int z = 3;
z = z++;                       // z vaut toujours 3` },
        { trap: "`double d = 10 / 4;` vaut `2.0` : la division est entière, l'élargissement vient après." },
        { trap: "`if (a++ > 3 & b++ < 10)` incrémente toujours `b` ; avec `&&`, `b` n'est incrémenté que si le premier test est vrai." }
      ]
    },
    {
      title: "API Math",
      blocks: [
        { table: {
          head: ["Méthode", "Type de retour", "Comportement"],
          rows: [
            ["`Math.round(double)`", "`long`", "arrondi au plus proche, .5 vers +∞ : `round(2.5)` = 3, `round(-2.5)` = -2"],
            ["`Math.round(float)`", "`int`", "idem"],
            ["`Math.floor(double)`", "`double`", "entier inférieur : `floor(-2.5)` = -3.0"],
            ["`Math.ceil(double)`", "`double`", "entier supérieur : `ceil(2.1)` = 3.0, `ceil(-0.5)` = -0.0"],
            ["`Math.abs(x)`", "type de l'argument", "`abs(Integer.MIN_VALUE)` reste négatif"],
            ["`Math.pow(double, double)`", "`double`", "`pow(2, 3)` = 8.0"],
            ["`Math.sqrt(double)`", "`double`", "`sqrt(-1)` = NaN"],
            ["`Math.min` / `Math.max`", "type promu des deux arguments", "`max(3, 4L)` est un `long`, `max(1, 2.0)` un `double`"],
            ["`Math.random()`", "`double`", "dans [0.0, 1.0[ (1.0 exclu)"],
            ["`Math.floorMod(a, b)`", "entier", "signe du **diviseur** : `floorMod(-7, 2)` = 1, `floorMod(7, -2)` = -1"],
            ["`Math.floorDiv(a, b)`", "entier", "arrondi vers -∞ : `floorDiv(-7, 2)` = -4"],
            ["`Math.clamp(value, min, max)`", "type des bornes", "Java 21 : borne la valeur ; `clamp(15L, 0, 10)` = 10 (`int`)"]
          ]
        } },
        { trap: "`int i = Math.round(2.5);` ne compile pas (retour `long`), `int i = Math.pow(2, 3);` et `int i = Math.ceil(2.1);` non plus (retour `double`). Seul `Math.round(float)` renvoie un `int`." },
        { tip: "Entier aléatoire entre 1 et 6 : `(int) (Math.random() * 6) + 1`. Sans les parenthèses, `(int) Math.random() * 6 + 1` vaut toujours 1 car le cast s'applique d'abord à `Math.random()`." }
      ]
    },
    {
      title: "String : immuabilité, pool et concaténation",
      blocks: [
        { list: [
          "`String` est **immuable** : toute méthode renvoie une nouvelle chaîne. `s.trim();` ou `s.toUpperCase();` sans réaffectation n'a aucun effet.",
          "String pool : les littéraux et les **constantes de compilation** (`\"ja\" + \"va\"`, concaténation avec une variable `final` initialisée par un littéral) sont internés, donc `==` vaut `true`.",
          "Une concaténation calculée à l'exécution (variable non `final`, appel de méthode) et `new String(\"x\")` créent un nouvel objet : `==` vaut `false`. `intern()` renvoie l'instance du pool.",
          "Toujours comparer le contenu avec `equals` (ou `equalsIgnoreCase`)."
        ] },
        { code: String.raw`String a = "java";
String b = "ja" + "va";     // constante : a == b
String c = "ja";
String d = c + "va";        // exécution : a != d
final String e = "ja";
String f = e + "va";        // constante : a == f
boolean g = a == d.intern();   // true` },
        { h: "Règles de l'opérateur +" },
        { list: [
          "Évaluation de gauche à droite : tant que les deux opérandes sont numériques, c'est une addition ; dès qu'un opérande est une `String`, c'est une concaténation.",
          "`1 + 2 + \"3\" + 4 + 5` donne `\"3345\"` ; `'a' + 1 + \"b\"` donne `\"98b\"` ; `\"b\" + 'c' + 1` donne `\"bc1\"`.",
          "`null` se concatène sous la forme `\"null\"` : `String s = null; s += \"x\";` donne `\"nullx\"`, sans exception."
        ] },
        { trap: "`String` et `StringBuilder` sont deux types sans lien d'héritage : `s == sb` ne compile pas, `s.equals(sb)` compile mais vaut toujours `false`. Utiliser `s.contentEquals(sb)` ou `s.equals(sb.toString())`." }
      ]
    },
    {
      title: "String : méthodes clés",
      blocks: [
        { table: {
          head: ["Méthode", "À retenir"],
          rows: [
            ["`length()`, `charAt(i)`", "index de 0 à `length() - 1`, sinon `StringIndexOutOfBoundsException`"],
            ["`substring(begin)`, `substring(begin, end)`", "`end` **exclu** ; `substring(4, 4)` donne `\"\"` ; `begin > end` ou `end > length()` lève une exception"],
            ["`indexOf(x)`, `indexOf(x, from)`, `lastIndexOf`", "renvoie -1 si absent, jamais d'exception ; Java 21 ajoute `indexOf(ch, begin, end)`"],
            ["`strip()`, `stripLeading()`, `stripTrailing()`", "retire les blancs Unicode"],
            ["`trim()`", "retire seulement les caractères de code ≤ U+0020"],
            ["`isEmpty()` / `isBlank()`", "longueur 0 / vide ou uniquement des blancs"],
            ["`repeat(n)`", "`\"ab\".repeat(3)` donne `\"ababab\"`, `repeat(0)` donne `\"\"`"],
            ["`replace(char, char)`, `replace(CharSequence, CharSequence)`", "remplace **toutes** les occurrences, sans regex"],
            ["`compareTo(String)`", "différence des premiers caractères distincts, sinon différence des longueurs"],
            ["`chars()`", "renvoie un `IntStream` (des `int`, pas des `char`)"],
            ["`contains`, `startsWith`, `endsWith`, `equalsIgnoreCase`", "renvoient un `boolean`"],
            ["`indent(n)`", "ajoute (n > 0) ou retire (n < 0) n espaces par ligne, normalise les fins de ligne et **ajoute un `\\n` final**"],
            ["`stripIndent()`", "retire l'indentation commune (algorithme des text blocks)"],
            ["`translateEscapes()`", "interprète les séquences d'échappement présentes sous forme de texte (`\\\\t` devient une tabulation)"],
            ["`formatted(args)` / `String.format(fmt, args)`", "`%s` tout type, `%d` entier, `%f` flottant, `%b` booléen, `%c` caractère, `%n` saut de ligne"]
          ]
        } },
        { list: [
          "`compareTo` : `\"apple\".compareTo(\"apricot\")` vaut -2 (`'p' - 'r'`), `\"abc\".compareTo(\"a\")` vaut 2 (longueurs), les majuscules sont avant les minuscules (`\"Zoo\".compareTo(\"apple\")` est négatif).",
          "Format : `%5d` cadre à droite sur 5 caractères, `%-5s` cadre à gauche, `%03d` complète avec des zéros, `%.2f` deux décimales (arrondi).",
          "`%d` avec un `double` lève `IllegalFormatConversionException` ; un argument manquant lève `MissingFormatArgumentException` ; les arguments en trop sont ignorés.",
          "`%b` avec un argument non booléen et non `null` affiche `true` ; `%c` accepte un `int` (code du caractère)."
        ] },
        { trap: "`\" a\\n  b\\n c\".indent(2)` a une longueur de 16 et non 15 : `indent` ajoute un saut de ligne à la dernière ligne s'il manque." },
        { trap: "Chaînage sur une chaîne immuable : dans `s.strip().replace('l', 'L').substring(2, 7)`, chaque méthode travaille sur le résultat de la précédente ; `s` lui-même ne change que s'il est réaffecté." }
      ]
    },
    {
      title: "StringBuilder",
      blocks: [
        { p: "`StringBuilder` est **mutable** : ses méthodes modifient l'objet et renvoient `this`, ce qui permet le chaînage. Deux variables qui référencent le même builder voient les mêmes modifications." },
        { table: {
          head: ["Méthode", "Effet"],
          rows: [
            ["`append(x)`", "ajoute à la fin (tout type : `append(1)`, `append(true)`, `append('c')`)"],
            ["`insert(offset, x)`", "insère avant l'index `offset` ; `offset > length()` lève une exception"],
            ["`delete(start, end)`", "supprime de `start` à `end` exclu ; `end` trop grand est toléré (ramené à la longueur)"],
            ["`deleteCharAt(index)`", "supprime un caractère ; index invalide : `StringIndexOutOfBoundsException`"],
            ["`replace(start, end, str)`", "remplace la plage `[start, end[` par `str` (signature différente de `String.replace`)"],
            ["`reverse()`", "inverse le contenu"],
            ["`setLength(n)`", "tronque, ou complète avec des `'\\u0000'` ; renvoie `void` (fin de chaîne d'appels)"],
            ["`repeat(cs, n)`, `repeat(codePoint, n)`", "Java 21 : ajoute n fois la séquence ou le caractère"],
            ["`length()`, `charAt`, `indexOf`, `substring`, `toString()`", "`substring` renvoie une `String` et ne modifie pas le builder"]
          ]
        } },
        { code: String.raw`StringBuilder sb = new StringBuilder("abcdef");
sb.insert(2, "XY")      // abXYcdef
  .delete(1, 3)         // aYcdef
  .deleteCharAt(0)      // Ycdef
  .reverse();           // fedcY` },
        { list: [
          "`StringBuilder` ne redéfinit **pas** `equals` ni `hashCode` : `equals` compare les références.",
          "Il implémente `Comparable<StringBuilder>` : `a.compareTo(b)` vaut 0 si les contenus sont identiques.",
          "`new StringBuilder(10)` crée un builder **vide** de capacité 10 (`length()` vaut 0)."
        ] },
        { trap: "`StringBuilder b = a.append(\"x\");` ne crée pas de copie : `a` et `b` désignent le même objet, `a == b` vaut `true`." }
      ]
    },
    {
      title: "Text blocks",
      blocks: [
        { list: [
          "Délimiteur d'ouverture `\"\"\"` suivi **obligatoirement** d'un saut de ligne : `\"\"\"hello\"\"\"` et `\"\"\" \"\"\"` ne compilent pas. Le contenu commence à la ligne suivante.",
          "Un text block est une `String` ordinaire, constante de compilation, internée : un bloc contenant `hi` suivi d'un saut de ligne est `==` à `\"hi\\n\"`.",
          "Fins de ligne normalisées en `\\n`, quel que soit le système (jamais `\\r\\n`).",
          "**Indentation accessoire** (incidental whitespace) : l'indentation commune à toutes les lignes non vides **et à la ligne du délimiteur fermant** est supprimée. Le reste est l'indentation essentielle.",
          "Délimiteur fermant sur sa propre ligne : la chaîne se termine par `\\n`. Collé à la dernière ligne (`texte\"\"\";`) : pas de `\\n` final.",
          "Déplacer le délimiteur fermant vers la gauche ajoute de l'indentation essentielle à toutes les lignes ; le déplacer vers la droite ne change rien.",
          "Les espaces en **fin de ligne** sont toujours supprimés ; pour en conserver, utiliser `\\s`.",
          "Les guillemets `\"` et `\"\"` sont libres dans le contenu ; trois guillemets consécutifs doivent être échappés (`\\\"\"\"`)."
        ] },
        { table: {
          head: ["Échappement", "Effet"],
          rows: [
            ["`\\` en fin de ligne", "continuation : pas de saut de ligne à cet endroit"],
            ["`\\s`", "un espace, qui protège aussi les espaces qui le précèdent"],
            ["`\\n`, `\\t`, `\\\"`, `\\\\`", "comme dans un littéral classique"]
          ]
        } },
        { code: String.raw`String t = """
        alpha
          beta
    """;
// délimiteur 4 colonnes à gauche de "alpha"
// t vaut "    alpha\n      beta\n"

String u = """
    a \
    b\s
    c""";
// u vaut "a b \nc"` },
        { trap: "Compter les lignes : une ligne par ligne de contenu, plus rien si le délimiteur fermant est sur la dernière ligne de texte. `lines().count()` ne compte pas de ligne vide finale." },
        { trap: "Une séquence d'échappement invalide dans un text block (par exemple `\\d` ou `\\w`) est une erreur de compilation, comme dans un littéral classique." }
      ]
    },
    {
      title: "Inférence de type avec var",
      blocks: [
        { list: [
          "`var` uniquement pour une **variable locale initialisée** dans sa déclaration (y compris dans `for`, `for-each`, try-with-resources et paramètres de lambda). Jamais pour un champ, un paramètre de méthode ou un type de retour.",
          "Le type est figé à la compilation à partir de l'initialiseur : `var a = 10;` est un `int`, on ne peut pas lui affecter `5L` ou `\"x\"` ensuite.",
          "Interdits : `var x;` (pas d'initialiseur), `var x = null;`, `var x = {1, 2};` (initialiseur de tableau), `var a = 1, b = 2;` (déclaration multiple), `var[] t = ...`.",
          "Autorisés : `var x = (String) null;`, `var t = new int[] {1, 2};`, `var l = 10_000L;` (`long`), `var c = 'x' + 1;` (`int`).",
          "`var` n'est pas un mot-clé réservé : `var var = 1;` compile ; en revanche `var` ne peut pas être un nom de type."
        ] },
        { code: String.raw`var a = 10;        // int
a = 'c';           // OK : char vers int
var b = 3.0f;      // float
b = 4.5;           // ne compile pas : double vers float
var s = (short) 1; // short
s += 100_000;      // OK : affectation composée` },
        { trap: "`var b = (byte) 1; b = b + 1;` ne compile pas : `var` ne change rien aux règles de promotion." }
      ]
    },
    {
      title: "Date-Time : classes et création",
      blocks: [
        { table: {
          head: ["Classe", "Contenu", "Exemple de `toString()`"],
          rows: [
            ["`LocalDate`", "date sans heure ni fuseau", "`2024-03-10`"],
            ["`LocalTime`", "heure sans date ni fuseau", "`10:30`, `10:00:05`"],
            ["`LocalDateTime`", "date et heure, sans fuseau", "`2024-03-10T10:30`"],
            ["`ZonedDateTime`", "date, heure, décalage et fuseau", "`2024-03-10T01:30-05:00[America/New_York]`"],
            ["`Instant`", "point sur la ligne du temps UTC", "`2024-06-01T10:00:00Z`"],
            ["`Period`", "quantité en années, mois, jours", "`P1Y2M3D`"],
            ["`Duration`", "quantité en secondes et nanosecondes", "`PT1H30M`"]
          ]
        } },
        { list: [
          "Aucun constructeur public : `new LocalDate(...)` ne compile pas. On utilise les fabriques `of(...)`, `now()`, `parse(...)`.",
          "`LocalDate.of(2024, 1, 31)` ou `LocalDate.of(2024, Month.JANUARY, 31)` : les mois vont de **1 à 12**.",
          "`LocalTime.of(h, m)`, `of(h, m, s)`, `of(h, m, s, nanos)` ; `LocalDateTime.of(date, time)` ou `of(y, M, d, h, m)`.",
          "`ZonedDateTime.of(date, time, zone)`, `of(dateTime, zone)` ou `of(y, M, d, h, m, s, nanos, zone)` avec `ZoneId.of(\"Europe/Paris\")`.",
          "Conversions : `date.atTime(10, 30)`, `date.atStartOfDay()`, `dateTime.atZone(zone)`, `zoned.toInstant()`, `dateTime.toInstant(ZoneOffset.UTC)` (un `LocalDateTime` seul ne peut pas donner un `Instant`).",
          "Valeur invalide (`LocalDate.of(2023, 2, 29)`, mois 13, `LocalTime.of(25, 0)`) : le code **compile** et lève `DateTimeException` à l'exécution.",
          "Toutes ces classes sont **immuables** : `d.plusDays(1);` sans réaffectation ne change rien."
        ] },
        { trap: "Les méthodes doivent correspondre au type : `LocalDate.plusHours`, `LocalTime.plusDays`, `LocalDate.getHour` n'existent pas (erreur de compilation)." },
        { tip: "`toString()` omet les secondes quand elles valent zéro : `LocalDateTime.of(2024, 1, 1, 10, 0, 0)` s'affiche `2024-01-01T10:00`." }
      ]
    },
    {
      title: "Manipuler les dates : plus, minus, with, Period, Duration, between",
      blocks: [
        { list: [
          "`plusDays`, `plusWeeks`, `plusMonths`, `plusYears`, `plusHours`, `plusMinutes`… et les `minusXxx` équivalents ; `plus(long, ChronoUnit)` ; `plus(Period ou Duration)`.",
          "`withDayOfMonth`, `withMonth`, `withYear`, `withHour`… renvoient une copie avec le champ remplacé.",
          "Ajouter des mois ajuste le jour au dernier jour valide : `LocalDate.of(2024, 1, 31).plusMonths(1)` donne `2024-02-29`. Aucune exception.",
          "`LocalTime` boucle sur 24 h : `LocalTime.of(23, 0).plusHours(2)` donne `01:00`.",
          "Comparaisons : `isBefore`, `isAfter`, `isEqual`, `equals`, `compareTo`."
        ] },
        { h: "Period et Duration" },
        { table: {
          head: ["", "`Period`", "`Duration`"],
          rows: [
            ["Unités", "années, mois, jours (calendrier)", "heures, minutes, secondes, nanos (temps exact)"],
            ["Fabriques", "`ofYears`, `ofMonths`, `ofWeeks`, `ofDays`, `of(y, m, d)`", "`ofDays`, `ofHours`, `ofMinutes`, `ofSeconds`, `ofMillis`, `ofNanos`, `of(n, ChronoUnit)`"],
            ["Affichage", "`Period.ofWeeks(2)` : `P14D` ; `Period.ofMonths(14)` : `P14M` (pas de normalisation)", "`Duration.ofDays(1)` : `PT24H` ; `Duration.ofMinutes(90)` : `PT1H30M`"],
            ["Applicable à", "`LocalDate`, `LocalDateTime`, `ZonedDateTime`", "`LocalTime`, `LocalDateTime`, `ZonedDateTime`, `Instant`"],
            ["between", "`Period.between(LocalDate, LocalDate)`", "`Duration.between(Temporal, Temporal)` avec une composante horaire"]
          ]
        } },
        { trap: "Les fabriques `Period.ofXxx` sont **statiques** : `Period.ofYears(1).ofMonths(2).ofDays(3)` compile mais ne garde que le dernier appel, soit `P3D`. Pour combiner : `Period.of(1, 2, 3)` ou `Period.ofYears(1).plusMonths(2)`." },
        { trap: "`localDate.plus(Duration.ofDays(1))` compile mais lève `UnsupportedTemporalTypeException` (unité Seconds non supportée). De même `localTime.plus(Period.ofDays(1))` et `Duration.between(date1, date2)` avec deux `LocalDate`." },
        { h: "between" },
        { list: [
          "`ChronoUnit.DAYS.between(start, end)` renvoie un `long`, nombre d'unités **complètes** (tronqué), négatif si `end` est avant `start`.",
          "`ChronoUnit.HOURS.between` avec deux `LocalDate` lève `UnsupportedTemporalTypeException`.",
          "`Period.between(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 3, 15))` donne `P2M14D` (et non 74 jours) ; `ChronoUnit.DAYS.between` donne 74.",
          "`Duration.toHours()` donne le total en heures ; `toHoursPart()` la partie heures (0 à 23)."
        ] }
      ]
    },
    {
      title: "Fuseaux horaires, Instant et heure d'été",
      blocks: [
        { list: [
          "`Instant` : instant UTC. Il accepte `plus`/`minus` avec les unités jusqu'à `ChronoUnit.DAYS` ; `WEEKS`, `MONTHS`, `YEARS` lèvent `UnsupportedTemporalTypeException`.",
          "`ZonedDateTime.equals` compare date-heure locale, décalage **et** fuseau. `isEqual` compare l'instant. Deux `ZonedDateTime` de fuseaux différents peuvent représenter le même `Instant`.",
          "Pour comparer deux `ZonedDateTime`, convertir en UTC : heure locale **moins** le décalage (12:00+02:00 correspond à 10:00Z ; 06:00-04:00 aussi)."
        ] },
        { h: "Heure d'été (DST) avec ZonedDateTime" },
        { list: [
          "Passage à l'heure d'été (exemple `America/New_York`, 10 mars 2024 : 02:00 devient 03:00, décalage -05:00 puis -04:00). L'heure 02:30 n'existe pas : `ZonedDateTime.of(...)` la décale à 03:30-04:00.",
          "Retour à l'heure d'hiver (3 novembre 2024 : 02:00 redevient 01:00). 01:30 existe deux fois : `of(...)` choisit le premier décalage (-04:00) ; `plusHours(1)` donne 01:30-05:00.",
          "Unités de **temps** (`plusHours`, `plusMinutes`, `plus(Duration)`) : calcul sur l'instant, l'heure locale suit le changement de décalage.",
          "Unités de **date** (`plusDays`, `plusMonths`, `plus(Period)`) : calcul sur la date locale, l'heure locale est conservée si elle existe."
        ] },
        { code: String.raw`var z = ZonedDateTime.of(LocalDate.of(2024, 3, 10), LocalTime.of(1, 30),
        ZoneId.of("America/New_York"));   // 01:30-05:00
z.plusHours(1);               // 2024-03-10T03:30-04:00
z.plus(Duration.ofDays(1));   // 24 h réelles : 2024-03-11T02:30-04:00
z.plus(Period.ofDays(1));     // jour calendaire : 2024-03-11T01:30-04:00` },
        { trap: "`Duration.ofDays(1)` vaut exactement 24 heures ; `Period.ofDays(1)` vaut un jour calendaire, qui dure 23 ou 25 heures les jours de changement d'heure." },
        { tip: "Le jour du passage à l'heure d'été, `Duration.between` de 01:30 à 03:30 vaut une seule heure : les durées se calculent toujours sur les instants." }
      ]
    }
  ],
  questions: [
    {
      id: "values-001",
      difficulty: 1,
      q: "Which of the following declarations compile? (Choose three.)",
      options: [
        "int a = 1_000_000;",
        "double b = 1_.5;",
        "long c = 0b1010L;",
        "float d = 3.14;",
        "int e = 0x_FF;",
        "int f = 017;"
      ],
      answer: [0, 2, 5],
      explain: "Un underscore n'est autorisé qu'entre deux chiffres : `1_000_000` est valide, mais `1_.5` (à côté du point décimal) et `0x_FF` (juste après le préfixe) provoquent l'erreur `illegal underscore`. `0b1010L` est un littéral binaire de type `long`, `017` un littéral octal valant 15. `float d = 3.14;` ne compile pas car `3.14` est un `double` : il faut le suffixe `f`."
    },
    {
      id: "values-002",
      difficulty: 2,
      q: "Which lines fail to compile? (Choose two.)",
      code: String.raw`byte b = 10;
b += 5;               // n1
b = b + 5;            // n2
short s = 3;
s++;                  // n3
s = s * 2;            // n4
final byte c = 10;
byte d = c + 5;       // n5`,
      options: ["n1", "n2", "n3", "n4", "n5"],
      answer: [1, 3],
      explain: "Dans une opération binaire, `byte` et `short` sont promus en `int` : `b + 5` et `s * 2` sont des `int`, qu'on ne peut pas affecter à un `byte` ou un `short` sans cast (n2 et n4 : `possible lossy conversion from int`). Les affectations composées (n1) et `++` (n3) contiennent un cast implicite. La ligne n5 compile car `c` est `final` : `c + 5` est une constante de compilation (15) qui tient dans un `byte`."
    },
    {
      id: "values-003",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`int i = Integer.MAX_VALUE;
i++;
long l = Integer.MAX_VALUE + 1;
byte b = (byte) 200;
System.out.println(i + " " + l + " " + b);`,
      options: [
        "-2147483648 -2147483648 -56",
        "-2147483648 2147483648 -56",
        "2147483647 2147483648 127",
        "-2147483648 2147483648 72",
        "An ArithmeticException is thrown at runtime"
      ],
      answer: [0],
      explain: "Le dépassement entier est silencieux : `i++` fait passer `Integer.MAX_VALUE` à `Integer.MIN_VALUE`. Pour `l`, l'addition `Integer.MAX_VALUE + 1` est faite en `int` (elle déborde) **avant** l'élargissement en `long` : `l` vaut donc -2147483648 et non 2147483648 (il aurait fallu `1L`). `(byte) 200` garde les 8 bits de poids faible : 200 - 256 = -56. Aucune `ArithmeticException` : seules les méthodes `Math.xxxExact` en lèvent."
    },
    {
      id: "values-004",
      difficulty: 2,
      q: "What are the types of r1, r2 and r3, in that order?",
      code: String.raw`short s = 10;
char c = 'A';
float f = 2.0f;
long l = 3L;
var r1 = s + c;
var r2 = l * f;
var r3 = c + 1.0;`,
      options: [
        "int, float, double",
        "short, float, double",
        "int, long, double",
        "int, double, double",
        "char, float, float"
      ],
      answer: [0],
      explain: "Promotion numérique binaire : `short` et `char` sont toujours promus en `int`, donc `s + c` est un `int` (ni `short` ni `char`). Avec un `long` et un `float`, le résultat est un `float` (le `float` l'emporte sur le `long`, il ne devient pas `double`). `1.0` est un littéral `double`, donc `c + 1.0` est un `double`."
    },
    {
      id: "values-005",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`Integer a = 127, b = 127;
Integer c = 128, d = 128;
Long e = 127L;
System.out.println((a == b) + " " + (c == d) + " "
        + c.equals(d) + " " + e.equals(127));`,
      options: [
        "true false true false",
        "true true true true",
        "true false true true",
        "false false true false",
        "true true true false"
      ],
      answer: [0],
      explain: "`==` entre deux wrappers compare les références. L'autoboxing passe par `Integer.valueOf`, qui met en cache les valeurs de -128 à 127 : `a == b` vaut `true`, mais 128 est hors cache, donc `c == d` vaut `false`. `c.equals(d)` compare les valeurs : `true`. Enfin `e.equals(127)` boxe 127 en `Integer` ; `Long.equals` exige un `Long`, le résultat est donc `false` même si la valeur numérique est identique."
    },
    {
      id: "values-006",
      difficulty: 2,
      q: "Which lines fail to compile? (Choose two.)",
      code: String.raw`int a = Integer.parseInt("42");       // n1
Integer b = Integer.valueOf("42");    // n2
long c = Integer.parseInt("42");      // n3
Long d = Integer.valueOf("42");       // n4
Double e = 5;                         // n5
double f = Integer.valueOf(5);        // n6`,
      options: ["n1", "n2", "n3", "n4", "n5", "n6"],
      answer: [3, 4],
      explain: "`parseInt` renvoie un `int`, `valueOf` un `Integer` (n1, n2). Un `int` s'élargit en `long` (n3), et un `Integer` peut être déballé puis élargi en `double` (n6). En revanche un `Integer` n'est pas un `Long` (n4 : types incompatibles), et l'autoboxing ne combine pas élargissement puis boxing : l'`int` 5 ne peut devenir qu'un `Integer`, pas un `Double` (n5). Il faudrait écrire `5.0` ou `5d`."
    },
    {
      id: "values-007",
      difficulty: 3,
      q: "What is the result of executing the following code?",
      code: String.raw`Integer count = null;
boolean flag = false;
Integer result = flag ? 1 : count;
System.out.println(result);`,
      options: [
        "null",
        "0",
        "1",
        "The code does not compile",
        "A NullPointerException is thrown at runtime"
      ],
      answer: [4],
      explain: "Quand les deux branches d'un ternaire sont de type `int` et `Integer`, l'expression est de type `int` : la branche `count` est donc **déballée** (`count.intValue()`) avant d'être reboxée pour l'affectation. Comme `count` vaut `null`, l'unboxing lève une `NullPointerException`. Le piège est de croire que `null` est simplement copié dans `result` : ce serait le cas si les deux branches étaient des `Integer`."
    },
    {
      id: "values-008",
      difficulty: 1,
      q: "What is the output of the following program?",
      code: String.raw`public class Defaults {
    static int i;
    static boolean b;
    static double d;
    static String s;
    static Integer w;

    public static void main(String[] args) {
        System.out.println(i + " " + b + " " + d + " " + s + " " + w);
    }
}`,
      options: [
        "0 false 0.0 null null",
        "0 false 0.0 null 0",
        "0 false 0 null null",
        "The code does not compile because the variables are not initialized",
        "A NullPointerException is thrown at runtime"
      ],
      answer: [0],
      explain: "Les champs (ici `static`) reçoivent une valeur par défaut : `0` pour `int`, `false` pour `boolean`, `0.0` pour `double` et `null` pour toute référence, y compris le wrapper `Integer` (pas `0`). La concaténation convertit `null` en `\"null\"` sans exception. L'erreur de compilation pour variable non initialisée ne concerne que les variables **locales**."
    },
    {
      id: "values-009",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`int x = 5;
int y = x++ + ++x * 2 - x--;
System.out.println(x + " " + y);`,
      options: ["6 12", "6 10", "5 12", "6 17", "7 12"],
      answer: [0],
      explain: "Les opérandes sont évalués de gauche à droite : `x++` vaut 5 (x passe à 6), `++x` vaut 7 (x = 7), `x--` vaut 7 (x = 6). L'expression devient `5 + 7 * 2 - 7` ; la multiplication est prioritaire : 5 + 14 - 7 = 12. `x` termine à 6. Le résultat 17 correspond à une évaluation sans priorité, `(5 + 7) * 2 - 7`."
    },
    {
      id: "values-010",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`int a = 3, b = 5;
if (a++ > 3 & b++ < 10) a += 10;
if (a > 3 || ++b > 6) b += 10;
if (a < 0 && b++ > 0) a = 0;
System.out.println(a + " " + b);`,
      options: ["4 16", "4 15", "4 17", "14 16", "4 18"],
      answer: [0],
      explain: "Premier `if` : `a++ > 3` compare 3 (faux) puis `a` vaut 4 ; `&` n'est pas un court-circuit, donc `b++` est évalué et `b` vaut 6 ; la condition est fausse. Deuxième `if` : `a > 3` est vrai, `||` court-circuite et `++b` n'est pas exécuté ; `b += 10` donne 16. Troisième `if` : `a < 0` est faux, `&&` court-circuite, `b` reste à 16. Résultat : `4 16`. Avec `&&` dans le premier test on aurait obtenu `4 15`."
    },
    {
      id: "values-011",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`System.out.println(7 / 2 + " " + -7 / 2 + " " + -7 % 2 + " "
        + 7 % -2 + " " + 7 / 2.0 + " " + Math.floorMod(-7, 2));`,
      options: [
        "3 -3 -1 1 3.5 1",
        "3 -4 -1 1 3.5 1",
        "3 -3 1 -1 3.5 1",
        "3 -3 -1 1 3.5 -1",
        "3.5 -3.5 -1 1 3.5 1"
      ],
      answer: [0],
      explain: "La division entière tronque vers zéro : `7 / 2` vaut 3 et `-7 / 2` vaut -3 (et non -4, qui serait le résultat de `Math.floorDiv`). Le signe de `%` est celui du dividende : `-7 % 2` vaut -1, `7 % -2` vaut 1. `7 / 2.0` est une division réelle : 3.5. `Math.floorMod` prend le signe du diviseur : `floorMod(-7, 2)` vaut 1."
    },
    {
      id: "values-012",
      difficulty: 3,
      q: "Given that all the methods used exist in Java 21, what is the output of the following code?",
      code: String.raw`StringBuilder sb = new StringBuilder("ab");
sb.repeat("xy", 2).repeat('z', 1);
System.out.println(sb + " " + Math.clamp(15L, 0, 10) + " "
        + "a-b-c".indexOf('-', 2, 5));`,
      options: [
        "abxyxyz 10 3",
        "abxyxyz 15 3",
        "abxyxyz 10 1",
        "ababxyz 10 3",
        "xyxyz 10 3"
      ],
      answer: [0],
      explain: "Ces trois API sont des nouveautés de Java 21. `StringBuilder.repeat(CharSequence, count)` **ajoute** la séquence `count` fois à la fin (il ne répète pas le contenu existant et ne le remplace pas) : `abxyxy`, puis `repeat('z', 1)` ajoute un `z`. `Math.clamp(value, min, max)` ramène 15 dans l'intervalle [0, 10] : 10. `indexOf(ch, beginIndex, endIndex)` cherche entre les index 2 inclus et 5 exclu : le premier `-` (index 1) est ignoré, le résultat est 3."
    },
    {
      id: "values-013",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`System.out.println(Math.round(2.5) + " " + Math.round(-2.5) + " "
        + Math.floor(-2.5) + " " + Math.ceil(2.1));`,
      options: [
        "3 -2 -3.0 3.0",
        "3 -3 -3.0 3.0",
        "3 -2 -2.0 3.0",
        "3.0 -2.0 -3.0 3.0",
        "3 -2 -3 3"
      ],
      answer: [0],
      explain: "`Math.round(double)` renvoie un `long` et arrondit les .5 vers l'infini positif : 2.5 donne 3 et -2.5 donne -2 (pas -3). `Math.floor` et `Math.ceil` renvoient des `double` : `floor(-2.5)` est l'entier inférieur, -3.0 ; `ceil(2.1)` est l'entier supérieur, 3.0. Les affichages sans `.0` pour `floor` et `ceil` sont donc faux, tout comme `3.0` pour `round`."
    },
    {
      id: "values-014",
      difficulty: 1,
      q: "Which of the following statements compile? (Choose two.)",
      options: [
        "int a = Math.round(2.5f);",
        "int b = Math.round(2.5);",
        "int c = Math.pow(2, 3);",
        "double d = Math.max(3, 4L);",
        "int e = Math.ceil(2.1);",
        "int f = Math.abs(-5L);"
      ],
      answer: [0, 3],
      explain: "`Math.round(float)` renvoie un `int`, alors que `Math.round(double)` renvoie un `long` (pas d'affectation à un `int` sans cast). `Math.pow` et `Math.ceil` renvoient toujours un `double`. `Math.abs(-5L)` renvoie un `long`. `Math.max(3, 4L)` promeut ses arguments en `long` et renvoie un `long`, qui s'élargit implicitement en `double`."
    },
    {
      id: "values-015",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`int a = 6, b = 3;
System.out.println((a & b) + " " + (a | b) + " " + (a ^ b) + " "
        + (a << 2) + " " + (-8 >> 1));`,
      options: [
        "2 7 5 24 -4",
        "2 7 5 12 -4",
        "3 6 5 24 -4",
        "2 7 9 24 -4",
        "2 7 5 24 4"
      ],
      answer: [0],
      explain: "6 s'écrit `110` et 3 s'écrit `011` en binaire. `&` (ET) donne `010` = 2, `|` (OU) donne `111` = 7, `^` (OU exclusif) donne `101` = 5. `a << 2` décale de deux bits vers la gauche, soit une multiplication par 4 : 24 (et non 12). `>>` est le décalage **signé** : il conserve le bit de signe, donc `-8 >> 1` vaut -4."
    },
    {
      id: "values-016",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`System.out.println(1 + 2 + "3" + 4 + 5);
System.out.println('a' + 1 + "b" + 'c' + 1);`,
      options: [
        String.raw`3345
98bc1`,
        String.raw`12345
a1bc1`,
        String.raw`339
98b100`,
        String.raw`3345
a1bc1`,
        String.raw`3345
98b100`
      ],
      answer: [0],
      explain: "L'opérateur `+` s'évalue de gauche à droite. `1 + 2` est une addition (3), puis dès qu'une `String` apparaît tout devient concaténation : `\"33\"`, `\"334\"`, `\"3345\"`. Sur la seconde ligne, `'a' + 1` est une addition entre un `char` et un `int` : 98. Ensuite `98 + \"b\"` donne `\"98b\"`, puis `'c'` et `1` sont concaténés tels quels : `98bc1` (pas d'addition `'c' + 1` car l'opérande gauche est déjà une `String`)."
    },
    {
      id: "values-017",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`String a = "java";
String b = "ja" + "va";
String c = "ja";
String d = c + "va";
final String e = "ja";
String f = e + "va";
System.out.println((a == b) + " " + (a == d) + " " + (a == f) + " "
        + (a == d.intern()));`,
      options: [
        "true false true true",
        "true false false true",
        "true true true true",
        "false false false true",
        "true false true false"
      ],
      answer: [0],
      explain: "`\"ja\" + \"va\"` est une constante de compilation : le compilateur la remplace par `\"java\"`, issue du pool, donc `a == b`. `c` n'est pas `final` : `c + \"va\"` est calculé à l'exécution et crée un nouvel objet, `a == d` vaut `false`. `e` est une variable `final` initialisée par un littéral, donc une constante : `e + \"va\"` est aussi résolu à la compilation et `a == f` vaut `true`. `intern()` renvoie l'instance du pool : `true`."
    },
    {
      id: "values-018",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`String s = "  Hello World  ";
s.trim();
s.toUpperCase();
s = s.strip().replace('l', 'L').substring(2, 7);
System.out.println(s + s.length());`,
      options: ["LLo W5", "LLO W5", "LLo Wo6", "llo W5", "eLLo W6"],
      answer: [0],
      explain: "`String` est immuable : `s.trim();` et `s.toUpperCase();` renvoient de nouvelles chaînes qui sont ignorées, `s` ne change pas (donc pas de majuscules sur le `o`). Ensuite `strip()` donne `\"Hello World\"`, `replace('l', 'L')` remplace **toutes** les occurrences : `\"HeLLo WorLd\"`, et `substring(2, 7)` prend les index 2 à 6 (7 exclu) : `\"LLo W\"`, de longueur 5."
    },
    {
      id: "values-019",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`System.out.println("apple".compareTo("apricot") + " "
        + "Zoo".compareTo("apple") + " "
        + "abc".compareTo("a"));`,
      options: ["-2 -7 2", "-1 1 1", "-2 25 2", "-2 -7 -2", "2 7 -2"],
      answer: [0],
      explain: "`compareTo` renvoie la différence entre les deux premiers caractères qui diffèrent, pas seulement -1, 0 ou 1. `\"apple\"` et `\"apricot\"` diffèrent à l'index 2 : `'p' - 'r'` = -2. `'Z'` (90) est avant `'a'` (97) car les majuscules précèdent les minuscules : 90 - 97 = -7 (25 serait l'écart alphabétique sans tenir compte de la casse). Quand une chaîne est le préfixe de l'autre, le résultat est la différence des longueurs : 3 - 1 = 2."
    },
    {
      id: "values-020",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`String s = "%s:%03d:%b:%c:%x".formatted("id", 7, "no", 65, 255);
System.out.println(s);`,
      options: [
        "id:007:true:A:ff",
        "id:007:false:A:ff",
        "id:7:true:A:ff",
        "id:007:true:65:255",
        "An IllegalFormatConversionException is thrown at runtime"
      ],
      answer: [0],
      explain: "`formatted` est l'équivalent d'instance de `String.format`. `%03d` affiche l'entier sur 3 caractères complétés par des zéros : `007`. `%b` avec un argument qui n'est ni `null` ni un `Boolean` affiche toujours `true` (la chaîne `\"no\"` n'est pas analysée). `%c` accepte un `int` et affiche le caractère correspondant : `A`. `%x` affiche en hexadécimal : `ff`. Aucune exception : elle surviendrait par exemple avec `%d` et un `double`."
    },
    {
      id: "values-021",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`String s = " a\n  b\n c";
System.out.println(s.indent(2).length() + " "
        + s.stripIndent().length() + " "
        + "x\\ty".translateEscapes().length());`,
      options: ["16 6 3", "15 6 3", "16 6 4", "15 9 4", "16 9 3"],
      answer: [0],
      explain: "`s` contient 9 caractères. `indent(2)` ajoute 2 espaces à chacune des 3 lignes (9 + 6 = 15) **et** ajoute un `\\n` final à la dernière ligne : 16. `stripIndent()` retire l'indentation commune (1 espace, le minimum des trois lignes) sans ajouter de saut de ligne : `\"a\\n b\\nc\"`, soit 6. `\"x\\\\ty\"` contient 4 caractères (x, antislash, t, y) ; `translateEscapes()` transforme l'antislash suivi de `t` en une vraie tabulation : 3 caractères."
    },
    {
      id: "values-022",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`StringBuilder sb = new StringBuilder("abcdef");
sb.insert(2, "XY").delete(1, 3).deleteCharAt(0).reverse()
        .append(sb.length());
System.out.println(sb);`,
      options: ["fedcY5", "fedcY6", "fedcXa5", "fedcY", "5fedcY"],
      answer: [0],
      explain: "`StringBuilder` est mutable et chaque méthode renvoie `this`. `insert(2, \"XY\")` : `abXYcdef`. `delete(1, 3)` supprime les index 1 et 2 (3 exclu) : `aYcdef`. `deleteCharAt(0)` : `Ycdef`. `reverse()` : `fedcY`. L'argument `sb.length()` est évalué au moment de l'appel à `append`, donc après les opérations précédentes : il vaut 5 et est ajouté à la fin."
    },
    {
      id: "values-023",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`StringBuilder a = new StringBuilder("java");
StringBuilder b = a.append("21");
b.replace(0, 4, "JDK").setLength(4);
System.out.println(a + " " + (a == b) + " "
        + a.equals(new StringBuilder("JDK2")) + " "
        + a.compareTo(new StringBuilder("JDK2")));`,
      options: [
        "JDK2 true false 0",
        "JDK2 true true 0",
        "java21 false false 2",
        "JDK21 true false 1",
        "JDK2 false false 0"
      ],
      answer: [0],
      explain: "`append` renvoie `this` : `a` et `b` référencent le même objet (`a == b` vaut `true`) et toute modification via `b` est visible via `a`. `replace(0, 4, \"JDK\")` remplace `java` : `JDK21`, puis `setLength(4)` tronque à `JDK2`. `StringBuilder` ne redéfinit pas `equals` : la comparaison avec un autre builder de même contenu vaut `false`. En revanche il implémente `Comparable` : `compareTo` compare les contenus et renvoie 0."
    },
    {
      id: "values-024",
      difficulty: 1,
      q: "Given the following declarations, which statements are true? (Choose two.)",
      code: String.raw`String s = "ocp";
StringBuilder sb = new StringBuilder("ocp");`,
      options: [
        "The expression s == sb does not compile",
        "s.equals(sb) returns true",
        "s.contentEquals(sb) returns true",
        "The expression sb.equals(s) does not compile",
        "s.equals(sb.toString()) returns false"
      ],
      answer: [0, 2],
      explain: "`String` et `StringBuilder` n'ont aucun lien d'héritage : `==` entre les deux est rejeté par le compilateur (`incomparable types`). `equals` accepte un `Object`, donc `s.equals(sb)` et `sb.equals(s)` compilent, mais valent `false` (types différents ; `StringBuilder.equals` compare les références). `contentEquals` compare le contenu avec n'importe quelle `CharSequence` : `true`. `s.equals(sb.toString())` compare deux `String` de même contenu : `true`."
    },
    {
      id: "values-025",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`String t = """
        alpha
          beta
        gamma
    """;
System.out.println(t.lines().count() + " " + t.indexOf("alpha")
        + " " + t.endsWith("\n"));`,
      options: ["3 4 true", "3 0 true", "3 0 false", "4 4 true", "3 8 true"],
      answer: [0],
      explain: "L'indentation accessoire est l'indentation commune aux lignes de contenu **et** à la ligne du délimiteur fermant. Celui-ci est 4 colonnes à gauche de `alpha` : seuls ses 4 espaces sont retirés, et chaque ligne garde 4 espaces essentiels, d'où `indexOf(\"alpha\")` = 4 (0 si le délimiteur était aligné sur le texte). Le délimiteur étant sur sa propre ligne, la chaîne se termine par `\\n`, mais `lines()` ne compte pas de ligne vide finale : 3 lignes."
    },
    {
      id: "values-026",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`String t = """
    a \
    b\s
    c
    d""";
System.out.print(t.replace(' ', '.'));`,
      options: [
        String.raw`a.b.
c
d`,
        String.raw`a.
b.
c
d`,
        String.raw`a.b
c
d`,
        String.raw`a.b.c.d`,
        "The code does not compile"
      ],
      answer: [0],
      explain: "Un `\\` en fin de ligne est une continuation : aucun saut de ligne n'est inséré, et l'espace qui le précède est conservé, donc `a ` et `b` sont sur la même ligne. `\\s` représente un espace (utile en fin de ligne, où les espaces ordinaires sont supprimés) : la première ligne vaut `a b ` avec un espace final. Les lignes `c` et `d` sont séparées par des `\\n` ; le délimiteur fermant étant collé à `d`, il n'y a pas de saut de ligne final."
    },
    {
      id: "values-027",
      difficulty: 2,
      q: "Which of the following declarations compile? (Choose two.)",
      options: [
        String.raw`String a = """hello""";`,
        String.raw`String b = """
    hello""";`,
        String.raw`String c = """
    say "hi" and ""bye""
    """;`,
        String.raw`String d = """
    end with """
    """;`,
        String.raw`String e = """ """;`
      ],
      answer: [1, 2],
      explain: "Le délimiteur ouvrant `\"\"\"` doit être suivi d'un saut de ligne : `\"\"\"hello\"\"\"` et `\"\"\" \"\"\"` ne compilent pas. Le délimiteur fermant peut être collé au contenu (pas de `\\n` final). Un ou deux guillemets consécutifs sont autorisés sans échappement dans le contenu. En revanche trois guillemets consécutifs ferment le bloc : dans la déclaration `d`, le bloc se termine après `end with` et la suite n'est plus du Java valide ; il faudrait écrire `\\\"\"\"`."
    },
    {
      id: "values-028",
      difficulty: 1,
      q: "Which of the following local variable declarations compile? (Choose two.)",
      options: [
        "var a = 10_000L;",
        "var b = null;",
        "var c = {1, 2};",
        "var d = 1, e = 2;",
        "var f = 'x' + 1;",
        "var g; g = 5;"
      ],
      answer: [0, 4],
      explain: "`var` exige un initialiseur dont le type peut être inféré : `10_000L` est un `long`, `'x' + 1` est un `int` (promotion du `char`). `null` seul n'a pas de type, un initialiseur de tableau `{1, 2}` a besoin d'un type cible explicite, `var` n'est pas autorisé dans une déclaration multiple (`var d = 1, e = 2;`), et `var g;` sans initialiseur est interdit même si l'affectation suit immédiatement."
    },
    {
      id: "values-029",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`LocalDate d = LocalDate.of(2024, 1, 31);
d.plusMonths(1);
d = d.plusDays(1).withDayOfMonth(15);
System.out.println(d);`,
      options: ["2024-02-15", "2024-03-15", "2024-01-15", "2024-02-01", "2024-03-01"],
      answer: [0],
      explain: "Les classes de `java.time` sont immuables : le résultat de `d.plusMonths(1);` n'est pas affecté, `d` reste au 31 janvier (les réponses en mars supposent à tort que `d` a été modifié). Ensuite `plusDays(1)` donne le 1er février 2024 et `withDayOfMonth(15)` remplace le jour : 2024-02-15. Cette fois le résultat est réaffecté à `d`."
    },
    {
      id: "values-030",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`LocalDate a = LocalDate.of(2024, 1, 31).plusMonths(1);
System.out.println(a);
LocalDate b = LocalDate.of(2023, 2, 29);
System.out.println(b);`,
      options: [
        "It prints 2024-02-29 and then throws a DateTimeException",
        "It throws a DateTimeException without printing anything",
        String.raw`It prints:
2024-02-29
2023-03-01`,
        String.raw`It prints:
2024-03-02
2023-03-01`,
        "The code does not compile"
      ],
      answer: [0],
      explain: "`plusMonths` ne lève jamais d'exception pour un jour inexistant : le 31 février est ramené au dernier jour valide du mois, le 29 février 2024 (année bissextile), et non reporté en mars. En revanche les fabriques `of` valident strictement leurs arguments : 2023 n'est pas bissextile, `LocalDate.of(2023, 2, 29)` lève une `DateTimeException` à l'exécution. Le code compile car les arguments sont de simples `int`."
    },
    {
      id: "values-031",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`Period p = Period.ofYears(1).ofMonths(2).ofDays(3);
LocalDate d = LocalDate.of(2024, 1, 1).plus(p);
System.out.println(d + " " + p);`,
      options: [
        "2024-01-04 P3D",
        "2025-03-04 P1Y2M3D",
        "2025-03-04 P3D",
        "2024-01-04 P1Y2M3D",
        "The code does not compile"
      ],
      answer: [0],
      explain: "`ofYears`, `ofMonths` et `ofDays` sont des méthodes **statiques** : les appeler sur une instance compile mais l'instance est ignorée. Seul le dernier appel compte : `p` vaut `Period.ofDays(3)`, affiché `P3D`, et la date devient 2024-01-04. Pour obtenir un an, deux mois et trois jours il faut `Period.of(1, 2, 3)`."
    },
    {
      id: "values-032",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`LocalDate date = LocalDate.of(2024, 3, 10);
Duration d = Duration.ofDays(1);
System.out.println(date.plus(d));`,
      options: [
        "2024-03-11",
        "2024-03-10",
        "2024-03-11T00:00",
        "The code does not compile",
        "An UnsupportedTemporalTypeException is thrown at runtime"
      ],
      answer: [4],
      explain: "`plus` accepte un `TemporalAmount`, interface implémentée par `Period` et par `Duration` : le code compile. Mais une `Duration` est exprimée en secondes et nanosecondes, même créée avec `ofDays` (elle vaut `PT24H`), et `LocalDate` ne gère pas les secondes : `UnsupportedTemporalTypeException: Unsupported unit: Seconds`. Pour ajouter un jour à un `LocalDate`, utiliser `Period.ofDays(1)` ou `plusDays(1)`."
    },
    {
      id: "values-033",
      difficulty: 3,
      q: "In the America/New_York time zone, daylight saving time starts on March 10, 2024: at 02:00 the clocks move forward to 03:00. What is the output of the following code?",
      code: String.raw`ZonedDateTime z = ZonedDateTime.of(LocalDate.of(2024, 3, 10),
        LocalTime.of(1, 30), ZoneId.of("America/New_York"));
ZonedDateTime a = z.plusHours(1);
ZonedDateTime b = z.plus(Duration.ofDays(1));
ZonedDateTime c = z.plus(Period.ofDays(1));
System.out.println(a.getHour() + " " + b.getHour() + " " + c.getHour());`,
      options: ["3 2 1", "2 1 1", "3 1 1", "3 2 2", "2 2 1"],
      answer: [0],
      explain: "`z` vaut 01:30 avec le décalage -05:00. `plusHours(1)` travaille sur l'instant : une heure plus tard il est 03:30 (-04:00), car 02:30 n'existe pas ce jour-là. `Duration.ofDays(1)` vaut exactement 24 heures réelles ; comme la journée du 10 mars ne dure que 23 heures, on arrive le 11 mars à 02:30. `Period.ofDays(1)` ajoute un jour calendaire en conservant l'heure locale : 11 mars à 01:30."
    },
    {
      id: "values-034",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`var start = LocalDateTime.of(2024, 1, 1, 22, 0);
var end = LocalDateTime.of(2024, 1, 3, 10, 0);
System.out.println(ChronoUnit.DAYS.between(start, end) + " "
        + ChronoUnit.HOURS.between(end, start) + " "
        + Duration.between(start, end).toHours());`,
      options: ["1 -36 36", "2 -36 36", "1 36 36", "2 36 36", "1 -36 12"],
      answer: [0],
      explain: "Entre le 1er janvier 22:00 et le 3 janvier 10:00 il s'écoule 36 heures. `ChronoUnit.DAYS.between` compte les jours **complets** (troncature) : 1, et non 2 comme le suggère la différence des dates. `between(end, start)` avec les arguments inversés donne un résultat négatif : -36. `Duration.toHours()` renvoie le total en heures (36) ; 12 serait le résultat de `toHoursPart()`."
    },
    {
      id: "values-035",
      difficulty: 3,
      q: "On June 1, 2024, the offset of Europe/Paris is +02:00 and the offset of America/New_York is -04:00. What is the output of the following code?",
      code: String.raw`ZonedDateTime z1 = ZonedDateTime.of(2024, 6, 1, 12, 0, 0, 0,
        ZoneId.of("Europe/Paris"));
ZonedDateTime z2 = ZonedDateTime.of(2024, 6, 1, 6, 0, 0, 0,
        ZoneId.of("America/New_York"));
System.out.println(z1.toInstant().equals(z2.toInstant()) + " "
        + z1.equals(z2) + " " + z1.isEqual(z2) + " "
        + Duration.between(z1, z2).toHours());`,
      options: [
        "true false true 0",
        "true true true 0",
        "false false false -6",
        "true false true -6",
        "false false false 6"
      ],
      answer: [0],
      explain: "Pour obtenir l'heure UTC on soustrait le décalage : 12:00+02:00 correspond à 10:00Z et 06:00-04:00 correspond aussi à 10:00Z. Les deux `Instant` sont donc égaux, `isEqual` (qui compare les instants) vaut `true` et la `Duration` entre les deux est nulle (0 heure, et non -6 qui est l'écart des heures locales). En revanche `ZonedDateTime.equals` compare aussi l'heure locale et le fuseau : `false`."
    }
  ]
});
