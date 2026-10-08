import { Sk } from "@/components/skeletons";

export default function Loading() {
  return (
    <>
      <div className="head">
        <div>
          <Sk w={90} h={12} />
          <Sk w={280} h={44} style={{ marginTop: 12 }} />
          <Sk w={220} style={{ marginTop: 12 }} />
        </div>
        <Sk w={140} h={40} style={{ borderRadius: 999 }} />
      </div>
      <div className="editor">
        <div className="stack">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card stack">
              <Sk w={200} h={24} />
              <div className="grid2">
                <Sk h={40} />
                <Sk h={40} />
              </div>
              <Sk h={80} />
            </div>
          ))}
        </div>
        <aside className="stack">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card stack">
              <Sk w={120} h={20} />
              <Sk />
              <Sk w="70%" />
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
