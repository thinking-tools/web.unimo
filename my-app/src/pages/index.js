import Head from 'next/head';
import Image from 'next/image';
import { useLayoutEffect } from 'react';
import { Inter } from '@next/font/google';
import styles from '@/styles/Home.module.css';

const inter = Inter({ subsets: ['latin'] });

class Star {
    constructor(canvas, c, speed) {
        //initializing
        this.canvas = canvas;
        this.c = c;
        this.speed = speed;
        this.x = Math.random() * this.canvas.width - this.canvas.width / 2; //random x
        this.y = Math.random() * this.canvas.height - this.canvas.height / 2; //random y
        this.px, this.py;
        this.z = Math.random() * 4; //random z
    }

    update() {
        //stores previous x, y and z and generates new coordinates
        this.px = this.x;
        this.py = this.y;
        this.z += this.speed;
        this.x += this.x * (this.speed * 0.2) * this.z;
        this.y += this.y * (this.speed * 0.2) * this.z;
        if (
            this.x > this.canvas.width / 2 + 50 ||
            this.x < -this.canvas.width / 2 - 50 ||
            this.y > this.canvas.height / 2 + 50 ||
            this.y < -this.canvas.height / 2 - 50
        ) {
            this.x = Math.random() * this.canvas.width - this.canvas.width / 2;
            this.y = Math.random() * this.canvas.height - this.canvas.height / 2;
            this.px = this.x;
            this.py = this.y;
            this.z = 0;
        }
    }
    show() {
        this.c.lineWidth = this.z;
        this.c.beginPath();
        this.c.moveTo(this.x, this.y);
        this.c.lineTo(this.px, this.py);
        this.c.stroke();
    }
}

export default function Home() {
    let c = null;
    let canvas = null;
    let stars = [];
    let reqAnimFrame = null;
    let animate = true;

    const draw = () => {
        //create rectangle
        c.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        for (let s of stars) {
            s.update();
            s.show();
        }
        if (animate) reqAnimFrame(draw);
    };

    const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            animate = true;
            console.warn('visible');
        } else {
            animate = false;
            console.warn('hidden');
        }
    };

    useLayoutEffect(() => {
        reqAnimFrame =
            window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame;
        canvas = document.getElementById('starField');
        c = canvas.getContext('2d');
        canvas.width = window.innerWidth; //screen width
        canvas.height = window.innerHeight; //screem height
        let speed = 0.004;
        for (let i = 0; i < 120; i++) stars.push(new Star(canvas, c, speed));
        c.fillStyle = 'rgba(0, 0, 0, 0.1)';
        c.strokeStyle = '#cfaeef';
        c.translate(canvas.width / 2, canvas.height / 2);
        document.addEventListener('visibilitychange', onVisibilityChange);
        draw();
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, []);

    return (
        <>
            <Head>
                <title>unimo.app | Experience that sparks joy.</title>
                <meta name='description' content='unimo.app | Experience that sparks joy.' />
                <meta name='viewport' content='width=device-width, initial-scale=1' />
                <link rel='icon' href='/favicon.ico' />
            </Head>
            <canvas id={'starField'} className={styles.starField}></canvas>
            <main className={styles.main}>
                <div>
                    <Image className={styles.logo} src={'static/unimo.svg'} alt='Next.js Logo' width={80} height={37} priority />
                </div>
                <div className={styles.center}>
                    <h1 className={styles.headline + ' ' + inter.className}>
                        All your devices.
                        <br />
                        One magic experience.
                    </h1>
                </div>

                <div className={styles.grid}>
                    <div className={styles.card}>
                        <h2 className={inter.className}>Synced</h2>
                        <p className={inter.className}>
                            Privacy and freedom come first without dopamine traps and dark patterns. No ads, no tracking, zero knowledge.
                        </p>
                    </div>

                    <div className={styles.card}>
                        <h2 className={inter.className}>Shared</h2>
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
