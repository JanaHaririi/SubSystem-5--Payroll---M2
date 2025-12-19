"use client";

import { useState } from "react";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";
interface SearchFormOfferProps {
  onSearch: (id: string, type: 'offer' | 'contract') => void;
}

export default function SearchFormOffer({ onSearch }: SearchFormOfferProps) {
  const [searchId, setSearchId] = useState("");
  const [searchType, setSearchType] = useState<'offer' | 'contract'>('offer');

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
          onChange={(e) => setSearchType(e.target.value as 'offer' | 'contract')}
          className={styles.select}
        >
          <option value="offer">Offer</option>
          <option value="contract">Contract</option>
        </select>

        <input
          type="text"
          id="searchId"
          name="searchId"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder={`Search by ${searchType === 'offer' ? 'Offer' : 'Contract'} ID...`}
          className={styles.input}
        />

        <button 
          type="submit" 
          className={styles.button}
        >
          🔍 Search {searchType === 'offer' ? 'Offer' : 'Contract'}
        </button>
      </div>
    </form>
  );
}