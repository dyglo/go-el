'use client';

import { useMemo, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  Bell,
  BellOff,
  Clock,
  HandHeart,
  Loader2,
  Lock,
  MessageCircle,
  Plus,
  Sparkles,
  Unlock,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  archivePrayerRequestAction,
  createPrayerRequestAction,
  fetchGroupDetailAction,
  joinGroupAction,
  leaveGroupAction,
  setNotificationPreferenceAction,
  togglePrayerReactionAction,
} from './actions';
import type {
  GroupMembershipView,
  PrayerGroupDetail,
  PrayerGroupSummary,
  PrayerRequestView,
} from '@/lib/server/groups';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { PrimaryHeader } from '@/components/layout/primary-header';

type GroupsClientProps = {
  viewer: {
    id: string;
    name?: string | null;
  };
  initialDirectory: PrayerGroupSummary[];
  initialGroupId: string | null;
  initialDetail: PrayerGroupDetail | null;
};

type RequestFormState = {
  title: string;
  body: string;
  reference: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Something went wrong. Please try again.';
}

type RequestCardProps = {
  request: PrayerRequestView;
  viewerId: string;
  membership: GroupMembershipView;
  disabled: boolean;
  onTogglePrayer: () => void;
  onArchive?: () => void;
};

function RequestCard({
  request,
  viewerId,
  membership,
  disabled,
  onTogglePrayer,
  onArchive,
}: RequestCardProps) {
  const relativeCreated = useMemo(() => {
    return formatDistanceToNow(new Date(request.createdAt), { addSuffix: true });
  }, [request.createdAt]);

  const canArchive =
    membership.status === 'member' &&
    (membership.role !== 'member' || request.author.id === viewerId) &&
    !request.archivedAt &&
    Boolean(onArchive);

  return (
    <Card className="border-white/10 bg-white/5 p-5 shadow-lg shadow-black/40">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white/90">{request.title}</h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-white/50">
              <span>{request.author.name}</span>
              {request.author.role && <span>• {request.author.role}</span>}
              <span>• {relativeCreated}</span>
            </div>
          </div>
          {request.reference && (
            <Badge variant="outline" className="border-golden/60 text-golden">
              {request.reference}
            </Badge>
          )}
        </div>

        {request.body && <p className="text-sm text-white/75">{request.body}</p>}

        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant={request.viewerHasPrayed ? 'default' : 'outline'}
            className={cn(
              'gap-2 transition-colors',
              request.viewerHasPrayed
                ? 'bg-golden text-black hover:bg-golden/90'
                : 'border-white/20 text-white/80 hover:border-golden/60 hover:text-golden'
            )}
            disabled={disabled}
            onClick={onTogglePrayer}
          >
            <HandHeart className="h-4 w-4" />
            {request.viewerHasPrayed ? 'Praying' : 'Pray'}
            <span className="ml-1 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white/10 px-2 text-xs">
              {request.prayingCount}
            </span>
          </Button>

          {canArchive && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-white/60 hover:text-white"
              disabled={disabled}
              onClick={onArchive}
            >
              <Archive className="h-4 w-4" />
              Archive
            </Button>
          )}

          {request.archivedAt && (
            <Badge className="bg-white/10 text-xs uppercase tracking-[0.25em] text-white/60">
              Archived
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

export function GroupsClient({
  viewer,
  initialDirectory,
  initialGroupId,
  initialDetail,
}: GroupsClientProps) {
  const [directory, setDirectory] = useState<PrayerGroupSummary[]>(initialDirectory);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    initialGroupId ?? initialDirectory[0]?.id ?? null
  );
  const [detail, setDetail] = useState<PrayerGroupDetail | null>(initialDetail);
  const [isSwitching, startSwitchTransition] = useTransition();
  const [isMutating, startMutate] = useTransition();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestForm, setRequestForm] = useState<RequestFormState>({
    title: '',
    body: '',
    reference: '',
  });

  const activeMembership = detail?.membership ?? {
    id: 'guest',
    status: 'guest' as GroupMembershipView['status'],
    role: 'member' as GroupMembershipView['role'],
    notifications: 'quiet' as GroupMembershipView['notifications'],
  };

  const canCreateRequest = activeMembership.status === 'member';
  const isAwaitingApproval = activeMembership.status === 'pending';
  const isCapacityFull = detail?.capacityFull && activeMembership.status !== 'member';

  const handleSelectGroup = (groupId: string) => {
    if (groupId === selectedGroupId) {
      return;
    }
    setSelectedGroupId(groupId);
    startSwitchTransition(async () => {
      try {
        const { detail: fetchedDetail } = await fetchGroupDetailAction(groupId);
        setDetail(fetchedDetail);
        setDirectory((prev) =>
          prev.map((group) => (group.id === fetchedDetail.summary.id ? fetchedDetail.summary : group))
        );
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    });
  };

  const handleJoin = () => {
    if (!selectedGroupId) {
      return;
    }
    startMutate(async () => {
      try {
        const result = await joinGroupAction({ groupId: selectedGroupId });
        setDetail(result.detail);
        setDirectory((prev) =>
          prev.map((group) => (group.id === result.summary.id ? result.summary : group))
        );

        if (result.capacityFull) {
          toast.error('This group has reached its 25 member limit.');
          return;
        }

        if (result.requiresApproval) {
          toast.success('Request submitted. A facilitator will confirm shortly.');
        } else {
          toast.success('Welcome to the group. We are praying with you.');
        }
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    });
  };

  const handleLeave = () => {
    if (!selectedGroupId) {
      return;
    }
    startMutate(async () => {
      try {
        const result = await leaveGroupAction({ groupId: selectedGroupId });
        setDetail(result.detail);
        setDirectory((prev) =>
          prev.map((group) => (group.id === result.summary.id ? result.summary : group))
        );
        toast.success('You have stepped back from this group.');
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    });
  };

  const handleCreateRequest = () => {
    if (!selectedGroupId) {
      return;
    }
    startMutate(async () => {
      try {
        const result = await createPrayerRequestAction({
          groupId: selectedGroupId,
          title: requestForm.title,
          body: requestForm.body || undefined,
          reference: requestForm.reference || undefined,
        });
        setDetail(result.detail);
        setDirectory((prev) =>
          prev.map((group) =>
            group.id === result.summary.id ? result.summary : group
          )
        );
        setRequestForm({ title: '', body: '', reference: '' });
        setRequestDialogOpen(false);
        toast.success('Prayer request shared with the group.');
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    });
  };

  const handleTogglePrayer = (requestId: string) => {
    if (!selectedGroupId) {
      return;
    }
    startMutate(async () => {
      try {
        const result = await togglePrayerReactionAction({
          groupId: selectedGroupId,
          requestId,
        });
        const nextActivity = new Date().toISOString();
        setDetail((previous) => {
          if (!previous) {
            return previous;
          }
          const updateList = (list: PrayerRequestView[]) =>
            list.map((item) =>
              item.id === requestId
                ? { ...item, prayingCount: result.prayingCount, viewerHasPrayed: result.viewerHasPrayed }
                : item
            );
          return {
            ...previous,
            summary: {
              ...previous.summary,
              lastActivityAt: nextActivity,
            },
            requests: updateList(previous.requests),
            archivedRequests: updateList(previous.archivedRequests),
          };
        });
        setDirectory((prev) =>
          prev.map((group) =>
            group.id === selectedGroupId ? { ...group, lastActivityAt: nextActivity } : group
          )
        );
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    });
  };

  const handleArchiveRequest = (requestId: string) => {
    if (!selectedGroupId) {
      return;
    }
    startMutate(async () => {
      try {
        const result = await archivePrayerRequestAction({
          groupId: selectedGroupId,
          requestId,
        });
        setDetail(result.detail);
        setDirectory((prev) =>
          prev.map((group) => (group.id === result.summary.id ? result.summary : group))
        );
        toast.success('Prayer request moved to archive.');
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    });
  };

  const handleNotificationToggle = (enabled: boolean) => {
    if (!selectedGroupId) {
      return;
    }
    startMutate(async () => {
      try {
        const preference = enabled ? 'all' : 'quiet';
        const result = await setNotificationPreferenceAction({
          groupId: selectedGroupId,
          preference,
        });
        setDetail(result.detail);
        setDirectory((prev) =>
          prev.map((group) => (group.id === result.summary.id ? result.summary : group))
        );
        toast.success(
          preference === 'all'
            ? 'Notifications set to real-time updates.'
            : 'Notifications softened to quiet mode.'
        );
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    });
  };

  const selectedSummary = useMemo(
    () => directory.find((group) => group.id === selectedGroupId) ?? null,
    [directory, selectedGroupId]
  );

  const showRequestDialog = requestDialogOpen && Boolean(detail);

  return (
    <div className="min-h-screen bg-black text-white">
      <PrimaryHeader active="groups" subtitle="Prayer Rooms" />
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-3">
          <span className="text-sm uppercase tracking-[0.4em] text-white/40">Prayer Groups</span>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Gather in Scripture-centred prayer communities
          </h1>
          <p className="max-w-2xl text-white/60">
            Small rooms of trust (capped at 25) where shepherds steward requests, pray quietly, and
            archive needs after thirty days. Join a group to post, respond, and follow along.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <Card className="border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Directory</h2>
                  <p className="text-sm text-white/50">Choose a group to explore or join.</p>
                </div>
                {isSwitching && <Loader2 className="h-5 w-5 animate-spin text-white/60" />}
              </div>
              <Separator className="my-4 border-white/10" />
              <ScrollArea className="h-[420px] pr-2">
                <div className="space-y-3">
                  {directory.map((group) => {
                    const isActive = group.id === selectedGroupId;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => handleSelectGroup(group.id)}
                        className={cn(
                          'w-full rounded-2xl border p-4 text-left transition-colors',
                          isActive
                            ? 'border-golden/80 bg-golden/10'
                            : 'border-white/10 bg-black/40 hover:border-golden/40 hover:bg-golden/5'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-medium text-white/90">{group.name}</h3>
                          {group.isPrivate ? (
                            <Lock className="h-4 w-4 text-white/40" />
                          ) : (
                            <Unlock className="h-4 w-4 text-white/40" />
                          )}
                        </div>
                        <p className="mt-2 text-sm text-white/60">{group.focus}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/45">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {group.memberCount}/{group.memberLimit}
                          </span>
                          <span>
                            Last activity{' '}
                            {formatDistanceToNow(new Date(group.lastActivityAt), {
                              addSuffix: true,
                            })}
                          </span>
                          {group.viewerStatus === 'pending' && (
                            <Badge className="bg-white/15 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                              Awaiting Approval
                            </Badge>
                          )}
                          {group.viewerStatus === 'member' && (
                            <Badge className="bg-golden/20 text-[0.65rem] uppercase tracking-[0.3em] text-golden">
                              Member
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </Card>
          </aside>

          <main>
            <AnimatePresence mode="wait">
              {detail && selectedSummary ? (
                <motion.div
                  key={detail.summary.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="space-y-6"
                >
                  <Card className="border-white/10 bg-white/5 p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-5 w-5 text-golden" />
                          <span className="text-sm uppercase tracking-[0.4em] text-white/40">
                            {detail.summary.scriptureAnchor}
                          </span>
                        </div>
                        <h2 className="text-2xl font-semibold">{detail.summary.name}</h2>
                        <p className="max-w-3xl text-sm text-white/65">{detail.summary.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {detail.summary.tags.map((tag) => (
                            <Badge key={tag} className="bg-white/10 text-xs uppercase tracking-[0.3em]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-stretch gap-3">
                        <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white/60">
                          <div className="flex items-center gap-2 text-white/80">
                            <Users className="h-4 w-4" />
                            <span className="font-medium text-white/85">
                              {detail.summary.memberCount} of {detail.summary.memberLimit} members
                            </span>
                          </div>
                          <p className="mt-2">
                            {detail.summary.pendingCount > 0
                              ? `${detail.summary.pendingCount} pending approvals`
                              : 'All members confirmed'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white/60">
                          <div className="flex items-center gap-3">
                            {detail.typing.length > 0 ? (
                              <MessageCircle className="h-4 w-4 text-golden" />
                            ) : (
                              <MessageCircle className="h-4 w-4 text-white/40" />
                            )}
                            <span>
                              {detail.typing.length > 0
                                ? detail.typing
                                    .map((indicator) => `${indicator.name} ${indicator.tone === 'typing' ? 'is typing a prayer' : 'is praying quietly'}`)
                                    .join(', ')
                                : 'No live updates right now. Quietly holding space.'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6 border-white/10" />

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={detail.membership.notifications === 'all'}
                          onCheckedChange={handleNotificationToggle}
                          disabled={activeMembership.status !== 'member' || isMutating}
                        />
                        <div>
                          <p className="text-sm font-medium text-white/85">Quiet notifications</p>
                          <p className="text-xs text-white/50">
                            {detail.membership.notifications === 'all'
                              ? 'Alerts delivered immediately.'
                              : 'Summaries batched unless someone tags you.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {activeMembership.status === 'member' && (
                          <Button
                            variant="outline"
                            className="border-white/20 text-white/85 hover:border-golden/60 hover:text-golden"
                            disabled={isMutating}
                            onClick={handleLeave}
                          >
                            Step out
                          </Button>
                        )}
                        {activeMembership.status === 'pending' && (
                          <Button
                            variant="outline"
                            className="border-white/20 text-white/70 hover:border-white/40"
                            disabled={isMutating}
                            onClick={handleLeave}
                          >
                            Withdraw request
                          </Button>
                        )}
                        {activeMembership.status !== 'member' && activeMembership.status !== 'pending' && (
                          <Button
                            className="bg-golden text-black hover:bg-golden/90"
                            disabled={isMutating || Boolean(isCapacityFull)}
                            onClick={handleJoin}
                          >
                            {isCapacityFull ? 'Group full' : 'Join prayer room'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>

                  <Card className="border-white/10 bg-white/5 p-6">
                    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white/90">Active requests</h3>
                        <p className="text-sm text-white/55">
                          Share needs, respond with prayer, and archive after the Lord answers.
                        </p>
                      </div>
                      <Button
                        className="inline-flex items-center gap-2 bg-golden text-black hover:bg-golden/90"
                        disabled={!canCreateRequest || isMutating}
                        onClick={() => setRequestDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Add request
                      </Button>
                    </div>

                    {isAwaitingApproval && (
                      <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
                        Your request to join is awaiting facilitator approval. You will be notified
                        once confirmed.
                      </div>
                    )}

                    {detail.requests.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/40 p-10 text-center text-white/45">
                        <HandHeart className="mx-auto h-10 w-10 text-white/30" />
                        <p className="mt-3 text-sm">
                          No active requests yet. Be the first to invite the group into prayer.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {detail.requests.map((request) => (
                          <RequestCard
                            key={request.id}
                            request={request}
                            viewerId={viewer.id}
                            membership={activeMembership}
                            disabled={isMutating}
                            onTogglePrayer={() => handleTogglePrayer(request.id)}
                            onArchive={() => handleArchiveRequest(request.id)}
                          />
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card className="border-white/10 bg-white/5 p-6">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="archive">
                        <AccordionTrigger className="text-left text-white/80">
                          Archived (30-day cycle)
                        </AccordionTrigger>
                        <AccordionContent>
                          {detail.archivedRequests.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-white/10 bg-black/40 p-6 text-center text-sm text-white/50">
                              Nothing archived yet. Requests move here automatically after thirty days.
                            </div>
                          ) : (
                            <div className="space-y-4 pt-4">
                              {detail.archivedRequests.map((request) => (
                                <RequestCard
                                  key={request.id}
                                  request={request}
                                  viewerId={viewer.id}
                                  membership={activeMembership}
                                  disabled={isMutating}
                                  onTogglePrayer={() => handleTogglePrayer(request.id)}
                                />
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-white/60"
                >
                  <p>Select a prayer group from the directory to see its rhythm.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      <Dialog open={showRequestDialog} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="bg-neutral-950 text-white">
          <DialogHeader>
            <DialogTitle>Share a prayer request</DialogTitle>
            <DialogDescription className="text-sm text-white/50">
              Keep requests short, Scripture anchored, and free of personal details you do not wish
              to share publicly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="request-title">
                Request
              </label>
              <Input
                id="request-title"
                placeholder="Where do you want the community to pray?"
                value={requestForm.title}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, title: event.target.value }))}
                maxLength={220}
                className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="request-body">
                Context (optional)
              </label>
              <Textarea
                id="request-body"
                placeholder="Add a short line of context or Scripture promise."
                value={requestForm.body}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, body: event.target.value }))}
                rows={4}
                maxLength={500}
                className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="request-reference">
                Scripture anchor (optional)
              </label>
              <Input
                id="request-reference"
                placeholder="e.g. Psalm 121:1-4"
                value={requestForm.reference}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, reference: event.target.value }))
                }
                maxLength={80}
                className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white"
              onClick={() => setRequestDialogOpen(false)}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button
              className="bg-golden text-black hover:bg-golden/90"
              onClick={handleCreateRequest}
              disabled={requestForm.title.trim().length < 4 || isMutating}
            >
              {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="ml-2">Share</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
