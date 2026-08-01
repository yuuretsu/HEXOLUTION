import type { FC } from "react";
import styles from "./entries.module.css";

export const Entries: FC<{ entries: [string, number][] }> = ({ entries }) => {
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <table>
      <tbody>
        {entries.map(([name, count]) => (
          <tr key={name}>
            <th className={styles.name}>{name}</th>
            <td className={styles.count}>{new Intl.NumberFormat("en-US").format(count)}</td>
            <td className={styles.percent}>{total ? ((count / total) * 100).toFixed(1) : "0.0"}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};