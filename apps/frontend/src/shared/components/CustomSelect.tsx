import React from "react";
import Select, { Props as SelectProps } from "react-select";

export interface OptionType {
  value: string;
  label: string;
}

export interface CustomSelectProps extends Omit<SelectProps<OptionType, false>, "onChange" | "options" | "value"> {
  name?: string;
  value?: string;
  onChange?: (e: { target: { name: string; value: string } }) => void;
  options: OptionType[];
  placeholder?: string;
}

export function CustomSelect({ name, value, onChange, options, placeholder, ...rest }: CustomSelectProps) {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  const handleChange = (selected: OptionType | null) => {
    if (onChange) {
      onChange({
        target: {
          name: name || "",
          value: selected ? selected.value : "",
        },
      });
    }
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: "42px",
      borderRadius: "8px",
      border: state.isFocused ? "1px solid #3b82f6" : "1px solid #d1d5db",
      boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
      "&:hover": {
        border: state.isFocused ? "1px solid #3b82f6" : "1px solid #9ca3af",
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999,
      borderRadius: "8px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#eff6ff" : "white",
      color: state.isSelected ? "white" : "#1f2937",
      "&:active": {
        backgroundColor: "#2563eb",
        color: "white"
      }
    }),
  };

  return (
    <Select
      name={name}
      value={selectedOption}
      onChange={handleChange}
      options={options}
      placeholder={placeholder || "-- Select --"}
      maxMenuHeight={250}
      styles={customStyles}
      {...rest}
    />
  );
}
