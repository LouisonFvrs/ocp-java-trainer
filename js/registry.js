// Central registry: topic metadata lives here, content files only contribute
// course sections and questions through OCP.register().
(function (root) {
  'use strict';

  // `weight` = number of questions drawn from the topic in a 50-question mock exam.
  const topics = [
    { id: 'values', title: 'Dates, texte, nombres et booléens', official: 'Handling Date, Time, Text, Numeric and Boolean Values', weight: 6 },
    { id: 'flow', title: 'Contrôle du flux', official: 'Controlling Program Flow', weight: 4 },
    { id: 'oop', title: 'Programmation orientée objet', official: 'Using Object-Oriented Concepts in Java', weight: 10 },
    { id: 'exceptions', title: 'Exceptions', official: 'Handling Exceptions', weight: 4 },
    { id: 'collections', title: 'Tableaux et collections', official: 'Working with Arrays and Collections', weight: 5 },
    { id: 'streams', title: 'Lambdas et streams', official: 'Working with Streams and Lambda expressions', weight: 8 },
    { id: 'modules', title: 'Modules et déploiement', official: 'Packaging and Deploying Java Code', weight: 3 },
    { id: 'concurrency', title: 'Concurrence', official: 'Managing Concurrent Code Execution', weight: 5 },
    { id: 'io', title: 'Entrées / sorties', official: 'Using Java I/O API', weight: 3 },
    { id: 'l10n', title: 'Localisation', official: 'Implementing Localization', weight: 2 }
  ];

  const byId = {};
  topics.forEach((t, i) => {
    t.n = i + 1;
    t.course = [];
    t.questions = [];
    byId[t.id] = t;
  });

  root.OCP = {
    exam: { code: '1Z0-830', questions: 50, minutes: 120, pass: 68 },
    topics,
    byId,
    register(part) {
      const topic = byId[part.topic];
      if (!topic) throw new Error('Unknown topic: ' + part.topic);
      (part.course || []).forEach((section) => topic.course.push(section));
      (part.questions || []).forEach((question) => {
        question.topic = topic.id;
        topic.questions.push(question);
      });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
