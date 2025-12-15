export const PollIllustration = () => {
    return (
        <div
            aria-hidden
            className="relative w-3/4 select-none">
            <div className="relative w-full space-y-2 py-4">
                <div className="absolute inset-y-0 left-0 w-px bg-[length:1px_4px] bg-repeat-y opacity-15 [background-image:linear-gradient(180deg,var(--color-foreground)_1px,transparent_1px)]"></div>

                <div className="pl-5">
                    <div className="text-foreground before:border-muted-foreground before:bg-background before:ring-background relative mt-0.5 inline-flex items-center gap-2 text-sm font-medium before:absolute before:inset-y-0 before:-left-[22px] before:my-auto before:size-[5px] before:rounded-full before:border before:ring">
                        <div className="text-muted-foreground text-xs">06 AM</div>
                        Poll Created
                    </div>
                </div>
                <div className="border-border-illustration relative -mx-5 flex rounded-xl border bg-white/5 p-2 text-xs shadow-md backdrop-blur">
                    <div className="before:border-primary before:bg-background before:ring-background relative ml-7 mt-0.5 inline-flex items-center gap-2 text-sm font-medium before:absolute before:inset-y-0 before:-left-[19px] before:my-auto before:size-[5px] before:rounded-full before:border before:ring">
                        <div className="flex items-center -space-x-2">
                            {[
                                { src: 'https://avatars.githubusercontent.com/u/47919550?v=4', alt: 'Méschac Irung' },
                                { src: 'https://avatars.githubusercontent.com/u/31113941?v=4', alt: 'Bernard Ngandu' },
                            ].map((avatar, index) => (
                                <div
                                    key={index}
                                    className="bg-illustration border-border-illustration size-6 rounded-full border p-0.5 shadow shadow-zinc-950/5 *:rounded-full">
                                    <img
                                        src={avatar.src}
                                        className="aspect-square rounded-[calc(var(--avatar-radius)-2px)] object-cover"
                                        alt={avatar.alt}
                                        width="460"
                                        height="460"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                            ))}
                        </div>
                        +50 Users voted
                    </div>
                </div>
                <div className="pl-5">
                    <div className="text-foreground before:border-muted-foreground before:bg-background before:ring-background relative mt-0.5 inline-flex items-center gap-2 text-sm font-medium before:absolute before:inset-y-0 before:-left-[22px] before:my-auto before:size-[5px] before:rounded-full before:border before:ring">
                        <div className="text-muted-foreground text-xs">01 PM</div>
                        Poll Closed
                    </div>
                </div>
            </div>
        </div>
    )
}