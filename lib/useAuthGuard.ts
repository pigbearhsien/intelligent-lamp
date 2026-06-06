'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuthGuard(): { studentId: string | null; checked: boolean } {
  const router = useRouter();
  const [state, setState] = useState<{ studentId: string | null; checked: boolean }>({
    studentId: null,
    checked: false,
  });

  useEffect(() => {
    const sid = localStorage.getItem('currentUser');
    if (!sid) {
      router.push('/login');
      return;
    }
    setState({ studentId: sid, checked: true });
  }, [router]);

  return state;
}
