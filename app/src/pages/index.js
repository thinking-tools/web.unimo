import Head from 'next/head';
import Logo from '@/components/logo';
import { useEffect, useRef, useState } from 'react';
import { Inter } from '@next/font/google';
import styles from '@/styles/Home.module.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

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
            draw();
        } else {
            animate = false;
        }
    };

    useEffect(() => {
        reqAnimFrame =
            window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame;
        canvas = document.getElementById('starField');
        c = canvas.getContext('2d');
        canvas.width = window.innerWidth; //screen width
        canvas.height = window.innerHeight; //screem height
        animate = true;
        let speed = 0.004;
        for (let i = 0; i < 120; i++) stars.push(new Star(canvas, c, speed));
        c.fillStyle = 'rgba(0, 0, 0, 0.1)';
        c.strokeStyle = '#cfaeef'; // #cfaeef
        c.translate(canvas.width / 2, canvas.height / 2);
        document.addEventListener('visibilitychange', onVisibilityChange);
        draw();
        (async () => {})();
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
            <div className={styles.gradientOverlay}></div>
            <main className={styles.main}>
                <section className={styles.jumboSection}>
                    <div>
                        <Logo />
                    </div>
                    <div className={styles.center}>
                        <h1 className={styles.headline + ' ' + inter.className}>
                            All your devices.
                            <br />
                            One magic experience.
                        </h1>
                    </div>
                    {/* <div className={styles.subline + ' ' + inter.className}>
                    <p>Follow us on Twitter, Github or subscribe to be the first.</p>
                </div> */}

                    <div className={styles.grid}>
                        <div className={styles.card}>
                            <h2 className={inter.className}>Connected</h2>
                            <p className={inter.className}>Share your experience with your friends and family. No more silos.</p>
                        </div>

                        <div className={styles.card}>
                            <h2 className={inter.className}>Real-time sync</h2>
                            <p className={inter.className}>
                                Effortlessly stay in sync across all your devices and keep your workflow on track.
                            </p>
                        </div>

                        <div className={styles.card}>
                            <h2 className={inter.className}>Private</h2>
                            <p className={inter.className}>Privacy and freedom come first without dopamine traps. Keep your data yours.</p>
                        </div>

                        <div className={styles.card}>
                            <h2 className={inter.className}>Everywhere</h2>
                            <p className={inter.className}>Everywhere you go, always with you. Make the magic work for you.</p>
                        </div>
                    </div>
                </section>
                {/* <section className={styles.subscribeSection}>
                    <div>
                        <h2 className={inter.className}>
                            Despite the ways internet use and devices has evolved, the operating systems has remained very boring.
                            <br />
                            <br />
                            We’re building an entirely new way to live, work and connect. Enabling new seamless experience across your
                            digital life.
                        </h2>
                    </div>
                </section> */}
            </main>

            {/* <footer>Made by Radicals © 2023</footer> */}
        </>
    );
}
