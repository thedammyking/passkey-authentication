import { HydrateClient } from "@/trpc/server";

export default async function GetStartedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <HydrateClient>
      <main className="flex h-screen w-full items-center justify-center pb-40 *:text-neutral-50">
        {children}
      </main>
    </HydrateClient>
  );
}
