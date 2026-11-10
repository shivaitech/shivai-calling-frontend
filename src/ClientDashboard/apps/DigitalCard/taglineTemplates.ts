/**
 * Tagline ideas for the card, filled in with the owner's own title and company. Each idea is
 * kept only if it fits the tagline limit once filled in, and needs the details it mentions.
 */

export const TAGLINE_MAX = 99;

export type TaglineStyle = "professional" | "friendly" | "bold" | "sales";

export const TAGLINE_STYLES: { id: TaglineStyle; label: string }[] = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "bold", label: "Bold" },
  { id: "sales", label: "Sales" },
];

interface Who {
  title: string;
  company: string;
}

type Idea = { style: TaglineStyle; text: (w: Who) => string; needs?: (keyof Who)[] };

const IDEAS: Idea[] = [
  // Professional
  { style: "professional", needs: ["title", "company"], text: (w) => `${w.title} at ${w.company}. Let's build something worthwhile together.` },
  { style: "professional", needs: ["company"], text: (w) => `Leading ${w.company} with focus, clarity and results.` },
  { style: "professional", needs: ["title"], text: (w) => `${w.title} helping businesses grow with smart strategy and execution.` },
  { style: "professional", text: () => "Turning ideas into results. Let's talk about what you're building." },
  { style: "professional", text: () => "Strategy, execution and long-term partnerships. Always open to a conversation." },
  { style: "professional", needs: ["company"], text: (w) => `Building ${w.company} one strong relationship at a time.` },
  // Friendly
  { style: "friendly", text: () => "Let's connect. Call, WhatsApp or save my contact in one tap." },
  { style: "friendly", text: () => "Happy to help. Reach me any way you like, right from this card." },
  { style: "friendly", needs: ["company"], text: (w) => `Hi, welcome! Find me and ${w.company} all in one place.` },
  { style: "friendly", text: () => "Great conversations start here. Say hello any time." },
  { style: "friendly", needs: ["title"], text: (w) => `${w.title} who loves meeting new people. Let's chat!` },
  { style: "friendly", text: () => "Coffee, call or WhatsApp, whatever works for you. Let's talk." },
  // Bold
  { style: "bold", text: () => "Builder. Problem solver. Always learning." },
  { style: "bold", needs: ["company"], text: (w) => `${w.company}: built different. Let's make it happen.` },
  { style: "bold", text: () => "Big ideas. Bold execution. Real results." },
  { style: "bold", needs: ["title"], text: (w) => `${w.title}. Driven by impact, powered by people.` },
  { style: "bold", text: () => "I don't just plan it. I build it." },
  { style: "bold", text: () => "Making the complex simple, and the simple remarkable." },
  // Sales
  { style: "sales", needs: ["company"], text: (w) => `Looking for the right partner? ${w.company} is ready when you are.` },
  { style: "sales", text: () => "Tell me what you need. I'll show you how we can help." },
  { style: "sales", needs: ["company"], text: (w) => `Discover how ${w.company} can save you time and grow your business.` },
  { style: "sales", text: () => "Quick answers, honest advice and fast follow-ups. Let's talk." },
  { style: "sales", needs: ["title"], text: (w) => `${w.title} ready to help you choose the right solution.` },
  { style: "sales", text: () => "Your next big win starts with one conversation. Reach out today." },
];

/** Every idea that fits this person in one style, with a stable id (so a shuffle survives typing). */
export function taglineIdeas(title: string, company: string, style: TaglineStyle): { id: number; text: string }[] {
  const who: Who = { title: title.trim(), company: company.trim() };
  return IDEAS.flatMap((i, id) => {
    if (i.style !== style || !(i.needs ?? []).every((k) => who[k])) return [];
    const text = i.text(who).replace(/\s+/g, " ").trim();
    return text.length <= TAGLINE_MAX ? [{ id, text }] : [];
  });
}

/** All idea ids shuffled, with the ones just shown moved to the end (so "New ideas" shows others). */
export function shuffleIdeas(justShown: number[] = []): number[] {
  const ids = IDEAS.map((_, i) => i).sort(() => Math.random() - 0.5);
  return [...ids.filter((i) => !justShown.includes(i)), ...ids.filter((i) => justShown.includes(i))];
}
