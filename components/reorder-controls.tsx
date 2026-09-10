export function ReorderControls({
  upAction,
  downAction,
  canUp,
  canDown,
  name,
}: {
  upAction: (formData: FormData) => void | Promise<void>;
  downAction: (formData: FormData) => void | Promise<void>;
  canUp: boolean;
  canDown: boolean;
  name: string;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <form action={upAction}>
        <button
          type="submit"
          className="header-chip disabled:pointer-events-none disabled:opacity-40"
          disabled={!canUp}
          aria-label={`Move ${name} up`}
        >
          <Chevron dir="up" />
        </button>
      </form>
      <form action={downAction}>
        <button
          type="submit"
          className="header-chip disabled:pointer-events-none disabled:opacity-40"
          disabled={!canDown}
          aria-label={`Move ${name} down`}
        >
          <Chevron dir="down" />
        </button>
      </form>
    </div>
  );
}

function Chevron({ dir }: { dir: "up" | "down" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d={dir === "up" ? "M4 10L8 6l4 4" : "M4 6l4 4 4-4"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
