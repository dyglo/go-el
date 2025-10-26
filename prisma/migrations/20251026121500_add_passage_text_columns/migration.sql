-- Add missing passage text storage for posts and share drafts
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "passageText" TEXT;
ALTER TABLE "ShareDraft" ADD COLUMN IF NOT EXISTS "passageText" TEXT;

-- Backfill existing records with an empty string so the columns can be non-null
UPDATE "Post" SET "passageText" = COALESCE("passageText", '');
UPDATE "ShareDraft" SET "passageText" = COALESCE("passageText", '');

ALTER TABLE "Post" ALTER COLUMN "passageText" SET NOT NULL;
ALTER TABLE "ShareDraft" ALTER COLUMN "passageText" SET NOT NULL;
