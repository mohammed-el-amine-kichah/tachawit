/** Columns the players need for an entry, with its published audio and the speaker's name. */
export const ENTRY_WITH_AUDIO = `
  id, text_latin, text_arabic, text_tifinagh, translations, part_of_speech, image_path,
  regions(name),
  audio_clips(id, storage_path, slow_storage_path, duration_ms, word_timestamps, is_primary, speakers(display_name))
`;
