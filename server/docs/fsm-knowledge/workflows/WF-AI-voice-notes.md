# WF-AI-voice-notes — Upload & Transcribe Voice Notes

## Module
Voice Notes — `VoiceNotesPage` (`/voice-notes`)

## Prerequisites
- User must be authenticated (route is nested under the authenticated app layout).
- An audio file to upload. Accepted types: `audio/*`, `.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`, `.webm`.

---

## Steps — Upload and Transcribe an Audio File

1. Navigate to `/voice-notes`. The page title reads **"Voice Notes & Transcription"**.
2. In the **"Upload Voice Note"** card, select the spoken language from the **language dropdown** (default **English**). Available options: English (`en`), Spanish (`es`), French (`fr`), German (`de`), Arabic (`ar`), Hindi (`hi`), Chinese (`zh`), Japanese (`ja`).
3. Click the **"Upload & Transcribe"** button (microphone icon) and choose an audio file. The file is submitted immediately on selection.
4. The button shows a loading state while the request runs (`transcribe.isPending`). The file is sent via `useTranscribe` → `voiceApi.transcribe(file, language)` as `multipart/form-data` to `POST /voice/transcribe`.
5. On success, a message appears (server `message` or "Transcription completed"), the new note is added to the top of the **"Voice Notes"** list, and it becomes the active note. On failure, an error message appears ("Transcription failed" or the server's message).

---

## Steps — Review Transcribed Notes

1. The left **"Voice Notes"** card (Col span 10) lists transcribed notes. Before any upload it shows the empty state **"No voice notes yet. Upload an audio file to get started."**
2. Each list item displays:
   - A play icon and the **file name**.
   - A **language tag** (`transcription.language`, falling back to the selected language).
   - The **duration** in seconds (e.g., "12.3s").
   - The **segment count** (e.g., "5 segments").
3. Click a list item to select it; the active note is highlighted and its transcription opens in the right panel.

---

## Steps — View a Transcription

1. The right card (Col span 14) shows the active note titled **"Transcription: {fileName}"**. When no note is selected it shows **"Select a voice note to view its transcription"**.
2. The **"Full Text"** inner card displays the complete transcribed text (`transcription.text`), or **"No transcription available."** if empty.
3. If the transcription has segments, a **"Segments"** inner card lists each segment with:
   - A blue time-range tag (e.g., "0.0s - 4.2s") from `seg.start`/`seg.end`.
   - A **confidence** percentage (e.g., "Confidence: 92%") when `seg.confidence` is present.
   - The segment text.

---

## Notes
- Voice notes are held in component state only — the list is not persisted and is cleared on page reload.
- The page also exposes a language-detection capability via `voiceApi.detectLanguage` (`POST /voice/detect-language`) through the `useDetectLanguage` hook, but no control on this page currently invokes it.

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| Select transcription language | Language **Select** dropdown | Authenticated | Client-side state (`language`) |
| Upload & transcribe audio | **Upload & Transcribe** button (Upload) | Authenticated | `useTranscribe` → `voiceApi.transcribe` → `POST /voice/transcribe` |
| Select a note to view | Click a list item in **Voice Notes** | Authenticated | Client-side state (`activeNote`) |
| View full text & segments | Active note panel (read-only) | Authenticated | Rendered from `TranscriptionResult` |
