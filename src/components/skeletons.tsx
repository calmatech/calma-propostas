export const Sk = ({ w = "100%", h = 14, style }: { w?: number | string; h?: number; style?: React.CSSProperties }) => (
  <span className="sk" style={{ width: w, height: h, ...style }} />
);

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="tablewrap">
      <table className="table" aria-busy="true">
        <thead>
          <tr>
            {Array.from({ length: cols }, (_, i) => (
              <th key={i}>
                <Sk w={60} h={10} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }, (_, c) => (
                <td key={c}>
                  <Sk w={c === 0 ? "70%" : "50%"} />
                  {c === 0 && <Sk w="40%" h={10} style={{ marginTop: 8 }} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
