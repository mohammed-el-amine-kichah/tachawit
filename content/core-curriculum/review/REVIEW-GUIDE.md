# دليل المراجعة — Guide de relecture

- [العربية](#العربية)
- [Français](#français)

---

## العربية

### ما هذا؟

هذا أول منهج كامل لتطبيق تاشاويت: 6 وحدات، و24 درسًا، و12 اختبارًا، و207 كلمات وعبارات. كل شيء مُدخَل في لوحة الإدارة **كمسودة**، ولن يراه أي متعلّم قبل أن تنشروه أنتم.

**لم يكتب هذه الكلمات متحدث أصلي.** كُتبت بالاعتماد على الأمازيغية المشتركة واللهجات القريبة، ولذلك قد يكون فيها أخطاء أو صيغ غير مستعملة في الأوراس. دوركم أن تصحّحوا وتسجّلوا وتقرّروا ما يُنشَر. ثقتكم في لغتكم أهمّ من أي شيء كُتب هنا.

### الملفات

| الملف | الاستعمال |
|---|---|
| `review-sheet.csv` | سطر لكل كلمة أو عبارة. الكلمات ذات الثقة الضعيفة (`low`) في الأعلى: ابدؤوا بها. |
| `recording-list.csv` | قائمة التسجيل بترتيب الدروس، مع الصوت المطلوب (امرأة أو رجل) ودور كل سطر في الحوارات. |
| `REVIEW-GUIDE.md` | هذا الدليل. |

افتحوا ملفات CSV في Excel أو LibreOffice أو Google Sheets (الترميز UTF-8). في ورقة المراجعة املؤوا الأعمدة الأربعة الأخيرة:

- **صحيح؟**: نعم / لا
- **التصحيح**: الصيغة الصحيحة كما تقولونها
- **المراجِع**: اسمكم
- **القرية**: قريتكم أو مدينتكم، لأن الصيغ تختلف من مكان إلى آخر

عمود «درجة الثقة» يبيّن مدى تأكّدنا: `high` (عالية)، `medium` (متوسطة)، `low` (ضعيفة). والعمودان «لماذا» يشرحان السبب ويذكران صيغًا أخرى معروفة.

### قواعد الكتابة المستعملة

- **الحرف اللاتيني**: الإملاء المعياري للأمازيغية (ɣ ḥ ṭ ḍ ṣ ẓ ε č ǧ، وحرف e للصائت القصير). النطق المحلي لا يُكتب: نكتب `tacawit` حتى لو قلنا «هاشاويث»، و`argaz` حتى لو قلنا «أرياز». التسجيل الصوتي هو الذي يُسمع النطق الحقيقي.
- **الحرف العربي**: قاعدة واحدة لكل الكلمات: الحرف الصامت المضعَّف يُكتب مرة واحدة، والصائت e لا يُكتب، وg ← ڨ، وc ← ش، وɣ ← غ، وẓ ← ز، وفي أول الكلمة a ← أ وi ← إ وu ← أو. إذا صحّحتم الكتابة اللاتينية فصحّحوا الكتابة العربية بالقواعد نفسها.
- **تيفيناغ**: تُولَّد تلقائيًا من الكتابة اللاتينية. بعد تصحيح الكتابة اللاتينية اضغطوا زر «اقتراح» بجانب خانة تيفيناغ، ثم تحقّقوا من النتيجة.
- **اللهجات**: الاختلاف بين المناطق ليس خطأ. إذا كانت كلمتكم مختلفة عن المكتوبة فلا تحذفوا الأخرى: أضيفوا صيغتكم كمدخل جديد، واختاروا منطقتكم في خانة «المنطقة أو اللهجة». يرى المتعلّمون الصيغتين جنبًا إلى جنب.

### 1. تصحيح كلمة أو عبارة

1. ادخلوا إلى الموقع بحسابكم، ثم افتحوا **الإدارة ← الكلمات والعبارات** (`/ar/admin/entries`).
2. اختاروا «المسودات» في الفلتر، ثم ابحثوا عن الكلمة بكتابتها أو بمعناها كما في ورقة المراجعة.
3. صحّحوا الخانات: الحرف اللاتيني، والحرف العربي، وتيفيناغ (زر «اقتراح»)، والمعنى بالإنجليزية والفرنسية والعربية، والمنطقة.
4. التعديلات تُحفَظ تلقائيًا. وخانة «ملاحظات» خاصة بالمشرفين ولا يراها المتعلّمون: اكتبوا فيها مصدركم أو الصيغ الأخرى.
5. انظروا إلى قسم **«ما يراه المتعلّمون»** في الصفحة نفسها: هكذا ستظهر الكلمة بالضبط.

إذا أردتم إزالة كلمة فلا تحذفوها مباشرة: أزيلوها أولًا من الدروس والاختبارات التي تستعملها، ثم احذفوها، وأخبروا مسؤول المشروع.

### 2. المتحدثون والموافقة

كل متحدث هو صاحب حساب في الموقع، وهو من يعطي موافقته بنفسه. المشرف لا يستطيع إضافة متحدث ولا تسجيل موافقة بدلًا عن أحد.

1. يدخل المتحدث إلى الموقع بحسابه (أو ينشئ حسابًا)، ثم يفتح **الملف ← أعِر صوتك**.
2. يكتب الاسم الذي يظهر مع تسجيلاته (اسمه الحقيقي أو اسمًا مستعارًا)، ومنطقته، وقريته.
3. يفعّل **«أوافق على نشر تسجيلاتي في تاشاويت»** ثم **«كن متحدثًا»**. يُسجَّل تاريخ الموافقة تلقائيًا.
4. يستطيع سحب موافقته في أي وقت من المكان نفسه، وعندها تُزال تسجيلاته من الموقع.

بعد ذلك يظهر اسمه في قائمة المتحدثين عند إضافة تسجيل. ومن يرسل تسجيلًا من صفحة **«ساهم»** بموافقته يصبح متحدثًا تلقائيًا.

### 3. التسجيل وربطه بالكلمة

استعملوا `recording-list.csv`: فيه النص المطلوب قراءته بالترتيب، ونوع الصوت (امرأة، رجل، أيّ صوت). بعض الجمل يجب أن تقولها امرأة (مثل `nec d tacawit`) وبعضها رجل. وفي الحوارات، عمود «الدور في الحوار» يبيّن من يقول كل سطر.

1. افتحوا الكلمة في **الكلمات والعبارات**، ثم **«إضافة تسجيل»**.
2. أفلتوا ملفًا صوتيًا (MP3 أو M4A أو WAV أو WebM أو OGG، حتى 25 ميغابايت)، أو اضغطوا **«التسجيل في المتصفح»**.
3. اقطعوا الصمت بخانتي **«البداية»** و**«النهاية»**، ثم **«استمع إلى المقطع المحدّد»**.
4. اختاروا **المتحدث**، ثم **«حفظ التسجيل»**. يُحوَّل الملف تلقائيًا إلى صيغة مناسبة للويب، ويُحفَظ الأصل.
5. انشروا التسجيل بتفعيل زر **«منشور»** بجانبه. إذا كان للكلمة عدة تسجيلات فاختاروا الذي يسمعه المتعلّمون بزر **«اجعله رئيسيًا»**.
6. اختياري للعبارات: **«توقيت الكلمات»**. يظهر التسجيل كموجة صوتية عليها فواصل حمراء عند بداية كل كلمة ونهايتها، يقترحها الموقع من فترات الصمت. اسحبوا كل فاصل إلى مكانه (أو اختاروه واستعملوا الأسهم)، والمسوا كلمة لتسمعوها وحدها، ثم **«استمع مع التظليل»** و**«حفظ التوقيت»**.

يمكن أيضًا رفع الملفات من صفحة **الصوت** ثم ربطها بزر **«ربط بمدخل»**.

### 4. مراجعة الدروس والاختبارات

1. **الإدارة ← الدروس** أو **الاختبارات**، ثم افتحوا الدرس.
2. راجعوا ترتيب الخطوات، والحوارات (من يقول ماذا)، ونص الملاحظات الثقافية باللغات الثلاث.
3. اضغطوا **«جرّبه كمتعلّم»**: يفتح الدرس كما سيراه المتعلّم تمامًا. جرّبوه بالعربية والفرنسية، وبكل كتابة (لاتينية، عربية، تيفيناغ) من زر الكتابة في أعلى الموقع.
4. في الاختبارات، الأسئلة التي تحتاج إلى الصوت («استمع واختر المعنى»، «اقرأ واختر الصوت»، «طابِق الأزواج») لا تظهر إلا بعد نشر تسجيلات كلماتها. لذلك سجّلوا قبل مراجعة الاختبارات.

### 5. ترتيب النشر

قاعدة البيانات تفرض هذا الترتيب:

**الكلمات ← التسجيلات ← الدروس والاختبارات ← المستويات ← الوحدة**

| الخطوة | ماذا يحدث إذا تخطّيتموها |
|---|---|
| 1. انشروا **كلمات** الدرس | لا يمكن نشر درس أو اختبار يستعمل كلمة ما زالت مسودة: «بعض الكلمات المستعملة لم تُنشر بعد». |
| 2. انشروا **التسجيلات** | لا يُنشَر تسجيل إلا لمتحدث أعطى موافقته من ملفه الشخصي. وبدون تسجيلات تُتخطّى أسئلة الاستماع في الاختبارات. |
| 3. انشروا **الدروس والاختبارات** | لا يمكن نشر مستوى على الخريطة ما دام درسه أو اختباره مسودة. |
| 4. انشروا **المستويات**: **الخريطة والوحدات** ← الوحدة ← كل مستوى | لا يظهر المستوى إلا إذا نُشر هو ودرسه أو اختباره والوحدة. |
| 5. في الأخير **«نشر الوحدة»** | عندها يرى المتعلّمون الوحدة ومستوياتها المنشورة. انشروها آخرًا حتى لا يروا وحدة ناقصة. |

---

## Français

### De quoi s'agit-il ?

C'est le premier programme complet de Tachawit : 6 unités, 24 leçons, 12 quiz et 207 mots et expressions. Tout est dans l'administration **en brouillon** : aucun apprenant ne le voit avant que vous le publiiez.

**Ces mots n'ont pas été écrits par un locuteur natif.** Ils s'appuient sur le tamazight commun et sur des parlers proches : il peut y avoir des erreurs ou des formes qu'on n'emploie pas dans les Aurès. Votre rôle est de corriger, d'enregistrer et de décider de ce qui est publié. Votre connaissance de la langue passe avant tout ce qui est écrit ici.

### Les fichiers

| Fichier | À quoi il sert |
|---|---|
| `review-sheet.csv` | Une ligne par mot ou expression. Les mots de confiance faible (`low`) sont en haut : commencez par eux. |
| `recording-list.csv` | La liste d'enregistrement dans l'ordre des leçons, avec la voix demandée (femme ou homme) et le rôle de chaque réplique dans les conversations. |
| `REVIEW-GUIDE.md` | Ce guide. |

Ouvrez les CSV dans Excel, LibreOffice ou Google Sheets (encodage UTF-8). Dans la feuille de relecture, remplissez les quatre dernières colonnes :

- **Correct ?** : oui / non
- **Correction** : la bonne forme, telle que vous la dites
- **Relecteur** : votre nom
- **Village** : votre village ou votre ville, car les formes changent d'un endroit à l'autre

La colonne « Confiance » dit à quel point nous sommes sûrs : `high` (élevée), `medium` (moyenne), `low` (faible). Les deux colonnes « Pourquoi » expliquent la raison et donnent les variantes connues.

### Conventions d'écriture

- **Latin** : orthographe standard du tamazight (ɣ ḥ ṭ ḍ ṣ ẓ ε č ǧ, et e pour la voyelle brève). La prononciation locale n'est pas écrite : on écrit `tacawit` même si l'on dit « hachawith », et `argaz` même si l'on dit « aryaz ». C'est l'enregistrement qui fait entendre la vraie prononciation.
- **Graphie arabe** : une seule règle pour tous les mots. Une consonne doublée s'écrit une fois, la voyelle e ne s'écrit pas, g → ڨ, c → ش, ɣ → غ, ẓ → ز, et en début de mot a → أ, i → إ, u → أو. Si vous corrigez le latin, corrigez l'arabe avec les mêmes règles.
- **Tifinagh** : généré automatiquement à partir du latin. Après avoir corrigé le latin, cliquez sur **« Suggérer »** à côté du champ Tifinagh, puis vérifiez le résultat.
- **Variantes** : une différence entre régions n'est pas une erreur. Si votre mot diffère de celui écrit, ne supprimez pas l'autre : ajoutez votre forme comme nouvelle entrée et choisissez votre région dans **« Région ou parler »**. Les apprenants voient les deux formes côte à côte.

### 1. Corriger un mot ou une expression

1. Connectez-vous au site, puis ouvrez **Administration → Mots et expressions** (`/fr/admin/entries`).
2. Filtrez sur « Brouillons » et cherchez le mot par sa graphie ou son sens, comme dans la feuille de relecture.
3. Corrigez les champs : latin, écriture arabe, Tifinagh (bouton « Suggérer »), sens en anglais, français et arabe, région.
4. Tout s'enregistre automatiquement. Le champ **« Notes »** est réservé aux admins, les apprenants ne le voient pas : notez-y vos sources ou les variantes.
5. Regardez le panneau **« Ce que voient les apprenants »** sur la même page : c'est exactement ce qu'ils verront.

Pour retirer un mot, ne le supprimez pas directement : enlevez-le d'abord des leçons et des quiz qui l'utilisent, puis supprimez-le, et prévenez le responsable du projet.

### 2. Locuteurs et consentement

Chaque locuteur est une personne qui a un compte sur le site, et c'est elle qui donne son accord. Un admin ne peut ni ajouter un locuteur, ni enregistrer un accord à la place de quelqu'un.

1. Le locuteur se connecte (ou crée un compte), puis ouvre **Profil → Prête ta voix**.
2. Il indique le nom affiché avec ses enregistrements (vrai nom ou pseudonyme), sa région et son village.
3. Il coche **« J'accepte que mes enregistrements soient publiés dans Tachawit »**, puis **« Devenir locuteur »**. La date de l'accord est enregistrée automatiquement.
4. Il peut retirer son accord à tout moment au même endroit : ses enregistrements sont alors retirés du site.

Son nom apparaît ensuite dans la liste des locuteurs quand on ajoute un enregistrement. Quelqu'un qui envoie un enregistrement depuis la page **« Contribuer »** avec son accord devient locuteur automatiquement.

### 3. Enregistrer et lier l'audio

Servez-vous de `recording-list.csv` : il donne le texte à lire dans l'ordre et la voix demandée (femme, homme, au choix). Certaines phrases doivent être dites par une femme (par exemple `nec d tacawit`), d'autres par un homme. Dans les conversations, la colonne « Rôle dans le dialogue » indique qui dit chaque réplique.

1. Ouvrez le mot dans **Mots et expressions**, puis **« Ajouter un enregistrement »**.
2. Déposez un fichier (MP3, M4A, WAV, WebM ou OGG, 25 Mo max.) ou cliquez sur **« Enregistrer dans le navigateur »**.
3. Coupez les silences avec **« Début »** et **« Fin »**, puis **« Écouter la sélection »**.
4. Choisissez le **locuteur**, puis **« Enregistrer »**. Le fichier est converti automatiquement dans un format adapté au web, et l'original est conservé.
5. Publiez l'enregistrement en activant l'interrupteur **« Publié »** à côté de lui. S'il y en a plusieurs pour un mot, choisissez celui que les apprenants entendront avec **« Rendre principal »**.
6. Facultatif, pour les expressions : **« Minutage des mots »**. L'enregistrement s'affiche comme une onde, avec des coupures rouges au début et à la fin de chaque mot, proposées d'après les pauses. Faites glisser chaque coupure à sa place (ou sélectionnez-la et utilisez les flèches), touchez un mot pour n'entendre que lui, puis **« Écouter avec le surlignage »** et **« Enregistrer le minutage »**.

Vous pouvez aussi envoyer les fichiers depuis la page **Audio**, puis les lier avec **« Lier à une entrée »**.

### 4. Relire les leçons et les quiz

1. **Administration → Leçons** ou **Quiz**, puis ouvrez la leçon.
2. Vérifiez l'ordre des étapes, les conversations (qui dit quoi) et le texte des notes culturelles dans les trois langues.
3. Cliquez sur **« Tester comme un apprenant »** : la leçon s'ouvre exactement comme l'apprenant la verra. Essayez-la en arabe et en français, et dans chaque écriture (latine, arabe, tifinagh) avec le bouton d'écriture en haut du site.
4. Dans les quiz, les questions qui ont besoin de l'audio (« Écouter, choisir le sens », « Lire, choisir l'audio », « Associer les paires ») n'apparaissent qu'une fois les enregistrements de leurs mots publiés. Enregistrez donc avant de relire les quiz.

### 5. L'ordre de publication

La base de données impose cet ordre :

**mots → audio → leçons et quiz → niveaux → unité**

| Étape | Si vous la sautez |
|---|---|
| 1. Publiez les **mots** de la leçon | Une leçon ou un quiz qui utilise un mot encore en brouillon ne peut pas être publié : « Certains mots utilisés ne sont pas encore publiés ». |
| 2. Publiez l'**audio** | Un enregistrement ne se publie que si le locuteur a donné son accord depuis son profil. Sans audio, les questions d'écoute des quiz sont sautées. |
| 3. Publiez les **leçons et les quiz** | Un niveau de la carte ne peut pas être publié tant que sa leçon ou son quiz est en brouillon. |
| 4. Publiez les **niveaux** : **Carte et unités** → l'unité → chaque niveau | Un niveau n'apparaît que si le niveau, sa leçon ou son quiz et l'unité sont tous publiés. |
| 5. Enfin, **« Publier l'unité »** | Les apprenants voient alors l'unité et ses niveaux publiés. Publiez-la en dernier pour qu'ils ne voient jamais une unité à moitié prête. |
