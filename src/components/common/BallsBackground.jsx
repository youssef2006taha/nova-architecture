const balls = [
  "-top-40 -left-32 size-[30rem] from-ball-1 to-bg-ball-1 opacity-40 animate-drift-a [animation-delay:-6s]",
  "-right-32 -bottom-40 size-[32rem] from-ball-2 to-bg-ball-2 opacity-35 animate-drift-b [animation-delay:-14s]",
  "top-1/4 right-1/4 size-72 from-ball-3 to-bg-ball-3 opacity-25 animate-drift-c [animation-delay:-3s]",
  "bottom-[20%] left-[18%] size-56 from-ball-2 to-bg-ball-1 opacity-20 animate-drift-c [animation-delay:-19s] [animation-direction:reverse]",
];

function BallsBackground({ grid = false, className = "" }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
    >
      {grid && (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--primary-light)_1px,transparent_1px),linear-gradient(to_bottom,var(--primary-light)_1px,transparent_1px)] bg-[size:56px_56px] opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      )}

      {balls.map((cls, i) => (
        <div
          key={i}
          className={`absolute rounded-full bg-linear-to-br blur-3xl will-change-transform motion-reduce:animate-none ${cls}`}
        />
      ))}
    </div>
  );
}

export default BallsBackground;