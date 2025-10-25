'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Compass,
  Feather,
  Flame,
  Globe2,
  Heart,
  Layers,
  Menu,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type NavItem = {
  label: string;
  href: string;
};

type Pillar = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type Stat = {
  value: string;
  label: string;
  detail: string;
};

type WorkflowStep = {
  step: string;
  title: string;
  description: string;
};

type FeatureHighlight = {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
};

type Commitment = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  location: string;
};

type RoadmapHighlight = {
  phase: string;
  focus: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const heroVerses = [
  {
    text: 'For the word of God is living and active, sharper than any two-edged sword.',
    reference: 'Hebrews 4:12',
  },
  {
    text: 'The grass withers, the flower fades; but the word of our God stands forever.',
    reference: 'Isaiah 40:8',
  },
  {
    text: 'Let the word of Christ dwell in you richly in all wisdom.',
    reference: 'Colossians 3:16',
  },
  {
    text: 'Blessed is the one who meditates on his law day and night.',
    reference: 'Psalm 1:2',
  },
  {
    text: 'Draw near to God, and he will draw near to you.',
    reference: 'James 4:8',
  },
];

const navItems: NavItem[] = [
  { label: 'Mission', href: '#mission' },
  { label: 'Pillars', href: '#pillars' },
  { label: 'Practices', href: '#features' },
  { label: 'Rhythms', href: '#rhythms' },
  { label: 'Journey', href: '#roadmap' },
  { label: 'Questions', href: '#faq' },
];

const pillars: Pillar[] = [
  {
    icon: BookOpen,
    title: 'Read',
    description: 'Sit with the Scriptures in a reverent setting that invites meditation and unhurried worship.',
  },
  {
    icon: Users,
    title: 'Share',
    description: 'Offer passages and brief encouragements so the body may teach and admonish one another in love.',
  },
  {
    icon: Heart,
    title: 'Pray',
    description: 'Gather in intimate prayer rooms to carry one another\'s burdens and rejoice in answered petitions.',
  },
];

const stats: Stat[] = [
  {
    value: '100%',
    label: 'Bible-centered posts',
    detail: 'Every share is anchored in Scripture and tended through prayerful moderation.',
  },
  {
    value: '25',
    label: 'Hearts in prayer rooms',
    detail: 'Intimate circles keep intercession personal and each name remembered before the Lord.',
  },
  {
    value: '1',
    label: 'Name we lift high',
    detail: 'Jesus Christ alone is the focus and song of every rhythm within GO\'EL.',
  },
];

const workflowSteps: WorkflowStep[] = [
  {
    step: '01',
    title: 'Receive the planted Word (James 1:21)',
    description: 'Arrive to a fresh passage prepared for meditation so the heart can be still and listen.',
  },
  {
    step: '02',
    title: 'Speak Scripture to one another (Colossians 3:16)',
    description: 'Share a verse and a humble reflection to build up the body in truth and grace.',
  },
  {
    step: '03',
    title: 'Bear one another\'s burdens (Galatians 6:2)',
    description: 'Bring prayer requests into trusted rooms where every response is a promise to pray.',
  },
  {
    step: '04',
    title: 'Walk in steadfast rhythms (Psalm 1:2)',
    description: 'Return daily through gentle reminders and shared plans that keep the Word near.',
  },
];

const featureHighlights: FeatureHighlight[] = [
  {
    icon: ScrollText,
    title: 'Abide in the passage (John 15:7)',
    description: 'Read slowly with generous spacing, quiet motion, and audio companions that help you linger in the verse.',
    bullets: [
      'Choose a reading atmosphere that keeps attention on Christ day or night.',
      'Adjust text to the pace of your meditation without losing reverence.',
      'Keep recent passages close at hand for return journeys even when offline.',
    ],
  },
  {
    icon: Users,
    title: 'Fellowship in the Word (Acts 2:42)',
    description: 'Share Scripture in a calm, chronological stream where Amen and Praying responses stir encouragement.',
    bullets: [
      'Give thanks together with gentle reactions anchored in prayer.',
      'Report concerns with humility so shepherds can guard the tone of the feed.',
      'Designed first for the phone in your hand while remaining beautiful on every screen.',
    ],
  },
  {
    icon: Heart,
    title: 'Kneel together in prayer (Philippians 4:6)',
    description: 'Gather in small rooms that make space for honest requests, faithful updates, and answered praise.',
    bullets: [
      'Requests rest for a season so the community stays attentive and focused.',
      'Receive quiet prompts when your brothers and sisters respond.',
      'Stories of God\'s faithfulness remain, even after the request is archived.',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Guard the flock (Titus 1:9)',
    description: 'Dedicated stewards oversee reports, uphold the Code of Conduct, and guide discipline in love.',
    bullets: [
      'Shepherd tools serve to restore, warn, or rest a member when needed.',
      'Clear history of every action keeps accountability before the community.',
      'Prayerful boundaries protect the witness of Scripture-only fellowship.',
    ],
  },
  {
    icon: Compass,
    title: 'Walk the Scriptures daily (Psalm 119:105)',
    description: 'Savor guided journeys and daily verses that keep you rooted in the story of redemption.',
    bullets: [
      'Track gentle progress through Gospel pathways and seasonal readings.',
      'Let soft reminders invite you back without pressure or comparison.',
      'Celebrate testimonies together as the Word shapes your days.',
    ],
  },
];

const commitments: Commitment[] = [
  {
    icon: ShieldCheck,
    title: 'Scripture-Only Promise',
    description: 'Every post begins with the Bible. Reflections stay brief and faithful to the passage shared.',
  },
  {
    icon: Feather,
    title: 'Reverent Aesthetic',
    description: 'A quiet black canvas and gentle gold accents lift the Word, not the interface, into focus.',
  },
  {
    icon: Globe2,
    title: 'Welcoming the whole Church',
    description: 'Readable contrast, thoughtful language, and mindful load times invite believers from every nation.',
  },
  {
    icon: Layers,
    title: 'Stewarded with integrity',
    description: 'Faithful caretaking of resources and rhythms keeps the witness of GO\'EL trustworthy.',
  },
];

const testimonials: Testimonial[] = [
  {
    quote: 'GO\'EL helps our home group dwell richly in Scripture. The stillness of the design invites us to linger in the Word together.',
    name: 'Miriam L.',
    role: 'House Church Coordinator',
    location: 'Austin, USA',
  },
  {
    quote: 'The prayer rooms give our missionaries a safe space to share updates. Amen and Praying reactions point us straight to Christ.',
    name: 'Samuel K.',
    role: 'Mission Pastor',
    location: 'Nairobi, Kenya',
  },
  {
    quote: 'As a designer, I love how the interface honors Scripture without distractions. As a believer, I love how it keeps my focus on Jesus.',
    name: 'Grace P.',
    role: 'Product Designer',
    location: 'Singapore',
  },
];

const roadmapHighlights: RoadmapHighlight[] = [
  {
    phase: 'Now',
    focus: 'Prepare the welcome',
    description: 'Shaping the home of GO\'EL with Scripture-saturated storytelling that points every visitor to Christ.',
  },
  {
    phase: 'Soon',
    focus: 'Gather the fellowship',
    description: 'Opening the Scripture stream and prayer rooms so believers can speak the Word, pray boldly, and be shepherded with care.',
  },
  {
    phase: 'Later',
    focus: 'Go into all the earth',
    description: 'Preparing translations, daily rhythms, and resilient access so the global Church can dwell in the Word together.',
  },
];

const faqs: FaqItem[] = [
  {
    question: 'What translations will GO\'EL support?',
    answer: 'The MVP launches with the World English Bible (Public Domain). Future phases integrate additional translations as licensing allows.',
  },
  {
    question: 'How are prayer groups kept safe?',
    answer: 'Groups are capped at 25 members, require invitation acceptance, and include reporting, moderation escalation, and archival after 30 days.',
  },
  {
    question: 'Will GO\'EL cost anything to use?',
    answer: 'No. GO\'EL is free to use. Operating costs are covered through supporters so Scripture can remain freely accessible.',
  },
  {
    question: 'Can I install GO\'EL as an app?',
    answer: 'Yes. You can add GO\'EL to your home screen on desktop or mobile, and recent passages stay close even when you are offline.',
  },
];

const sectionContainer = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

const SectionHeading = ({ eyebrow, title, description }: SectionHeadingProps) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6 }}
    className="mx-auto mb-12 max-w-3xl text-center"
  >
    {eyebrow ? (
      <span className="text-sm font-medium uppercase tracking-[0.3em] text-golden/80">
        {eyebrow}
      </span>
    ) : null}
    <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h2>
    {description ? (
      <p className="mt-4 text-lg leading-relaxed text-white/70">{description}</p>
    ) : null}
  </motion.div>
);

