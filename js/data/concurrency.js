OCP.register({
  topic: 'concurrency',
  course: [
    {
      title: "Threads : création, start() et cycle de vie",
      blocks: [
        { p: "Un thread exécute une tâche décrite par un `Runnable` (méthode `void run()`, aucune exception contrôlée autorisée). Trois façons classiques de créer un thread de plateforme :" },
        { code: String.raw`Thread t1 = new Thread(() -> System.out.println("lambda"));   // Runnable
Thread t2 = new Thread(new MyRunnable(), "worker");            // Runnable + name
Thread t3 = new Thread() {                                     // Thread subclass
    @Override public void run() { System.out.println("subclass"); }
};
t1.start();   // new thread: run() is called asynchronously
t1.run();     // NO new thread: plain method call in the current thread` },
        { list: [
          "`start()` crée le nouveau fil d'exécution puis appelle `run()` dedans ; `run()` appelé directement s'exécute dans le thread courant (souvent `main`).",
          "`start()` ne peut être appelé **qu'une fois** : un second appel lève `IllegalThreadStateException`, même si le thread est terminé.",
          "`Thread.run()` par défaut délègue au `Runnable` passé au constructeur ; si une sous-classe redéfinit `run()`, le `Runnable` est ignoré.",
          "L'ordre d'exécution entre threads n'est **jamais** garanti sans synchronisation explicite (`join`, `Future.get`, etc.)."
        ] },
        { h: "États (`Thread.State`)" },
        { table: { head: ["État", "Signification"], rows: [
          ["`NEW`", "créé, `start()` pas encore appelé"],
          ["`RUNNABLE`", "en cours d'exécution ou prêt à l'être"],
          ["`BLOCKED`", "attend un moniteur (`synchronized`)"],
          ["`WAITING`", "attente sans limite : `join()`, `wait()`"],
          ["`TIMED_WAITING`", "attente bornée : `sleep(ms)`, `join(ms)`, `wait(ms)`"],
          ["`TERMINATED`", "`run()` terminé (normalement ou par exception)"]
        ] } },
        { trap: "Une question qui affiche depuis plusieurs threads sans `join()` ni `get()` a presque toujours pour réponse « l'ordre ne peut pas être déterminé ». À l'inverse, `t.run()` au lieu de `t.start()` rend le code parfaitement séquentiel." },
        { trap: "Une exception non interceptée dans un thread termine ce thread seulement : le thread `main` continue normalement." }
      ]
    },
    {
      title: "sleep, join, interrupt et threads démons",
      blocks: [
        { table: { head: ["Méthode", "Nature", "Comportement"], rows: [
          ["`Thread.sleep(long ms)` / `sleep(Duration)`", "statique", "endort le thread **courant** ; lève `InterruptedException` (contrôlée) ; ne libère aucun verrou"],
          ["`t.join()` / `join(ms)`", "instance", "le thread courant attend la fin de `t` ; lève `InterruptedException`"],
          ["`t.interrupt()`", "instance", "positionne le drapeau d'interruption de `t` ; ne tue pas le thread"],
          ["`t.isInterrupted()`", "instance", "lit le drapeau **sans** l'effacer"],
          ["`Thread.interrupted()`", "statique", "lit le drapeau du thread courant **et l'efface**"]
        ] } },
        { list: [
          "Si le thread est bloqué dans `sleep`, `join` ou `wait` (ou y entre avec le drapeau déjà levé), une `InterruptedException` est levée et le drapeau est **remis à false**.",
          "L'interruption est coopérative : un thread qui ne teste jamais le drapeau et n'appelle aucune méthode bloquante n'est pas arrêté.",
          "`InterruptedException` est contrôlée : impossible d'appeler `Thread.sleep()` dans un `Runnable` lambda sans `try/catch`."
        ] },
        { h: "Threads démons" },
        { list: [
          "La JVM s'arrête quand il ne reste plus que des threads démons ; ils sont alors abandonnés brutalement (leurs blocs `finally` ne sont pas garantis).",
          "`setDaemon(true)` doit être appelé **avant** `start()`, sinon `IllegalThreadStateException`.",
          "Un thread de plateforme hérite du statut démon de son créateur ; `main` n'est pas un démon.",
          "Un pool créé par `Executors.newFixedThreadPool` utilise des threads non démons : sans `shutdown()` / `close()`, le programme ne se termine pas."
        ] },
        { code: String.raw`Thread.currentThread().interrupt();          // flag = true
System.out.println(Thread.interrupted());    // true, and clears the flag
System.out.println(Thread.interrupted());    // false` },
        { trap: "Dans un `catch (InterruptedException e)`, `Thread.currentThread().isInterrupted()` renvoie `false` : lever l'exception a effacé le drapeau." }
      ]
    },
    {
      title: "Threads de plateforme et threads virtuels (Java 21)",
      blocks: [
        { p: "Un **thread de plateforme** enveloppe un thread du système (coûteux, nombre limité). Un **thread virtuel** est géré par la JVM : il est *monté* sur un thread de plateforme porteur (*carrier*, issu d'un `ForkJoinPool` interne) quand il s'exécute et *démonté* dès qu'il bloque (E/S, `sleep`, `Lock`…), ce qui libère le porteur." },
        { code: String.raw`Thread p = Thread.ofPlatform().name("p1").daemon(true).start(task);
Thread v1 = Thread.ofVirtual().name("v1").start(task);
Thread v2 = Thread.ofVirtual().unstarted(task);     // state NEW, needs v2.start()
Thread v3 = Thread.startVirtualThread(task);        // created AND started

try (ExecutorService es = Executors.newVirtualThreadPerTaskExecutor()) {
    es.submit(task);      // one new virtual thread per task, no pooling
}                         // close() waits for the tasks` },
        { table: { head: ["Propriété", "Plateforme", "Virtuel"], rows: [
          ["Démon", "au choix (`setDaemon`)", "**toujours** démon ; `setDaemon(false)` lève `IllegalArgumentException`"],
          ["Priorité", "1 à 10", "fixe à `NORM_PRIORITY` (5) ; `setPriority` est ignoré"],
          ["Coût", "élevé (pile système)", "très faible : des millions possibles"],
          ["Pool", "oui, on les réutilise", "non : un thread virtuel par tâche"],
          ["`isVirtual()`", "`false`", "`true`"],
          ["Constructeur `new Thread(...)`", "oui", "jamais : toujours via `Thread.ofVirtual()` / `startVirtualThread` / executor"]
        ] } },
        { list: [
          "Usage : beaucoup de tâches **bloquantes** (E/S, appels réseau). Aucun gain pour du calcul intensif (CPU-bound).",
          "**Pinning** : en Java 21, un thread virtuel qui bloque à l'intérieur d'un bloc ou d'une méthode `synchronized` (ou d'une méthode native) reste épinglé à son porteur, qui est alors bloqué aussi. Préférer `ReentrantLock` autour des opérations bloquantes.",
          "Un thread virtuel est une instance de `Thread` : `join`, `interrupt`, `getState`, `Thread.currentThread()` fonctionnent pareil."
        ] },
        { trap: "Comme les threads virtuels sont démons, un `main` qui se termine sans `join()` ni executor fermé peut arrêter la JVM avant qu'ils n'aient affiché quoi que ce soit." },
        { trap: "`Thread.ofVirtual().unstarted(r)` ne démarre rien. `Thread.ofVirtual().start(r)` et `Thread.startVirtualThread(r)` démarrent immédiatement." }
      ]
    },
    {
      title: "Runnable, Callable, ExecutorService et Future",
      blocks: [
        { table: { head: ["", "`Runnable`", "`Callable<V>`"], rows: [
          ["Méthode", "`void run()`", "`V call() throws Exception`"],
          ["Résultat", "aucun", "valeur de type `V`"],
          ["Exceptions contrôlées", "interdites", "autorisées"],
          ["Utilisable avec", "`Thread`, `execute`, `submit`", "`submit`, `invokeAll`, `invokeAny` (pas `Thread`, pas `execute`)"]
        ] } },
        { h: "Fabriques `Executors`" },
        { table: { head: ["Fabrique", "Comportement"], rows: [
          ["`newSingleThreadExecutor()`", "un seul thread : tâches exécutées **dans l'ordre de soumission**"],
          ["`newFixedThreadPool(n)`", "n threads, file d'attente non bornée"],
          ["`newCachedThreadPool()`", "crée des threads à la demande, réutilise les inactifs"],
          ["`newScheduledThreadPool(n)` / `newSingleThreadScheduledExecutor()`", "renvoient un `ScheduledExecutorService`"],
          ["`newVirtualThreadPerTaskExecutor()`", "un nouveau thread virtuel par tâche (Java 21)"]
        ] } },
        { h: "Soumettre des tâches" },
        { table: { head: ["Méthode", "Retour", "Remarque"], rows: [
          ["`execute(Runnable)`", "`void`", "exception de la tâche : propagée au thread du pool (trace affichée)"],
          ["`submit(Runnable)`", "`Future<?>`", "`get()` renvoie `null`"],
          ["`submit(Callable<T>)`", "`Future<T>`", "exception stockée dans le `Future`"],
          ["`invokeAll(tasks)`", "`List<Future<T>>`", "bloque jusqu'à la fin de **toutes** ; même ordre que la collection"],
          ["`invokeAny(tasks)`", "`T`", "résultat d'une tâche réussie (laquelle : non déterminé), annule les autres"]
        ] } },
        { h: "Future" },
        { list: [
          "`get()` bloque ; lève `InterruptedException` et `ExecutionException` (contrôlées). L'exception de la tâche est dans `getCause()`.",
          "`get(long, TimeUnit)` lève en plus `TimeoutException` (contrôlée) ; la tâche continue de tourner.",
          "`cancel(boolean mayInterruptIfRunning)` renvoie `true` si l'annulation a réussi ; ensuite `isCancelled()` et `isDone()` valent `true` et `get()` lève `CancellationException` (non contrôlée).",
          "`isDone()` vaut `true` pour une fin normale, une exception ou une annulation."
        ] },
        { code: String.raw`ExecutorService es = Executors.newSingleThreadExecutor();
Future<Integer> f = es.submit(() -> 6 * 7);     // Callable<Integer>
System.out.println(f.get());                    // 42
es.shutdown();` },
        { trap: "`submit` n'affiche jamais l'exception d'une tâche : tant que personne n'appelle `get()`, elle passe inaperçue. `get()` la relance enveloppée dans une `ExecutionException`." },
        { trap: "`Runnable r = () -> { Thread.sleep(10); };` ne compile pas (exception contrôlée), alors que le même corps avec un `return` compile comme `Callable`." }
      ]
    },
    {
      title: "Arrêt d'un executor et tâches planifiées",
      blocks: [
        { table: { head: ["Méthode", "Effet"], rows: [
          ["`shutdown()`", "refuse les nouvelles tâches, laisse finir celles déjà soumises ; **ne bloque pas**"],
          ["`shutdownNow()`", "tente d'interrompre les tâches en cours (sans garantie) et renvoie la `List<Runnable>` des tâches jamais démarrées"],
          ["`awaitTermination(long, TimeUnit)`", "attend la fin après un shutdown ; renvoie `true` si terminé, `false` si le délai expire ; ne déclenche pas d'arrêt"],
          ["`isShutdown()`", "`true` dès l'appel à `shutdown()` / `shutdownNow()`"],
          ["`isTerminated()`", "`true` quand l'arrêt est demandé **et** que toutes les tâches sont finies"],
          ["`close()` (Java 19)", "`shutdown()` puis attend la fin de toutes les tâches"]
        ] } },
        { list: [
          "Soumettre une tâche après `shutdown()` lève `RejectedExecutionException` (non contrôlée).",
          "`ExecutorService` étend `AutoCloseable` depuis Java 19 : utilisable dans un try-with-resources, la sortie du bloc attend la fin des tâches.",
          "Oublier d'arrêter un pool de threads de plateforme empêche la JVM de se terminer."
        ] },
        { code: String.raw`try (ExecutorService es = Executors.newFixedThreadPool(4)) {
    es.submit(() -> System.out.println("task"));
}   // implicit close(): shutdown + wait
System.out.println("always after the task");` },
        { h: "ScheduledExecutorService" },
        { table: { head: ["Méthode", "Tâche", "Retour"], rows: [
          ["`schedule(Runnable, delay, unit)`", "une fois après le délai", "`ScheduledFuture<?>`"],
          ["`schedule(Callable<V>, delay, unit)`", "une fois après le délai", "`ScheduledFuture<V>`"],
          ["`scheduleAtFixedRate(Runnable, initialDelay, period, unit)`", "période mesurée entre deux **débuts**", "`ScheduledFuture<?>`"],
          ["`scheduleWithFixedDelay(Runnable, initialDelay, delay, unit)`", "délai mesuré entre la **fin** d'une exécution et le début de la suivante", "`ScheduledFuture<?>`"]
        ] } },
        { trap: "Les deux méthodes périodiques n'acceptent qu'un `Runnable` (jamais un `Callable`) et prennent **quatre** arguments. Une tâche périodique qui lève une exception n'est plus jamais relancée." }
      ]
    },
    {
      title: "Thread safety : synchronized, volatile et classes atomiques",
      blocks: [
        { p: "Une **race condition** apparaît quand plusieurs threads lisent et modifient une même donnée sans coordination. `count++` n'est pas atomique : lecture, incrémentation, écriture. Deux threads peuvent lire la même valeur et une mise à jour est perdue." },
        { h: "synchronized" },
        { table: { head: ["Forme", "Moniteur verrouillé"], rows: [
          ["`synchronized void m()`", "`this`"],
          ["`static synchronized void m()`", "l'objet `Class` (`MyType.class`)"],
          ["`synchronized (obj) { ... }`", "`obj` (n'importe quel objet, jamais une primitive ni `null`)"]
        ] } },
        { list: [
          "Deux sections ne s'excluent que si elles verrouillent le **même** objet. Une méthode `synchronized` d'instance et une méthode `static synchronized` ne s'excluent pas.",
          "Deux instances différentes ont deux moniteurs différents : `a.m()` et `b.m()` peuvent tourner en même temps.",
          "Le verrou est **réentrant** : un thread qui le détient peut entrer dans un autre bloc `synchronized` sur le même objet.",
          "Le verrou est libéré automatiquement à la sortie du bloc, même par exception.",
          "`synchronized` ne s'applique ni aux constructeurs ni aux variables."
        ] },
        { h: "volatile" },
        { p: "`volatile` garantit la **visibilité** : chaque lecture voit la dernière écriture. Il ne rend **pas** atomiques les opérations composées (`count++`, test puis écriture)." },
        { h: "Classes atomiques (`java.util.concurrent.atomic`)" },
        { table: { head: ["Méthode", "Renvoie"], rows: [
          ["`incrementAndGet()` / `decrementAndGet()`", "la **nouvelle** valeur (comme `++i`)"],
          ["`getAndIncrement()` / `getAndDecrement()`", "l'**ancienne** valeur (comme `i++`)"],
          ["`addAndGet(n)` / `getAndAdd(n)`", "nouvelle / ancienne valeur"],
          ["`getAndSet(v)`", "ancienne valeur"],
          ["`compareAndSet(expected, v)`", "`true` si la valeur valait `expected` et a été remplacée"],
          ["`updateAndGet(op)` / `accumulateAndGet(x, op)`", "nouvelle valeur calculée par la lambda"],
          ["`get()` / `set(v)`", "lecture / écriture simple"]
        ] } },
        { tip: "Le nom se lit dans l'ordre : `getAndIncrement` = je lis **puis** j'incrémente ; `incrementAndGet` = j'incrémente **puis** je lis." },
        { trap: "`AtomicInteger`, `AtomicLong`, `AtomicBoolean` ne sont pas des wrappers : pas d'autoboxing, pas d'opérateur `++`, il faut appeler les méthodes." }
      ]
    },
    {
      title: "Framework Lock et CyclicBarrier",
      blocks: [
        { code: String.raw`Lock lock = new ReentrantLock();
lock.lock();
try {
    // critical section
} finally {
    lock.unlock();          // always in finally
}

if (lock.tryLock()) {       // does not block: true if acquired
    try { /* ... */ } finally { lock.unlock(); }
}` },
        { table: { head: ["Méthode", "Comportement"], rows: [
          ["`lock()`", "bloque jusqu'à l'obtention du verrou"],
          ["`unlock()`", "libère ; `IllegalMonitorStateException` si le thread courant ne détient pas le verrou"],
          ["`tryLock()`", "renvoie immédiatement `true` / `false`"],
          ["`tryLock(long, TimeUnit)`", "attend au plus le délai ; lève `InterruptedException`"],
          ["`lockInterruptibly()`", "comme `lock()` mais interruptible"]
        ] } },
        { list: [
          "`ReentrantLock` est réentrant : chaque `lock()` doit être compensé par un `unlock()`. Après deux `lock()` et un seul `unlock()`, le verrou est toujours détenu.",
          "`new ReentrantLock(true)` : verrou équitable (le thread qui attend depuis le plus longtemps passe en premier).",
          "Contrairement à `synchronized`, rien n'est libéré automatiquement : oublier `unlock()` bloque les autres threads pour toujours.",
          "`tryLock()` renvoie `true` aussi quand le thread courant détient déjà le verrou (réentrance)."
        ] },
        { h: "ReentrantReadWriteLock" },
        { list: [
          "`readLock()` : partagé, plusieurs lecteurs simultanés tant qu'aucun écrivain ne détient le verrou.",
          "`writeLock()` : exclusif, aucun autre lecteur ni écrivain.",
          "Pas de promotion : un thread qui détient seulement le verrou de lecture ne peut pas obtenir le verrou d'écriture."
        ] },
        { h: "CyclicBarrier" },
        { code: String.raw`CyclicBarrier barrier = new CyclicBarrier(3, () -> System.out.println("all here"));
// in each of the 3 threads:
barrier.await();   // throws InterruptedException, BrokenBarrierException` },
        { list: [
          "`await()` bloque jusqu'à ce que le nombre de threads attendu (*parties*) soit arrivé ; l'action de barrière s'exécute alors **une fois**, avant que les threads ne soient relâchés.",
          "La barrière est réutilisable (cyclique) pour le groupe suivant.",
          "Si le pool a moins de threads que de *parties*, la barrière n'est jamais atteinte : le programme reste bloqué."
        ] },
        { trap: "`await()` lève deux exceptions contrôlées : dans un `Runnable` il faut un `try/catch`, dans un `Callable` non." }
      ]
    },
    {
      title: "Collections concurrentes",
      blocks: [
        { table: { head: ["Classe", "Points clés"], rows: [
          ["`ConcurrentHashMap`", "pas de clé ni de valeur `null` ; `putIfAbsent`, `merge`, `compute` atomiques ; itérateurs faiblement cohérents"],
          ["`ConcurrentLinkedQueue`", "file FIFO non bloquante : `offer`, `peek`, `poll`"],
          ["`ConcurrentSkipListMap` / `ConcurrentSkipListSet`", "équivalents concurrents **triés** de `TreeMap` / `TreeSet`"],
          ["`CopyOnWriteArrayList` / `CopyOnWriteArraySet`", "chaque écriture copie le tableau ; l'itérateur parcourt un **instantané**"],
          ["`LinkedBlockingQueue`", "`BlockingQueue` éventuellement bornée ; méthodes avec délai"]
        ] } },
        { h: "Itération et modification" },
        { list: [
          "Collection classique (`ArrayList`, `HashMap`…) modifiée pendant un for-each : `ConcurrentModificationException`, même avec un seul thread (seule exception : supprimer l'avant-dernier élément d'une `ArrayList`, la boucle s'arrête alors sans erreur).",
          "Collections concurrentes : jamais de `ConcurrentModificationException`.",
          "`CopyOnWriteArrayList` : la boucle ne voit pas les éléments ajoutés pendant l'itération (pas de boucle infinie), mais la liste finale les contient.",
          "`Collections.synchronizedList/Map/Set(...)` : chaque méthode est synchronisée, mais l'itération ne l'est pas ; modifier pendant un for-each lève toujours `ConcurrentModificationException`."
        ] },
        { h: "BlockingQueue" },
        { table: { head: ["Opération", "Exception", "Valeur spéciale", "Bloque", "Avec délai"], rows: [
          ["Insertion", "`add(e)` : `IllegalStateException` si pleine", "`offer(e)` : `false`", "`put(e)`", "`offer(e, time, unit)` : `false`"],
          ["Retrait", "`remove()` : `NoSuchElementException` si vide", "`poll()` : `null`", "`take()`", "`poll(time, unit)` : `null`"]
        ] } },
        { trap: "`offer(e, time, unit)`, `poll(time, unit)`, `put` et `take` lèvent `InterruptedException` (contrôlée) ; `offer(e)` et `poll()` non." },
        { trap: "`map.put(key, null)` ou `map.put(null, v)` sur une `ConcurrentHashMap` lève `NullPointerException`, alors qu'une `HashMap` l'accepte." }
      ]
    },
    {
      title: "Problèmes de vivacité (liveness)",
      blocks: [
        { table: { head: ["Problème", "Définition"], rows: [
          ["**Deadlock**", "des threads sont bloqués pour toujours, chacun attendant un verrou détenu par l'autre"],
          ["**Starvation**", "un thread n'obtient jamais la ressource parce que d'autres la monopolisent"],
          ["**Livelock**", "les threads restent actifs et réagissent les uns aux autres, mais sans jamais progresser"]
        ] } },
        { code: String.raw`// Thread 1                     // Thread 2
synchronized (a) {              synchronized (b) {
    synchronized (b) { }            synchronized (a) { }
}                               }` },
        { list: [
          "Le deadlock ci-dessus est **possible**, pas certain : tout dépend de l'ordonnancement.",
          "Prévention : acquérir les verrous toujours dans le même ordre, ou utiliser `tryLock`.",
          "La JVM ne détecte ni ne résout un deadlock : aucune exception, le programme reste bloqué."
        ] },
        { trap: "Dans un deadlock les threads sont `BLOCKED` / `WAITING` ; dans un livelock ils tournent (`RUNNABLE`). La réentrance de `synchronized` n'empêche pas un deadlock entre deux threads." }
      ]
    },
    {
      title: "Streams parallèles et concurrence",
      blocks: [
        { p: "`collection.parallelStream()` ou `stream.parallel()` répartissent le travail sur plusieurs threads (le `ForkJoinPool` commun). Le résultat d'un pipeline correct est le même qu'en séquentiel, mais l'ordre d'exécution des lambdas ne l'est pas." },
        { table: { head: ["Opération", "En parallèle"], rows: [
          ["`forEach`", "ordre **non déterminé**"],
          ["`forEachOrdered`", "respecte l'ordre de rencontre"],
          ["`findFirst`", "toujours le premier élément dans l'ordre de rencontre"],
          ["`findAny`", "n'importe quel élément"],
          ["`collect(Collectors.toList())`, `toList()`", "liste dans l'ordre de rencontre, thread-safe"],
          ["`reduce(identity, op)`", "correct seulement si `op` est associative et sans état, et si `identity` est un vrai élément neutre"]
        ] } },
        { list: [
          "Effet de bord sur une collection non thread-safe (`ArrayList::add` dans `forEach`) : éléments perdus, `null`, voire `ArrayIndexOutOfBoundsException`. Utiliser `collect` ou une collection concurrente.",
          "Un mauvais élément neutre est combiné une fois par segment : `reduce(10, Integer::sum)` donne un résultat différent en parallèle.",
          "`Collectors.toConcurrentMap` et `groupingByConcurrent` accumulent dans une `ConcurrentMap` partagée.",
          "`parallel()` et `sequential()` s'appliquent à tout le pipeline : le dernier appelé l'emporte."
        ] },
        { code: String.raw`List<Integer> safe = IntStream.range(0, 1000).parallel()
    .boxed()
    .collect(Collectors.toList());     // always 1000 elements, in order` },
        { trap: "Une lambda avec état (compteur partagé, liste externe) dans un stream parallèle rend le résultat imprévisible : la bonne réponse est alors « le résultat ne peut pas être déterminé »." }
      ]
    }
  ],
  questions: [
    {
      id: "concurrency-001",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) throws InterruptedException {
        Thread t = new Thread(
            () -> System.out.print(Thread.currentThread().getName() + " "), "worker");
        t.run();
        t.start();
        t.join();
    }
}`,
      options: [
        "main worker",
        "worker worker",
        "worker main",
        "main main",
        "worker, then an IllegalThreadStateException is thrown"
      ],
      answer: [0],
      explain: "`t.run()` est un simple appel de méthode : la lambda s'exécute dans le thread courant, `main`. Seul `t.start()` crée un nouveau fil d'exécution, nommé `worker`. Appeler `run()` avant `start()` ne démarre pas le thread, donc `start()` reste autorisé et ne lève pas `IllegalThreadStateException`. Le `join()` garantit que `worker` a affiché avant la fin de `main`."
    },
    {
      id: "concurrency-002",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) throws InterruptedException {
        Thread t = new Thread(() -> System.out.print("run "));
        System.out.print(t.getState() + " ");
        t.start();
        t.join();
        System.out.print(t.getState() + " ");
        t.start();
    }
}`,
      options: [
        "NEW run TERMINATED run",
        "NEW run TERMINATED and then an IllegalThreadStateException is thrown",
        "NEW run RUNNABLE and then an IllegalThreadStateException is thrown",
        "RUNNABLE run TERMINATED run",
        "The output cannot be determined"
      ],
      answer: [1],
      explain: "Avant `start()` le thread est dans l'état `NEW`. `join()` attend sa fin : `run ` est donc affiché avant le second état, qui vaut `TERMINATED`. Un thread ne peut être démarré qu'une seule fois : le second `start()` lève `IllegalThreadStateException`, même si le thread est terminé. Grâce au `join()`, l'ordre est entièrement déterministe."
    },
    {
      id: "concurrency-003",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) throws InterruptedException {
        Thread t = new Thread(() -> System.out.print("A")) {
            @Override
            public void run() {
                System.out.print("B");
            }
        };
        t.start();
        t.join();
        System.out.print("C");
    }
}`,
      options: ["AC", "BC", "ABC", "BAC", "The code does not compile"],
      answer: [1],
      explain: "C'est `Thread.run()` qui, par défaut, appelle le `run()` du `Runnable` reçu par le constructeur. Ici la classe anonyme redéfinit `run()` sans appeler `super.run()` : le `Runnable` qui affiche `A` est ignoré et seul `B` est affiché par le nouveau thread. `join()` garantit que `C` vient ensuite. Le code compile : une classe anonyme peut étendre `Thread` en passant des arguments au constructeur."
    },
    {
      id: "concurrency-004",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) {
        Thread.currentThread().interrupt();
        try {
            System.out.print("A");
            Thread.sleep(1000);
            System.out.print("B");
        } catch (InterruptedException e) {
            System.out.print("C" + Thread.currentThread().isInterrupted());
        }
    }
}`,
      options: [
        "AB",
        "ACtrue",
        "ACfalse",
        "A and then an uncaught InterruptedException terminates the program",
        "The code does not compile"
      ],
      answer: [2],
      explain: "`interrupt()` ne fait que lever le drapeau d'interruption : `A` est affiché normalement. `Thread.sleep()` appelé avec le drapeau déjà levé lance immédiatement `InterruptedException`, donc `B` n'est jamais affiché. Lever cette exception **efface** le drapeau : `isInterrupted()` renvoie `false` dans le `catch`, d'où `ACfalse` et non `ACtrue`."
    },
    {
      id: "concurrency-005",
      difficulty: 1,
      q: "Which statements about daemon threads are true? (Choose two.)",
      options: [
        "The JVM may exit while daemon threads are still running",
        "A platform thread created with `new Thread(r)` inherits the daemon status of the thread that creates it",
        "Calling `setDaemon(true)` on a thread that is already running turns it into a daemon thread",
        "The `main` thread is a daemon thread",
        "The `finally` blocks of running daemon threads are guaranteed to complete before the JVM exits"
      ],
      answer: [0, 1],
      explain: "La JVM s'arrête dès qu'il ne reste que des threads démons, sans attendre leur fin ni exécuter leurs blocs `finally`. Un thread de plateforme hérite du statut démon de son créateur ; comme `main` n'est pas un démon, les threads qu'il crée ne le sont pas par défaut. `setDaemon()` doit être appelé avant `start()` : sur un thread vivant il lève `IllegalThreadStateException`."
    },
    {
      id: "concurrency-006",
      difficulty: 3,
      q: "What is the result of executing the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) {
        Thread t = Thread.ofVirtual().name("v").unstarted(() -> {});
        t.setPriority(Thread.MAX_PRIORITY);
        System.out.print(t.isDaemon() + " " + t.getPriority() + " ");
        t.setDaemon(false);
        System.out.print(t.isVirtual());
    }
}`,
      options: [
        "true 5 true",
        "true 5 and then an IllegalArgumentException is thrown",
        "true 10 and then an IllegalArgumentException is thrown",
        "false 10 true",
        "false 5 true"
      ],
      answer: [1],
      explain: "Un thread virtuel est **toujours** démon : `isDaemon()` renvoie `true`. Sa priorité est fixée à `Thread.NORM_PRIORITY` (5) et `setPriority()` est silencieusement ignoré, d'où `5` et non `10`. En revanche `setDaemon(false)` sur un thread virtuel lève `IllegalArgumentException` : le dernier `print` n'est jamais atteint."
    },
    {
      id: "concurrency-007",
      difficulty: 2,
      q: "Given the following declaration, which statements start a thread in which r prints true when it runs? (Choose three.)",
      code: String.raw`Runnable r = () -> System.out.println(Thread.currentThread().isVirtual());`,
      options: [
        "Thread.startVirtualThread(r);",
        "Thread.ofVirtual().start(r);",
        "Executors.newVirtualThreadPerTaskExecutor().submit(r);",
        "Thread.ofVirtual().unstarted(r);",
        "new Thread(r).start();",
        "Thread.ofPlatform().daemon(true).start(r);"
      ],
      answer: [0, 1, 2],
      explain: "`Thread.startVirtualThread(r)` et `Thread.ofVirtual().start(r)` créent **et démarrent** un thread virtuel ; `newVirtualThreadPerTaskExecutor()` crée un nouveau thread virtuel pour chaque tâche soumise. `unstarted(r)` crée un thread virtuel dans l'état `NEW` sans le démarrer : rien n'est affiché. `new Thread(r)` et `Thread.ofPlatform()` créent des threads de plateforme (affichage `false`), démon ou non. Attention : un thread virtuel étant démon, l'affichage n'a réellement lieu que si la JVM lui en laisse le temps (`join()`, ou fermeture de l'executor)."
    },
    {
      id: "concurrency-008",
      difficulty: 1,
      q: "Which statements about virtual threads in Java 21 are true? (Choose two.)",
      options: [
        "While it runs, a virtual thread is mounted on a platform thread called its carrier",
        "A virtual thread that blocks inside a `synchronized` block is pinned to its carrier thread",
        "Virtual threads should be reused through a fixed-size thread pool",
        "Virtual threads make CPU-intensive computations faster than platform threads do",
        "`Thread.ofVirtual().start(r)` creates a non-daemon thread unless `daemon(true)` is requested"
      ],
      answer: [0, 1],
      explain: "Un thread virtuel s'exécute monté sur un thread de plateforme porteur (*carrier*) et en est démonté quand il bloque. En Java 21, s'il bloque dans un bloc ou une méthode `synchronized`, il reste épinglé (*pinned*) et bloque aussi son porteur. Les threads virtuels sont peu coûteux et ne se mettent jamais en pool : on en crée un par tâche. Ils n'accélèrent pas le calcul pur, leur intérêt est le code bloquant. Ils sont toujours démons, et `Thread.Builder.OfVirtual` n'a pas de méthode `daemon`."
    },
    {
      id: "concurrency-009",
      difficulty: 2,
      q: "Which line fails to compile?",
      code: String.raw`public class Main {
    public static void main(String[] args) throws Exception {
        ExecutorService es = Executors.newSingleThreadExecutor();
        Callable<Integer> c = () -> { Thread.sleep(10); return 1; };   // n1
        Runnable r = () -> { Thread.sleep(10); };                      // n2
        Future<?> f1 = es.submit(() -> System.out.println("x"));       // n3
        Future<Integer> f2 = es.submit(c);                             // n4
        es.shutdown();
    }
}`,
      options: ["n1", "n2", "n3", "n4", "The code compiles without error"],
      answer: [1],
      explain: "`Runnable.run()` ne déclare aucune exception contrôlée : la lambda de `n2` laisse échapper l'`InterruptedException` de `Thread.sleep()` et ne compile pas (le `throws Exception` de `main` ne s'applique pas au corps de la lambda). `Callable.call()` déclare `throws Exception`, donc `n1` compile. `submit(Runnable)` renvoie un `Future<?>` (`n3`) et `submit(Callable<Integer>)` un `Future<Integer>` (`n4`)."
    },
    {
      id: "concurrency-010",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) {
        ExecutorService es = Executors.newSingleThreadExecutor();
        Callable<String> c = () -> { throw new IOException("io"); };
        Future<String> f = es.submit(c);
        try {
            System.out.print(f.get());
        } catch (ExecutionException e) {
            System.out.print("E:" + e.getCause().getMessage());
        } catch (Exception e) {
            System.out.print("X:" + e.getMessage());
        } finally {
            es.shutdown();
        }
    }
}`,
      options: ["io", "E:io", "X:io", "null", "The code does not compile"],
      answer: [1],
      explain: "Une exception levée par une tâche soumise avec `submit` est capturée et stockée dans le `Future`. `get()` la relance enveloppée dans une `ExecutionException`, dont `getCause()` est l'`IOException` d'origine : affichage `E:io`. Le second `catch` n'est pas atteint car `ExecutionException` est interceptée en premier. Le code compile : un `Callable` peut lever une exception contrôlée, et `catch (Exception e)` couvre l'`InterruptedException` de `get()`."
    },
    {
      id: "concurrency-011",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) {
        try (ExecutorService es = Executors.newSingleThreadExecutor()) {
            es.execute(() -> System.out.print("A"));
            es.execute(() -> System.out.print("B"));
        }
        System.out.print("C");
    }
}`,
      options: [
        "ABC",
        "CAB",
        "The output cannot be determined",
        "AB, and the program never terminates because the executor is never shut down",
        "The code does not compile because ExecutorService is not AutoCloseable"
      ],
      answer: [0],
      explain: "Depuis Java 19, `ExecutorService` étend `AutoCloseable`. À la sortie du try-with-resources, `close()` appelle `shutdown()` puis **attend** la fin de toutes les tâches soumises : `C` est donc forcément affiché après elles, et le programme se termine. Un executor à un seul thread exécute les tâches dans leur ordre de soumission, d'où `A` puis `B`. Le résultat `ABC` est déterministe."
    },
    {
      id: "concurrency-012",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) throws Exception {
        ExecutorService es = Executors.newFixedThreadPool(2);
        es.submit(() -> System.out.print("A")).get();
        es.shutdown();
        System.out.print(es.isShutdown());
        try {
            es.submit(() -> System.out.print("B"));
        } catch (RejectedExecutionException e) {
            System.out.print("R");
        }
    }
}`,
      options: ["AtrueR", "AtrueB", "AfalseR", "Atrue", "The output cannot be determined"],
      answer: [0],
      explain: "`get()` attend la fin de la première tâche : `A` est affiché en premier. `shutdown()` ne bloque pas mais `isShutdown()` vaut `true` immédiatement (c'est `isTerminated()` qui attend la fin des tâches). Après un shutdown, toute nouvelle soumission est refusée par une `RejectedExecutionException` : la tâche `B` n'est ni exécutée ni ignorée en silence, et `R` est affiché."
    },
    {
      id: "concurrency-013",
      difficulty: 1,
      q: "Which statements about shutting down an ExecutorService are true? (Choose two.)",
      options: [
        "`shutdown()` lets the tasks that were already submitted complete but rejects new ones",
        "`shutdownNow()` returns the list of tasks that were awaiting execution",
        "`shutdown()` blocks until all submitted tasks have completed",
        "`shutdownNow()` guarantees that the running tasks stop immediately",
        "`awaitTermination()` initiates a shutdown and then waits for it to complete",
        "`isTerminated()` returns true as soon as `shutdown()` has been called"
      ],
      answer: [0, 1],
      explain: "`shutdown()` lance un arrêt ordonné : les tâches déjà soumises s'exécutent, les nouvelles sont rejetées, et la méthode rend la main tout de suite. `shutdownNow()` renvoie une `List<Runnable>` des tâches jamais démarrées et tente d'interrompre celles en cours, sans garantie qu'elles s'arrêtent. `awaitTermination()` se contente d'attendre (il faut avoir demandé l'arrêt avant). `isTerminated()` ne vaut `true` qu'une fois toutes les tâches terminées ; c'est `isShutdown()` qui passe à `true` immédiatement."
    },
    {
      id: "concurrency-014",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) throws Exception {
        ExecutorService es = Executors.newFixedThreadPool(3);
        List<Callable<String>> tasks = List.of(() -> "A", () -> "B", () -> "C");
        for (Future<String> f : es.invokeAll(tasks)) {
            System.out.print(f.get());
        }
        es.shutdown();
    }
}`,
      options: [
        "ABC",
        "The three letters, in an order that cannot be determined",
        "Only one of the three letters",
        "The code does not compile"
      ],
      answer: [0],
      explain: "`invokeAll` bloque jusqu'à la fin de toutes les tâches et renvoie une `List<Future<T>>` **dans le même ordre** que la collection de tâches, quel que soit l'ordre réel d'exécution dans le pool. L'affichage est fait par `main` en parcourant cette liste : toujours `ABC`. C'est `invokeAny` qui ne renvoie qu'un seul résultat (directement de type `T`)."
    },
    {
      id: "concurrency-015",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) throws Exception {
        ExecutorService es = Executors.newSingleThreadExecutor();
        Future<String> f = es.submit(() -> {
            Thread.sleep(5000);
            return "done";
        });
        try {
            System.out.print(f.get(100, TimeUnit.MILLISECONDS));
        } catch (TimeoutException e) {
            System.out.print("T " + f.isDone() + " ");
            System.out.print(f.cancel(true) + " " + f.isCancelled() + " " + f.isDone());
        }
        es.shutdown();
    }
}`,
      options: [
        "done",
        "T false true true true",
        "T false true true false",
        "T false false false false",
        "T true false false true"
      ],
      answer: [1],
      explain: "La tâche dort 5 secondes : `get(100, MILLISECONDS)` lève `TimeoutException` sans arrêter la tâche, donc `isDone()` vaut encore `false`. `cancel(true)` réussit (la tâche n'est pas terminée) et renvoie `true` en interrompant le thread. Après une annulation, `isCancelled()` **et** `isDone()` valent `true` : une tâche annulée est considérée comme terminée. Un `get()` ultérieur lèverait `CancellationException`."
    },
    {
      id: "concurrency-016",
      difficulty: 2,
      q: "Which lines fail to compile? (Choose two.)",
      code: String.raw`ScheduledExecutorService ses = Executors.newScheduledThreadPool(2);
Runnable r = () -> System.out.print("r");
Callable<String> c = () -> "c";
ScheduledFuture<?> f1 = ses.schedule(r, 1, TimeUnit.SECONDS);                   // n1
ScheduledFuture<String> f2 = ses.schedule(c, 1, TimeUnit.SECONDS);              // n2
ScheduledFuture<?> f3 = ses.scheduleAtFixedRate(r, 1, 2, TimeUnit.SECONDS);     // n3
ScheduledFuture<?> f4 = ses.scheduleWithFixedDelay(c, 1, 2, TimeUnit.SECONDS);  // n4
ScheduledFuture<String> f5 = ses.schedule(r, 1, TimeUnit.SECONDS);              // n5`,
      options: ["n1", "n2", "n3", "n4", "n5"],
      answer: [3, 4],
      explain: "`schedule` existe en deux versions : avec un `Runnable` (retour `ScheduledFuture<?>`, `n1`) et avec un `Callable<V>` (retour `ScheduledFuture<V>`, `n2`). Les méthodes périodiques `scheduleAtFixedRate` et `scheduleWithFixedDelay` n'acceptent qu'un `Runnable` : `n3` compile, `n4` non (un `Callable` n'est pas un `Runnable`). En `n5`, `schedule(Runnable, ...)` renvoie un `ScheduledFuture<?>` qui ne peut pas être affecté à un `ScheduledFuture<String>`."
    },
    {
      id: "concurrency-017",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    private static volatile int count;

    public static void main(String[] args) throws InterruptedException {
        Runnable r = () -> {
            for (int i = 0; i < 10_000; i++) {
                count++;
            }
        };
        Thread t1 = new Thread(r);
        Thread t2 = new Thread(r);
        t1.start();
        t2.start();
        t1.join();
        t2.join();
        System.out.print(count);
    }
}`,
      options: [
        "20000",
        "10000",
        "The output cannot be determined; it may be less than 20000",
        "The code does not compile because a lambda cannot modify count"
      ],
      answer: [2],
      explain: "`volatile` garantit seulement la visibilité des écritures, pas l'atomicité : `count++` reste une lecture suivie d'une écriture. Deux threads peuvent lire la même valeur et une incrémentation est alors perdue. Les `join()` garantissent que les deux threads ont fini, mais le total peut être inférieur à 20000. Il faudrait `synchronized` ou un `AtomicInteger`. Le code compile : la règle « effectively final » concerne les variables locales, pas les champs."
    },
    {
      id: "concurrency-018",
      difficulty: 3,
      q: "Two threads share a single Stock instance referenced by s. Which pairs of calls can never execute their synchronized code at the same time? (Choose two.)",
      code: String.raw`public class Stock {
    private static int total;
    private int qty;

    public static synchronized void addTotal() { total++; }

    public synchronized void add() { qty++; }

    public void remove() {
        synchronized (this) { qty--; }
    }

    public void reset() {
        synchronized (Stock.class) { total = 0; }
    }
}`,
      options: [
        "s.add() in one thread, s.remove() in the other",
        "Stock.addTotal() in one thread, s.reset() in the other",
        "Stock.addTotal() in one thread, s.add() in the other",
        "s.add() in one thread, s.reset() in the other",
        "s.remove() in one thread, s.reset() in the other"
      ],
      answer: [0, 1],
      explain: "Deux sections ne s'excluent que si elles verrouillent le même moniteur. Une méthode d'instance `synchronized` verrouille `this`, comme `synchronized (this)` : `add()` et `remove()` sur la même instance s'excluent. Une méthode `static synchronized` verrouille l'objet `Stock.class`, comme `synchronized (Stock.class)` : `addTotal()` et `reset()` s'excluent. Les autres paires mélangent le moniteur de l'instance et celui de la classe, deux objets différents, et peuvent donc s'exécuter en même temps."
    },
    {
      id: "concurrency-019",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`AtomicInteger a = new AtomicInteger(5);
