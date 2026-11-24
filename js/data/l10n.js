OCP.register({
  topic: 'l10n',
  course: [
    {
      title: "Locale : format, création, locale par défaut",
      blocks: [
        { p: "Une `java.util.Locale` désigne une langue, éventuellement un pays (région) et une variante. Sa forme textuelle (`toString()`) est `langue` ou `langue_PAYS` : **langue en minuscules** (2 lettres), underscore, **pays en majuscules** (2 lettres)." },
        { table: { head: ["Chaîne", "Valide ?", "Pourquoi"], rows: [
          ["`fr`", "oui", "langue seule"],
          ["`fr_CA`", "oui", "langue + pays"],
          ["`CA`", "non", "un pays seul n'est pas une locale"],
          ["`CA_fr`", "non", "ordre inversé"],
          ["`FR_ca`, `fr_ca`", "non", "casse incorrecte"],
          ["`fr-CA`", "tag IETF", "format de `Locale.forLanguageTag`, pas celui de `toString()` ni des noms de fichiers"]
        ] } },
        { h: "Créer une Locale" },
        { code: String.raw`Locale a = Locale.FRENCH;                    // fr      (langue)
Locale b = Locale.FRANCE;                    // fr_FR   (langue + pays)
Locale c = Locale.of("fr");                  // Java 19+
Locale d = Locale.of("fr", "CA");            // langue, pays
Locale e = Locale.of("fr", "CA", "variant"); // langue, pays, variante
Locale f = new Locale.Builder()              // ordre des setters libre
        .setRegion("CA")
        .setLanguage("fr")
        .build();
Locale g = Locale.forLanguageTag("fr-CA");   // tiret, pas underscore
Locale h = new Locale("fr", "CA");           // compile, mais deprecated depuis 19` },
        { list: [
          "Constantes de langue : `Locale.ENGLISH`, `Locale.FRENCH`, `Locale.GERMAN`… ; constantes de pays : `Locale.US`, `Locale.UK`, `Locale.FRANCE`, `Locale.GERMANY`, `Locale.CANADA`, `Locale.CANADA_FRENCH`…",
          "`Locale.of` existe en 3 surcharges (1, 2 ou 3 `String`). Il normalise la casse : `Locale.of(\"FR\", \"ca\")` affiche `fr_CA`.",
          "`Locale.Builder` : classe imbriquée statique, s'instancie avec `new Locale.Builder()`, méthodes `setLanguage`, `setRegion`, `build()`. Il **valide** ses arguments (`IllformedLocaleException`).",
          "Les constructeurs `new Locale(...)` sont **deprecated depuis Java 19** : avertissement, pas erreur de compilation."
        ] },
        { trap: "`Locale.of` ne valide rien : `Locale.of(\"CA\", \"fr\")` compile, s'exécute et donne la locale absurde `ca_FR` (langue « ca », pays « FR »). Aucune exception. Il n'existe ni `Locale.Builder()` sans `new`, ni `Locale.builder()`, ni `setRegion` sur `Locale` (une `Locale` est immuable)." },
        { h: "Locale par défaut et Locale.Category" },
        { code: String.raw`Locale current = Locale.getDefault();
Locale.setDefault(Locale.GERMANY);                        // toutes les catégories
Locale.setDefault(Locale.Category.FORMAT, Locale.FRANCE); // dates, nombres, monnaies
Locale.setDefault(Locale.Category.DISPLAY, Locale.US);    // libellés affichés
Locale fmt = Locale.getDefault(Locale.Category.FORMAT);` },
        { table: { head: ["Catégorie", "Utilisée pour"], rows: [
          ["`Locale.Category.DISPLAY`", "textes d'interface : `getDisplayCountry()`, `getDisplayLanguage()`, noms affichés"],
          ["`Locale.Category.FORMAT`", "formatage et analyse : `NumberFormat`, `DateTimeFormatter`, monnaies"]
        ] } },
        { trap: "`Locale.setDefault(locale)` (un seul argument) **réinitialise aussi les deux catégories**. Un `setDefault(Category.FORMAT, x)` placé avant est donc écrasé. L'ordre des appels compte." },
        { tip: "`setDefault` ne modifie que la JVM en cours d'exécution, jamais le réglage du système." }
      ]
    },
    {
      title: "Resource bundles : nommage et recherche",
      blocks: [
        { p: "Un `ResourceBundle` associe des clés à des valeurs localisées. À l'examen il est presque toujours fourni par des fichiers `.properties` placés sur le classpath." },
        { h: "Nommage des fichiers" },
        { list: [
          "`Zoo.properties` : bundle de base (défaut)",
          "`Zoo_fr.properties` : langue",
          "`Zoo_fr_CA.properties` : langue + pays",
          "Le nom passé à `getBundle` est le nom de base **sans** suffixe de locale ni extension : `\"Zoo\"`."
        ] },
        { code: String.raw`ResourceBundle rb1 = ResourceBundle.getBundle("Zoo");          // locale par défaut
ResourceBundle rb2 = ResourceBundle.getBundle("Zoo", locale);  // locale demandée
String s = rb2.getString("hello");
Set<String> keys = rb2.keySet();     // inclut les clés héritées des parents` },
        { h: "Ordre de recherche du bundle" },
        { p: "Pour `getBundle(\"Zoo\", Locale.of(\"fr\", \"FR\"))` avec une locale par défaut `en_US`, Java prend le **premier** fichier trouvé dans cet ordre :" },
        { table: { head: ["Étape", "Fichier cherché", "Origine"], rows: [
          ["1", "`Zoo_fr_FR.properties`", "locale demandée"],
          ["2", "`Zoo_fr.properties`", "langue de la locale demandée"],
          ["3", "`Zoo_en_US.properties`", "locale par défaut"],
          ["4", "`Zoo_en.properties`", "langue de la locale par défaut"],
          ["5", "`Zoo.properties`", "bundle de base"],
          ["6", "`MissingResourceException`", "rien trouvé"]
        ] } },
        { trap: "La locale par défaut passe **avant** le bundle de base. Si on demande `de_DE` et qu'il existe `Zoo_en.properties` et `Zoo.properties` (défaut `en_US`), c'est `Zoo_en` qui est choisi, pas `Zoo`." },
        { h: "Héritage des clés" },
        { p: "Une fois le bundle sélectionné, une clé est cherchée dans ce bundle puis dans ses **parents** : on retire un élément du nom à chaque fois (`Zoo_fr_FR` → `Zoo_fr` → `Zoo`). Les valeurs peuvent donc provenir de fichiers différents." },
        { trap: "La chaîne de la locale par défaut n'est **pas** mélangée à celle du bundle choisi. Si `Zoo_fr` est sélectionné, les clés ne sont cherchées que dans `Zoo_fr` puis `Zoo` ; une clé présente uniquement dans `Zoo_en` provoque une `MissingResourceException`." },
        { list: [
          "`MissingResourceException` est **unchecked** (`RuntimeException`). Elle est levée par `getBundle` si aucun bundle n'est trouvé, et par `getString` si la clé est absente de toute la chaîne de parents (jamais de `null`).",
          "Un bundle peut aussi être une classe Java (`ListResourceBundle`) ; à nom égal, la classe est préférée au fichier `.properties`."
        ] },
        { h: "Syntaxe d'un fichier .properties" },
        { code: String.raw`# commentaire
! autre commentaire
hello=Bonjour
name = Zoo de Paris
open:9h
close 18h
long=premiere partie \
     suite de la valeur` },
        { list: [
          "Séparateur clé/valeur : `=`, `:` ou un espace. Les espaces autour du séparateur sont ignorés.",
          "Commentaire : ligne commençant par `#` ou `!`.",
          "Un `\\` en fin de ligne poursuit la valeur sur la ligne suivante."
        ] }
      ]
    },
    {
      title: "MessageFormat et Properties",
      blocks: [
        { h: "MessageFormat" },
        { p: "`java.text.MessageFormat.format(String pattern, Object... args)` remplace les paramètres `{0}`, `{1}`… par les arguments de même index (à partir de 0). Sert à injecter des valeurs dans un texte venu d'un resource bundle." },
        { code: String.raw`String pattern = "{1} sees {0} and {1}";
String s = MessageFormat.format(pattern, "Ann", "Bob");
// Bob sees Ann and Bob` },
        { list: [
          "Un index peut être réutilisé plusieurs fois et l'ordre est libre.",
          "Un index sans argument correspondant reste tel quel dans le résultat (`{2}`), sans exception.",
          "Un argument en trop est simplement ignoré."
        ] },
        { trap: "L'index commence à `{0}`, pas à `{1}`. Dans un pattern `MessageFormat`, l'apostrophe est un caractère d'échappement : pour afficher une apostrophe il faut la doubler (`''`)." },
        { h: "Properties" },
        { p: "`java.util.Properties` est une `Map` (elle étend `Hashtable<Object,Object>`) spécialisée pour des couples `String`/`String`." },
        { code: String.raw`var props = new Properties();
props.setProperty("a", "1");
props.getProperty("a");        // "1"
props.getProperty("c");        // null
props.getProperty("c", "y");   // "y"  (valeur par défaut)
props.get("c");                // null (méthode de Map, retourne Object)` },
        { trap: "Le paramètre de valeur par défaut n'existe que sur `getProperty(key, default)`. `get(key)` vient de `Map`, retourne `Object` et n'a pas de version à deux arguments avec défaut (c'est `getOrDefault`). `ResourceBundle.getString`, lui, lève une exception au lieu de retourner `null`." }
      ]
    },
    {
      title: "Formater et analyser des nombres",
      blocks: [
        { p: "`java.text.NumberFormat` est une classe **abstraite** : on obtient une instance par une méthode de fabrique statique, sans argument (locale par défaut de catégorie `FORMAT`) ou avec une `Locale`." },
        { table: { head: ["Fabrique", "Rôle", "Exemple en `Locale.US`"], rows: [
          ["`getInstance()` / `getNumberInstance()`", "nombre général (3 décimales max)", "`1234.56789` → `1,234.568`"],
          ["`getIntegerInstance()`", "arrondit à l'entier", "`1234.9` → `1,235`"],
          ["`getCurrencyInstance()`", "monnaie", "`1234.5` → `$1,234.50`"],
          ["`getPercentInstance()`", "pourcentage (× 100)", "`0.256` → `26%`"],
          ["`getCompactNumberInstance()`", "forme compacte", "`7_654_321` → `8M`"]
        ] } },
        { list: [
          "`String format(long)` / `format(double)` : nombre → texte.",
          "`Number parse(String) throws ParseException` : texte → nombre. `ParseException` (`java.text`) est **checked**.",
          "Arrondi par défaut : `RoundingMode.HALF_EVEN` (arrondi du banquier). Avec `getIntegerInstance` : `2.5` → `2`, `3.5` → `4`.",
          "Le séparateur dépend de la locale : `1,234.5` en `en_US`, `1.234,5` en `de_DE`."
        ] },
        { h: "Analyse partielle" },
        { p: "`parse` lit le plus long préfixe qui a un sens pour la locale, puis **s'arrête sans erreur**. Il ne lève `ParseException` que si le **début** de la chaîne est inutilisable." },
        { code: String.raw`NumberFormat us = NumberFormat.getInstance(Locale.US);
NumberFormat fr = NumberFormat.getInstance(Locale.FRANCE);
us.parse("40.45");   // 40.45
fr.parse("40.45");   // 40     (le point n'est pas décimal en français)
us.parse("12abc");   // 12
us.parse("x40");     // ParseException` },
        { trap: "Un `parse` sans `try`/`catch` ni `throws ParseException` ne compile pas. Avec `getCurrencyInstance(Locale.US)`, `parse(\"12.50\")` lève `ParseException` car le symbole `$` attendu est absent ; `parse(\"$12.50\")` donne `12.5`." },
        { h: "CompactNumberFormat" },
        { code: String.raw`NumberFormat s = NumberFormat.getCompactNumberInstance(Locale.US, NumberFormat.Style.SHORT);
NumberFormat l = NumberFormat.getCompactNumberInstance(Locale.US, NumberFormat.Style.LONG);
s.format(7_654_321);   // 8M
l.format(7_654_321);   // 8 million
s.format(999);         // 999
l.format(1_499);       // 1 thousand
s.format(314_900_000); // 315M` },
        { list: [
          "`getCompactNumberInstance()` sans argument : locale par défaut et `Style.SHORT`.",
          "`NumberFormat.Style` est une enum à deux valeurs : `SHORT` (`K`, `M`, `B`…) et `LONG` (`thousand`, `million`…).",
          "Par défaut, le nombre est **arrondi à l'entier le plus proche** dans son unité (HALF_EVEN), sans décimale : `7_654_321` → `8M`, pas `7.65M` ni `7M`.",
          "En dessous de mille, le nombre est affiché tel quel."
        ] },
        { h: "DecimalFormat" },
        { p: "`new DecimalFormat(pattern)` (sous-classe concrète de `NumberFormat`) formate selon un motif, avec les symboles de la locale par défaut." },
        { table: { head: ["Symbole", "Signification"], rows: [
          ["`#`", "chiffre affiché seulement s'il existe (position omise sinon)"],
          ["`0`", "chiffre toujours affiché, `0` si absent"],
          ["`.`", "séparateur décimal"],
          ["`,`", "séparateur de groupes"]
        ] } },
        { code: String.raw`double d = 1234.567;
new DecimalFormat("#,##0.0").format(d);   // 1,234.6
new DecimalFormat("00000.00").format(d);  // 01234.57
new DecimalFormat("#.#####").format(d);   // 1234.567
new DecimalFormat("#.00").format(0.5);    // .50
new DecimalFormat("0.##").format(5);      // 5` },
        { trap: "Les `#` et `0` à gauche du point ne tronquent jamais la partie entière : `#.#` appliqué à `1234.567` donne `1234.6`. Ce sont les décimales qui sont arrondies au nombre de positions du motif." }
      ]
    },
    {
      title: "DateTimeFormatter : motifs personnalisés",
      blocks: [
        { p: "`java.time.format.DateTimeFormatter` est immuable et thread-safe. `DateTimeFormatter.ofPattern(String)` ou `ofPattern(String, Locale)` construit un formateur à partir de lettres ; le **nombre de lettres** fixe la forme." },
        { table: { head: ["Symbole", "Champ", "Exemples (9 mars 2025, 14:05:07)"], rows: [
          ["`y`", "année", "`yy` → `25`, `yyyy` → `2025`"],
          ["`M`", "mois", "`M` → `3`, `MM` → `03`, `MMM` → `Mar`, `MMMM` → `March`"],
          ["`d`", "jour du mois", "`d` → `9`, `dd` → `09`"],
          ["`H`", "heure 0-23", "`H` → `14`, `HH` → `14`"],
          ["`h`", "heure 1-12", "`h` → `2`, `hh` → `02`"],
          ["`m`", "minute", "`m` → `5`, `mm` → `05`"],
          ["`s`", "seconde", "`s` → `7`, `ss` → `07`"],
          ["`a`", "AM / PM", "`PM`"],
          ["`z`", "nom du fuseau", "`CET` (exige un fuseau)"],
          ["`Z`", "décalage", "`+0100` (exige un fuseau)"]
        ] } },
        { trap: "`M` majuscule = mois, `m` minuscule = minute. `H` = heure sur 24, `h` = heure sur 12 (à combiner avec `a`). Confondre `MM` et `mm` ne lève pas forcément d'exception : le résultat est juste faux." },
        { h: "Texte littéral" },
        { p: "Tout texte littéral se place entre **apostrophes simples**. Une lettre non échappée est interprétée comme un symbole ; une lettre inconnue fait échouer `ofPattern` avec une `IllegalArgumentException`. Une apostrophe littérale s'écrit `''`." },
        { code: String.raw`var dt = LocalDateTime.of(2025, 3, 9, 14, 5, 7);
var f = DateTimeFormatter.ofPattern("MMM d, yy 'at' hh:mm", Locale.US);
dt.format(f);                              // Mar 9, 25 at 02:05
f.format(dt);                              // identique
DateTimeFormatter.ofPattern("yyyy at HH"); // IllegalArgumentException (lettre t)` },
        { tip: "`format` s'appelle dans les deux sens : `temporal.format(formatter)` ou `formatter.format(temporal)`. En revanche `date.format(\"yyyy\")` ne compile pas (un `DateTimeFormatter` est attendu) et `new DateTimeFormatter(...)` non plus (pas de constructeur public)." },
        { h: "Le type doit posséder les champs du motif" },
        { table: { head: ["Type", "`y M d`", "`H h m s a`", "`z Z`"], rows: [
          ["`LocalDate`", "oui", "exception", "exception"],
          ["`LocalTime`", "exception", "oui", "exception"],
          ["`LocalDateTime`", "oui", "oui", "exception"],
          ["`ZonedDateTime`", "oui", "oui", "oui"]
        ] } },
        { trap: "L'erreur est levée **à l'exécution**, au moment du `format`, jamais à la compilation : `UnsupportedTemporalTypeException` (sous-classe de `DateTimeException`) pour un champ absent, `DateTimeException` pour un fuseau demandé à un type sans fuseau. Toutes sont unchecked." }
      ]
    },
    {
      title: "Formats localisés, ISO et analyse de dates",
      blocks: [
        { h: "Formateurs ISO prédéfinis" },
        { list: [
          "`DateTimeFormatter.ISO_LOCAL_DATE` → `2025-03-09`",
          "`DateTimeFormatter.ISO_LOCAL_TIME` → `14:05:07`",
          "`DateTimeFormatter.ISO_LOCAL_DATE_TIME` → `2025-03-09T14:05:07`",
          "Un `LocalDateTime` accepte `ISO_LOCAL_DATE` (seule la date est écrite) ; un `LocalDate` formaté avec `ISO_LOCAL_DATE_TIME` lève `UnsupportedTemporalTypeException`."
        ] },
        { h: "Styles localisés" },
        { code: String.raw`DateTimeFormatter.ofLocalizedDate(FormatStyle.SHORT);
DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT);
DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM);
DateTimeFormatter.ofLocalizedDateTime(FormatStyle.FULL, FormatStyle.SHORT); // date, heure` },
        { table: { head: ["`FormatStyle`", "Date (en_US)", "Heure", "Fuseau requis pour l'heure ?"], rows: [
          ["`SHORT`", "`3/9/25`", "heures et minutes", "non"],
          ["`MEDIUM`", "`Mar 9, 2025`", "avec secondes", "non"],
          ["`LONG`", "`March 9, 2025`", "avec fuseau abrégé", "**oui**"],
          ["`FULL`", "`Sunday, March 9, 2025`", "avec nom complet du fuseau", "**oui**"]
        ] } },
        { list: [
          "`ofLocalizedDate` : fonctionne avec `LocalDate`, `LocalDateTime`, `ZonedDateTime`, quel que soit le style. Avec `LocalTime` : exception.",
          "`ofLocalizedTime` : exige les champs d'heure ; `LocalDate` → `UnsupportedTemporalTypeException`.",
          "`ofLocalizedTime` et `ofLocalizedDateTime` en `LONG` ou `FULL` : la partie heure affiche le fuseau, donc `LocalDateTime` ou `LocalTime` → `DateTimeException` ; il faut un `ZonedDateTime`.",
          "`ofLocalizedDateTime` : exige date **et** heure."
        ] },
        { trap: "`ofLocalizedDateTime(FormatStyle.LONG)` appliqué à un `LocalDateTime` compile mais lève `DateTimeException` à l'exécution. `SHORT` et `MEDIUM` fonctionnent sans fuseau." },
        { h: "withLocale" },
        { p: "Un formateur localisé utilise la locale par défaut de catégorie `FORMAT` **au moment de sa création**. `withLocale(locale)` retourne un **nouveau** formateur ; l'original n'est pas modifié (immuable)." },
        { code: String.raw`var f = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.US);
f.withLocale(Locale.FRANCE);                 // résultat ignoré : f inchangé
f.format(LocalDate.of(2025, 3, 9));          // March 2025
f.withLocale(Locale.FRANCE)
 .format(LocalDate.of(2025, 3, 9));          // mars 2025` },
        { tip: "Les sorties localisées exactes (espaces, virgules, abréviations) varient selon la version du JDK et de CLDR. L'examen s'appuie sur les règles : quel style exige un fuseau, quel appel lève une exception, quelle locale s'applique." },
        { h: "Analyse (parsing)" },
        { code: String.raw`LocalDate.parse("2025-03-09");                        // ISO_LOCAL_DATE par défaut
LocalTime.parse("14:05");
var f = DateTimeFormatter.ofPattern("dd/MM/yyyy");
LocalDate d = LocalDate.parse("03/09/2025", f);       // 3 septembre 2025
System.out.println(d);                                // 2025-09-03` },
        { list: [
          "`parse` est une méthode **statique** du type temporel : `LocalDate.parse(text)` ou `LocalDate.parse(text, formatter)`.",
          "Le texte doit correspondre exactement au motif : `LocalDate.parse(\"2025-3-9\")` et `LocalDate.parse(\"3/9/2025\", f)` avec `dd/MM/yyyy` lèvent `DateTimeParseException` (unchecked, sous-classe de `DateTimeException`).",
          "`toString()` d'une date reste au format ISO, quel que soit le formateur utilisé pour la lire."
        ] }
      ]
    }
  ],
  questions: [
    {
      id: "l10n-001",
      difficulty: 1,
      q: "Which of the following follow the locale format used by Java, for example as the suffix of a resource bundle file name? (Choose two.)",
      options: ["en", "en_US", "US", "US_en", "EN_us", "en-us"],
      answer: [0, 1],
      explain: "Le format est `langue` ou `langue_PAYS` : langue en minuscules, underscore, pays en majuscules. `en` (langue seule) et `en_US` sont corrects. `US` est un pays seul, ce qui ne forme pas une locale. `US_en` inverse l'ordre, `EN_us` inverse la casse, et `en-us` utilise un tiret (forme proche des tags IETF de `Locale.forLanguageTag`, pas celle de `toString()` ni des noms de fichiers)."
    },
    {
      id: "l10n-002",
      difficulty: 2,
      q: "Which of the following statements fail to compile? (Choose two.)",
      options: [
        String.raw`Locale l = Locale.of("fr", "CA");`,
        String.raw`Locale l = new Locale("fr", "CA");`,
        String.raw`Locale l = new Locale.Builder().setRegion("CA").setLanguage("fr").build();`,
        String.raw`Locale l = Locale.Builder().setLanguage("fr").build();`,
        String.raw`Locale l = Locale.of("fr").setRegion("CA");`,
        String.raw`Locale l = Locale.forLanguageTag("fr-CA");`
      ],
      answer: [3, 4],
      explain: "`Locale.Builder` est une classe imbriquée : il faut l'instancier avec `new Locale.Builder()` ; `Locale.Builder()` sans `new` est lu comme un appel de méthode inexistante (`cannot find symbol`). `Locale` est immuable et n'a pas de méthode `setRegion` : seul le builder en possède une. Les autres compilent : `Locale.of` (Java 19+), le builder dont les setters s'enchaînent dans n'importe quel ordre, `forLanguageTag` avec un tiret. `new Locale(\"fr\", \"CA\")` est **deprecated** depuis Java 19 : cela produit un avertissement, pas une erreur."
    },
    {
      id: "l10n-003",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`Locale.setDefault(Locale.Category.FORMAT, Locale.GERMANY);
Locale.setDefault(Locale.US);
Locale.setDefault(Locale.Category.DISPLAY, Locale.GERMANY);

System.out.println(NumberFormat.getInstance().format(1234.5));
System.out.println(Locale.ITALY.getDisplayCountry());`,
      options: [
        String.raw`1,234.5
Italien`,
        String.raw`1.234,5
Italien`,
        String.raw`1,234.5
Italy`,
        String.raw`1.234,5
Italy`
      ],
      answer: [0],
      explain: "`Locale.setDefault(Locale.US)` (un seul argument) fixe la locale par défaut **et réinitialise les deux catégories** : le `FORMAT` allemand défini juste avant est écrasé. Ensuite seule la catégorie `DISPLAY` passe à l'allemand. `NumberFormat.getInstance()` utilise la catégorie `FORMAT` (US) : `1,234.5`. `getDisplayCountry()` utilise la catégorie `DISPLAY` (allemand) : `Italien`. `1.234,5` serait le format allemand, obtenu si l'on oubliait la réinitialisation ; `Italy` si l'on croyait que `DISPLAY` suit la locale par défaut générale."
    },
    {
      id: "l10n-004",
      difficulty: 1,
      q: "The default locale is en_US and the classpath contains exactly these four files, each defining the key hello. What does the code print?",
      code: String.raw`// Zoo.properties        hello=Hi
// Zoo_en.properties     hello=Hello
// Zoo_fr.properties     hello=Bonjour
// Zoo_fr_FR.properties  hello=Salut

ResourceBundle rb = ResourceBundle.getBundle("Zoo", Locale.of("fr", "CA"));
System.out.println(rb.getString("hello"));`,
      options: ["Bonjour", "Salut", "Hello", "Hi", "A MissingResourceException is thrown"],
      answer: [0],
      explain: "Pour la locale demandée `fr_CA`, Java cherche d'abord `Zoo_fr_CA` (absent), puis la langue seule `Zoo_fr` : trouvé, donc `Bonjour`. `Zoo_fr_FR` n'est jamais candidat : un autre pays de la même langue n'est pas consulté. `Zoo_en` (locale par défaut) et `Zoo` (base) ne seraient examinés que si aucun fichier `fr` n'existait."
    },
    {
      id: "l10n-005",
      difficulty: 3,
      q: "The classpath contains exactly the four files described in the comments. What is the output?",
      code: String.raw`// Park.properties        name=Park      open=always    fee=5
// Park_en.properties                    open=weekdays  fee=7
// Park_en_US.properties  name=US Park
// Park_fr.properties     name=Parc

Locale.setDefault(Locale.US);
var rb = ResourceBundle.getBundle("Park", Locale.of("de", "DE"));
System.out.println(rb.getString("name") + ", " + rb.getString("open")
        + ", " + rb.getString("fee"));`,
      options: [
        "US Park, weekdays, 7",
        "Park, always, 5",
        "US Park, always, 5",
        "Park, weekdays, 7",
        "A MissingResourceException is thrown"
      ],
      answer: [0],
      explain: "Aucun fichier `Park_de_DE` ni `Park_de` : Java passe à la **locale par défaut** `en_US` avant le bundle de base, et sélectionne `Park_en_US`. Les clés sont ensuite résolues dans la chaîne de parents `Park_en_US` → `Park_en` → `Park` : `name` vient de `Park_en_US` (`US Park`), `open` et `fee` du premier parent qui les définit, `Park_en` (`weekdays`, `7`). `Park, always, 5` suppose à tort que le bundle de base est choisi directement ; `US Park, always, 5` oublie le parent intermédiaire `Park_en`."
    },
    {
      id: "l10n-006",
      difficulty: 3,
      q: "The classpath contains exactly the four files described in the comments. What is the result?",
      code: String.raw`// Shop.properties        name=Shop
// Shop_en.properties     name=Store     hours=9-5
// Shop_en_US.properties                 hours=9-9
// Shop_fr.properties     name=Boutique

Locale.setDefault(Locale.US);
var rb = ResourceBundle.getBundle("Shop", Locale.FRANCE);
System.out.println(rb.getString("name"));
System.out.println(rb.getString("hours"));`,
      options: [
        "Boutique is printed, then a MissingResourceException is thrown",
        String.raw`Boutique
9-9`,
        String.raw`Boutique
9-5`,
        String.raw`Store
9-9`,
        "A MissingResourceException is thrown before anything is printed"
      ],
      answer: [0],
      explain: "Pour `fr_FR`, `Shop_fr_FR` n'existe pas mais `Shop_fr` oui : il est sélectionné et `name` vaut `Boutique`. La clé `hours` est ensuite cherchée uniquement dans la chaîne de parents du bundle choisi : `Shop_fr` puis `Shop`. Aucun des deux ne la définit, donc `getString` lève `MissingResourceException`. Les bundles de la locale par défaut (`Shop_en_US`, `Shop_en`) ne servent que pendant la **sélection** du bundle ; ils ne sont jamais mélangés à la chaîne d'héritage d'un bundle d'une autre langue. `getString` ne retourne jamais `null`."
    },
    {
      id: "l10n-007",
      difficulty: 2,
      q: "The default locale is en_US. Which list gives the order of preference in which the following call selects a resource bundle file (the first file of the list that exists is the one selected)?",
      code: String.raw`ResourceBundle.getBundle("Zoo", Locale.of("fr", "FR"));`,
      options: [
        String.raw`Zoo_fr_FR.properties
Zoo_fr.properties
Zoo_en_US.properties
Zoo_en.properties
Zoo.properties`,
        String.raw`Zoo_fr_FR.properties
Zoo_fr.properties
Zoo.properties
Zoo_en_US.properties
Zoo_en.properties`,
        String.raw`Zoo_fr_FR.properties
Zoo_fr.properties
Zoo.properties`,
        String.raw`Zoo_fr_FR.properties
Zoo_en_US.properties
Zoo_fr.properties
Zoo_en.properties
Zoo.properties`,
        String.raw`Zoo.properties
Zoo_fr.properties
Zoo_fr_FR.properties`
      ],
      answer: [0],
      explain: "Ordre de priorité : locale demandée (`Zoo_fr_FR`), sa langue seule (`Zoo_fr`), locale par défaut (`Zoo_en_US`), sa langue seule (`Zoo_en`), enfin le bundle de base (`Zoo`). Si rien n'est trouvé : `MissingResourceException`. Le piège principal est de placer le bundle de base avant la locale par défaut, ou d'oublier complètement la locale par défaut. La langue de la locale demandée est épuisée avant de passer à la locale par défaut."
    },
    {
      id: "l10n-008",
      difficulty: 3,
      q: "Which statements about resource bundles are true? (Choose three.)",
      options: [
        "ResourceBundle.getBundle throws an unchecked MissingResourceException when no matching bundle exists",
        "getString returns null when the key is not defined in the bundle or its parents",
        "keySet() also returns the keys defined in the parent bundles of the selected bundle",
        "The base name passed to getBundle must end with the .properties extension",
        "In a properties file, a key and its value may be separated by = or by :",
        "MissingResourceException must be caught or declared by the calling method"
      ],
      answer: [0, 2, 4],
      explain: "`MissingResourceException` étend `RuntimeException` : elle est unchecked (donc rien à déclarer) et est levée aussi bien par `getBundle` (aucun bundle trouvé) que par `getString` (clé absente), qui ne retourne jamais `null`. `keySet()` retourne les clés du bundle **et de ses parents**. Le nom de base se donne sans extension : `getBundle(\"Zoo.properties\")` chercherait un bundle introuvable et lèverait `MissingResourceException`. Dans un fichier `.properties`, le séparateur peut être `=`, `:` ou un espace."
    },
    {
      id: "l10n-009",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`String pattern = "{1} sees {0} and {1} {2}";
System.out.println(MessageFormat.format(pattern, "Ann", "Bob"));`,
      options: [
        "Bob sees Ann and Bob {2}",
        "Ann sees Bob and Ann {2}",
        "Bob sees Ann and Bob null",
        "Bob sees Ann and Bob",
        "An IllegalArgumentException is thrown",
        "An ArrayIndexOutOfBoundsException is thrown"
      ],
      answer: [0],
      explain: "Les paramètres sont indexés à partir de 0 : `{0}` = `Ann`, `{1}` = `Bob`. Un même index peut apparaître plusieurs fois et dans n'importe quel ordre. Il n'y a pas de troisième argument : `MessageFormat` laisse alors le paramètre `{2}` tel quel dans le résultat, sans exception et sans écrire `null`. `Ann sees Bob and Ann {2}` correspond à l'erreur classique d'une numérotation à partir de 1."
    },
    {
      id: "l10n-010",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`var props = new Properties();
props.setProperty("a", "1");
System.out.println(props.getProperty("a", "x") + props.getProperty("c", "y")
        + props.getProperty("c") + props.get("c"));`,
      options: [
        "1ynullnull",
        "xynullnull",
        "1yyy",
        "1ynull followed by a NullPointerException",
        "The code does not compile"
      ],
      answer: [0],
      explain: "`getProperty(key, default)` ne retourne la valeur par défaut que si la clé est absente : `a` existe donc `1`, `c` n'existe pas donc `y`. La valeur par défaut n'est pas enregistrée : `getProperty(\"c\")` retourne ensuite `null`, tout comme `get(\"c\")` hérité de `Hashtable` (qui retourne un `Object`). La concaténation de `null` écrit le texte `null` sans exception."
    },
    {
      id: "l10n-011",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`NumberFormat nf = NumberFormat.getIntegerInstance(Locale.US);
System.out.println(nf.format(2.5) + " " + nf.format(3.5) + " " + nf.format(1234.9));`,
      options: [
        "2 4 1,235",
        "3 4 1,235",
        "2 3 1,234",
        "3 4 1235",
        "2.5 3.5 1,234.9"
      ],
      answer: [0],
      explain: "`getIntegerInstance` arrondit à l'entier avec le mode par défaut `RoundingMode.HALF_EVEN` : à égale distance, on va vers l'entier **pair**. `2.5` donne `2`, `3.5` donne `4`, et `1234.9` donne `1,235` avec le séparateur de milliers de la locale US. `3 4 1,235` suppose un arrondi HALF_UP, `2 3 1,234` une troncature, et `1235` oublie le groupement."
    },
    {
      id: "l10n-012",
      difficulty: 2,
      q: "What is the result of the following code?",
      code: String.raw`import java.text.*;
import java.util.*;

public class Rate {
    public static void main(String[] args) {
        NumberFormat nf = NumberFormat.getPercentInstance(Locale.US);
        String s = nf.format(0.256);        // n1
        Number n = nf.parse("25%");         // n2
        System.out.println(s + " " + n);
    }
}`,
      options: [
        "26% 0.25",
        "25.6% 0.25",
        "26% 25",
        "Compilation fails at line n1",
        "Compilation fails at line n2",
        "A ParseException is thrown at runtime"
      ],
      answer: [4],
      explain: "`NumberFormat.parse(String)` déclare `throws ParseException`, une exception **checked** de `java.text`. `main` ne l'attrape pas et ne la déclare pas : erreur de compilation à la ligne n2 (`unreported exception ParseException`). `format` ne déclare aucune exception checked, n1 est donc correct. Avec `throws ParseException` sur `main`, le programme afficherait `26% 0.25` : le format pourcentage multiplie par 100 sans décimale, et `parse` fait l'opération inverse."
    },
    {
      id: "l10n-013",
      difficulty: 2,
      q: "What is the result of the following code?",
      code: String.raw`public static void main(String[] args) throws ParseException {
    NumberFormat us = NumberFormat.getInstance(Locale.US);
    NumberFormat fr = NumberFormat.getInstance(Locale.FRANCE);
    String s = "40.45";
    System.out.println(us.parse(s));
    System.out.println(fr.parse(s));
    System.out.println(us.parse("x40"));
}`,
      options: [
        "40.45 and 40 are printed, then a ParseException is thrown",
        "40.45 and 40.45 are printed, then a ParseException is thrown",
        "40.45 is printed, then a ParseException is thrown",
        "40.45, 40 and 40 are printed",
        "40.45 and 4045 are printed, then a ParseException is thrown"
      ],
      answer: [0],
      explain: "`parse` lit le plus long préfixe valide pour la locale puis s'arrête sans erreur. En US le point est le séparateur décimal : `40.45`. En français le séparateur décimal est la virgule ; le point n'a pas de sens dans ce nombre, l'analyse s'arrête donc après `40`, sans exception. En revanche `x40` ne **commence** par rien d'analysable : `ParseException`. Les caractères invalides ne sont ignorés qu'en fin de chaîne, jamais au début."
    },
    {
      id: "l10n-014",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`var s = NumberFormat.getCompactNumberInstance(Locale.US, NumberFormat.Style.SHORT);
var l = NumberFormat.getCompactNumberInstance(Locale.US, NumberFormat.Style.LONG);
System.out.println(s.format(7_654_321) + " " + l.format(7_654_321)
        + " " + s.format(999));`,
      options: [
        "8M 8 million 999",
        "7M 7 million 999",
        "7.7M 7.7 million 999",
        "8M 8 million 1K",
        "7.65M 7.65 million 0K"
      ],
      answer: [0],
      explain: "Un `CompactNumberFormat` exprime le nombre dans son unité (ici le million) puis l'**arrondit à l'entier le plus proche**, sans décimale par défaut : 7,654321 millions donne `8M` en `SHORT` et `8 million` en `LONG`. Il ne tronque pas (`7M`) et n'affiche pas de décimales (`7.7M`, `7.65M`). Un nombre inférieur à mille est affiché tel quel : `999`, pas `1K`."
    },
    {
      id: "l10n-015",
      difficulty: 2,
      q: "Assuming the default locale is en_US, what is the output of the following code?",
      code: String.raw`double d = 1234.567;
System.out.println(new DecimalFormat("#,##0.0").format(d));
System.out.println(new DecimalFormat("00000.00").format(d));
System.out.println(new DecimalFormat("#.#####").format(d));`,
      options: [
        String.raw`1,234.6
01234.57
1234.567`,
        String.raw`1,234.6
01234.57
1234.56700`,
        String.raw`1,234.5
01234.56
1234.567`,
        String.raw`1,234.6
1234.57
1234.567`,
        String.raw`234.6
01234.57
1234.567`
      ],
      answer: [0],
      explain: "`0` impose un chiffre (complété par `0` si nécessaire), `#` n'affiche un chiffre que s'il existe. `#,##0.0` : groupement par milliers et une décimale arrondie, `1,234.6`. `00000.00` : cinq chiffres entiers obligatoires et deux décimales, `01234.57`. `#.#####` : jusqu'à cinq décimales mais sans zéros de remplissage, `1234.567`. Les décimales sont arrondies, pas tronquées (`1,234.5` est faux), et un motif ne coupe jamais la partie entière (`234.6` est faux)."
    },
    {
      id: "l10n-016",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`var dt = LocalDateTime.of(2025, 3, 9, 14, 5, 7);
var f = DateTimeFormatter.ofPattern("MMM d, yy 'at' hh:mm", Locale.US);
System.out.println(dt.format(f));`,
      options: [
        "Mar 9, 25 at 02:05",
        "March 9, 25 at 02:05",
        "Mar 9, 25 at 14:05",
        "Mar 09, 2025 at 02:05",
        "03 9, 25 at 02:05",
        "An IllegalArgumentException is thrown"
      ],
      answer: [0],
      explain: "`MMM` donne le nom abrégé du mois (`Mar`) ; `MMMM` donnerait `March` et `MM` donnerait `03`. `d` écrit le jour sans zéro initial (`9`), `yy` l'année sur deux chiffres (`25`). `hh` est l'heure sur **12** heures avec deux chiffres : 14 h devient `02` (`HH` donnerait `14`). `mm` = minutes `05`. Le texte `at` est entre apostrophes, il est donc recopié tel quel ; sans les apostrophes, la lettre `t` inconnue provoquerait une `IllegalArgumentException`."
    },
    {
      id: "l10n-017",
      difficulty: 2,
      q: "Each marked line is executed independently of the others. Which lines throw an exception at runtime? (Choose two.)",
      code: String.raw`var dt = LocalDateTime.of(2025, 3, 9, 14, 5, 7);
var d = dt.toLocalDate();

DateTimeFormatter.ofPattern("yyyy 'at' HH").format(dt);    // n1
DateTimeFormatter.ofPattern("yyyy at HH");                 // n2
dt.format(DateTimeFormatter.ISO_LOCAL_DATE);               // n3
d.format(DateTimeFormatter.ofPattern("MM/dd HH"));         // n4
d.format(DateTimeFormatter.ISO_DATE);                      // n5`,
      options: ["n1", "n2", "n3", "n4", "n5"],
      answer: [1, 3],
      explain: "n2 : hors apostrophes, `a` est le symbole AM/PM mais `t` n'est pas une lettre de motif connue ; `ofPattern` lève immédiatement une `IllegalArgumentException`, avant même tout formatage. n4 : le motif demande l'heure (`HH`) à un `LocalDate` qui n'en a pas : `UnsupportedTemporalTypeException` au moment du `format`. n1 échappe correctement le texte et affiche `2025 at 14`. n3 est valide : un `LocalDateTime` possède tous les champs de `ISO_LOCAL_DATE` (seule la date est écrite). n5 formate simplement la date en `2025-03-09`."
    },
    {
      id: "l10n-018",
      difficulty: 3,
      q: "Given the following declarations, which statements throw an exception at runtime? (Choose two.)",
      code: String.raw`var ldt = LocalDateTime.of(2025, 3, 9, 14, 5, 7);
var zdt = ldt.atZone(ZoneId.of("Europe/Paris"));`,
      options: [
        String.raw`DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM).format(ldt);`,
        String.raw`DateTimeFormatter.ofLocalizedDateTime(FormatStyle.LONG).format(ldt);`,
        String.raw`DateTimeFormatter.ofLocalizedDate(FormatStyle.FULL).format(ldt);`,
        String.raw`DateTimeFormatter.ofLocalizedTime(FormatStyle.FULL).format(ldt);`,
        String.raw`DateTimeFormatter.ofLocalizedDateTime(FormatStyle.FULL).format(zdt);`,
        String.raw`DateTimeFormatter.ofLocalizedDate(FormatStyle.LONG).format(ldt.toLocalDate());`
      ],
      answer: [1, 3],
      explain: "Les styles `LONG` et `FULL` appliqués à une **heure** affichent le fuseau horaire. Un `LocalDateTime` n'en a pas : `ofLocalizedDateTime(LONG)` et `ofLocalizedTime(FULL)` lèvent une `DateTimeException` (impossible d'extraire un `ZoneId`). `MEDIUM` (comme `SHORT`) n'a pas besoin de fuseau. `ofLocalizedDate` ne concerne que la date : tous les styles, `FULL` compris, fonctionnent avec un `LocalDate` ou un `LocalDateTime`. Avec un `ZonedDateTime`, le style `FULL` fonctionne puisque le fuseau est disponible."
    },
    {
      id: "l10n-019",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`var f = DateTimeFormatter.ofPattern("dd/MM/yyyy");
LocalDate date = LocalDate.parse("03/09/2025", f);
System.out.println(date + " " + date.getMonth());`,
      options: [
        "2025-09-03 SEPTEMBER",
        "2025-03-09 MARCH",
        "03/09/2025 SEPTEMBER",
        "03/09/2025 MARCH",
        "A DateTimeParseException is thrown"
      ],
      answer: [0],
      explain: "Le motif `dd/MM/yyyy` lit d'abord le jour (`03`) puis le mois (`09`) : la date est le 3 septembre 2025. Le formateur ne sert qu'à l'analyse ; `toString()` d'un `LocalDate` reste toujours au format ISO `yyyy-MM-dd`, d'où `2025-09-03`. Le texte correspond exactement au motif (deux chiffres pour le jour et le mois), il n'y a donc pas de `DateTimeParseException` ; ce serait le cas avec `3/9/2025`."
    },
    {
      id: "l10n-020",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`var f = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.US);
f.withLocale(Locale.FRANCE);
System.out.println(f.format(LocalDate.of(2025, 3, 9)));`,
      options: [
        "March 2025",
        "mars 2025",
        "Mar 2025",
        "March 9, 2025",
        "An UnsupportedTemporalTypeException is thrown"
      ],
      answer: [0],
      explain: "`DateTimeFormatter` est immuable : `withLocale` retourne un **nouveau** formateur et ne modifie pas `f`. Le résultat étant ignoré, `f` garde la locale US et `MMMM` écrit le nom complet du mois en anglais : `March 2025`. `mars 2025` serait obtenu avec `f = f.withLocale(Locale.FRANCE)`. `Mar` correspond à `MMM`. Le motif ne demande que le mois et l'année, deux champs que `LocalDate` possède : pas d'exception, et le jour n'est pas affiché."
    }
  ]
});
