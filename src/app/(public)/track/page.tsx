import type { Metadata } from "next";
import { TrackPanel } from "@/components/TrackPanel";

export const metadata: Metadata = { title: "Track a complaint" };

export default function TrackPage() {
  return (
    <div className="wrap">
      <TrackPanel />
    </div>
  );
}
