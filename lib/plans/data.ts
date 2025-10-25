export type GospelPlanDay = {
  day: number;
  reference: string;
  title: string;
  focus: string;
};

export const GOSPEL_PLAN_DAYS: GospelPlanDay[] = [
  { day: 1, reference: 'Matthew 1:18-25', title: 'The Birth of Jesus', focus: 'Marvel at the humility of the Incarnation.' },
  { day: 2, reference: 'Matthew 3:13-17', title: 'Baptised in Obedience', focus: 'See the Trinity rejoice over the Son.' },
  { day: 3, reference: 'Matthew 4:1-11', title: 'Victory in Temptation', focus: 'Follow Jesus into Scripture-shaped resistance.' },
  { day: 4, reference: 'Matthew 5:1-12', title: 'Blessed Are the Poor in Spirit', focus: 'Hear the blessings of the Kingdom.' },
  { day: 5, reference: 'Matthew 6:9-15', title: 'Teach Us to Pray', focus: "Let the Lord's Prayer form your requests." },
  { day: 6, reference: 'Matthew 8:23-27', title: 'Peace in the Storm', focus: 'Trust His authority over chaos.' },
  { day: 7, reference: 'Matthew 9:35-38', title: 'Compassion for the Crowd', focus: 'Pray for labourers in the harvest.' },
  { day: 8, reference: 'Matthew 11:28-30', title: 'Rest for the Weary', focus: 'Take His easy yoke upon you.' },
  { day: 9, reference: 'Matthew 13:44-46', title: 'The Treasure of the Kingdom', focus: 'Value Christ above every treasure.' },
  { day: 10, reference: 'Matthew 16:13-20', title: 'You Are the Christ', focus: "Confess Jesus with Peter's boldness." },
  { day: 11, reference: 'Matthew 17:1-8', title: 'Glory on the Mountain', focus: 'Listen to the beloved Son.' },
  { day: 12, reference: 'Matthew 22:34-40', title: 'The Greatest Command', focus: 'Love God fully and neighbour faithfully.' },
  { day: 13, reference: 'Matthew 26:26-30', title: 'Covenant in His Blood', focus: 'Remember the cost of redemption.' },
  { day: 14, reference: 'Mark 2:1-12', title: 'Faith that Breaks Through', focus: 'Bring others to the Healer.' },
  { day: 15, reference: 'Mark 5:1-20', title: 'Freedom for the Bound', focus: 'Celebrate deliverance and testify.' },
  { day: 16, reference: 'Mark 10:13-16', title: 'Let the Children Come', focus: 'Receive the Kingdom with childlike trust.' },
  { day: 17, reference: 'Mark 12:41-44', title: "The Widow's Gift", focus: 'Offer whole-hearted devotion.' },
  { day: 18, reference: 'Luke 1:46-55', title: "Mary's Song", focus: 'Magnify the Lord who scatters pride.' },
  { day: 19, reference: 'Luke 4:16-21', title: 'Good News to the Poor', focus: 'Rejoice in Jubilee fulfilled in Christ.' },
  { day: 20, reference: 'Luke 5:17-26', title: 'Rise and Walk', focus: 'Receive forgiveness and new life.' },
  { day: 21, reference: 'Luke 7:11-17', title: 'Compassion at Nain', focus: 'Witness resurrection mercy.' },
  { day: 22, reference: 'Luke 10:25-37', title: 'The Good Samaritan', focus: 'Show mercy that crosses boundaries.' },
  { day: 23, reference: 'Luke 15:11-24', title: 'Welcome Home', focus: "Feel the Father's embrace for the lost." },
  { day: 24, reference: 'Luke 19:1-10', title: 'Grace for Zacchaeus', focus: 'Celebrate salvation coming home.' },
  { day: 25, reference: 'Luke 22:39-46', title: 'Agony in the Garden', focus: 'Watch and pray in surrender.' },
  { day: 26, reference: 'John 1:1-5', title: 'The Word Made Flesh', focus: 'Adore the eternal Light and Life.' },
  { day: 27, reference: 'John 3:16-21', title: 'Loved and Rescued', focus: 'Rest in the gift of eternal life.' },
  { day: 28, reference: 'John 10:11-18', title: 'The Good Shepherd', focus: 'Hear the voice that lays down His life.' },
  { day: 29, reference: 'John 13:1-15', title: 'The Servant King', focus: 'Follow His example of humble love.' },
  { day: 30, reference: 'John 20:24-31', title: 'Blessed Belief', focus: 'Believe and have life in His name.' },
];

export type VerseOfDaySeed = {
  reference: string;
  theme: string;
};

export const VERSE_OF_DAY_ROTATION: VerseOfDaySeed[] = [
  { reference: 'Psalms 27:1', theme: 'Light in the Darkness' },
  { reference: 'Isaiah 26:3-4', theme: 'Perfect Peace' },
  { reference: 'Lamentations 3:22-23', theme: 'Mercies New Every Morning' },
  { reference: 'John 15:4-5', theme: 'Abide in the True Vine' },
  { reference: 'Romans 12:9-12', theme: 'Sincere Love' },
  { reference: '1 Corinthians 1:26-31', theme: 'Boast in the Lord' },
  { reference: '2 Corinthians 4:7-9', theme: 'Treasure in Jars of Clay' },
  { reference: 'Ephesians 3:16-21', theme: 'Rooted in Love' },
  { reference: 'Philippians 4:4-9', theme: 'Peace that Guards' },
  { reference: 'Colossians 1:13-18', theme: 'Supremacy of Christ' },
  { reference: 'Hebrews 12:1-3', theme: 'Run with Endurance' },
  { reference: 'James 1:2-5', theme: 'Joy in Trials' },
  { reference: '1 Peter 5:6-11', theme: 'Grace for the Humble' },
  { reference: 'Revelation 21:1-5', theme: 'All Things Made New' },
];
