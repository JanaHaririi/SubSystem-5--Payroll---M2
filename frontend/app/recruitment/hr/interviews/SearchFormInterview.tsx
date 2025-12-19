"use client";

import { useState } from "react";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
interface SearchFormInterviewProps {
  onSearch: (id: string, type: 'interview') => void;
}

export default function SearchFormInterview({ onSearch }: SearchFormInterviewProps) {
  const [searchId, setSearchId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      onSearch(searchId.trim(), 'interview');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={styles.searchForm}
    >
      <div className={styles.formGroup}>
        <input
          type="text"
          id="searchId"
          name="searchId"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder="Search by Interview ID..."
          className={styles.input}
        />

        <button 
          type="submit" 
          className={styles.button}
        >
          🔍 Search Interview
        </button>
      </div>
    </form>
  );
}