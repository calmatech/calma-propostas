import { Sk, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <>
      <div className="head">
        <div>
          <Sk w={240} h={44} />
          <Sk w={360} style={{ marginTop: 12 }} />
        </div>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="grid3">
          <Sk h={60} />
          <Sk h={60} />
          <Sk h={60} />
        </div>
      </div>
      <TableSkeleton cols={4} />
    </>
  );
}
