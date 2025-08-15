import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useRouter } from "next/router";
import UserLayout from "@/layout/UserLayout";
import React from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const router = useRouter();

  const features = [
    {
      title: "Authentic Connections",
      description:
        "No vanity metrics. Just real people and meaningful interactions.",
      icon: "/globe.svg",
    },
    {
      title: "Noise-Free Feed",
      description: "Curated updates that matter to your growth & goals.",
      icon: "/window.svg",
    },
    {
      title: "Private & Secure",
      description:
        "Your data stays yours. Transparent & privacy‑first approach.",
      icon: "/file.svg",
    },
  ];

  return (
    <UserLayout>
      <Head>
        <title>Pro Connect | Home</title>
        <meta
          name="description"
          content="Pro Connect – A true social platform focused on authentic stories and meaningful professional connections."
        />
      </Head>
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.hero__text}>
            <h1 id="hero-heading" className={styles.gradientTitle}>
              Connect with friends without Exaggeration
            </h1>
            <p className={styles.subtitle}>
              A true social platform – authentic stories, no bluffs.
            </p>
            <div className={styles.ctaGroup}>
              <button
                className={styles.primaryCta}
                onClick={() => router.push("/login")}
                aria-label="Join Pro Connect now"
              >
                Join Now
              </button>
              <button
                className={styles.secondaryCta}
                onClick={() => router.push("/discover")}
                aria-label="Explore the discover page"
              >
                Explore
              </button>
            </div>
          </div>
          <div className={styles.hero__media}>
            <div className={styles.heroImageWrapper}>
              <Image
                src="/images/home_connection.png"
                alt="People connecting in a network"
                width={640}
                height={520}
                priority
                className={styles.heroImage}
              />
              <div className={styles.blurOrb} aria-hidden />
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          className={styles.featuresSection}
          aria-label="Platform highlights"
        >
          <div className={styles.featuresGrid}>
            {features.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIconWrapper}>
                  <Image
                    src={f.icon}
                    alt=""
                    width={36}
                    height={36}
                    aria-hidden
                  />
                </div>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom subtle callout */}
        <section className={styles.bottomCallout}>
          <p>
            Building for authenticity. <span>Be an early contributor.</span>
          </p>
          <button
            className={styles.outlineCta}
            onClick={() => router.push("/login")}
            aria-label="Create an account"
          >
            Create Account
          </button>
        </section>
      </div>
    </UserLayout>
  );
}