export default function Home() {
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVerseIndex((prev) => (prev + 1) % heroVerses.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className={`${sectionContainer} flex items-center justify-between py-5`}>
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-golden/30 bg-golden/10">
              <BookOpen className="h-6 w-6 text-golden" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">GO&apos;EL</p>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Scripture First</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-white/70 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/feed">
              <Button className="bg-golden text-black hover:bg-golden/90">
                Enter GO&apos;EL
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setIsMobileNavOpen((prev) => !prev)}
            >
              {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileNavOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="border-t border-white/10 bg-black/95 lg:hidden"
            >
              <div className={`${sectionContainer} flex flex-col gap-4 py-6`}>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileNavOpen(false)}
                    className="text-sm font-medium text-white/80 transition hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-4 flex flex-col gap-3">
                  <Link href="/share" onClick={() => setIsMobileNavOpen(false)}>
                    <Button className="w-full bg-golden text-black hover:bg-golden/90">
                      Share Scripture
                    </Button>
                  </Link>
                  <Link href="/today" onClick={() => setIsMobileNavOpen(false)}>
                    <Button variant="outline" className="w-full border-golden text-golden">
                      Today&apos;s Verse
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <main>
        <section
          id="top"
          className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-black via-black to-black/80"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_55%)]" />
          <div className={`${sectionContainer} relative flex flex-col gap-16 py-20 lg:flex-row lg:items-center`}>
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-golden/30 bg-golden/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-golden/80">
                  <Sparkles className="h-3 w-3" />
                  Scripture, Shared in Reverence
                </span>
                <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Let the word of Christ dwell richly among us (Colossians 3:16).
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-white/70">
                  GO&apos;EL is a quiet gathering place for believers to read the Scriptures, encourage one another, and pray with hopeful hearts fixed on Jesus.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link href="/feed">
                    <Button className="w-full bg-golden text-black hover:bg-golden/90 sm:w-auto">
                      Enter GO&apos;EL
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#mission">
                    <Button
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10 sm:w-auto"
                    >
                      Discover the Mission
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>

            <div className="relative flex-1">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-white/50">Today&apos;s Verse</p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={heroVerses[currentVerseIndex].reference}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -24 }}
                        transition={{ duration: 0.5 }}
                        className="mt-2 text-xl font-semibold text-golden"
                      >
                        {heroVerses[currentVerseIndex].reference}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-golden/40 bg-golden/10">
                    <Flame className="h-5 w-5 text-golden" />
                  </div>
                </div>
                <div className="mt-6 h-40 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentVerseIndex}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -24 }}
                      transition={{ duration: 0.5 }}
                      className="font-serif text-xl italic leading-relaxed text-white/90 md:text-2xl"
                    >
                      &ldquo;{heroVerses[currentVerseIndex].text}&rdquo;
                    </motion.p>
                  </AnimatePresence>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5 }}
                      className="rounded-2xl border border-white/10 bg-black/60 p-4 shadow-lg shadow-black/30"
                    >
                      <p className="text-2xl font-semibold text-golden">{stat.value}</p>
                      <p className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-white/60">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-sm text-white/60">{stat.detail}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="mission" className="border-b border-white/5 py-20">
          <div className={sectionContainer}>
            <SectionHeading
              eyebrow="Mission"
              title="GO&apos;EL exists so believers may gather around the living Word."
              description="We long for every follower of Jesus to step into a quiet sanctuary, open the Scriptures together, and be knit in prayerful unity. Everything we build serves that holy purpose."
            />

            <div className="grid gap-8 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-8"
              >
                <h3 className="text-2xl font-semibold text-golden">Product Vision</h3>
                <p className="mt-4 text-base leading-relaxed text-white/70">
                  GO&apos;EL is a Scripture-only community where believers can read, share, and pray the Word with reverence. The experience stays gentle and uncluttered so that the voice remembered most clearly is the Lord&apos;s.
                </p>
                <ul className="mt-6 space-y-3 text-white/70">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-golden" />
                    <span>Christ-centered simplicity keeps the Gospel at the heart of every interaction.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-golden" />
                    <span>Hospitality extends worldwide so believers in any context can enter without hindrance.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-golden" />
                    <span>Stewardship and prayer guide every decision so growth never outpaces care for souls.</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="rounded-3xl border border-golden/20 bg-golden/5 p-8"
              >
                <h3 className="text-2xl font-semibold text-golden">The Name GO&apos;EL</h3>
                <p className="mt-4 text-base leading-relaxed text-white/70">
                  GO&apos;EL means Redeemer. The app is a space where believers remember the Redeemer by dwelling on His Word together. From onboarding to prayer rooms, every interaction points to Jesus and His gospel.
                </p>
                <div className="mt-8 rounded-2xl border border-white/10 bg-black/60 p-6">
                  <p className="text-sm uppercase tracking-[0.25em] text-white/50">Core values</p>
                  <p className="mt-4 text-lg font-semibold text-white">
                    Reverence &middot; Community &middot; Stewardship &middot; Accessibility &middot; Joy in the Word
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="pillars" className="border-b border-white/5 py-20">
          <div className={sectionContainer}>
            <SectionHeading
              eyebrow="Devotion"
              title="They devoted themselves to the teaching, the fellowship, and the prayers (Acts 2:42)."
              description="GO&apos;EL holds fast to three simple practices: lingering over Scripture, blessing one another with the Word, and praying together in unity."
            />

            <div className="grid gap-10 md:grid-cols-3">
              {pillars.map((pillar, index) => (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-lg shadow-black/30"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-golden/40 bg-golden/10">
                    <pillar.icon className="h-8 w-8 text-golden" />
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold text-white">{pillar.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-white/70">{pillar.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="border-b border-white/5 py-20">
          <div className={sectionContainer}>
            <SectionHeading
              eyebrow="The path"
              title="Order our steps in Your Word (Psalm 119:133)."
              description="GO&apos;EL gently guides disciples from receiving Scripture, to blessing others with it, to kneeling together in prayer."
            />

            <div className="grid gap-8 lg:grid-cols-4">
              {workflowSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <span className="text-sm font-semibold uppercase tracking-[0.25em] text-golden/80">
                    Step {step.step}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/70">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="border-b border-white/5 py-20">
          <div className={sectionContainer}>
            <SectionHeading
              eyebrow="Practices"
              title="The Lord builds the house (Psalm 127:1)."
              description="Every facet of GO&apos;EL keeps disciples abiding in Scripture, exhorting one another, and caring for the flock with tenderness."
            />

            <div className="grid gap-8 lg:grid-cols-2">
              {featureHighlights.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.55, delay: index * 0.08 }}
                  className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-8"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-golden/30 bg-golden/10">
                      <feature.icon className="h-6 w-6 text-golden" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-white/70">{feature.description}</p>
                  <ul className="mt-6 space-y-3 text-sm text-white/70">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <CheckCircle className="mt-1 h-4 w-4 text-golden" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="rhythms" className="border-b border-white/5 py-20">
          <div className={sectionContainer}>
            <SectionHeading
              eyebrow="Rhythms of grace"
              title="Be still, and know that I am God (Psalm 46:10)."
              description="Whether held in one hand or opened on a larger screen, GO&apos;EL offers a quiet space to dwell in Scripture without distraction."
            />

            <div className="grid gap-8 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-8"
              >
                <h3 className="text-xl font-semibold text-white">One Gospel, any setting</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  Whether you open GO&apos;EL on a commute, during a quick pause, or in evening quiet, the layout rests into place so the Word stays clear and undistracted.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-white/70">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-4 w-4 text-golden" />
                    <span>Navigation stays within reach so you can return to a passage in a single tap.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-4 w-4 text-golden" />
                    <span>Layouts restack gently so sideways scrolling never interrupts meditation.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-4 w-4 text-golden" />
                    <span>Tap areas remain generous and focus states clear for tired eyes and hands.</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="rounded-3xl border border-golden/20 bg-golden/5 p-8"
              >
                <h3 className="text-xl font-semibold text-white">Return to Him with your whole heart</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  Gentle prompts, seasonal readings, and testimonies of answered prayer invite you back without burden. GO&apos;EL remembers where you left off so you can pick up the story of redemption at any moment.
                </p>
                <div className="mt-6 space-y-4">
                  {commitments.map((commitment) => (
                    <div
                      key={commitment.title}
                      className="flex gap-4 rounded-2xl border border-white/10 bg-black/60 p-4"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-golden/30 bg-golden/10">
                        <commitment.icon className="h-5 w-5 text-golden" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{commitment.title}</p>
                        <p className="mt-1 text-sm text-white/60">{commitment.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="voices" className="border-b border-white/5 py-20">
          <div className={sectionContainer}>
            <SectionHeading
              eyebrow="Testimonies"
              title="Tell of His wondrous works (Psalm 105:1)."
              description="Brothers and sisters share how a Scripture-only refuge is stirring their communities toward Christ."
            />

            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <p className="flex-1 text-base leading-relaxed text-white/70">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="mt-6 border-t border-white/10 pt-4 text-sm text-white/60">
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p>{testimonial.role}</p>
                    <p className="text-white/50">{testimonial.location}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="roadmap" className="border-b border-white/5 py-20">
          <div className={sectionContainer}>
            <SectionHeading
              eyebrow="Journey"
              title="Strengthen the hands for the work (Nehemiah 2:18)."
              description="We are steadily shaping GO&apos;EL so the Church can gather safely around Scripture, pray with boldness, and invite others into the story of redemption."
            />

            <div className="grid gap-6 md:grid-cols-3">
              {roadmapHighlights.map((item, index) => (
                <motion.div
                  key={item.phase}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.55, delay: index * 0.05 }}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <span className="text-sm font-semibold uppercase tracking-[0.3em] text-golden/80">
                    {item.phase}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold text-white">{item.focus}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/70">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="border-b border-white/5 py-20">
          <div className={sectionContainer}>
            <SectionHeading
              eyebrow="Questions"
              title="Questions believers are asking."
              description="Transparency builds trust. Here are the most common questions about GO&apos;EL today."
            />

            <div className="grid gap-6 md:grid-cols-2">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.04 }}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <h3 className="text-lg font-semibold text-golden">{faq.question}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="border-b border-white/5 py-20">
          <div className={sectionContainer}>
            <div className="grid gap-10 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-8"
              >
                <h3 className="text-3xl font-semibold text-white">Join the early community</h3>
                <p className="mt-4 text-base leading-relaxed text-white/70">
                  We are inviting prayerful believers to preview GO&apos;EL before launch. Share an email to receive Scripture updates, early access invitations, and launch-day celebrations.
                </p>
                <form className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <label className="sr-only" htmlFor="email">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="bg-black/60 text-white placeholder:text-white/40 focus-visible:ring-golden"
                    required
                  />
                  <Button className="bg-golden text-black hover:bg-golden/90" type="submit">
                    Request Invite
                  </Button>
                </form>
                <p className="mt-3 text-xs text-white/50">
                  We will only use your email to share GO&apos;EL updates. You can unsubscribe at any time.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="rounded-3xl border border-golden/20 bg-golden/5 p-8"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-golden/40 bg-golden/10">
                    <Sparkles className="h-5 w-5 text-golden" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-white/60">Support the work</p>
                    <h3 className="text-xl font-semibold text-white">Spread the Word</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  Share GO&apos;EL with your church, small group, or missions team. We welcome partnerships that help believers everywhere dwell richly in Scripture.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-white/70">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-4 w-4 text-golden" />
                    <span>Invite your prayer team to join the early access list.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-4 w-4 text-golden" />
                    <span>Partner with us on translation and Scripture licensing opportunities.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-4 w-4 text-golden" />
                    <span>Contribute testimonies of how Scripture in community transforms lives.</span>
                  </li>
                </ul>
                <Link
                  href="mailto:hello@goel.app"
                  className="mt-6 inline-flex items-center text-sm font-semibold text-golden hover:text-golden/80"
                >
                  Email the team
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black py-16">
        <div className={`${sectionContainer} grid gap-12 md:grid-cols-3`}>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-golden/30 bg-golden/10">
                <BookOpen className="h-6 w-6 text-golden" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">GO&apos;EL</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Redeemer</p>
              </div>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-white/60">
              GO&apos;EL is a Scripture-only Christian community. We believe in one God&mdash;Father, Son, and Holy Spirit&mdash;and in His Word as perfect, sufficient, and living.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-golden">Resources</h4>
            <ul className="mt-4 space-y-3 text-sm text-white/60">
              <li>Scripture quotes from the World English Bible (Public Domain).</li>
              <li>Future translations will include licensing notices as required.</li>
              <li>Design system powered by Tailwind, shadcn/ui, and Framer Motion.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-golden">Stay connected</h4>
            <p className="mt-4 text-sm text-white/60">
              hello@goel.app &middot; @goelapp &middot; Weekly Scripture updates for community leaders.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/plans">
                <Button variant="outline" className="border-golden text-golden hover:bg-golden/10">
                  View Plans
                </Button>
              </Link>
              <Link href="/groups">
                <Button variant="ghost" className="text-white hover:text-golden">
                  Prayer Groups
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          &copy; {new Date().getFullYear()} GO&apos;EL. Built unto the glory of God.
        </div>
      </footer>
    </div>
  );
}
