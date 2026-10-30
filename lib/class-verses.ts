export type Verse = { text: string; ref: string };

const VERSES: Record<string, Verse> = {
  "membership-class": {
    text: "Behold, how good and how pleasant it is for brethren to dwell together in unity!",
    ref: "Psalm 133:1",
  },
  sslc: {
    text: "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.",
    ref: "Proverbs 27:17",
  },
  "school-of-shift": {
    text: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.",
    ref: "Romans 12:2",
  },
};

const FALLBACK: Verse = {
  text: "Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ:",
  ref: "Philippians 1:6",
};

export const verseFor = (slug?: string | null): Verse => (slug && VERSES[slug]) || FALLBACK;