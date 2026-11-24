OCP.register({
  topic: 'modules',
  course: [
    {
      title: "Déclarer un module : module-info.java",
      blocks: [
        { p: "Un module nommé est un ensemble de packages décrit par un fichier `module-info.java` placé **à la racine** des sources du module (compilé en `module-info.class`). Par défaut, un module n'expose **rien** : tout ce qui n'est pas exporté est encapsulé." },
        { code: String.raw`module zoo.core {                       // "open module zoo.core" ouvre tous les packages
    requires zoo.model;                 // dépendance (compilation + exécution)
    requires transitive java.sql;       // dépendance "réexportée" à mes clients
    requires static zoo.annotations;    // obligatoire à la compilation, optionnelle à l'exécution
    exports zoo.core.api;               // types public accessibles par tous les modules
    exports zoo.core.staff to zoo.app;  // export qualifié : seulement pour zoo.app
    opens zoo.core.model;               // réflexion profonde à l'exécution, pour tous
    opens zoo.core.dto to zoo.json;     // opens qualifié
    uses zoo.core.api.Tour;             // je consomme le service (ServiceLoader)
    provides zoo.core.api.Tour with zoo.core.impl.CityTour;   // je fournis le service
}` },
        { table: { head: ["Directive", "Opérande", "Effet"], rows: [
          ["`requires M;`", "module", "Le module lit `M` (compilation et exécution)"],
          ["`requires transitive M;`", "module", "Idem, et tout module qui me requiert lit aussi `M` (lisibilité implicite)"],
          ["`requires static M;`", "module", "`M` doit exister à la compilation ; à l'exécution il n'est pas résolu automatiquement"],
          ["`exports p;`", "package", "Les types `public` de `p` sont accessibles (compilation + exécution)"],
          ["`exports p to M1, M2;`", "package, modules", "Export qualifié, réservé aux modules listés"],
          ["`opens p;` / `opens p to M;`", "package", "Réflexion profonde (membres privés) à l'exécution seulement"],
          ["`uses S;`", "type (service)", "Autorise `ServiceLoader.load(S.class)` dans ce module"],
          ["`provides S with I1, I2;`", "types", "Déclare des implémentations du service `S`"]
        ] } },
        { h: "Règles à connaître" },
        { list: [
          "`java.base` est requis implicitement par tout module ; écrire `requires java.base;` est permis mais inutile.",
          "Une directive par ligne logique : `requires a, b;` et `exports p, q;` ne compilent pas. Seules les listes après `to` et après `with` acceptent des virgules.",
          "Pas de joker : `exports zoo.*;` ne compile pas. Exporter `zoo.core` n'exporte **pas** `zoo.core.api` (pas de notion de sous-package).",
          "Pas de doublon : deux `requires` du même module, deux `exports` du même package (même si l'un est qualifié), deux `uses` identiques → erreur de compilation.",
          "`exports` d'un package inexistant ou vide → erreur ; `requires` d'un module introuvable → erreur `module not found` (même avec `static`).",
          "Pas de dépendance cyclique entre modules nommés à la compilation : `cyclic dependence involving ...` (même si l'un des deux `requires` est `static`).",
          "Nom de module : identifiants Java séparés par des points (`zoo.core`). Le tiret est interdit (`zoo-core` ne compile pas). Convention : nom de domaine inversé, comme le package principal du module.",
          "`module`, `open`, `requires`, `exports`, `opens`, `to`, `uses`, `provides`, `with`, `transitive` sont des mots-clés **contextuels** : ils restent utilisables comme identifiants ailleurs.",
          "Aucun modificateur d'accès : `public module x { }` ne compile pas.",
          "L'ordre des directives est libre."
        ] },
        { trap: "`open module m { opens p; }` ne compile pas : un module `open` ouvre déjà tous ses packages, la directive `opens` y est interdite. En revanche `exports`, `requires`, `uses` et `provides` restent autorisés dans un module `open`." },
        { trap: "`requires transitive` se place dans le module **intermédiaire**, pas chez le client. Si `data.access` écrit `requires transitive data.model;`, alors `shop.ui` qui fait `requires data.access;` lit aussi `data.model`. Sans `transitive`, `shop.ui` doit écrire lui-même `requires data.model;`." },
        { trap: "`requires static` : le module doit être présent à la compilation, mais à l'exécution il n'est **pas** ajouté au graphe même s'il se trouve sur le module path, sauf si un autre module le requiert ou si on passe `--add-modules`. Utiliser une de ses classes lève alors `NoClassDefFoundError`." }
      ]
    },
    {
      title: "Accessibilité, exports et réflexion",
      blocks: [
        { p: "Pour qu'un type d'un module `A` soit utilisable dans un module `B`, **trois** conditions : `B` lit `A` (`requires`, direct ou transitif), le package est exporté par `A` (à tous ou à `B`), et le type est `public` (les membres suivent ensuite les règles d'accès habituelles)." },
        { table: { head: ["Situation dans le module fournisseur", "Compilation (import)", "Réflexion sur membres `public`", "Réflexion profonde (`setAccessible(true)` sur du privé)"], rows: [
          ["Package non exporté, non ouvert", "non", "non", "non"],
          ["`exports p;`", "oui", "oui", "non → `InaccessibleObjectException`"],
          ["`opens p;`", "non", "oui", "oui"],
          ["`exports p; opens p;`", "oui", "oui", "oui"],
          ["`open module`", "seulement les packages exportés", "oui", "oui (tous les packages)"]
        ] } },
        { list: [
          "Package non exporté : `error: package x.y is not visible (... which does not export it)`.",
          "Module non lu : `package x.y is not visible (... but module m does not read it)`.",
          "`opens` n'accorde **rien** à la compilation : un `import` d'un package seulement ouvert ne compile pas.",
          "`exports` ne suffit pas pour la réflexion profonde : `Field.setAccessible(true)` sur un champ privé lève `java.lang.reflect.InaccessibleObjectException` (une `RuntimeException`), pas `IllegalAccessException`.",
          "Les frameworks à base de réflexion (injection, JSON, ORM) ont besoin de `opens` ou d'un `open module`."
        ] },
        { h: "Contourner l'encapsulation en ligne de commande" },
        { table: { head: ["Option (`javac` et/ou `java`)", "Équivalent", "Syntaxe"], rows: [
          ["`--add-exports`", "`exports p to M`", "`--add-exports source.module/package=target.module`"],
          ["`--add-opens` (`java` seulement)", "`opens p to M`", "`--add-opens source.module/package=target.module`"],
          ["`--add-modules`", "ajoute des modules racines", "`--add-modules m1,m2` (ou `ALL-MODULE-PATH`, `ALL-SYSTEM`)"],
          ["`--add-reads`", "`requires`", "`--add-reads module=other.module`"]
        ] } },
        { tip: "La cible `ALL-UNNAMED` désigne le code du classpath : `--add-opens java.base/java.lang=ALL-UNNAMED`." },
        { trap: "`--add-exports` ne donne pas la réflexion profonde : pour `setAccessible(true)` sur un membre privé il faut `--add-opens`. La syntaxe est toujours `module/package=cible` : le module **propriétaire** du package à gauche du `/`." }
      ]
    },
    {
      title: "Modules nommés, automatiques et module sans nom",
      blocks: [
        { p: "Le type d'un module dépend de **l'endroit où l'on place le JAR** (module path ou classpath) et de la présence d'un `module-info.class`." },
        { table: { head: ["", "Module nommé", "Module automatique", "Module sans nom (unnamed)"], rows: [
          ["Emplacement", "module path", "module path", "classpath"],
          ["`module-info.class`", "oui", "non", "ignoré s'il existe"],
          ["Nom", "celui du descripteur", "`Automatic-Module-Name` ou dérivé du nom du JAR", "aucun"],
          ["Packages exportés", "ceux déclarés", "tous (et tous ouverts)", "tout est accessible depuis le classpath"],
          ["Lit", "ce qu'il `requires`", "tous les modules + le classpath", "tous les modules résolus"],
          ["Lisible par un module nommé", "oui (`requires`)", "oui (`requires` avec son nom)", "**non**"]
        ] } },
        { h: "Nom d'un module automatique" },
        { list: [
          "Si le `MANIFEST.MF` contient `Automatic-Module-Name: org.acme.util`, c'est ce nom, sans transformation.",
          "Sinon, à partir du nom du fichier : retirer `.jar` ; supprimer la version (tout ce qui suit le premier tiret suivi de chiffres puis d'un point ou de la fin du nom : `-1.0.2`, `-2.0-SNAPSHOT`, `-3`) ; remplacer tout caractère autre que lettre ou chiffre par un point ; fusionner les points consécutifs ; retirer les points en début et en fin.",
          "`holiday-calendar-1.0.2.jar` → `holiday.calendar` ; `commons_io-2.11.jar` → `commons.io` ; `cool-lib_v3.jar` → `cool.lib.v3` ; `zoo-keeper2-3.1.0.RELEASE.jar` → `zoo.keeper2`."
        ] },
        { trap: "Un module nommé ne peut **jamais** lire le module sans nom : du code d'un module avec `module-info` qui utilise une classe placée sur le classpath ne compile pas (`package ... is declared in the unnamed module, but module m does not read it`). Seuls les modules automatiques font le pont : ils lisent le classpath." },
        { trap: "Un JAR modulaire placé sur le **classpath** est traité comme un JAR ordinaire : son `module-info.class` est ignoré, il fait partie du module sans nom et tous ses packages, même non exportés, deviennent accessibles au reste du classpath." },
        { trap: "Le code du classpath ne voit un module du module path que si ce module est dans le graphe : il faut `--add-modules nom` (ou `ALL-MODULE-PATH`), sinon `package ... is not visible` à la compilation et `NoClassDefFoundError` à l'exécution." },
        { tip: "Module path : `--module-path` / `-p`, liste de répertoires contenant des modules ou de JAR. Classpath : `-cp`, `-classpath`, `--class-path`. Les deux peuvent être utilisés dans la même commande." }
      ]
    },
    {
      title: "Services et ServiceLoader",
      blocks: [
        { p: "Un service découple un consommateur de ses implémentations. Quatre rôles, souvent répartis dans quatre modules." },
        { table: { head: ["Rôle", "Contenu", "Directives du module"], rows: [
          ["Service provider interface (SPI)", "L'interface (ou classe abstraite) du service et ses types associés", "`exports` du package de l'interface"],
          ["Service locator", "Le code qui appelle `ServiceLoader.load`", "`requires` SPI, `exports` son package, **`uses`** l'interface"],
          ["Consumer (client)", "Appelle le locator", "`requires` locator (et SPI si pas `transitive`)"],
          ["Service provider", "Une implémentation", "`requires` SPI, **`provides` S `with` Impl** ; pas besoin d'`exports`"]
        ] } },
        { list: [
          "SPI + service locator forment ce que l'on appelle parfois le **service** ; le provider n'est connu ni du consommateur ni du locator à la compilation.",
          "Le provider n'exporte pas son package d'implémentation : `ServiceLoader` y accède quand même.",
          "L'implémentation doit avoir un constructeur public sans argument (ou une méthode `public static provider()`) et être un sous-type du service, sinon `provides` ne compile pas.",
          "`provides S with A, B;` : une seule directive `provides` par service, plusieurs implémentations séparées par des virgules."
        ] },
        { h: "API java.util.ServiceLoader<S>" },
        { code: String.raw`ServiceLoader<Tour> loader = ServiceLoader.load(Tour.class);   // méthode static, pas de constructeur

for (Tour t : loader) { }                       // ServiceLoader<S> implements Iterable<S>
Iterator<Tour> it = loader.iterator();
Optional<Tour> first = loader.findFirst();      // méthode d'instance

Stream<ServiceLoader.Provider<Tour>> s = loader.stream();   // Stream de Provider, pas de Tour !
List<Tour> all = loader.stream()
        .map(ServiceLoader.Provider::get)       // Provider.get() instancie, Provider.type() donne la classe
        .toList();` },
        { trap: "`loader.stream()` renvoie un `Stream<ServiceLoader.Provider<S>>` : il faut `.map(ServiceLoader.Provider::get)` (ou `p -> p.get()`) pour obtenir les instances. `Tour t = loader.stream().findFirst().get();` ne compile pas." },
        { trap: "Oublier `uses` dans le module qui appelle `ServiceLoader.load` **compile**, mais lève à l'exécution `java.util.ServiceConfigurationError: ... module x does not declare 'uses'`. Oublier `provides` ne provoque aucune erreur : le service n'est simplement pas trouvé." },
        { tip: "Aucun provider présent : pas d'exception. L'itération est vide, `findFirst()` renvoie `Optional.empty()`, `stream().count()` vaut 0." }
      ]
    },
    {
      title: "Compiler, empaqueter et exécuter des modules",
      blocks: [
        { h: "javac" },
        { code: String.raw`# un module, fichiers listés explicitement (module-info.java en fait partie)
javac -d out -p mods src/module-info.java src/hello/Main.java

# plusieurs modules : src/<nom.du.module>/module-info.java ...
javac -d out --module-source-path src -m zoo.core,zoo.app
javac -d out --module-path mods --module-source-path src --module hello.app` },
        { list: [
          "`-d <dir>` : répertoire de sortie des `.class`. Avec `--module-source-path`, un sous-répertoire par module (`out/zoo.core/...`).",
          "`-m` / `--module` exige **à la fois** `--module-source-path` et `-d`.",
          "`-p` / `--module-path` : où trouver les modules déjà compilés dont on dépend. Des dépendances modulaires placées avec `-cp` ne sont pas trouvées (`module not found`)."
        ] },
        { h: "jar" },
        { code: String.raw`jar --create --file mods/core.jar -C out/zoo.core .
jar -cf mods/core.jar -C out/zoo.core .
jar --create --file mods/app.jar --main-class hello.Main -C out/hello.app .
jar -c -f mods/app.jar -e hello.Main -C out/hello.app .
jar --describe-module --file mods/app.jar        # ou : jar -d -f mods/app.jar
jar --list --file mods/app.jar                   # ou : jar -tf mods/app.jar` },
        { list: [
          "Un JAR modulaire est un JAR ordinaire dont la racine contient `module-info.class`.",
          "`-C dir .` : se place dans `dir` et ajoute son contenu. Sans `-C`, les entrées gardent le préfixe du chemin (`out/zoo.core/...`) et le JAR est inutilisable.",
          "`--main-class` / `-e` enregistre le point d'entrée (attribut `Main-Class` du manifeste, et classe principale du module).",
          "`--file` / `-f` est obligatoire pour nommer l'archive ; `jar --describe-module app.jar` échoue."
        ] },
        { h: "java" },
        { code: String.raw`java --module-path mods --module hello.app/hello.Main
java -p mods -m hello.app/hello.Main
java -p mods -m hello.app                  # si le JAR modulaire déclare une main class
java -p mods -d hello.app                  # --describe-module
java -p mods --list-modules                # modules observables (JDK + module path), puis quitte
java -p mods --show-module-resolution -m hello.app
java -p mods --add-modules zoo.core -cp classes Legacy` },
        { table: { head: ["Option courte", "`javac`", "`java`", "`jar`"], rows: [
          ["`-d`", "répertoire de sortie", "`--describe-module`", "`--describe-module`"],
          ["`-p`", "`--module-path`", "`--module-path`", "`--module-path`"],
          ["`-m`", "`--module` (module à compiler)", "`--module` (module[/classe] à lancer)", "`--manifest` (fichier manifeste)"],
          ["`-cp`", "`--class-path`, `-classpath`", "`--class-path`, `-classpath`", "—"],
          ["`-C`", "—", "—", "changer de répertoire"]
        ] } },
        { trap: "Le séparateur entre module et classe principale est `/` : `-m hello.app/hello.Main`. Ni `:` ni `.` ni espace. Et `-m` doit être la **dernière** option : tout ce qui suit est passé en argument au programme (`java -m hello.app/hello.Main -p mods` échoue)." },
        { trap: "`-mp`, `--modulepath`, `-module-path` n'existent pas. Les options longues prennent deux tirets ; `--list-modules` et `--show-module-resolution` n'ont pas de forme courte." },
        { trap: "`java -p mods -jar mods/app.jar` : avec `-jar`, le JAR est mis sur le **classpath** (module sans nom) même s'il est modulaire. Les modules de `mods` ne sont pas résolus, d'où un `NoClassDefFoundError` si l'application dépend de l'un d'eux. Il faut `-m`, ou ajouter `--add-modules`." },
        { tip: "`java --describe-module` affiche notamment `requires java.base mandated`, les `exports`, les `qualified exports ... to ...` et `contains` pour les packages non exportés." }
      ]
    },
    {
      title: "jdeps, jmod et jlink",
      blocks: [
        { h: "jdeps : analyser les dépendances" },
        { code: String.raw`jdeps legacy.jar                       # dépendances par package
jdeps -s legacy.jar                    # résumé (-summary) : une ligne par module requis
jdeps --jdk-internals legacy.jar       # usages d'API internes du JDK (sun.misc.Unsafe...)
jdeps --module-path mods -s mods/app.jar   # nécessaire pour résoudre les modules applicatifs` },
        { list: [
          "Exemple de résumé : `legacy.jar -> java.base`, `legacy.jar -> java.sql`, `legacy.jar -> jdk.unsupported`.",
          "`--jdk-internals` (ancienne forme `-jdkinternals`) liste les classes qui utilisent des API internes et propose un remplacement.",
          "`jdeps` fonctionne sur des `.class`, des répertoires ou des JAR, modulaires ou non : c'est l'outil de préparation d'une migration."
        ] },
        { trap: "La forme longue du résumé est `-summary` (un seul tiret) ; l'option courte est `-s`. Avec `jdeps`, `-p` ne désigne pas le module path mais un **package** à rechercher (`-p <pkg>`, `-package`) : le module path s'écrit uniquement `--module-path`." },
        { h: "jmod : fichiers JMOD" },
        { table: { head: ["Mode", "Rôle"], rows: [
          ["`jmod create`", "Crée un fichier `.jmod` (`--class-path`, `--cmds`, `--config`, `--libs`...)"],
          ["`jmod extract`", "Extrait tout le contenu (`--dir`)"],
          ["`jmod list`", "Liste les entrées"],
          ["`jmod describe`", "Affiche le descripteur du module"],
          ["`jmod hash`", "Enregistre les hachages des modules liés"]
        ] } },
        { list: [
          "Un JMOD peut contenir, en plus des classes, du code natif et des fichiers de configuration. Le JDK lui-même est livré en JMOD.",
          "Un JMOD sert à la **compilation** et à l'**édition de liens** (`jlink`) ; il n'est pas utilisable sur le module path de `java` à l'exécution."
        ] },
        { h: "jlink : image d'exécution sur mesure" },
        { code: String.raw`jlink --module-path mods --add-modules hello.app --output img
jlink -p mods --add-modules hello.app,java.sql --output img

img/bin/java --list-modules        # hello.app, zoo.core, java.base
img/bin/java -m hello.app/hello.Main` },
        { list: [
          "`--add-modules` donne les modules racines ; `jlink` ajoute leurs dépendances transitives (au minimum `java.base`).",
          "`--output` est obligatoire, n'a pas de forme courte et le répertoire ne doit pas déjà exister.",
          "L'image contient `bin/java` mais pas les outils (`javac`, `jar`...) sauf si leurs modules sont ajoutés ; elle s'exécute sans JDK ni JRE installé, sur la plateforme pour laquelle elle a été construite.",
          "Les modules de l'image sont déjà résolus : pas besoin de `-p` pour lancer l'application."
        ] },
        { trap: "`jlink` refuse les modules **automatiques** (`automatic module cannot be used with jlink`) : seuls des modules nommés (JAR modulaires ou JMOD) peuvent entrer dans une image." }
      ]
    },
    {
      title: "Stratégies de migration",
      blocks: [
        { table: { head: ["", "Bottom-up", "Top-down"], rows: [
          ["Point de départ", "Les JAR les plus bas (sans dépendance non modulaire)", "L'application elle-même (le haut du graphe)"],
          ["Prérequis", "Maîtriser les bibliothèques dont on dépend", "Aucun : les dépendances peuvent ne pas être migrées"],
          ["JAR déjà migrés", "module path, modules **nommés**", "module path, modules **nommés**"],
          ["JAR pas encore migrés", "**classpath** (module sans nom)", "**module path**, modules **automatiques**"],
          ["Ce que l'on écrit", "`module-info` de la brique basse, `exports` de ses packages", "`module-info` de l'application avec `requires` des noms automatiques"]
        ] } },
        { list: [
          "Bottom-up : le code du classpath continue de voir les modules migrés (le module sans nom lit tous les modules). On remonte ensuite couche par couche.",
          "Top-down : on déplace **tous** les JAR sur le module path ; ceux sans `module-info` deviennent automatiques et le module applicatif les `requires` par leur nom dérivé. On descend ensuite.",
          "Un module nommé ne peut pas dépendre d'un JAR resté sur le classpath : c'est ce qui impose l'ordre de chaque stratégie."
        ] },
        { h: "Obstacles classiques" },
        { list: [
          "**Split package** : un même package présent dans deux modules. Un module ne peut pas lire le même package depuis deux modules (`module x reads package p from both a and b`). Solution : regrouper le package dans un seul module ou le renommer.",
          "**Dépendance cyclique** : interdite entre modules nommés à la compilation. Solution : extraire le code commun dans un troisième module dont les deux autres dépendent, ou inverser la dépendance avec un service.",
          "Usage d'API internes du JDK : repéré par `jdeps --jdk-internals`, contourné provisoirement par `--add-exports` / `--add-opens`."
        ] },
        { trap: "Ne pas inverser : en bottom-up les JAR non migrés restent sur le **classpath** ; en top-down ils passent sur le **module path** comme modules automatiques." }
      ]
    },
    {
      title: "Modules du JDK à connaître",
      blocks: [
        { table: { head: ["Module", "Contenu principal"], rows: [
          ["`java.base`", "`java.lang`, `java.util` (collections, `function`, `stream`, `concurrent`), `java.io`, `java.nio`, `java.time`, `java.math`, `java.net`, `java.text` ; requis implicitement"],
          ["`java.sql`", "JDBC : `java.sql`, `javax.sql` ; `requires transitive` `java.logging`, `java.xml`, `java.transaction.xa`"],
          ["`java.logging`", "`java.util.logging`"],
          ["`java.xml`", "JAXP : `javax.xml.*`, `org.w3c.dom`, `org.xml.sax`"],
          ["`java.desktop`", "AWT, Swing (`java.awt`, `javax.swing`), `java.beans`, impression, son, images"],
          ["`java.net.http`", "Client HTTP (`java.net.http.HttpClient`)"],
          ["`java.naming`, `java.management`, `java.compiler`", "JNDI, JMX, API du compilateur"],
          ["`java.se`", "Module agrégateur : ne contient pas de code, `requires transitive` tous les modules Java SE"],
          ["`jdk.compiler`, `jdk.javadoc`, `jdk.jartool`", "`javac`, `javadoc`, `jar`"],
          ["`jdk.jdeps`, `jdk.jlink`, `jdk.jshell`", "`jdeps` / `javap`, `jlink` / `jmod`, `jshell`"],
          ["`jdk.unsupported`", "API internes encore tolérées : `sun.misc.Unsafe`"]
        ] } },
        { list: [
          "Préfixe `java.` : modules de la spécification Java SE. Préfixe `jdk.` : modules propres au JDK (outils, API spécifiques).",
          "`java --list-modules` affiche les modules du runtime avec leur version (`java.base@21`). `java --describe-module java.sql` affiche leurs directives."
        ] },
        { trap: "Un module qui ne déclare que `requires java.sql;` peut utiliser `java.util.logging.Logger` et les types XML (dépendances **transitives** de `java.sql`), mais pas `javax.swing` : `java.desktop` n'est pas dans le graphe." },
        { tip: "Tout ce qui est d'usage courant (`String`, `List`, `Stream`, `Path`, `LocalDate`, `ExecutorService`) est dans `java.base` : aucun `requires` nécessaire." }
      ]
    },
    {
      title: "Code non modulaire : packages, classpath, JAR, lancement d'un fichier source",
      blocks: [
        { h: "Packages et compilation" },
        { code: String.raw`javac -d classes src/com/acme/util/Text.java src/com/acme/app/Start.java
javac -d classes -sourcepath src src/com/acme/app/Start.java   # trouve Text.java tout seul
java -cp classes com.acme.app.Start` },
        { list: [
          "`-d classes` crée l'arborescence des packages (`classes/com/acme/app/Start.class`).",
          "On lance une classe par son **nom qualifié**, depuis la racine du classpath : `java -cp classes/com/acme/app Start` échoue (`wrong name`), `java ... Start.class` aussi.",
          "Classpath par défaut : le répertoire courant. Dès que `-cp` est donné, le répertoire courant n'est plus inclus sauf si on l'ajoute (`.`)."
        ] },
        { h: "Classpath" },
        { list: [
          "Trois écritures équivalentes : `-cp`, `-classpath`, `--class-path`.",
          "Séparateur : `:` sous Linux/macOS, `;` sous Windows.",
          "Une entrée est un répertoire de `.class`, un fichier JAR, ou un joker `dir/*`.",
          "`lib/*` désigne **tous les JAR** de `lib` (pas les `.class`, pas les sous-répertoires). `lib/*.jar` n'est pas reconnu, et `-cp lib` seul ne charge aucun JAR."
        ] },
        { tip: "Mettre le joker entre guillemets (`-cp \"lib/*\"`) pour empêcher le shell de le développer." },
        { h: "JAR" },
        { code: String.raw`jar -cvf app.jar -C classes .                 # c = create, v = verbose, f = file
jar --create --file app.jar -C classes .
java -cp app.jar com.acme.app.Start            # pas besoin de Main-Class

jar --create --file run.jar --main-class com.acme.app.Start -C classes .
jar -cfe run.jar com.acme.app.Start -C classes .
java -jar run.jar` },
        { trap: "`java -jar app.jar` sans attribut `Main-Class` dans le manifeste échoue (`no main manifest attribute`). Et avec `-jar`, l'option `-cp` est **ignorée** : le classpath vient du JAR (attribut `Class-Path` du manifeste)." },
        { h: "Lancer directement un fichier source" },
        { code: String.raw`java Trip.java arg1 arg2      # compile en mémoire puis exécute` },
        { list: [
          "Aucun fichier `.class` n'est écrit sur le disque.",
          "La classe lancée est la **première classe de premier niveau** du fichier ; elle doit contenir `main`. Le nom du fichier n'a pas besoin de correspondre au nom de la classe, même `public`.",
          "Le fichier peut contenir plusieurs classes ; en Java 21 tout le programme doit tenir dans ce seul fichier (plus les bibliothèques du classpath).",
          "Les arguments placés après le nom du fichier sont passés à `main` ; les options de la JVM (`-cp`, `--source 21`...) se placent avant.",
          "C'est l'extension `.java` qui déclenche ce mode : `java Trip` cherche une classe compilée `Trip`."
        ] },
        { trap: "`javac Trip.java` refuse un fichier dont la classe `public` ne porte pas le nom du fichier, alors que `java Trip.java` l'accepte : les deux commandes n'appliquent pas les mêmes règles." }
      ]
    }
  ],
  questions: [
    {
      id: "modules-001",
      difficulty: 1,
      q: "Which of the following are syntactically valid directives inside a module declaration? (Choose three.)",
      options: [
        "exports pets.api to zoo.app, zoo.visitor;",
        "requires transitive zoo.core;",
        "opens pets.impl to zoo.app;",
        "exports pets.*;",
        "requires zoo.core, java.sql;",
        "export pets.api;"
      ],
      answer: [0, 1, 2],
      explain: "Un export qualifié accepte une liste de modules séparés par des virgules après `to`, `requires transitive` est un modificateur valide et `opens ... to` est la forme qualifiée de `opens`. En revanche il n'existe pas de joker dans `exports` (`pets.*` → `<identifier> expected`), `requires` n'accepte qu'un seul module par directive (`';' expected`) et le mot-clé est `exports`, pas `export`."
    },
    {
      id: "modules-002",
      difficulty: 2,
      q: "Given the following files, and knowing that all three packages of zoo.core contain public classes (Animal, Keeper, Secret), what is the result of compiling module zoo.visitor?",
      code: String.raw`// zoo.core/module-info.java
module zoo.core {
    exports zoo.core.api;
    exports zoo.core.staff to zoo.app;
}

// zoo.visitor/module-info.java
module zoo.visitor {
    requires zoo.core;
}

// zoo.visitor/zoo/visitor/Visit.java
package zoo.visitor;
import zoo.core.api.Animal;      // v1
import zoo.core.staff.Keeper;    // v2
public class Visit { }`,
      options: [
        "Compilation succeeds",
        "Only line v1 fails to compile",
        "Only line v2 fails to compile",
        "Lines v1 and v2 both fail to compile",
        "The declaration of module zoo.core fails to compile"
      ],
      answer: [2],
      explain: "`zoo.core.api` est exporté à tous les modules : v1 compile puisque `zoo.visitor` lit `zoo.core`. `zoo.core.staff` fait l'objet d'un export **qualifié** vers `zoo.app` uniquement : pour `zoo.visitor` le package est inaccessible et v2 est rejetée. Avoir deux directives `exports` portant sur des packages différents, dont une qualifiée, est parfaitement légal."
    },
    {
      id: "modules-003",
      difficulty: 2,
      q: "Module shop.ui does not compile because of line s2. Which changes, each applied independently, allow all three modules to compile? (Choose two.)",
      code: String.raw`// data.model
module data.model { exports data.model; }      // contains public class data.model.Row

// data.access
module data.access {
    requires data.model;
    exports data.access;                       // Dao has: public Row find()
}

// shop.ui
module shop.ui { requires data.access; }

package shop.ui;
import data.access.Dao;
public class Screen {
    void show() {
        var row = new Dao().find();   // s1
        data.model.Row r = row;       // s2
    }
}`,
      options: [
        "In data.access, replace requires data.model; with requires transitive data.model;",
        "In shop.ui, add the directive requires data.model;",
        "In data.access, add the directive exports data.model;",
        "In shop.ui, replace requires data.access; with requires transitive data.access;",
        "In data.access, replace requires data.model; with requires static data.model;"
      ],
      answer: [0, 1],
      explain: "L'erreur est `package data.model is not visible (... but module shop.ui does not read it)` : `shop.ui` ne lit pas `data.model`. Deux remèdes : `requires transitive data.model;` dans le module intermédiaire `data.access` (lisibilité implicite pour ses clients) ou un `requires data.model;` direct dans `shop.ui`. Un module ne peut exporter que ses propres packages (`exports data.model;` dans `data.access` → `package is empty or does not exist`). `transitive` placé dans `shop.ui` ne concerne que les clients de `shop.ui`, et `requires static` ne rend pas la dépendance transitive."
    },
    {
      id: "modules-004",
      difficulty: 3,
      q: "Given the following modules, what is the result of running zoo.app.Main?",
      code: String.raw`// zoo.core
module zoo.core {
    exports zoo.core.api;
}

package zoo.core.api;
public class Animal {
    private String name = "Leo";
    public String getName() { return name; }
}

// zoo.app
module zoo.app {
    requires zoo.core;
}

package zoo.app;
import zoo.core.api.Animal;
public class Main {
    public static void main(String[] args) throws Exception {
        Animal a = new Animal();
        var m = Animal.class.getMethod("getName");
        System.out.print(m.invoke(a) + " ");
        var f = Animal.class.getDeclaredField("name");
        f.setAccessible(true);
        System.out.print(f.get(a));
    }
}`,
      options: [
        "Leo Leo",
        "It prints Leo and then throws an InaccessibleObjectException",
        "It throws an InaccessibleObjectException without printing anything",
        "It prints Leo and then throws an IllegalAccessException",
        "The code does not compile"
      ],
      answer: [1],
      explain: "`exports` autorise l'accès, y compris par réflexion, aux types et membres **public** d'un package : `getMethod(\"getName\")` puis `invoke` fonctionnent et affichent `Leo `. La réflexion profonde sur un membre privé exige que le package soit **ouvert** (`opens zoo.core.api;` ou `open module`) : `f.setAccessible(true)` lève `java.lang.reflect.InaccessibleObjectException` (`module zoo.core does not \"opens zoo.core.api\" to module zoo.app`). Ce n'est pas `IllegalAccessException`, qui ne serait levée que par `f.get(a)` sans appel à `setAccessible`."
    },
    {
      id: "modules-005",
      difficulty: 2,
      q: "Module zoo.core exports the package zoo.core.api but does not open it. Code in module zoo.app calls setAccessible(true) on a private field of a class of that package and fails with an InaccessibleObjectException. Without changing any source file, which command makes the application run successfully?",
      options: [
        "java --add-opens zoo.core/zoo.core.api=zoo.app -p mods -m zoo.app/zoo.app.Main",
        "java --add-exports zoo.core/zoo.core.api=zoo.app -p mods -m zoo.app/zoo.app.Main",
        "java --add-opens zoo.core.api=zoo.app -p mods -m zoo.app/zoo.app.Main",
        "java --add-opens zoo.app/zoo.core.api=zoo.core -p mods -m zoo.app/zoo.app.Main",
        "java --add-modules zoo.core -p mods -m zoo.app/zoo.app.Main"
      ],
      answer: [0],
      explain: "`--add-opens module/package=cible` équivaut à ajouter `opens package to cible` dans le module propriétaire du package : c'est ce qu'exige la réflexion profonde. `--add-exports` n'apporte que ce que `exports` donne déjà (l'exception persiste). La syntaxe impose `module/package` à gauche : sans nom de module la JVM ne démarre pas, et inverser les modules (`zoo.app/zoo.core.api`) désigne un package qui n'appartient pas à `zoo.app`. `--add-modules` ajoute un module au graphe mais n'ouvre rien."
    },
    {
      id: "modules-006",
      difficulty: 2,
      q: "A module contains the packages pets.api and pets.impl, and the modules zoo.core and zoo.app are available on the module path. Which module declarations compile? (Choose two.)",
      options: [
        "module pets.store { requires java.base; requires transitive zoo.core; }",
        "open module pets.store { exports pets.api; }",
        "open module pets.store { opens pets.impl; }",
        "module pets.store { exports pets.api; exports pets.api to zoo.app; }",
        "module pets.store { requires zoo.core; requires zoo.core; }",
        "module pets-store { exports pets.api; }"
      ],
      answer: [0, 1],
      explain: "Écrire explicitement `requires java.base;` est redondant mais autorisé, et un module `open` peut contenir des `exports`. Sont rejetés : `opens` dans un module `open` (`'opens' only allowed in strong modules`, tout est déjà ouvert), deux `exports` du même package même si l'un est qualifié (`duplicate or conflicting exports`), deux `requires` identiques (`duplicate requires`) et un nom de module contenant un tiret (un nom de module est une suite d'identifiants Java séparés par des points)."
    },
    {
      id: "modules-007",
      difficulty: 1,
      q: "What is the result of compiling these two modules together?",
      code: String.raw`// a.one/module-info.java
module a.one { requires b.two; }

// b.two/module-info.java
module b.two { requires a.one; }`,
      options: [
        "Both modules compile",
        "Compilation fails because of a cyclic dependency between the modules",
        "Both modules compile, but a ResolutionException is thrown when one of them is run",
        "Only the module that is listed first on the command line compiles",
        "Both modules compile, with a warning about the cycle"
      ],
      answer: [1],
      explain: "Les dépendances cycliques entre modules nommés sont interdites dès la compilation : `javac` signale `cyclic dependence involving ...` pour chacun des deux descripteurs. Ce n'est ni un simple avertissement ni une erreur reportée à l'exécution. Pour supprimer le cycle, on extrait le code commun dans un troisième module ou on passe par un service."
    },
    {
      id: "modules-008",
      difficulty: 2,
      q: "The file holiday-calendar-1.0.2.jar contains no module-info.class and its manifest has no Automatic-Module-Name entry. It is placed on the module path. Which statements are true? (Choose two.)",
      options: [
        "Its module name is holiday.calendar",
        "All of its packages are exported",
        "Its module name is holiday.calendar.1.0.2",
        "Its classes cannot use classes located on the class path",
        "It can be added to a custom runtime image with jlink",
        "It is part of the unnamed module"
      ],
      answer: [0, 1],
      explain: "Sur le module path, un JAR sans descripteur devient un module **automatique**. Son nom est dérivé du fichier : extension retirée, version supprimée à partir de `-1.0.2`, tiret remplacé par un point → `holiday.calendar`. Un module automatique exporte (et ouvre) tous ses packages et lit tous les modules, y compris le module sans nom, donc le classpath. `jlink` refuse les modules automatiques. Il ne ferait partie du module sans nom que s'il était placé sur le classpath."
    },
    {
      id: "modules-009",
      difficulty: 3,
      q: "core.jar is a modular JAR whose descriptor is shown below; the public class zoo.core.internal.Secret has a public static method hint() returning \"hint\". Legacy.java is compiled and run with core.jar on the class path only (no module path). What is the result?",
      code: String.raw`// descriptor inside core.jar
module zoo.core {
    exports zoo.core.api;
}

// Legacy.java (no module-info, default package)
public class Legacy {
    public static void main(String[] args) {
        System.out.println(zoo.core.internal.Secret.hint());
    }
}`,
      options: [
        "hint",
        "Compilation fails because package zoo.core.internal is not exported",
        "The code compiles but an IllegalAccessError is thrown at runtime",
        "Compilation fails because a modular JAR cannot be placed on the class path",
        "The code compiles but a NoClassDefFoundError is thrown at runtime"
      ],
      answer: [0],
      explain: "Un JAR modulaire placé sur le **classpath** est traité comme un JAR ordinaire : son `module-info.class` est ignoré et ses classes rejoignent le module sans nom. L'encapsulation ne s'applique donc plus : `zoo.core.internal`, bien que non exporté, est accessible comme n'importe quel package public du classpath, et le programme affiche `hint`. L'erreur `package is not visible` n'apparaîtrait que si `core.jar` était sur le module path."
    },
    {
      id: "modules-010",
      difficulty: 2,
      q: "Module tour.api exports the package tour.api, which contains the interface Tour. The class tour.agency.CityTour implements Tour. Which declaration makes CityTour discoverable through ServiceLoader.load(Tour.class)?",
      options: [
        String.raw`module tour.agency {
    requires tour.api;
    provides tour.api.Tour with tour.agency.CityTour;
}`,
        String.raw`module tour.agency {
    requires tour.api;
    provides tour.agency.CityTour with tour.api.Tour;
}`,
        String.raw`module tour.agency {
    provides tour.api.Tour with tour.agency.CityTour;
}`,
        String.raw`module tour.agency {
    requires tour.api;
    uses tour.api.Tour;
    exports tour.agency;
}`,
        String.raw`module tour.agency {
    requires tour.api;
    provides tour.api.Tour to tour.agency.CityTour;
}`
      ],
      answer: [0],
      explain: "Un provider doit lire le module de l'interface (`requires tour.api;`) et déclarer `provides <service> with <implémentation>;`. Inverser les deux types ne compile pas (l'implémentation doit être un sous-type du service et appartenir au module). Sans `requires tour.api;`, le package `tour.api` n'est pas visible. `uses` est la directive du **consommateur** et exporter le package d'implémentation n'enregistre aucun service (et n'est d'ailleurs pas nécessaire). Le mot-clé est `with`, pas `to`."
    },
    {
      id: "modules-011",
      difficulty: 3,
      q: "Module tour.api exports the interface tour.api.Tour, and all three modules are on the module path. What is the result of running tour.finder.Finder?",
      code: String.raw`// tour.agency
module tour.agency {
    requires tour.api;
    provides tour.api.Tour with tour.agency.CityTour;
}

// tour.finder
module tour.finder {
    requires tour.api;
}

package tour.finder;
import java.util.ServiceLoader;
import tour.api.Tour;
public class Finder {
    public static void main(String[] args) {
        ServiceLoader<Tour> loader = ServiceLoader.load(Tour.class);
        System.out.print(loader.stream().count());
    }
}`,
      options: [
        "0",
        "1",
        "Module tour.finder does not compile",
        "A ServiceConfigurationError is thrown at runtime",
        "A NoSuchElementException is thrown at runtime"
      ],
      answer: [3],
      explain: "Le module qui appelle `ServiceLoader.load(Tour.class)` doit déclarer `uses tour.api.Tour;`. Le compilateur ne le vérifie pas : le code compile. À l'exécution, `ServiceLoader.load` lève `java.util.ServiceConfigurationError: tour.api.Tour: module tour.finder does not declare 'uses'`. Avec la directive `uses`, le programme afficherait `1` puisque `tour.agency` fournit une implémentation."
    },
    {
      id: "modules-012",
      difficulty: 2,
      q: "Tour is a service interface, and java.util.* is imported. Which statements compile? (Choose two.)",
      options: [
        "Tour t = ServiceLoader.load(Tour.class).findFirst().orElseThrow();",
        "List<Tour> all = ServiceLoader.load(Tour.class).stream().map(ServiceLoader.Provider::get).toList();",
        "Tour t = ServiceLoader.load(Tour.class).stream().findFirst().get();",
        "ServiceLoader<Tour> loader = new ServiceLoader<>(Tour.class);",
        "Tour t = ServiceLoader.load(Tour.class).get();",
        "Optional<Tour> t = ServiceLoader.findFirst(Tour.class);"
      ],
      answer: [0, 1],
      explain: "`ServiceLoader.load(Class)` est une méthode static qui renvoie un `ServiceLoader<Tour>` ; sa méthode d'instance `findFirst()` renvoie un `Optional<Tour>`. `stream()` renvoie un `Stream<ServiceLoader.Provider<Tour>>` : il faut `Provider::get` pour obtenir les instances, donc `stream().findFirst().get()` donne un `Provider<Tour>` et non un `Tour`. `ServiceLoader` n'a pas de constructeur accessible, pas de méthode `get()`, et `findFirst` n'est pas static et ne prend pas d'argument."
    },
    {
      id: "modules-013",
      difficulty: 1,
      q: "The directory mods contains the modules hello.app and zoo.core. The main class is hello.Main in module hello.app. Which commands run the application? (Choose two.)",
      options: [
        "java --module-path mods --module hello.app/hello.Main",
        "java -p mods -m hello.app/hello.Main",
        "java -p mods -m hello.app:hello.Main",
        "java -p mods hello.app/hello.Main",
        "java -mp mods -m hello.app/hello.Main",
        "java -m hello.app/hello.Main -p mods"
      ],
      answer: [0, 1],
      explain: "La forme est `java --module-path <chemin> --module <module>/<classe>`, abrégée en `-p` et `-m`. Le séparateur entre module et classe est `/`, pas `:`. Sans `-m`, `hello.app/hello.Main` est interprété comme un nom de classe du classpath. `-mp` n'existe pas. Enfin `-m` doit être la dernière option : dans `java -m hello.app/hello.Main -p mods`, `-p mods` devient des arguments du programme et le module n'est pas trouvé."
    },
    {
      id: "modules-014",
      difficulty: 2,
      q: "The source tree is src/zoo.core/module-info.java, src/zoo.core/zoo/core/api/Animal.java, and so on. Which command compiles module zoo.core into the directory out?",
      options: [
        "javac -d out --module-source-path src -m zoo.core",
        "javac -d out -m zoo.core",
        "javac --module-source-path src -m zoo.core",
        "javac -o out --module-source-path src -m zoo.core",
        "javac -d out -s src -m zoo.core"
      ],
      answer: [0],
      explain: "Avec `-m` (`--module`), `javac` exige à la fois `--module-source-path` (racine contenant un répertoire par module) et `-d` (répertoire de sortie) : en omettre un donne `module source path must be specified if -m option is used` ou `class output directory must be specified if -m option is used`. `-o` n'est pas une option de `javac`, et `-s` désigne le répertoire des sources **générées**, pas le module source path."
    },
    {
      id: "modules-015",
      difficulty: 2,
      q: "The directory mods contains app.jar, a modular JAR for module hello.app. Which commands print the description of the module (its requires, exports, …)? (Choose three.)",
      options: [
        "java -p mods -d hello.app",
        "java --module-path mods --describe-module hello.app",
        "jar --file mods/app.jar --describe-module",
        "jar --describe-module mods/app.jar",
        "java -p mods --describe hello.app",
        "jdeps -d mods/app.jar"
      ],
      answer: [0, 1, 2],
      explain: "Pour `java`, `--describe-module` s'abrège en `-d` et prend un **nom de module** recherché sur le module path. Pour `jar`, `--describe-module` (ou `-d`) s'applique à l'archive désignée par `--file` / `-f` : sans `--file`, la commande échoue. `--describe` n'est pas une option de `java` et `jdeps` n'a pas d'option `-d` (son résumé s'obtient avec `-s`)."
    },
    {
      id: "modules-016",
      difficulty: 3,
      q: "The directory mods contains core.jar (module zoo.core) and app.jar (module hello.app, which requires zoo.core and was packaged with --main-class hello.Main). hello.Main prints \"hello \" followed by the name returned by a class of zoo.core, \"Leo\". What is the result of the following command?",
      code: String.raw`java -p mods -jar mods/app.jar`,
      options: [
        "hello Leo",
        "A NoClassDefFoundError is thrown at runtime",
        "The JVM fails to start with a FindException: Module hello.app not found",
        "The command fails with: no main manifest attribute, in mods/app.jar",
        "The command fails because -p and -jar cannot be combined"
      ],
      answer: [1],
      explain: "Avec `-jar`, l'archive est placée sur le **classpath** : `app.jar` rejoint le module sans nom et son descripteur est ignoré, donc son `requires zoo.core` aussi. Le module `zoo.core` est bien observable sur le module path, mais aucun module racine ne le requiert : il n'est pas résolu et `hello.Main` échoue avec `NoClassDefFoundError: zoo/core/api/Animal`. La classe principale est trouvée (attribut `Main-Class` écrit par `--main-class`). Il fallait `java -p mods -m hello.app`, ou ajouter `--add-modules zoo.core`."
    },
    {
      id: "modules-017",
      difficulty: 1,
      q: "legacy.jar is a non-modular JAR. Which command reports the classes of this JAR that depend on JDK internal APIs such as sun.misc.Unsafe?",
      options: [
        "jdeps --jdk-internals legacy.jar",
        "jdeps --internal-api legacy.jar",
        "java --jdk-internals -jar legacy.jar",
        "jar --describe-module --file legacy.jar",
        "jlink --list-internals legacy.jar"
      ],
      answer: [0],
      explain: "`jdeps` est l'outil d'analyse statique des dépendances ; son option `--jdk-internals` (ancienne forme `-jdkinternals`) liste les dépendances de niveau classe vers les API internes du JDK et suggère un remplacement. `jdeps -s` donnerait seulement le résumé par module (`legacy.jar -> jdk.unsupported`). `jar --describe-module` se contente d'indiquer le nom de module automatique dérivé ; les autres options n'existent pas."
    },
    {
      id: "modules-018",
      difficulty: 1,
      q: "Which of the following are operation modes of the jmod tool? (Choose three.)",
      options: [
        "create",
        "describe",
        "hash",
        "update",
        "delete",
        "run"
      ],
      answer: [0, 1, 2],
      explain: "`jmod` possède exactement cinq modes : `create`, `extract`, `list`, `describe` et `hash`. Il n'existe ni `update`, ni `delete`, ni `run` : un fichier JMOD ne s'exécute pas, il sert à la compilation et à l'édition de liens par `jlink`."
    },
    {
      id: "modules-019",
      difficulty: 2,
      q: "The directory mods contains the modular JARs of modules hello.app and zoo.core. Which command creates a custom runtime image for the application in the directory img?",
      options: [
        "jlink --module-path mods --add-modules hello.app --output img",
        "jlink -p mods --add-modules hello.app -o img",
        "jlink -p mods -m hello.app --output img",
        "jlink --module-path mods --add-modules hello.app",
        "jmod create --module-path mods --add-modules hello.app img"
      ],
      answer: [0],
      explain: "`jlink` attend `--module-path` (ou `-p`), `--add-modules` pour les modules racines et `--output` pour le répertoire de l'image. `--output` est obligatoire (`--output must be specified`) et n'a pas de forme courte `-o` ; `-m` n'est pas une option de `jlink`. `jmod create` produit un fichier `.jmod`, pas une image d'exécution. L'image obtenue contient `hello.app`, `zoo.core` et `java.base`, et se lance avec `img/bin/java -m hello.app/hello.Main`."
    },
    {
      id: "modules-020",
      difficulty: 2,
      q: "Which statements about migrating an application to modules are true? (Choose two.)",
      options: [
        "In a bottom-up migration, the JARs that have not been migrated yet stay on the class path",
        "In a top-down migration, the JARs that have not been migrated yet are placed on the module path as automatic modules",
        "In a top-down migration, the JARs that have not been migrated yet stay on the class path",
        "In a bottom-up migration, the JARs that have not been migrated yet become automatic modules",
        "A named module can depend on a JAR of the class path by requiring the unnamed module",
        "A bottom-up migration starts with the JAR containing the main class of the application"
      ],
      answer: [0, 1],
      explain: "Bottom-up : on modularise d'abord les JAR les plus bas, qui deviennent des modules nommés sur le module path ; le reste demeure sur le classpath (module sans nom, qui lit tous les modules). Top-down : on commence par l'application ; tous les autres JAR passent sur le module path et deviennent des modules **automatiques** que le module applicatif peut `requires`. Un module nommé ne peut jamais lire le module sans nom, qui n'a pas de nom à mettre dans un `requires`."
    },
    {
      id: "modules-021",
      difficulty: 3,
      q: "Given the following module, which line fails to compile?",
      code: String.raw`// module-info.java
module bank.app {
    requires java.sql;
}

// bank/Audit.java
package bank;
import java.sql.SQLException;          // b1
import java.util.logging.Logger;       // b2
import javax.swing.JFrame;             // b3
import java.util.List;                 // b4
public class Audit { }`,
      options: [
        "b1",
        "b2",
        "b3",
        "b4",
        "No line fails: the module compiles"
      ],
      answer: [2],
      explain: "`java.sql` déclare `requires transitive java.logging;` (ainsi que `java.xml` et `java.transaction.xa`) : un module qui requiert `java.sql` lit donc aussi `java.logging`, et b2 compile. `java.util.List` est dans `java.base`, requis implicitement. En revanche `javax.swing` appartient à `java.desktop`, que `bank.app` ne lit pas : `package javax.swing is not visible (... but module bank.app does not read it)`."
    },
    {
      id: "modules-022",
      difficulty: 2,
      q: "On Linux, the directory lib contains two non-modular JARs, app.jar (with class hello.Main, no Main-Class attribute) and core.jar, on which app.jar depends. Which commands run hello.Main successfully? (Choose two.)",
      options: [
        "java -cp \"lib/*\" hello.Main",
        "java -classpath lib/app.jar:lib/core.jar hello.Main",
        "java -cp lib hello.Main",
        "java -cp \"lib/*.jar\" hello.Main",
        "java -jar lib/app.jar"
      ],
      answer: [0, 1],
      explain: "Le joker `lib/*` ajoute au classpath tous les fichiers JAR du répertoire `lib`. On peut aussi lister chaque JAR, séparés par `:` sous Linux (`;` sous Windows) ; `-cp`, `-classpath` et `--class-path` sont équivalents. `-cp lib` ne désigne que le répertoire (pour des `.class`), pas les JAR qu'il contient. `lib/*.jar` n'est pas une forme reconnue par la JVM. `java -jar lib/app.jar` échoue faute d'attribut `Main-Class` dans le manifeste."
    },
    {
      id: "modules-023",
      difficulty: 2,
      q: "The file Trip.java contains exactly the following code. What is the result of the command java Trip.java a b?",
      code: String.raw`class Guide {
    public static void main(String[] args) {
        System.out.println("Guide " + args.length);
    }
}
public class Planner {
    public static void main(String[] args) {
        System.out.println("Planner " + args.length);
    }
}`,
      options: [
        "Guide 2",
        "Planner 2",
        "Guide 3",
        "An error, because the public class Planner must be declared in a file named Planner.java",
        "An error, because the file does not declare a class named Trip"
      ],
      answer: [0],
      explain: "En mode lancement de fichier source, le fichier est compilé en mémoire et la classe exécutée est la **première classe de premier niveau** du fichier, ici `Guide`, peu importe laquelle est `public`. La règle liant le nom d'une classe `public` au nom du fichier n'est pas appliquée dans ce mode (elle le serait avec `javac Trip.java`). Les arguments placés après le nom du fichier sont `a` et `b` : `args.length` vaut 2, le nom du fichier n'en fait pas partie."
    },
    {
      id: "modules-024",
      difficulty: 2,
      q: "The directory classes contains com/acme/app/Start.class, a class with a main method. Which commands create a JAR that can be run with java -jar run.jar? (Choose two.)",
      options: [
        "jar --create --file run.jar --main-class com.acme.app.Start -C classes .",
        "jar -c -f run.jar -e com.acme.app.Start -C classes .",
        "jar -c -f run.jar -m com.acme.app.Start -C classes .",
        "jar --create --file run.jar --main-class com.acme.app.Start classes",
        "jar --create run.jar --main-class com.acme.app.Start -C classes .",
        "jar --create --file run.jar --main com.acme.app.Start -C classes ."
      ],
      answer: [0, 1],
      explain: "`--main-class` (forme courte `-e`) inscrit l'attribut `Main-Class` dans le manifeste, et `-C classes .` ajoute le contenu de `classes` à la racine de l'archive. `-m` attend un **fichier manifeste**, pas un nom de classe. Sans `-C`, les entrées sont stockées sous `classes/com/acme/...` : le JAR est créé mais `java -jar` ne trouve pas `com.acme.app.Start`. Le nom de l'archive doit être introduit par `--file` / `-f`, et `--main` n'existe pas."
    },
    {
      id: "modules-025",
      difficulty: 3,
      q: "Module zoo.core exports zoo.core.api, whose class Animal has a method getName() returning \"Leo\". Both zoo.core and report.app are compiled into the directory mods. What is the result of the following command?",
      code: String.raw`// module-info.java
module report.app {
    requires static zoo.core;
}

// report/Main.java
package report;
public class Main {
    public static void main(String[] args) {
        System.out.print("start ");
        if (args.length > 0) {
            System.out.print(new zoo.core.api.Animal().getName());
        }
        System.out.print("end");
    }
}

// command
java -p mods -m report.app/report.Main x`,
      options: [
        "start Leoend",
        "start end",
        "It prints start and then throws a NoClassDefFoundError",
        "The JVM fails to start because zoo.core is not resolved",
        "Module report.app does not compile"
      ],
      answer: [2],
      explain: "`requires static` rend la dépendance obligatoire à la compilation mais **optionnelle à l'exécution** : la JVM ne résout pas `zoo.core` à partir de ce seul `requires static`, même si le module est présent sur le module path. Le démarrage réussit, `start ` est affiché, puis l'utilisation de `Animal` lève `NoClassDefFoundError`. Pour obtenir `start Leoend`, il faudrait `--add-modules zoo.core` ou qu'un autre module résolu requière `zoo.core`. Sans argument, le programme afficherait `start end`."
    }
  ]
});
