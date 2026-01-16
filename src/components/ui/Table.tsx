import { type ReactNode } from "react";

type TableProps = {
  headers: string[];
  rows: ReactNode[][];
  ariaLabel: string;
};

export const Table = ({ headers, rows, ariaLabel }: TableProps) => {
  return (
    <div className="table" role="region" aria-label={ariaLabel}>
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="table__empty">
                No records available
              </td>
            </tr>
          )}
          {rows.map((row, index) => (
            <tr key={`row-${index}`}>
              {row.map((cell, cellIndex) => (
                <td key={`cell-${index}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
