import Head from 'next/head';
import Image from 'next/image';
import { Inter } from '@next/font/google';
import styles from '@/styles/Home.module.css';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
    return (
        <>
            <Head>
                <title>unimo.app | Experience that sparks joy.</title>
                <meta name='description' content='unimo.app | Experience that sparks joy.' />
                <meta name='viewport' content='width=device-width, initial-scale=1' />
                <link rel='icon' href='/favicon.ico' />
            </Head>
            <main className={styles.main}>
                <div className={styles.center}>
                    {/* <div>
                        <Image className={styles.logo} src='/next.svg' alt='Next.js Logo' width={180} height={37} priority />
                    </div> */}

                    <h1 className={styles.headline + ' ' + inter.className}>
                        Experience that sparks joy.
                        <br />
                        Beyond your device universe.
                    </h1>
                </div>

                <div className={styles.grid}>
                    <div className={styles.card}>
                        <h2 className={inter.className}>Humane</h2>
                        <p className={inter.className}>
                            Providing real values in simple ways. No more clutter. Making computers finally bearable and fun.
                        </p>
                    </div>

                    <div className={styles.card}>
                        <h2 className={inter.className}>Private</h2>
                        <p className={inter.className}>
                            Privacy and freedom come first without dopamine traps and dark patterns. No ads, no tracking, zero knowledge.
                        </p>
                    </div>

                    <div className={styles.card}>
                        <h2 className={inter.className}>Everywhere</h2>
                        <p className={inter.className}>
                            For every platform and device you own. One seamless experience. Always accessible.
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