System.out.print(a.getAndIncrement() + " ");
System.out.print(a.incrementAndGet() + " ");
System.out.print(a.addAndGet(3) + " ");
System.out.print(a.getAndAdd(2) + " ");
System.out.print(a.compareAndSet(10, 0) + " ");
System.out.print(a.get());`,
      options: [
        "5 7 10 10 false 12",
        "5 7 10 10 true 0",
        "6 7 10 12 false 12",
        "5 6 9 9 false 11",
        "5 7 10 12 false 12"
      ],
      answer: [0],
      explain: "`getAndIncrement()` renvoie l'ancienne valeur 5 (la valeur devient 6). `incrementAndGet()` incrémente puis renvoie 7. `addAndGet(3)` renvoie la nouvelle valeur 10. `getAndAdd(2)` renvoie l'ancienne valeur 10 et la valeur passe à 12. `compareAndSet(10, 0)` échoue car la valeur courante est 12, pas 10 : il renvoie `false` et ne modifie rien. `get()` renvoie donc 12."
    },
    {
      id: "concurrency-020",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) {
        Lock lock = new ReentrantLock();
        if (lock.tryLock()) {
            try {
                System.out.print("A");
            } finally {
                lock.unlock();
            }
        }
        lock.unlock();
        System.out.print("B");
    }
}`,
      options: [
        "AB",
        "A and then an IllegalMonitorStateException is thrown",
        "B",
        "A and then the program hangs forever",
        "The code does not compile because unlock() throws a checked exception"
      ],
      answer: [1],
      explain: "`tryLock()` obtient le verrou libre et renvoie `true` : `A` est affiché puis le `finally` libère le verrou. Le second `unlock()` est appelé alors que le thread courant ne détient plus le verrou : `ReentrantLock` lève `IllegalMonitorStateException` (non contrôlée) et `B` n'est jamais affiché. Chaque `unlock()` doit correspondre à exactement un `lock()` ou `tryLock()` réussi."
    },
    {
      id: "concurrency-021",
      difficulty: 3,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) throws InterruptedException {
        ReentrantLock lock = new ReentrantLock();
        lock.lock();
        lock.lock();
        lock.unlock();
        Thread t = new Thread(() -> System.out.print(lock.tryLock() + " "));
        t.start();
        t.join();
        System.out.print(lock.isLocked() + " " + lock.getHoldCount());
    }
}`,
      options: [
        "false true 1",
        "true true 1",
        "false false 0",
        "false true 2",
        "The program hangs forever"
      ],
      answer: [0],
      explain: "`ReentrantLock` est réentrant : `main` peut appeler `lock()` deux fois sans se bloquer, le compteur de détention passe à 2. Un seul `unlock()` le ramène à 1 : le verrou est toujours détenu par `main`. Dans l'autre thread, `tryLock()` ne bloque pas et renvoie `false`. `main` affiche ensuite `true` (verrou pris) et `1` (nombre de détentions du thread courant)."
    },
    {
      id: "concurrency-022",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) throws InterruptedException {
        ReadWriteLock rw = new ReentrantReadWriteLock();
        rw.readLock().lock();
        Thread t = new Thread(() -> {
            System.out.print(rw.readLock().tryLock() + " ");
            System.out.print(rw.writeLock().tryLock());
        });
        t.start();
        t.join();
        rw.readLock().unlock();
    }
}`,
      options: ["true false", "true true", "false false", "false true", "The program hangs forever"],
      answer: [0],
      explain: "Le verrou de lecture est partagé : plusieurs threads peuvent le détenir en même temps tant qu'aucun écrivain n'est présent, donc le premier `tryLock()` renvoie `true`. Le verrou d'écriture est exclusif : il ne peut pas être obtenu tant qu'un lecteur (ici `main`, et le thread lui-même) détient le verrou de lecture, d'où `false`. `tryLock()` ne bloque jamais, le programme se termine."
    },
    {
      id: "concurrency-023",
      difficulty: 3,
      q: "What is the result of executing the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) {
        CyclicBarrier barrier = new CyclicBarrier(3, () -> System.out.print("X"));
        ExecutorService es = Executors.newFixedThreadPool(2);
        for (int i = 0; i < 3; i++) {
            es.submit(() -> {
                barrier.await();
                System.out.print("A");
                return null;
            });
        }
        es.shutdown();
    }
}`,
      options: [
        "XAAA",
        "AAAX",
        "Nothing is printed and the program never terminates",
        "A BrokenBarrierException is thrown and the program terminates",
        "The code does not compile because await() throws checked exceptions"
      ],
      answer: [2],
      explain: "La barrière attend 3 threads, mais le pool n'en a que 2 : les deux premières tâches se bloquent dans `await()`, la troisième reste dans la file car aucun thread n'est libre. La barrière n'est jamais atteinte, rien n'est affiché, et les threads du pool (non démons) empêchent la JVM de s'arrêter malgré `shutdown()`. Avec un pool de 3 threads on obtiendrait `XAAA`. Le code compile : la lambda contient `return null`, c'est donc un `Callable`, qui autorise les exceptions contrôlées."
    },
    {
      id: "concurrency-024",
      difficulty: 1,
      q: "What is the output of the following code?",
      code: String.raw`List<Integer> list = new CopyOnWriteArrayList<>(List.of(1, 2, 3));
