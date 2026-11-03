// Gemini prebuilt voices, offered for Multilingual Mode (saved as the agent's `multilingual_voice`).
// Every voice speaks every supported language, so the full list is shown whatever the agent's
// gender — the agent's own gender is just listed first.

export interface GeminiVoice {
  id: string;
  gender: "female" | "male";
  /** Google's one-word description of the voice. */
  style: string;
}

export const GEMINI_VOICES: GeminiVoice[] = [
  { id: "Achernar", gender: "female", style: "Soft" },
  { id: "Aoede", gender: "female", style: "Breezy" },
  { id: "Autonoe", gender: "female", style: "Bright" },
  { id: "Callirrhoe", gender: "female", style: "Easy-going" },
  { id: "Despina", gender: "female", style: "Smooth" },
  { id: "Erinome", gender: "female", style: "Clear" },
  { id: "Gacrux", gender: "female", style: "Mature" },
  { id: "Kore", gender: "female", style: "Firm" },
  { id: "Laomedeia", gender: "female", style: "Upbeat" },
  { id: "Leda", gender: "female", style: "Youthful" },
  { id: "Pulcherrima", gender: "female", style: "Forward" },
  { id: "Sulafat", gender: "female", style: "Warm" },
  { id: "Vindemiatrix", gender: "female", style: "Gentle" },
  { id: "Zephyr", gender: "female", style: "Bright" },
  { id: "Achird", gender: "male", style: "Friendly" },
  { id: "Algenib", gender: "male", style: "Gravelly" },
  { id: "Algieba", gender: "male", style: "Smooth" },
  { id: "Alnilam", gender: "male", style: "Firm" },
  { id: "Charon", gender: "male", style: "Informative" },
  { id: "Enceladus", gender: "male", style: "Breathy" },
  { id: "Fenrir", gender: "male", style: "Excitable" },
  { id: "Iapetus", gender: "male", style: "Clear" },
  { id: "Orus", gender: "male", style: "Firm" },
  { id: "Puck", gender: "male", style: "Upbeat" },
  { id: "Rasalgethi", gender: "male", style: "Informative" },
  { id: "Sadachbia", gender: "male", style: "Lively" },
  { id: "Sadaltager", gender: "male", style: "Knowledgeable" },
  { id: "Schedar", gender: "male", style: "Even" },
  { id: "Umbriel", gender: "male", style: "Easy-going" },
  { id: "Zubenelgenubi", gender: "male", style: "Casual" },
];

export const defaultGeminiVoice = (gender?: string) => (gender === "male" ? "Puck" : "Kore");

export const isGeminiVoice = (id?: string) => !!id && GEMINI_VOICES.some((v) => v.id === id);

/** A saved voice that isn't a Gemini voice (older agents used OpenAI ones like "alloy") becomes the default. */
export const toGeminiVoice = (id: string | undefined, gender?: string) => (isGeminiVoice(id) ? id! : defaultGeminiVoice(gender));

/** All Gemini voices as <option>s, grouped Female / Male with the agent's gender first. */
export function GeminiVoiceOptions({ gender }: { gender?: string }) {
  const order: GeminiVoice["gender"][] = gender === "male" ? ["male", "female"] : ["female", "male"];
  return (
    <>
      {order.map((g) => (
        <optgroup key={g} label={g === "female" ? "Female voices" : "Male voices"}>
          {GEMINI_VOICES.filter((v) => v.gender === g).map((v) => (
            <option key={v.id} value={v.id}>
              {v.id} · {v.style}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
