import { useRef } from "react";
import { site } from "./content";
import { CopyEmail } from "./components/CopyEmail";
import { Inspector } from "./components/Inspector";
import { LabGrid } from "./components/Lab";
import { ExperienceList, LinkRow, WorkList, WritingList } from "./components/Lists";
import { Avatar } from "./components/Avatar";
import { LocalTime } from "./components/LocalTime";
import { Rulers } from "./components/Rulers";
import { Reveal, Rich, Section } from "./components/Section";
import { ThemeToggle } from "./components/ThemeToggle";
import { useFinePointer, useMediaQuery } from "./lib/hooks";
import { useMeasureTracking } from "./lib/measure";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export default function App() {
  const columnRef = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const wide = useMediaQuery("(min-width: 768px)");
  const tools = fine && wide; // rulers + inspector are a mouse-and-keyboard thing
  useMeasureTracking(tools);

  return (
    <>
      {tools && <Rulers originRef={columnRef} />}
      {tools && <Inspector columnRef={columnRef} />}

      <main className="px-5 pb-16 pt-16 md:px-10 md:pb-24 md:pt-32">
        <div ref={columnRef} className="relative mx-auto w-full max-w-[640px]">
          <header className="relative grid grid-cols-1 gap-5 md:grid-cols-[128px_minmax(0,1fr)] md:items-center md:gap-x-8">
            <Avatar width={site.avatar.width} alt={site.avatar.alt} />
            <Reveal delay={0.25} className="flex flex-col">
              <h1 data-measure="text" className="w-fit font-medium text-fg">
                {site.name}
              </h1>
              <p data-measure="text" className="w-fit text-fg-2">
                {site.role}
              </p>
              <p className="mt-1 text-[13px] leading-5 text-fg-3">
                <LocalTime timeZone={site.location.timeZone} tz={site.location.tz} label={site.location.label} />
              </p>
            </Reveal>
            <div className="absolute right-0 top-0">
              <ThemeToggle />
            </div>
          </header>

          <div className="mt-16 flex flex-col gap-14 md:mt-20 md:gap-16">
            <Section label="Now" delay={0.45}>
              <div className="space-y-3 text-fg-2">
                {site.intro.map((p) => (
                  <p key={p} data-measure="text">
                    <Rich text={p} />
                  </p>
                ))}
              </div>
            </Section>

            <Section label="Work" delay={0.55}>
              <WorkList items={site.work} columnRef={columnRef} />
            </Section>

            <Section label="Lab" align="start">
              <LabGrid />
            </Section>

            <Section label="Writing">
              <WritingList items={site.writing} />
            </Section>

            <Section label="Experience">
              <ExperienceList items={site.experience} />
            </Section>

            <Section label="Contact">
              <div className="space-y-2">
                <CopyEmail email={site.email} />
                <LinkRow links={site.links} />
              </div>
            </Section>
          </div>

          <footer className="mt-24 flex flex-col gap-2 border-t border-line pt-5 text-[13px] leading-5 text-fg-3 md:flex-row md:items-center md:justify-between">
            <span>
              © {new Date().getFullYear()} {site.name} · Updated {site.updated}
            </span>
            {tools && (
              <span className="flex items-center gap-1.5">
                Hold <Kbd>{isMac ? "⌥" : "Alt"}</Kbd> or press <Kbd>M</Kbd> to measure
              </span>
            )}
          </footer>
        </div>
      </main>
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-[4px] border border-line-2 px-1 font-sans text-[11px] font-medium leading-none text-fg-2">
      {children}
    </kbd>
  );
}
