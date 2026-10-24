# Workstream C — progress-aware story contract

Issue #50 · Branch `feat/galaxy-genie-progress-story` · Independent main.

**API:** `window.GalaxyProgressStory.build({userId,subjects,topics,progress,now})` returns sanitized display data only: `{masteredWorlds, masteredTopicCount, totalTopicCount, next, allWorldsMastered}`. It never saves progress, awards mastery or makes network calls.

**Inputs:** only user-scoped `genai_study_progress` rows loaded after successful Supabase Auth. Every present row needs `user_id` equal to the verified identity; mixed/missing ownership fails closed. The helper treats `status=2` as mastered; a chapter enters the Genie waist sack ONLY if every topic has status 2. Existing progress keys remain `branch / group / title` and 17 worlds remain fixed.

**Next planet:** first due revision by curriculum order, otherwise first topic not mastered, otherwise a consolidation/revision recommendation. No fake rewards from keyword hints. `next` includes chapter and topic names, kind, and index; personal ID never returns.

**Integration:** coordinator includes static `genie/progress/story.js` and switches existing `showGenieForSignedInUser` to read this helper after baseline PR #47 merges. Only coordinator edits app.js and static deployment allowlist. No project DB changes.

**Check:** `node tests/progress-story/test_progress_story.cjs`. Browser login/RLS still needs dedicated owner-approved real test users; this is pure offline validation.
