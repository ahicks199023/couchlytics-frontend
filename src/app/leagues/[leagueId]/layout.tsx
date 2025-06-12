// app/leagues/[leagueId]/layout.tsx

import LeagueLayout from '@/layouts/LeagueLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LeagueLayout>{children}</LeagueLayout>
}
