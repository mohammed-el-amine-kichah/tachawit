-- Sample content so the app can be tried end to end: one unit, three lessons, one quiz.
--
-- EVERYTHING HERE IS [PLACEHOLDER] CONTENT. The words are common pan-Amazigh forms chosen only
-- to exercise the app; spellings, scripts and translations must be verified and replaced by native
-- speakers from Merouana. The audio files are synthetic tones, not pronunciations.
-- Some Arabic-script and Tifinagh spellings are deliberately left empty to exercise the Latin fallback.
--
-- Audio files live in supabase/seed-assets/audio/placeholder and are uploaded to the "audio"
-- bucket by the Supabase CLI (see [storage.buckets.audio] in config.toml).

-- Region -------------------------------------------------------------------------
insert into public.regions (id, slug, name) values
  ('10000000-0000-4000-8000-000000000001', 'merouana',
    '{"en": "Merouana (Batna)", "fr": "Merouana (Batna)", "ar": "مروانة (باتنة)", "dz": "مروانة (باتنة)"}');

-- Speaker (synthetic placeholder: there is no real person behind these tones) ---
insert into public.speakers (id, display_name, region_id, consent_given, consent_date, public_bio) values
  ('20000000-0000-4000-8000-000000000001', '[PLACEHOLDER] Synthetic tones',
    '10000000-0000-4000-8000-000000000001', true, '2026-09-24',
    '{"en": "[PLACEHOLDER] Not a real speaker: generated tones used until recordings from Merouana are added.",
      "fr": "[PLACEHOLDER] Pas un vrai locuteur : des sons générés en attendant les enregistrements de Merouana.",
      "ar": "[PLACEHOLDER] ليس متحدثًا حقيقيًا: أصوات مولَّدة في انتظار تسجيلات من مروانة.",
      "dz": "[PLACEHOLDER] ماشي متكلم حقيقي: أصوات مصنوعة حتى يجيو التسجيلات من مروانة."}');

-- Entries ------------------------------------------------------------------------
insert into public.entries
  (id, text_latin, text_arabic, text_tifinagh, translations, part_of_speech, region_id, notes, status)
