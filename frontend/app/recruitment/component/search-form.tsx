"use client";

import { useState } from "react";
import styles from "./SearchForm.module.css";

interface SearchFormProps {
  onSearch: (id: string, type: 'requisition' | 'template') => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [searchId, setSearchId] = useState("");
  const [searchType, setSearchType] = useState<'requisition' | 'template'>('requisition');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      onSearch(searchId.trim(), searchType);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={styles.searchForm}
    >
      <div className={styles.formGroup}>
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as 'requisition' | 'template')}
          className={styles.select}
        >
          <option value="requisition">Requisition</option>
          <option value="template">Template</option>
        </select>

        <input
          type="text"
          id="searchId"
          name="searchId"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder={`Search by ${searchType} ID...`}
          className={styles.input}
        />

        <button 
          type="submit" 
          className={styles.button}
        >
          🔍 Search
        </button>
      </div>
    </form>
  );
}