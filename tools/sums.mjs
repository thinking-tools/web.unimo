#!/usr/bin/env node
/**
 * The answers to the finale's sums, from the apps' own calculator.
 *
 *   node tools/sums.mjs "0.1 + 0.2" "86.40 + 15%"
 *
 * For each sum it prints what goes into that sum's `data-answers` in index.html: the answer the calculator gives
 * once so many characters of the sum are typed. The page shows the last answer always, and an answer on the way
 * only when it is a plain number and what is typed so far ends in a digit or a percent sign (the calculator also
 * answers "86." with "86"), so that is what is kept here. An answer that only repeats the one before it is left
 * out.
 *
 * The calculator is the desktop app's (libqalculate, built for the web), read from the app's folder next to this
 * one, so that folder has to be there with its packages installed. A sum is asked as the app asks it
 * (desktop-app/src/search/calc.ts): no answer for an error, or for an answer that is the question over again.
 * Money is converted at the rates the calculator carries with it, so those answers are of their day.
 */
import { readFileSync } from 'node:fs';

const dist = new URL('../../desktop-app/node_modules/libqalculate-lite-wasm/dist/', import.meta.url);
const { default: load } = await import(new URL('libqalculate.js', dist).href);
const calc = await load({ wasmBinary: readFileSync(new URL('libqalculate.wasm', dist)) });

const TIMEOUT_MS = 100;
const squeezed = text => text.replace(/\s/g, '');
const isPlainNumber = text => /^-?\d+(\.\d+)?$/.test(text);
const endsWhole = text => /[\d%]$/.test(text);

function answer(query) {
  if (!/\d/.test(query)) return undefined;
  const { result, messages } = calc.calculate(query, TIMEOUT_MS);
  if (messages.some(message => message.severity === 'error') || result === 'timed out') return undefined;
  return squeezed(result) === squeezed(query) ? undefined : result;
}

for (const sum of process.argv.slice(2)) {
  const letters = [...sum];
  const answers = {};
  let last;
  letters.forEach((_, i) => {
    const typed = letters.slice(0, i + 1).join('');
    const isWhole = i + 1 === letters.length;
    const found = answer(typed);
    const isShown = isWhole || (isPlainNumber(found ?? '') && endsWhole(typed));
    if (found === undefined || found === last || !isShown) return;
    answers[i + 1] = last = found;
  });
  console.log(`${sum}\n  data-answers='${JSON.stringify(answers)}'`);
}
