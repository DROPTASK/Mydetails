import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { NAV } from "../lib/nav";
import { ProfileSwap } from "../components/ProfileSwap";
import { SocialLinks } from "../components/SocialLinks";
import { sfxClick } from "../lib/sound";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export function Home() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-md mx-auto flex flex-col items-center gap-7 pt-6"
    >
      <motion.div variants={item}>
        <ProfileSwap />
      </motion.div>

      <motion.div variants={item}>
        <SocialLinks />
      </motion.div>

      <motion.div variants={item} className="w-full flex flex-col gap-2.5">
        {NAV.filter((n) => n.to !== "/").map((n) => (
          <NavLink key={n.to} to={n.to} onClick={sfxClick} className="link-pill">
            <span>{n.label}</span>
            <ChevronRight className="w-4 h-4 opacity-40" strokeWidth={2.4} />
          </NavLink>
        ))}
      </motion.div>
    </motion.div>
  );
}