values
  ('30000000-0000-4000-8000-000000000001', 'azul', 'أزول', 'ⴰⵣⵓⵍ',
    '{"en": "hello", "fr": "bonjour", "ar": "مرحبا", "dz": "سلام"}',
    'interjection', '10000000-0000-4000-8000-000000000001',
    '[PLACEHOLDER] Unverified sample. Replace with the form confirmed by a native speaker.', 'published'),
  ('30000000-0000-4000-8000-000000000002', 'azul fellawen', 'أزول فلاون', 'ⴰⵣⵓⵍ ⴼⴻⵍⵍⴰⵡⴻⵏ',
    '{"en": "hello (to you all)", "fr": "bonjour (à vous tous)", "ar": "السلام عليكم", "dz": "السلام عليكم"}',
    'phrase', '10000000-0000-4000-8000-000000000001',
    '[PLACEHOLDER] Unverified sample. Replace with the form confirmed by a native speaker.', 'published'),
  ('30000000-0000-4000-8000-000000000003', 'tanmirt', null, 'ⵜⴰⵏⵎⵉⵔⵜ',
    '{"en": "thank you", "fr": "merci", "ar": "شكرا", "dz": "صحّيت"}',
    'interjection', '10000000-0000-4000-8000-000000000001',
    '[PLACEHOLDER] Unverified sample. Replace with the form confirmed by a native speaker.', 'published'),
  ('30000000-0000-4000-8000-000000000004', 'ih', null, null,
    '{"en": "yes", "fr": "oui", "ar": "نعم", "dz": "إيه"}',
    'particle', '10000000-0000-4000-8000-000000000001',
    '[PLACEHOLDER] Unverified sample. Replace with the form confirmed by a native speaker.', 'published'),
  ('30000000-0000-4000-8000-000000000005', 'yemma', null, 'ⵢⴻⵎⵎⴰ',
    '{"en": "mother", "fr": "mère", "ar": "أمّ", "dz": "يمّا"}',
    'noun', '10000000-0000-4000-8000-000000000001',
    '[PLACEHOLDER] Unverified sample. Replace with the form confirmed by a native speaker.', 'published'),
  ('30000000-0000-4000-8000-000000000006', 'baba', 'بابا', 'ⴱⴰⴱⴰ',
    '{"en": "father", "fr": "père", "ar": "أب", "dz": "بابا"}',
    'noun', '10000000-0000-4000-8000-000000000001',
    '[PLACEHOLDER] Unverified sample. Replace with the form confirmed by a native speaker.', 'published'),
  ('30000000-0000-4000-8000-000000000007', 'aman', 'أمان', 'ⴰⵎⴰⵏ',
    '{"en": "water", "fr": "eau", "ar": "ماء", "dz": "الما"}',
    'noun', '10000000-0000-4000-8000-000000000001',
    '[PLACEHOLDER] Unverified sample. Replace with the form confirmed by a native speaker.', 'published'),
  ('30000000-0000-4000-8000-000000000008', 'aɣrum', 'أغروم', 'ⴰⵖⵔⵓⵎ',
    '{"en": "bread", "fr": "pain", "ar": "خبز", "dz": "الخبز"}',
    'noun', '10000000-0000-4000-8000-000000000001',
    '[PLACEHOLDER] Unverified sample. Replace with the form confirmed by a native speaker.', 'published'),
  ('30000000-0000-4000-8000-000000000009', 'adrar', 'أدرار', 'ⴰⴷⵔⴰⵔ',
    '{"en": "mountain", "fr": "montagne", "ar": "جبل", "dz": "الجبل"}',
    'noun', '10000000-0000-4000-8000-000000000001',
    '[PLACEHOLDER] Unverified sample. Replace with the form confirmed by a native speaker.', 'published');

-- Audio (placeholder tones; timestamps match the generated notes) -----------------
insert into public.audio_clips
  (id, entry_id, speaker_id, storage_path, slow_storage_path, mime_type, duration_ms, transcript, word_timestamps, is_primary, status)
values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
    'placeholder/azul.mp3', 'placeholder/azul-slow.mp3', 'audio/mpeg', 800, 'azul',
    '[{"word": "azul", "startMs": 50, "endMs": 650}]', true, 'published'),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001',
    'placeholder/azul-fellawen.mp3', 'placeholder/azul-fellawen-slow.mp3', 'audio/mpeg', 1880, 'azul fellawen',
    '[{"word": "azul", "startMs": 50, "endMs": 650}, {"word": "fellawen", "startMs": 810, "endMs": 1730}]', true, 'published'),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001',
    'placeholder/tanmirt.mp3', 'placeholder/tanmirt-slow.mp3', 'audio/mpeg', 800, 'tanmirt',
    '[{"word": "tanmirt", "startMs": 50, "endMs": 650}]', true, 'published'),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001',
    'placeholder/ih.mp3', 'placeholder/ih-slow.mp3', 'audio/mpeg', 480, 'ih',
    '[{"word": "ih", "startMs": 50, "endMs": 330}]', true, 'published'),
  ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001',
    'placeholder/yemma.mp3', 'placeholder/yemma-slow.mp3', 'audio/mpeg', 800, 'yemma',
    '[{"word": "yemma", "startMs": 50, "endMs": 650}]', true, 'published'),
  ('40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001',
    'placeholder/baba.mp3', 'placeholder/baba-slow.mp3', 'audio/mpeg', 800, 'baba',
    '[{"word": "baba", "startMs": 50, "endMs": 650}]', true, 'published'),
  ('40000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000001',
    'placeholder/aman.mp3', 'placeholder/aman-slow.mp3', 'audio/mpeg', 800, 'aman',
    '[{"word": "aman", "startMs": 50, "endMs": 650}]', true, 'published'),
  ('40000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000001',
    'placeholder/aghrum.mp3', 'placeholder/aghrum-slow.mp3', 'audio/mpeg', 800, 'aɣrum',
    '[{"word": "aɣrum", "startMs": 50, "endMs": 650}]', true, 'published'),
  ('40000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000001',
    'placeholder/adrar.mp3', 'placeholder/adrar-slow.mp3', 'audio/mpeg', 800, 'adrar',
    '[{"word": "adrar", "startMs": 50, "endMs": 650}]', true, 'published');