for (Integer i : list) {
    list.add(i * 10);
}
System.out.print(list);`,
      options: [
        "[1, 2, 3, 10, 20, 30]",
        "[1, 2, 3]",
        "[1, 10, 2, 20, 3, 30]",
        "A ConcurrentModificationException is thrown",
        "The loop never terminates"
      ],
      answer: [0],
      explain: "L'itérateur d'une `CopyOnWriteArrayList` parcourt un **instantané** du tableau pris au début de la boucle : il voit seulement 1, 2 et 3, ne lève jamais `ConcurrentModificationException` et la boucle se termine après trois tours. Chaque `add` copie le tableau et ajoute à la fin de la vraie liste, qui contient donc les six éléments à la fin. Avec une `ArrayList`, la même boucle lèverait `ConcurrentModificationException`."
    },
    {
      id: "concurrency-025",
      difficulty: 3,
      q: "What is the result of executing the following code?",
      code: String.raw`List<Integer> list =
    Collections.synchronizedList(new ArrayList<>(List.of(1, 2, 3)));
for (Integer i : list) {
    if (i == 1) {
        list.remove(i);
    }
}
System.out.print(list);`,
      options: [
        "[2, 3]",
        "[1, 3]",
        "A ConcurrentModificationException is thrown",
        "The code does not compile"
      ],
      answer: [2],
      explain: "`Collections.synchronizedList` synchronise chaque méthode, mais son itérateur reste celui de l'`ArrayList` sous-jacente (*fail-fast*). `list.remove(i)` avec un `Integer` appelle `remove(Object)` et supprime la valeur 1 pendant l'itération ; au tour suivant, l'itérateur détecte la modification et lève `ConcurrentModificationException`, même avec un seul thread. Seules les vraies collections concurrentes (`CopyOnWriteArrayList`, `ConcurrentHashMap`…) autorisent la modification pendant le parcours."
    },
    {
      id: "concurrency-026",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`Map<String, Integer> map = new ConcurrentHashMap<>();
