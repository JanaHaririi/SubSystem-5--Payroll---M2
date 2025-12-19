"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import styles from "./generic-form.module.css";

export type FieldType = 
  | "text" 
  | "email" 
  | "number" 
  | "textarea" 
  | "radio" 
  | "select" 
  | "date"
  | "password";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[]; // For radio and select
  multiple?: boolean; // For multi-select
}

interface GenericFormProps {
  fields: FieldConfig[];
  onSubmit: (data: Record<string, any>) => void;
  submitButtonText?: string;
  showResetButton?: boolean;
  initialValues?: Record<string, any>;
}

const GenericForm: React.FC<GenericFormProps> = ({
  fields,
  onSubmit,
  submitButtonText = "Submit",
  showResetButton = true,
  initialValues = {},
}) => {
  // Initialize form data with initial values or empty strings
  const getInitialData = () => {
    const data: Record<string, any> = {};
    fields.forEach((field) => {
      if (initialValues[field.name] !== undefined) {
        data[field.name] = initialValues[field.name];
      } else if (field.type === "select" && field.multiple) {
        data[field.name] = [];
      } else {
        data[field.name] = "";
      }
    });
    return data;
  };

  const [formData, setFormData] = useState<Record<string, any>>(getInitialData());

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "select-multiple") {
      const target = e.target as HTMLSelectElement;
      const selectedOptions = Array.from(target.selectedOptions).map(
        (option) => option.value
      );
      setFormData({ ...formData, [name]: selectedOptions });
    } else if (type === "radio") {
      const target = e.target as HTMLInputElement;
      if (target.checked) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleReset = () => {
    setFormData(getInitialData());
  };

  const renderField = (field: FieldConfig) => {
    switch (field.type) {
      case "textarea":
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            className={styles.input}
            rows={4}
          />
        );

      case "select":
        return (
          <select
            id={field.name}
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            multiple={field.multiple}
            required={field.required}
            className={styles.select}
          >
            {!field.required && !field.multiple && (
              <option value="">Select an option</option>
            )}
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className={styles.radioGroup}>
            {field.options?.map((option) => (
              <label key={option.value} className={styles.radioLabel}>
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={formData[field.name] === option.value}
                  onChange={handleChange}
                  required={field.required}
                  className={styles.radio}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            className={styles.input}
          />
        );
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.name} className={styles.formGroup}>
          <label htmlFor={field.name} className={styles.label}>
            {field.label}
            {field.required && <span className={styles.required}>*</span>}
          </label>
          {renderField(field)}
        </div>
      ))}

      <div className={styles.buttonGroup}>
        <button type="submit" className={styles.button}>
          {submitButtonText}
        </button>
        {showResetButton && (
          <button type="button" onClick={handleReset} className={styles.buttonSecondary}>
            Reset
          </button>
        )}
      </div>
    </form>
  );
};

export default GenericForm;