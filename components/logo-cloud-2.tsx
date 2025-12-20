import { BeaconLogo as Beacon } from '@/components/ui/svgs/beaconLogo'
import { Hulu } from '@/components/ui/svgs/hulu'
import { Stripe } from '@/components/ui/svgs/stripe'
import { SupabaseWordmarkDark as Supabase } from '@/components/ui/svgs/supabaseWordmarkDark'
import { VercelWordmark as VercelFull } from '@/components/ui/svgs/vercelWordmark'
import { SpotifyWordmark as Spotify } from '@/components/ui/svgs/spotifyWordmark'
import { TailwindcssWordmark as TailwindCSS } from '@/components/ui/svgs/tailwindcssWordmark'

export function LogoCloud() {
    return (
        <div className="mx-auto max-w-5xl px-6">
            <div className="**:fill-foreground grid grid-cols-3 items-center gap-y-12 sm:grid-cols-4">
                <div className="flex h-full items-center justify-center px-2">
                    <Hulu
                        height={16}
                        width="auto"
                    />
                </div>

                <div className="flex items-center justify-center px-2">
                    <Spotify
                        height={22}
                        width="auto"
                    />
                </div>
                <div className="flex items-center justify-center px-2">
                    <Supabase
                        height={20}
                        width="auto"
                    />
                </div>
                <div className="flex items-center justify-center px-2">
                    <Beacon
                        height={16}
                        width="auto"
                    />
                </div>
                <div className="flex items-center justify-center px-2">
                    <VercelFull
                        height={16}
                        width="auto"
                    />
                </div>

                <div className="flex items-center justify-center px-2">
                    <Stripe
                        height={20}
                        width="auto"
                    />
                </div>
                <div className="flex items-center justify-center px-2">
                    <TailwindCSS
                        height={20}
                        width="auto"
                    />
                </div>
                <div className="flex items-center justify-center px-2">
                    <Stripe
                        height={20}
                        width="auto"
                    />
                </div>
            </div>
        </div>
    )
}