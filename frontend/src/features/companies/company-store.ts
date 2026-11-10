import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CompanyState {
  selectedCompanyId: string | null;
  selectCompany: (companyId: string | null) => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      selectedCompanyId: null,
      selectCompany: (selectedCompanyId) => set({ selectedCompanyId }),
    }),
    {
      name: 'interview-preparation-company',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedCompanyId: state.selectedCompanyId,
      }),
    },
  ),
);
