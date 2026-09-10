export function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      {open ? (
        <path
          d="M3.5 3.5l9 9M12.5 3.5l-9 9"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M3 5h10M3 8h10M3 11h10"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
