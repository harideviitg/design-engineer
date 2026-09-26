import { site } from "../content";
import { Avatar } from "../components/Avatar";
import { CopyEmail } from "../components/CopyEmail";
import { LabGrid } from "../components/Lab";
import { ExperienceList, LinkRow, NotesList, WorkList } from "../components/Lists";
import { LocalTime } from "../components/LocalTime";
import { Reveal, Rich, Section } from "../components/Section";
import { ThemeToggle } from "../components/ThemeToggle";
import { sortedNotes } from "../notes";

export function Home({ columnRef }: { columnRef: React.RefObject<HTMLElement | null> }) {
  return (
    <>
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

        <Section label="Notes">
          <NotesList items={sortedNotes} />
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
    </>
  );
}
