// Deterministic mock "QR" — visual only.
export function QrMock({ value, size = 128 }: { value: string; size?: number }) {
  const grid = 15;
  const cell = size / grid;
  let seed = 0;
  for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) >>> 0;
  const rand = (i: number, j: number) => {
    const x = (i * 374761393 + j * 668265263 + seed) >>> 0;
    return ((x ^ (x >> 13)) * 1274126177) >>> 0;
  };
  const isFinder = (i: number, j: number) => {
    const inBox = (bi: number, bj: number) =>
      i >= bi && i < bi + 7 && j >= bj && j < bj + 7 &&
      !(i > bi + 1 && i < bi + 5 && j > bj + 1 && j < bj + 5) || (i >= bi + 2 && i < bi + 5 && j >= bj + 2 && j < bj + 5);
    return inBox(0, 0) || inBox(0, grid - 7) || inBox(grid - 7, 0);
  };
  const cells = [];
  for (let i = 0; i < grid; i++) {
    for (let j = 0; j < grid; j++) {
      const on = isFinder(i, j) ? true : (rand(i, j) % 100) < 45;
      if (on) cells.push(<rect key={`${i}-${j}`} x={j * cell} y={i * cell} width={cell} height={cell} fill="currentColor" />);
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="text-primary">
      <rect width={size} height={size} fill="white" />
      {cells}
    </svg>
  );
}
