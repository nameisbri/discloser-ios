"use client";

import { useState } from "react";

export function VerificationExplainer({ isVerified }: { isVerified: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-surface-light px-6 py-4">
      <p className="text-center text-white/40 text-xs">
        {isVerified ? (
          <span className="text-accent-mint">&#10003; Verified</span>
        ) : (
          <span>Not verified</span>
        )}
        {" — "}
        <button
          onClick={() => setOpen(!open)}
          className="underline underline-offset-2 hover:text-white/60 transition-colors"
        >
          {open ? "hide details" : "what does this mean?"}
        </button>
      </p>

      {open && (
        <div className="mt-3 text-left text-white/50 text-xs space-y-2">
          {isVerified ? (
            <>
              <p>
                This result was automatically checked against several signals to confirm it comes from a real lab report:
              </p>
              <ul className="list-disc list-inside space-y-1 text-white/40">
                <li>Recognized lab name or letterhead</li>
                <li>Patient name matches the sharer&apos;s profile</li>
                <li>Valid collection date</li>
                <li>Lab accession or requisition number</li>
                <li>Health card or patient ID detected</li>
              </ul>
              <p className="text-white/30">
                No system is perfect. Verification means the document passed automated checks — not that it has been manually reviewed.
              </p>
            </>
          ) : (
            <>
              <p>
                This result did not pass enough automated checks to be marked as verified. This could mean:
              </p>
              <ul className="list-disc list-inside space-y-1 text-white/40">
                <li>The lab was not recognized</li>
                <li>The patient name didn&apos;t match the sharer&apos;s profile</li>
                <li>Key details were missing or unclear in the upload</li>
              </ul>
              <p className="text-white/30">
                An unverified result may still be accurate — it just couldn&apos;t be confirmed automatically.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
