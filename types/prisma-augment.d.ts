import '@prisma/client';

declare module '@prisma/client' {
  interface Post {
    passageText: string;
  }

  interface ShareDraft {
    passageText: string;
  }
}
