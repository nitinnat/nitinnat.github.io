interface PhotoHeroProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export function PhotoHero({
  title,
  subtitle,
  imageUrl,
  imageAlt,
}: PhotoHeroProps) {
  const hasImage = Boolean(imageUrl);

  return (
    <section className="relative w-full h-[60vh] min-h-[320px] max-h-[720px]">
      {hasImage ? (
        <>
          <img
            src={imageUrl}
            alt={imageAlt || ""}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/60"
            aria-hidden
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-muted" aria-hidden />
      )}
      <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
        <div className={hasImage ? "text-white" : "text-foreground"}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p
              className={
                hasImage
                  ? "mt-4 text-sm sm:text-base text-white/80"
                  : "mt-4 text-sm sm:text-base text-muted-foreground"
              }
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
