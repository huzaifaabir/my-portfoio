import { useEffect } from 'react';

// Sets the browser tab title for a page
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Huzaifa Abir` : 'Huzaifa Abir | Graphic Designer';
  }, [title]);
}