-- Lessons ------------------------------------------------------------------------
insert into public.lessons (id, title, steps, status) values
  ('50000000-0000-4000-8000-000000000001',
    '{"en": "Greetings", "fr": "Salutations", "ar": "التحيات", "dz": "السلام"}',
    '[
      {"id": "greet-1", "type": "introduce", "entryId": "30000000-0000-4000-8000-000000000001"},
      {"id": "greet-2", "type": "listen_repeat", "entryId": "30000000-0000-4000-8000-000000000001"},
      {"id": "greet-3", "type": "culture_note", "body": {
        "en": "[PLACEHOLDER] Azul is a greeting shared by many Amazigh communities, from the Aurès to Morocco.",
        "fr": "[PLACEHOLDER] Azul est une salutation partagée par de nombreuses communautés amazighes, des Aurès au Maroc.",
        "ar": "[PLACEHOLDER] «أزول» تحية مشتركة بين كثير من المجتمعات الأمازيغية، من الأوراس إلى المغرب.",
        "dz": "[PLACEHOLDER] «أزول» سلام يقولوه بزاف تاع الأمازيغ، من الأوراس حتى للمغرب."}},
      {"id": "greet-4", "type": "introduce", "entryId": "30000000-0000-4000-8000-000000000002"},
      {"id": "greet-5", "type": "introduce", "entryId": "30000000-0000-4000-8000-000000000003"},
      {"id": "greet-6", "type": "introduce", "entryId": "30000000-0000-4000-8000-000000000004"},
      {"id": "greet-7", "type": "dialogue", "lines": [
        {"speaker": "A", "entryId": "30000000-0000-4000-8000-000000000002"},
        {"speaker": "B", "entryId": "30000000-0000-4000-8000-000000000001"},
        {"speaker": "A", "entryId": "30000000-0000-4000-8000-000000000003"}]}
    ]', 'published'),
  ('50000000-0000-4000-8000-000000000002',
    '{"en": "Family", "fr": "La famille", "ar": "العائلة", "dz": "العايلة"}',
    '[
      {"id": "family-1", "type": "introduce", "entryId": "30000000-0000-4000-8000-000000000005"},
      {"id": "family-2", "type": "listen_repeat", "entryId": "30000000-0000-4000-8000-000000000005"},
      {"id": "family-3", "type": "introduce", "entryId": "30000000-0000-4000-8000-000000000006"},
      {"id": "family-4", "type": "listen_repeat", "entryId": "30000000-0000-4000-8000-000000000006"}
    ]', 'published'),
  ('50000000-0000-4000-8000-000000000003',
    '{"en": "Everyday words", "fr": "Mots du quotidien", "ar": "كلمات يومية", "dz": "كلمات تاع كل يوم"}',
    '[
      {"id": "everyday-1", "type": "introduce", "entryId": "30000000-0000-4000-8000-000000000007"},
      {"id": "everyday-2", "type": "introduce", "entryId": "30000000-0000-4000-8000-000000000008"},
      {"id": "everyday-3", "type": "introduce", "entryId": "30000000-0000-4000-8000-000000000009"},
      {"id": "everyday-4", "type": "listen_repeat", "entryId": "30000000-0000-4000-8000-000000000009"}
    ]', 'published');

