'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bell, BellOff, BookOpen, Calendar, CheckCircle2, Circle, Flame, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Passage } from '@/lib/scripture';
import { usePlanProgress } from '@/hooks/use-plan-progress';
import { useReminderPreference } from '@/hooks/use-reminder-preference';
import { PrimaryHeader } from '@/components/layout/primary-header';
import { toast } from 'sonner';
import { setPlanProgressAction } from './actions';

type VerseOfDayClient = {
  reference: string;
  theme: string;
  passageId: string;
  displayDate: string;
  passage: Passage;
};

type PlanDayDetail = {
  day: number;
  reference: string;
  title: string;
  focus: string;
  available: boolean;
  passageId?: string;
  excerpt?: string;
  passage?: Passage;
};

type PlanClientPayload = {
  id: string;
  title: string;
  subtitle: string;
  totalDays: number;
  days: PlanDayDetail[];
};

type PlansClientProps = {
  verseOfDay: VerseOfDayClient;
  plan: PlanClientPayload;
  viewerId?: string | null;
  initialProgress?: Record<number, string>;
};

export function PlansClient({ verseOfDay, plan, viewerId, initialProgress }: PlansClientProps) {
  const { completedDays, completedCount, completionPercent, streaks, toggleDay, setDayState } = usePlanProgress({
    totalDays: plan.totalDays,
    initialCompleted: initialProgress,
  });
  const [pendingDayId, setPendingDayId] = useState<number | null>(null);
  const [isSyncing, startSync] = useTransition();
  const { enabled: remindersEnabled, permission, toggle } = useReminderPreference();
  const [modalData, setModalData] = useState<{
    reference: string;
    translation: string;
    verses: Passage['verses'];
  } | null>(null);
  const [localWarningShown, setLocalWarningShown] = useState(false);

  const verseText = useMemo(() => {
    return verseOfDay.passage.verses.map((verse) => `${verse.text}`).join(' ');
  }, [verseOfDay.passage.verses]);

  const reminderDescription =
    permission === 'granted'
      ? 'Daily reminder is on. Watch for gentle prompts at your preferred time.'
      : permission === 'denied'
        ? 'Browser notifications are blocked. Update permissions to enable reminders.'
        : permission === 'unsupported'
          ? 'Reminders are not supported in this browser.'
          : 'Enable reminders to receive a daily prompt to open the Word.';

  const handleToggleDay = (dayNumber: number) => {
    const result = toggleDay(dayNumber);

    if (!viewerId) {
      if (!localWarningShown) {
        toast.info('Progress is stored on this device. Sign in to sync across devices.');
        setLocalWarningShown(true);
      }
      return;
    }

    setPendingDayId(dayNumber);
    startSync(async () => {
      try {
        const response = await setPlanProgressAction({
          planId: plan.id,
          day: dayNumber,
          complete: result.completed,
        });
        setDayState(dayNumber, response.isCompleted, response.completedAt);
      } catch (error) {
        if (result.previous) {
          setDayState(dayNumber, result.previous.completed, result.previous.timestamp);
        }
        toast.error('Unable to sync your plan progress. We restored the previous state.');
      } finally {
        setPendingDayId((current) => (current === dayNumber ? null : current));
      }
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <PrimaryHeader active="plans" subtitle="Reading Plans" containerClassName="max-w-5xl" />

      <main className="container mx-auto max-w-5xl px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Reading Plans</h1>
            <p className="mt-2 text-white/60">Stay rooted in Scripture with daily rhythms and gentle reminders.</p>
          </div>

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-[2fr,1fr]">
            <Card className="rounded-3xl border border-golden/30 bg-gradient-to-br from-golden/15 to-olive/10 p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-golden" />
                    <h2 className="text-xl font-semibold">Verse of the Day</h2>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
                    <Calendar className="h-4 w-4 text-golden" />
                    <span>{verseOfDay.displayDate}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-black/40 text-xs uppercase tracking-[0.2em] text-golden">
                  {verseOfDay.theme}
                </Badge>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-golden">{verseOfDay.reference}</h3>
                  <p className="mt-2 font-serif text-lg leading-relaxed text-white/90">&ldquo;{verseText}&rdquo;</p>
                  <p className="mt-3 text-sm text-white/50">{verseOfDay.passage.translation}</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="flex-1 bg-golden text-black hover:bg-golden/90"
                    onClick={() =>
                      setModalData({
                        reference: verseOfDay.reference,
                        translation: verseOfDay.passage.translation,
                        verses: verseOfDay.passage.verses,
                      })
                    }
                  >
                    Read Full Passage
                  </Button>
                  <Link href="/share" className="flex-1">
                    <Button variant="outline" className="w-full border-golden text-golden hover:bg-golden/10">
                      Share to Feed
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Daily Rhythm</h3>
                    <p className="mt-1 text-sm text-white/60">Keep a gentle streak going.</p>
                  </div>
                  <Flame className="h-6 w-6 text-golden" />
                </div>
                <div className="mt-5 grid gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Current streak</span>
                    <span className="font-semibold text-golden">
                      {streaks.current} day{streaks.current === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Longest streak</span>
                    <span className="font-semibold text-white">{streaks.longest}</span>
                  </div>
                  <Separator className="border-white/10" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Plan progress</span>
                    <span className="font-semibold text-white">
                      {completedCount} / {plan.totalDays}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-golden transition-all duration-300"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>
              </Card>

              <Card className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Daily reminders</h3>
                    <p className="text-sm text-white/60">A monthly-friendly nudge to open the Word.</p>
                  </div>
                  <Switch
                    checked={remindersEnabled}
                    onCheckedChange={(value) => {
                      void toggle(value);
                    }}
                    disabled={permission === 'unsupported'}
                  />
                </div>
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
                  {remindersEnabled && permission === 'granted' ? (
                    <Bell className="mt-0.5 h-4 w-4 text-golden" />
                  ) : (
                    <BellOff className="mt-0.5 h-4 w-4 text-white/40" />
                  )}
                  <p>{reminderDescription}</p>
                </div>
              </Card>
            </div>
          </section>

          <Card className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{plan.title}</h2>
                <p className="mt-1 text-white/60">{plan.subtitle}</p>
              </div>
              <Badge className="self-start bg-white/10 text-xs uppercase tracking-[0.2em] text-white/70">
                {plan.totalDays} days
              </Badge>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {plan.days.map((day, index) => {
                const completed = completedDays.has(day.day);
                const isPendingDay = pendingDayId === day.day && isSyncing;
                return (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className={`cursor-pointer rounded-2xl border transition-colors ${
                        completed ? 'border-golden/40 bg-golden/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                      } ${isPendingDay ? 'pointer-events-none opacity-70' : ''}`}
                      onClick={() => handleToggleDay(day.day)}
                    >
                      <div className="flex flex-col gap-4 p-4">
                        <div className="flex items-start gap-3">
                          {completed ? (
                            <CheckCircle2 className="h-6 w-6 shrink-0 text-golden" />
                          ) : (
                            <Circle className="h-6 w-6 shrink-0 text-white/30" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-white/60">Day {day.day}</span>
                              <span className="text-sm text-golden">{day.reference}</span>
                            </div>
                            <p className={`mt-1 font-medium ${completed ? 'text-white/70 line-through' : 'text-white'}`}>
                              {day.title}
                            </p>
                            <p className="mt-1 text-sm text-white/60">{day.focus}</p>
                            {day.excerpt && (
                              <p className="mt-2 line-clamp-3 text-sm text-white/50">{day.excerpt}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs uppercase tracking-[0.2em] text-white/40">
                            {isPendingDay ? 'Syncing...' : completed ? 'Completed' : 'Tap to toggle'}
                          </span>
                          {day.available && day.passage ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-golden hover:text-golden/80"
                              onClick={(event) => {
                                event.stopPropagation();
                                const passage = day.passage;
                                if (passage) {
                                  setModalData({
                                    reference: day.reference,
                                    translation: passage.translation,
                                    verses: passage.verses,
                                  });
                                }
                              }}
                            >
                              Read
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="text-white/50" disabled>
                              Passage coming soon
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </Card>

          <Card className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-golden" />
            <h3 className="mt-4 text-xl font-semibold">More plans coming soon</h3>
            <p className="mt-2 text-white/60">
              Advent, Lent, and prayer-focused journeys are being prepared. Share feedback with the GO&apos;EL team.
            </p>
          </Card>
        </motion.div>
      </main>

      <Dialog
        open={Boolean(modalData)}
        onOpenChange={(open) => {
          if (!open) {
            setModalData(null);
          }
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto border border-white/10 bg-black/95 text-white sm:max-w-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-semibold text-golden">
              {modalData?.reference ?? 'Passage preview'}
            </DialogTitle>
            <DialogDescription className="text-sm uppercase tracking-[0.3em] text-white/40">
              {modalData?.translation}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3 font-serif text-lg leading-relaxed text-white/90">
              {modalData?.verses.map((verse) => {
                if (!modalData) {
                  return null;
                }
                return (
                  <p key={`${modalData.reference}-${verse.verse}`}>
                    <span className="mr-2 text-xs uppercase tracking-[0.2em] text-golden/70">{verse.verse}</span>
                    {verse.text}
                  </p>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setModalData(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
