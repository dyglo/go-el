'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  Shield,
  AlertTriangle,
  Hammer,
  Undo2,
  CheckCircle2,
  Loader2,
  BookOpen,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { ModerationReportView, ModerationSummary } from '@/lib/server/moderation';
import { moderateReportAction } from './actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type AdminReportsClientProps = {
  moderator: {
    id: string;
    name?: string | null;
  };
  initialReports: ModerationReportView[];
};

type ModerationFilter = 'all' | 'pending' | 'in_review' | 'actioned' | 'dismissed';

const FILTER_OPTIONS: { label: string; value: ModerationFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In review', value: 'in_review' },
  { label: 'Actioned', value: 'actioned' },
  { label: 'Dismissed', value: 'dismissed' },
];

const STATUS_MAP: Record<
  ModerationReportView['status'],
  { label: string; variant: 'amber' | 'green' | 'slate' | 'purple' }
> = {
  pending: { label: 'Pending', variant: 'amber' },
  in_review: { label: 'In review', variant: 'purple' },
  actioned: { label: 'Actioned', variant: 'green' },
  dismissed: { label: 'Dismissed', variant: 'slate' },
};

function getStatusBadgeClasses(variant: 'amber' | 'green' | 'slate' | 'purple') {
  switch (variant) {
    case 'amber':
      return 'bg-amber-500/20 text-amber-200';
    case 'green':
      return 'bg-emerald-500/20 text-emerald-200';
    case 'purple':
      return 'bg-violet-500/20 text-violet-200';
    default:
      return 'bg-white/10 text-white/70';
  }
}

function calculateSummary(reports: ModerationReportView[]): ModerationSummary {
  return {
    total: reports.length,
    pending: reports.filter((report) => report.status === 'pending').length,
    inReview: reports.filter((report) => report.status === 'in_review').length,
    actioned: reports.filter((report) => report.status === 'actioned').length,
    dismissed: reports.filter((report) => report.status === 'dismissed').length,
  };
}

function getAvailableActions(status: ModerationReportView['status']) {
  switch (status) {
    case 'pending':
      return ['warn', 'hide', 'suspend'] as const;
    case 'in_review':
      return ['warn', 'hide', 'suspend', 'restore'] as const;
    case 'actioned':
      return ['restore'] as const;
    case 'dismissed':
      return ['restore'] as const;
    default:
      return ['warn', 'hide', 'suspend'] as const;
  }
}

