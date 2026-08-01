import type { FC } from "react";

export const Entries: FC<{ entries: [string, number][] }> = ({ entries }) => {
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <table>
      <tbody>
        {entries.map(([name, count]) => (
          <tr key={name}>
            <th style={{ minWidth: 150 }}>{name}</th>
            <td style={{ minWidth: 100 }}>{new Intl.NumberFormat("en-US").format(count)}</td>
            <td style={{ minWidth: 64 }}>{total ? ((count / total) * 100).toFixed(1) : "0.0"}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
