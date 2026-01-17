import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { motion } from "motion/react";
import { MotionFloat } from "@/components/motion/motion-components";
import { Button } from "@/components/ui/button";
import { Highlight } from "@/components/ui/highlight";
import { bounce } from "@/lib/animation-variants";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";

/*
  [clip-path:polygon(0_0,100%_0,100%_70%,50%_85%,0%_70%)]
  Sudut = 85%
  Horizontal position = 50%
  Tinggi garis = 70%
*/

export function Hero() {
  return (
    <section className="relative mx-auto flex w-full flex-col items-center justify-start overflow-hidden bg-background pt-20 [clip-path:polygon(0_0,100%_0,100%_85%,50%_100%,0%_85%)] *:max-w-5xl">
      <div className="container mx-auto flex max-w-5xl shrink-0 flex-col items-center px-4 pt-8 md:pt-20">
        <div className="flex flex-col items-center gap-3 text-center md:gap-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl"
          >
            Rumah Baru untuk{" "}
            <Highlight variant="darkBlue" weight={"bold"}>
              Persiapan UTBK-mu,
            </Highlight>
            <Highlight variant="darkBlue" weight={"bold"}>
              Satu Tempat
            </Highlight>{" "}
            untuk{" "}
            <Highlight variant="darkBlue" weight={"bold"}>
              Semua
            </Highlight>{" "}
            Targetmu!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-sm sm:text-base"
          >
            Nikmati ekosistem lengkap dari materi hingga simulasi ujian di satu tempat. <br />
            Kamu fokus belajar biar kami yang atur sistemnya.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex w-full flex-wrap items-center justify-center gap-2 *:max-sm:text-xs"
          >
            <motion.div variants={bounce} whileHover="whileHover">
              <Button asChild size="sm" className="flex-1 px-3 font-semibold sm:w-auto sm:flex-initial">
                <Link to="/login">
                  Mulai Belajar Sekarang
                  <ArrowRightIcon weight="bold" />
                </Link>
              </Button>
            </motion.div>
            <motion.div variants={bounce} whileHover="whileHover">
              <Button variant="outline" size="sm" className="flex-1 px-3 font-semibold sm:w-auto sm:flex-initial">
                <Link to="/dashboard">Cara Kerjanya</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <MotionFloat delay={0.3}>
        <Image src="/images/home/Hero Image.png" alt="Hero Illustration" layout="fullWidth" className="" />
      </MotionFloat>
    </section>
  );
}
