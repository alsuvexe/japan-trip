import { createContext, useContext, type ReactNode } from 'react';

const ReadOnlyContext = createContext(false);

export function ReadOnlyProvider({ children }: { children: ReactNode }) {
  const params = new URLSearchParams(window.location.search);
  const isReadOnly = params.get('readonly') === 'true' || params.get('mode') === 'view';

  return (
    <ReadOnlyContext.Provider value={isReadOnly}>
      {children}
    </ReadOnlyContext.Provider>
  );
}

export function useReadOnly() {
  return useContext(ReadOnlyContext);
}
