// A labelled block on a page, so a tester can find each scenario quickly.
// Wrapper classes deliberately avoid every masking name (aadhaar, pan, mobile, card, ...).
export default function Scenario({ ids, title, children }) {
  return (
    <section className="scenario">
      <div className="scenario-head">
        <span className="sid">{ids}</span>
        <span className="scenario-title">{title}</span>
      </div>
      <div className="scenario-body">{children}</div>
    </section>
  );
}
