import { Sk, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <>
      <div className="head">
        <div>
          <Sk w={220} h={44} />
          <Sk w={260} style={{ marginTop: 12 }} />
        </div>
      </div>
      <div className="grid3" style={{ marginBottom: 28 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="card">
            <Sk w={80} h={32} />
            <Sk w={140} h={12} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
      <div className="tabs">
        {[0, 1, 2, 3].map((i) => (
          <Sk key={i} w={90} h={30} style={{ borderRadius: 999 }} />
        ))}
      </div>
      <TableSkeleton cols={6} />
    </>
  );
}
