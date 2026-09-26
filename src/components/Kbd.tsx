export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-[4px] border border-line-2 px-1 font-sans text-[11px] font-medium leading-none text-fg-2">
      {children}
    </kbd>
  );
}