map.put("a", 1);
map.put("b", 2);
map.putIfAbsent("a", 5);
map.merge("b", 10, Integer::sum);
for (String key : map.keySet()) {
    if (key.equals("a")) {
        map.remove(key);
    }
}
System.out.print(map);`,
      options: [
        "{b=12}",
        "{a=5, b=12}",
        "{b=10}",
        "{b=2}",
        "A ConcurrentModificationException is thrown"
      ],
      answer: [0],
      explain: "`putIfAbsent(\"a\", 5)` ne fait rien car la clé `a` existe déjà. `merge(\"b\", 10, Integer::sum)` combine l'ancienne valeur 2 et 10 : `b` vaut 12. Les itérateurs d'une `ConcurrentHashMap` sont faiblement cohérents : supprimer une entrée pendant le parcours ne lève pas `ConcurrentModificationException` (contrairement à une `HashMap`). Il reste donc `{b=12}`."
    },
    {
      id: "concurrency-027",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`public class Main {
    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<String> q = new LinkedBlockingQueue<>(1);
        System.out.print(q.offer("A") + " ");
        System.out.print(q.offer("B") + " ");
        System.out.print(q.offer("C", 100, TimeUnit.MILLISECONDS) + " ");
        System.out.print(q.poll() + " ");
        System.out.print(q.poll(100, TimeUnit.MILLISECONDS));
    }
}`,
      options: [
        "true false false A null",
        "true true true A B",
        "true false false A and then the program blocks forever",
        "true and then an IllegalStateException is thrown",
        "true false true A C"
      ],
      answer: [0],
      explain: "La file est bornée à 1 élément. `offer(\"A\")` réussit ; `offer(\"B\")` renvoie `false` immédiatement car la file est pleine (c'est `add` qui lèverait `IllegalStateException`). `offer(\"C\", 100, MILLISECONDS)` attend 100 ms qu'une place se libère, personne ne retire d'élément, donc `false`. `poll()` retire `A`. `poll(100, MILLISECONDS)` attend 100 ms sur la file vide puis renvoie `null` ; seuls `put` et `take` bloquent indéfiniment."
    },
    {
      id: "concurrency-028",
      difficulty: 2,
      q: "Which statements about the following code are true? (Choose two.)",
      code: String.raw`public class Main {
    public static void main(String[] args) {
        Object a = new Object();
        Object b = new Object();
        new Thread(() -> {
            synchronized (a) {
                synchronized (b) {
                    System.out.print("1");
                }
            }
        }).start();
        new Thread(() -> {
            synchronized (b) {
                synchronized (a) {
                    System.out.print("2");
                }
            }
        }).start();
    }
}`,
      options: [
        "The program can print 12 and terminate",
        "The program can hang forever without printing anything",
        "The program can print 1 and then hang forever",
        "The JVM detects the situation and throws an IllegalMonitorStateException",
        "The program always terminates because synchronized is reentrant"
      ],
      answer: [0, 1],
      explain: "Les deux threads prennent les mêmes verrous dans l'ordre inverse. Si le premier obtient `a` et `b` avant que le second ne démarre, le programme affiche `12` (ou `21` dans le cas symétrique) et se termine. Si chacun obtient son premier verrou, chacun attend l'autre pour toujours : c'est un **deadlock**, rien n'est affiché. Afficher `1` puis rester bloqué est impossible : le thread qui affiche détenait les deux verrous et les libère ensuite. La JVM ne lève aucune exception, et la réentrance ne concerne qu'un même thread."
    },
    {
      id: "concurrency-029",
      difficulty: 2,
      q: "What is the result of executing the following code?",
      code: String.raw`List<Integer> out = new ArrayList<>();
IntStream.range(0, 1000).parallel().forEach(out::add);
System.out.print(out.size());`,
      options: [
        "It always prints 1000",
        "It always prints 0 because forEach is lazy",
        "The result is unpredictable: it may print 1000, a smaller number, or throw an exception",
        "The code does not compile because out is not a concurrent collection"
      ],
      answer: [2],
      explain: "`forEach` est une opération terminale exécutée ici par plusieurs threads, et `ArrayList` n'est pas thread-safe : des ajouts simultanés peuvent se perdre (taille inférieure à 1000) ou corrompre le tableau interne (`ArrayIndexOutOfBoundsException`). Le résultat ne peut donc pas être prédit. Le compilateur ne vérifie rien de tout cela. La version correcte utilise `boxed().collect(Collectors.toList())` ou une collection concurrente."
    },
    {
      id: "concurrency-030",
      difficulty: 2,
      q: "What is the output of the following code?",
      code: String.raw`var list = List.of(1, 2, 3, 4, 5);
int first = list.parallelStream()
    .map(x -> x * 2)
    .findFirst()
    .get();
System.out.print(first + " ");
list.parallelStream()
    .map(x -> x * 2)
    .forEachOrdered(System.out::print);`,
      options: [
        "2 246810",
        "2 followed by the five values in an order that cannot be determined",
        "A value that cannot be determined, followed by 246810",
        "The output cannot be determined at all"
      ],
      answer: [0],
      explain: "Une `List` a un ordre de rencontre, que le parallélisme ne supprime pas. `findFirst()` renvoie toujours le premier élément dans cet ordre, même en parallèle : 2 (c'est `findAny()` qui pourrait en renvoyer un autre). `forEachOrdered` traite les éléments dans l'ordre de rencontre, contrairement à `forEach` : `246810`. Le résultat est donc déterministe."
    }
  ]
});
