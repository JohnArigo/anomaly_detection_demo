import { type ChangeEvent } from "react";

export type PersonOption = {
  id: string;
  name: string;
};

type PersonSelectProps = {
  value: string;
  options: PersonOption[];
  onChange: (value: string) => void;
};

export const PersonSelect = ({
  value,
  options,
  onChange,
}: PersonSelectProps) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <label className="select">
      <span className="sr-only">Select person</span>
      <select value={value} onChange={handleChange} aria-label="Select person">
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
};
