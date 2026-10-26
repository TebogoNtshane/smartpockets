import { ArrowUpRight } from "lucide-react";
import { formatRand } from "@/lib/format";
import { PLATFORMS } from "@/lib/investmentPlatforms";

export default function PlatformLinks({ weights }) {
  const matches = PLATFORMS.map((platform) => {
    const covered = (weights || []).filter((asset) => asset.weight > 0.02 && platform.classes.includes(asset.key));
    return {
      ...platform,
      covered,
      amount: covered.reduce((sum, asset) => sum + Number(asset.amount || 0), 0),
    };
  })
    .filter((platform) => platform.covered.length)
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-2.5">
      <p className="text-[12px] leading-relaxed text-ink/55">
        These are real platforms that accept this money. Tap one and its own sign-up page opens in a new tab — you invest
        there, with your own account. SmartPockets never holds or moves your cash.
      </p>

      {matches.map((platform) => (
        <a
          key={platform.name}
          href={platform.url}
          target="_blank"
          rel="noreferrer noopener"
          className="block rounded-2xl border border-line/70 bg-canvas px-4 py-3 transition active:scale-[0.99]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink">{platform.name}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink/55">{platform.blurb}</p>
              <p className="mt-1.5 text-[11px] text-ink/45">
                Covers {platform.covered.map((asset) => asset.name).join(", ")}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="tnum font-display text-[13px] font-semibold text-ink">{formatRand(platform.amount)}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-protea">
                Invest <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </a>
      ))}

      <p className="text-[11px] leading-relaxed text-ink/45">
        Some platforms have minimums or need an ID and proof of address to open an account. Links are for convenience,
        not advice.
      </p>
    </div>
  );
}