-- Quiz ---------------------------------------------------------------------------
insert into public.quizzes (id, title, questions, status) values
  ('60000000-0000-4000-8000-000000000001',
    '{"en": "First words check", "fr": "Bilan des premiers mots", "ar": "مراجعة الكلمات الأولى", "dz": "نراجعو الكلمات اللولين"}',
    '[
      {"id": "q1", "type": "listen_pick_translation", "entryId": "30000000-0000-4000-8000-000000000001",
        "distractorEntryIds": ["30000000-0000-4000-8000-000000000003", "30000000-0000-4000-8000-000000000007"]},
      {"id": "q2", "type": "pick_audio", "entryId": "30000000-0000-4000-8000-000000000007",
        "distractorEntryIds": ["30000000-0000-4000-8000-000000000008", "30000000-0000-4000-8000-000000000009"]},
      {"id": "q3", "type": "match_pairs", "entryIds": [
        "30000000-0000-4000-8000-000000000005", "30000000-0000-4000-8000-000000000006",
        "30000000-0000-4000-8000-000000000007", "30000000-0000-4000-8000-000000000008"]},
      {"id": "q4", "type": "build_sentence", "entryId": "30000000-0000-4000-8000-000000000002",
        "distractorEntryIds": ["30000000-0000-4000-8000-000000000003"]},
      {"id": "q5", "type": "fill_blank", "entryId": "30000000-0000-4000-8000-000000000002", "blankWordIndex": 1,
        "distractorEntryIds": ["30000000-0000-4000-8000-000000000007", "30000000-0000-4000-8000-000000000009"]},
      {"id": "q6", "type": "listen_pick_translation", "entryId": "30000000-0000-4000-8000-000000000009",
        "distractorEntryIds": ["30000000-0000-4000-8000-000000000008", "30000000-0000-4000-8000-000000000006"]},
      {"id": "q7", "type": "speak", "entryId": "30000000-0000-4000-8000-000000000001"}
    ]', 'published');

-- Unit and map levels --------------------------------------------------------------
insert into public.units (id, slug, position, title, description, map_theme, status) values
  ('70000000-0000-4000-8000-000000000001', 'first-words', 0,
    '{"en": "First Words & Greetings", "fr": "Premiers mots et salutations", "ar": "الكلمات الأولى والتحيات", "dz": "الكلمات اللولين والسلام"}',
    '{"en": "[PLACEHOLDER] Sample unit for development. Words and audio will be replaced with verified recordings from Merouana.",
      "fr": "[PLACEHOLDER] Unité d''exemple pour le développement. Les mots et l''audio seront remplacés par des enregistrements vérifiés de Merouana.",
      "ar": "[PLACEHOLDER] وحدة تجريبية للتطوير. ستُستبدل الكلمات والتسجيلات بتسجيلات موثّقة من مروانة.",
      "dz": "[PLACEHOLDER] وحدة تاع تجربة. الكلمات والصوت يتبدلو بتسجيلات صحاح من مروانة."}',
    'aures_peaks', 'published');

insert into public.levels (id, unit_id, position, type, title, lesson_id, quiz_id, map_x, map_y, status) values
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 0, 'lesson',
    '{"en": "Greetings", "fr": "Salutations", "ar": "التحيات", "dz": "السلام"}',
    '50000000-0000-4000-8000-000000000001', null, 0.5, 0.1, 'published'),
  ('80000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001', 1, 'lesson',
    '{"en": "Family", "fr": "La famille", "ar": "العائلة", "dz": "العايلة"}',
    '50000000-0000-4000-8000-000000000002', null, 0.28, 0.36, 'published'),
  ('80000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000001', 2, 'lesson',
    '{"en": "Everyday words", "fr": "Mots du quotidien", "ar": "كلمات يومية", "dz": "كلمات تاع كل يوم"}',
    '50000000-0000-4000-8000-000000000003', null, 0.7, 0.62, 'published'),
  ('80000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000001', 3, 'quiz',
    '{"en": "Checkpoint", "fr": "Étape", "ar": "محطة", "dz": "محطة"}',
    null, '60000000-0000-4000-8000-000000000001', 0.46, 0.88, 'published');
