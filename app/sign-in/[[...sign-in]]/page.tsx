import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl",
            headerTitle: "text-white",
            headerSubtitle: "text-white/50",
            socialButtonsBlockButton:
              "bg-white/5 border-white/10 text-white hover:bg-white/10",
            socialButtonsBlockButtonText: "text-white",
            dividerLine: "bg-white/10",
            dividerText: "text-white/50",
            formFieldLabel: "text-white/70",
            formFieldInput:
              "bg-white/5 border-white/10 text-white placeholder:text-white/30",
            formButtonPrimary:
              "bg-white text-black hover:bg-white/90",
            footerActionLink: "text-white hover:text-white/80",
            identityPreviewText: "text-white",
            identityPreviewEditButton: "text-white/50 hover:text-white",
          },
        }}
      />
    </div>
  );
}