export function AdminReportsClient({ moderator, initialReports }: AdminReportsClientProps) {
  const [reports, setReports] = useState<ModerationReportView[]>(initialReports);
  const [filter, setFilter] = useState<ModerationFilter>('pending');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [isMutating, startMutation] = useTransition();

  const filteredReports = useMemo(() => {
    if (filter === 'all') {
      return reports;
    }
    return reports.filter((report) => report.status === filter);
  }, [filter, reports]);

  const summary = useMemo<ModerationSummary>(() => calculateSummary(reports), [reports]);

  const summaryTiles = useMemo(
    () => [
      {
        label: 'Pending',
        value: summary.pending,
        description: 'Awaiting first review',
        icon: AlertTriangle,
      },
      {
        label: 'In review',
        value: summary.inReview,
        description: 'Warned / follow-up needed',
        icon: Shield,
      },
      {
        label: 'Actioned',
        value: summary.actioned,
        description: 'Hidden or suspended',
        icon: Hammer,
      },
      {
        label: 'Dismissed',
        value: summary.dismissed,
        description: 'Restored after review',
        icon: Undo2,
      },
    ],
    [summary]
  );

  const handleAction = (reportId: string, action: 'hide' | 'warn' | 'suspend' | 'restore') => {
    startMutation(async () => {
      try {
        setPendingActionId(reportId);
        const response = await moderateReportAction({
          reportId,
          action,
          notes: noteDrafts[reportId],
        });

        setReports((previous) =>
          previous
            .map((entry) => (entry.id === reportId ? response.report : entry))
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        );

        setNoteDrafts((prev) => {
          if (!(reportId in prev)) {
            return prev;
          }
          const next = { ...prev };
          delete next[reportId];
          return next;
        });

        toast.success('Moderation action recorded.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update report.';
        toast.error(message);
      } finally {
        setPendingActionId(null);
      }
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-3">
          <span className="text-sm uppercase tracking-[0.4em] text-white/40">Admin</span>
          <h1 className="text-3xl font-semibold md:text-4xl">Moderation suite</h1>
          <p className="max-w-3xl text-white/60">
            Review community reports, issue warnings, hide content, or suspend posts. Logging keeps a
            trail of every action for accountability.
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-white/35">
            Acting as {moderator.name ?? moderator.id}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryTiles.map((tile) => (
            <Card key={tile.label} className="border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">{tile.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white/90">{tile.value}</p>
                </div>
                <tile.icon className="h-8 w-8 text-golden" />
              </div>
              <p className="mt-4 text-xs text-white/45">{tile.description}</p>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <p className="text-sm text-white/60">Filter by status</p>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => {
              const isActive = filter === option.value;
              return (
                <Button
                  key={option.value}
                  variant={isActive ? 'default' : 'outline'}
                  className={cn(
                    'border-white/15 text-sm',
                    isActive
                      ? 'bg-golden text-black hover:bg-golden/90'
                      : 'border-white/20 bg-transparent text-white/70 hover:border-golden/40 hover:text-golden'
                  )}
                  onClick={() => setFilter(option.value)}
                  disabled={isMutating && pendingActionId !== null}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
          <div className="ml-auto text-xs uppercase tracking-[0.3em] text-white/35">
            {summary.total} reports in review
          </div>
        </div>

        <Separator className="my-6 border-white/10" />

        {filteredReports.length === 0 ? (
          <Card className="border-white/10 bg-white/5 p-12 text-center text-white/50">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400/60" />
            <p className="mt-3 text-sm">No reports in this queue. All clear.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredReports.map((report) => {
              const statusMeta = STATUS_MAP[report.status];
              const actionsForStatus = getAvailableActions(report.status);
              const isPending = pendingActionId === report.id && isMutating;
              const createdRelative = formatDistanceToNow(new Date(report.createdAt), {
                addSuffix: true,
              });
              const resolvedRelative = report.resolvedAt
                ? formatDistanceToNow(new Date(report.resolvedAt), { addSuffix: true })
                : null;
              const noteDraft = noteDrafts[report.id] ?? '';

              return (
                <Card key={report.id} className="border-white/10 bg-white/5 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={cn('text-xs uppercase tracking-[0.3em]', getStatusBadgeClasses(statusMeta.variant))}>
                        {statusMeta.label}
                      </Badge>
                      <span className="text-sm text-white/50">
                        Reported {createdRelative}
                        {resolvedRelative && ` • resolved ${resolvedRelative}`}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {actionsForStatus.map((action) => {
                        const Icon =
                          action === 'warn' ? AlertTriangle : action === 'hide' ? Shield : action === 'suspend' ? Hammer : Undo2;
                        const label =
                          action === 'warn'
                            ? 'Warn author'
                            : action === 'hide'
                            ? 'Hide post'
                            : action === 'suspend'
                            ? 'Suspend post'
                            : 'Restore post';
                        return (
                          <Button
                            key={action}
                            variant="outline"
                            className="gap-2 border-white/20 text-white/80 hover:border-golden/40 hover:text-golden"
                            disabled={isMutating}
                            onClick={() => handleAction(report.id, action)}
                          >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                            {label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator className="my-5 border-white/10" />

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-white/40">Concern</p>
                        <p className="mt-2 text-base text-white/85">{report.reason}</p>
                        {report.notes && (
                          <p className="mt-2 text-sm text-white/55">Last note: {report.notes}</p>
                        )}
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/65">
                        <p className="text-white/80">
                          Reporter: <span className="font-medium text-white/90">{report.reporter.name}</span>
                        </p>
                        {report.reporter.email && <p className="text-white/50">{report.reporter.email}</p>}
                        <p className="mt-2 text-sm text-white/60">
                          Post by <span className="font-medium text-white/85">{report.post.author.name}</span> ·{' '}
                          <span className="uppercase tracking-[0.3em] text-white/35">{report.post.status}</span>
                        </p>
                        <p className="mt-3 text-xs uppercase tracking-[0.3em] text-white/35">Post reference</p>
                        <p className="mt-1 text-white/80">{report.post.reference}</p>
                        {report.post.reflection && (
                          <p className="mt-2 line-clamp-3 text-sm text-white/60">{report.post.reflection}</p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/50">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {report.post.reportCount} reports
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            {report.post.tags.length > 0 ? report.post.tags.join(', ') : 'No tags'}
                          </span>
                          <span>Amen {report.post.reactionCounts.amen}</span>
                          <span>Praying {report.post.reactionCounts.praying}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-white/40">Moderator note</p>
                        <Textarea
                          value={noteDraft}
                          onChange={(event) =>
                            setNoteDrafts((prev) => ({
                              ...prev,
                              [report.id]: event.target.value,
                            }))
                          }
                          placeholder="Record a short note for this action (optional, max 280 chars)."
                          maxLength={280}
                          className="mt-2 min-h-[120px] border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                        />
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-white/40">Action log</p>
                        {report.actions.length === 0 ? (
                          <p className="mt-2 text-sm text-white/50">No actions recorded yet.</p>
                        ) : (
                          <ScrollArea className="mt-3 max-h-40 pr-3">
                            <div className="space-y-3">
                              {report.actions.map((action) => (
                                <div
                                  key={action.id}
                                  className="rounded-xl border border-white/10 bg-black/60 p-3 text-sm text-white/70"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-white/85">{action.actor.name}</span>
                                    <span className="text-xs uppercase tracking-[0.3em] text-white/35">
                                      {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/40">
                                    {action.action.toUpperCase()}
                                  </p>
                                  {action.notes && (
                                    <p className="mt-1 text-sm text-white/60">{action.notes}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
