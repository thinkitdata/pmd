import Link from "next/link";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <main>
      <section
        className="section surface-ink"
        style={{ paddingTop: "clamp(9rem, 16vw, 13rem)", minHeight: "70svh" }}
      >
        <div className="shell shell--wide">
          <p className="eyebrow">404</p>
          <h1 className="u-mt-md" style={{ maxWidth: "16ch" }}>
            This road doesn&rsquo;t go anywhere.
          </h1>
          <div className="btn-row u-mt-lg">
            <Link href="/" className="btn">
              Back to the start
            </Link>
            <Link href="/book" className="btn btn--ghost">
              Reserve a date
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
