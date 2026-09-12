import type { FC } from "react";
import { Text } from "@/shared/ui/text";
import styles from "./entries.module.css";

export const Entries: FC<{ entries: [string, number][] }> = ({ entries }) => {
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <table>
      <tbody>
        {entries.map(([name, count]) => (
          <tr key={name}>
            <th className={styles.name}><Text>{name}</Text></th>
            <td className={styles.count}><Text>{new Intl.NumberFormat("en-US").format(count)}</Text></td>
            <td className={styles.percent}><Text isMuted>{total ? ((count / total) * 100).toFixed(1) : "0.0"}%</Text></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
