import { FiZap } from "react-icons/fi";

const sizes = {
  sm: { box: "size-12", inner: "size-8", icon: "size-4", dot: "size-1.5", orbit: "-inset-2" },
  md: { box: "size-20", inner: "size-12", icon: "size-6", dot: "size-2.5", orbit: "-inset-3" },
  lg: { box: "size-28", inner: "size-16", icon: "size-8", dot: "size-3", orbit: "-inset-4" },
};

function LogoIcon({ icon: Icon = FiZap, size = "md", className = "" }) {
  const s = sizes[size] || sizes.md;

  return (
    <div className={`relative ${s.box} ${className}`}>
      {/* pulse ring */}
      <span className="absolute inset-0 animate-ping rounded-[28%] bg-primary/20 [animation-duration:3s] motion-reduce:animate-none" />

      {/* rotating gradient ring */}
      <span className="absolute -inset-0 rounded-[30%] blur-[1px]  animate-spin-slow bg-[conic-gradient(from_0deg,var(--ball-1),var(--ball-2),var(--ball-3),var(--ball-1))]" />

      {/* body */}
      <div className="relative grid size-full place-items-center rounded-[28%] bg-bg-surface shadow-xl shadow-primary/20">
        <div
          className={`grid ${s.inner} place-items-center rounded-[30%] bg-linear-to-br from-primary to-bg-ball-2 text-primary-inverse`}
        >
          <Icon className={s.icon} />
        </div>
      </div>

      {/* orbiting dot */}
      <div
        className={`absolute ${s.orbit} animate-spin-slow [animation-duration:5s] motion-reduce:animate-none`}
      >
        <span
          className={`absolute top-0 left-1/2 ${s.dot} -translate-x-1/2 rounded-full bg-ball-2 shadow-[0_0_12px_var(--ball-2)]`}
        />
      </div>
    </div>
  );
}

export default LogoIcon;