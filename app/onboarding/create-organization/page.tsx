'use client'

import { CreateOrganization } from "@clerk/nextjs"

export default function CreateOrganizationPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4">
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-semibold text-white">Set up your organization</h1>
                <p className="mt-2 text-white/50">
                    Create your company workspace to start finding leads
                </p>
            </div>
            <CreateOrganization
                afterCreateOrganizationUrl="/onboarding"
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl",
                        headerTitle: "text-white",
                        headerSubtitle: "text-white/50",
                        formFieldLabel: "text-white/70",
                        formFieldInput:
                            "bg-white/5 border-white/10 text-white placeholder:text-white/30",
                        formButtonPrimary:
                            "bg-white text-black hover:bg-white/90",
                        footerActionLink: "text-white hover:text-white/80",
                    },
                }}
            />
        </div>
    )
}
