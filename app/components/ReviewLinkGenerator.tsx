"use client";
import { useState } from "react";
import QrWithLogo from "./QrWithLogo";
import { buildReviewLink } from "@/lib/extractPlaceId";

export default function ReviewLinkGenerator() {
  const [placeId, setPlaceId] = useState("");
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [wantsQr, setWantsQr] = useState<boolean | null>(null);

  const reviewLink = confirmedId ? buildReviewLink(confirmedId) : null;

  return (
    <div className="max-w-lg mx-auto w-full px-5 py-8">
      <h1 className="font-display text-3xl sm:text-4xl text-ink mb-2 text-center">
        Get your review link
      </h1>
      <p className="text-center text-ink/60 mb-2 text-sm sm:text-base">
        Paste your business&apos;s Place ID below.
      </p>
      <p className="text-center text-xs text-ink/50 mb-8">
        Don&apos;t have it?{" "}
        <a
          href="https://developers.google.com/maps/documentation/places/web-service/place-id"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-lavender-dark"
        >
          Look it up here
        </a>{" "}
        — search your business, copy the ID it shows you.
      </p>

      <div className="flex flex-col gap-3">
        <input
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
          className="w-full rounded-xl2 border border-sage px-4 py-3 bg-white/70 focus:outline-none focus:ring-2 focus:ring-lavender"
        />
        <button
          onClick={() => {
            setConfirmedId(placeId.trim());
            setWantsQr(null);
          }}
          disabled={!placeId.trim()}
          className="rounded-full bg-sage hover:bg-sage-dark transition-colors py-3 font-medium disabled:opacity-50"
        >
          Generate review link
        </button>
      </div>

      {reviewLink && (
        <div className="mt-8 rounded-xl2 bg-white/70 p-5 flex flex-col gap-4">
        <a  
            href={reviewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lavender-dark underline break-all text-sm"
          >
            {reviewLink}
          </a>
          <button
            onClick={() => navigator.clipboard.writeText(reviewLink)}
            className="self-start rounded-full bg-lavender hover:bg-lavender-dark px-4 py-2 text-sm font-medium"
          >
            Copy link
          </button>

          {wantsQr === null && (
            <div className="mt-2">
              <p className="text-sm mb-2">Want a QR code for this link?</p>
              <div className="flex gap-3">
                <button onClick={() => setWantsQr(true)} className="rounded-full bg-peach px-4 py-2 text-sm font-medium">
                  Yes
                </button>
                <button onClick={() => setWantsQr(false)} className="rounded-full bg-white px-4 py-2 text-sm font-medium border border-sage">
                  No
                </button>
              </div>
            </div>
          )}

          {wantsQr && (
            <div className="mt-4">
              <QrWithLogo value={reviewLink} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}