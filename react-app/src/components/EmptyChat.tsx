const starterPrompts = [
  { label: "Structure", title: "LLC vs C-Corp", desc: "Choose the right company form", q: "LLC vs C-Corp?" },
  { label: "Equity", title: "Equity Split", desc: "Plan founder ownership clearly", q: "Equity split?" },
  { label: "IP", title: "IP Protection", desc: "Protect code, brand, and assets", q: "IP protection?" },
  { label: "Funding", title: "SAFE Notes", desc: "Understand startup financing", q: "SAFE note?" },
  { label: "Privacy", title: "Privacy Policy", desc: "Prepare for user data rules", q: "Privacy policy?" },
  { label: "Contracts", title: "NDA", desc: "Handle confidentiality basics", q: "NDA basics?" }
];

export function EmptyChat({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <section className="home">
      <p className="eyebrow">Startup counsel, simplified</p>
      <h1>Startup Legal Assistant</h1>
      <p className="home-subtitle">
        Ask about startup structure, equity, IP, funding, privacy, or contracts.
      </p>

      <div className="prompt-grid">
        {starterPrompts.map((item) => (
          <button className="prompt-card" key={item.title} onClick={() => onPrompt(item.q)} type="button">
            <span className="prompt-label">{item.label}</span>
            <span className="prompt-title">{item.title}</span>
            <span className="prompt-desc">{item.desc}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
