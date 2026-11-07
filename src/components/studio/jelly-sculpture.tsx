"use client";

import { motion } from "framer-motion";

const meshLines = [
  "M119 151 C254 196 526 62 645 106",
  "M95 184 C247 230 550 90 671 143",
  "M82 221 C240 268 560 126 681 180",
  "M77 260 C234 307 558 166 681 218",
  "M79 300 C226 346 545 206 673 256",
  "M88 340 C212 385 523 248 656 295",
  "M104 377 C199 419 493 291 633 333",
  "M128 412 C188 449 458 334 600 366",
  "M162 444 C183 476 411 375 558 394",
  "M192 127 C186 217 331 402 418 506",
  "M247 93 C238 192 350 395 457 521",
  "M306 73 C302 177 377 390 489 514",
  "M366 65 C373 172 409 376 516 495",
  "M426 66 C442 170 443 352 538 466",
  "M485 76 C511 174 484 325 555 430",
  "M542 91 C575 181 526 298 565 391",
];

export function JellySculpture() {
  return (
    <div className="hero-visual" aria-label="A floating liquid glass form" data-liquid-surface>
      <motion.svg
        className="hero-sculpture"
        viewBox="0 0 760 570"
        role="img"
        aria-label="A sculpted lavender glass loop"
        initial={{ opacity: 0, y: 16, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <defs>
          <linearGradient id="jelly-surface" x1="0" y1="0" x2=".86" y2="1">
            <stop stopColor="#fff" stopOpacity=".98" />
            <stop offset=".23" stopColor="#c8d1f8" stopOpacity=".88" />
            <stop offset=".48" stopColor="#8e9bdf" stopOpacity=".83" />
            <stop offset=".73" stopColor="#dbe2ff" stopOpacity=".94" />
            <stop offset="1" stopColor="#7582cb" stopOpacity=".78" />
          </linearGradient>
          <linearGradient id="jelly-highlight" x1=".05" y1="0" x2=".9" y2=".8">
            <stop stopColor="#fff" stopOpacity=".92" />
            <stop offset=".45" stopColor="#fff" stopOpacity=".08" />
            <stop offset=".72" stopColor="#fff" stopOpacity=".7" />
            <stop offset="1" stopColor="#fff" stopOpacity=".12" />
          </linearGradient>
          <radialGradient id="jelly-glow" cx=".3" cy=".2" r=".9">
            <stop stopColor="#fff" stopOpacity=".74" />
            <stop offset=".5" stopColor="#dce3ff" stopOpacity=".1" />
            <stop offset="1" stopColor="#6f7cc8" stopOpacity=".3" />
          </radialGradient>
          <filter id="jelly-blur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <clipPath id="jelly-band">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M136 347 C88 267 124 164 221 99 C318 34 464 45 562 105 C670 171 701 274 642 360 C589 438 535 496 458 514 C373 534 257 489 189 423 C165 401 148 376 136 347 Z M239 344 C219 301 237 245 286 211 C332 179 405 173 454 199 C507 228 527 270 499 308 C466 352 436 395 385 407 C330 421 265 390 239 344 Z"
            />
          </clipPath>
        </defs>

        <ellipse cx="380" cy="437" rx="207" ry="35" fill="#6370bd" opacity=".14" filter="url(#jelly-blur)" />
        <g className="hero-sculpture-float" transform="rotate(-6 380 286)">
          <path
            d="M136 347 C88 267 124 164 221 99 C318 34 464 45 562 105 C670 171 701 274 642 360 C589 438 535 496 458 514 C373 534 257 489 189 423 C165 401 148 376 136 347 Z M239 344 C219 301 237 245 286 211 C332 179 405 173 454 199 C507 228 527 270 499 308 C466 352 436 395 385 407 C330 421 265 390 239 344 Z"
            fill="url(#jelly-surface)"
            fillRule="evenodd"
            clipRule="evenodd"
            stroke="#fff"
            strokeOpacity=".74"
            strokeWidth="3"
          />
          <path
            d="M136 347 C88 267 124 164 221 99 C318 34 464 45 562 105 C670 171 701 274 642 360 C589 438 535 496 458 514 C373 534 257 489 189 423 C165 401 148 376 136 347 Z M239 344 C219 301 237 245 286 211 C332 179 405 173 454 199 C507 228 527 270 499 308 C466 352 436 395 385 407 C330 421 265 390 239 344 Z"
            fill="url(#jelly-glow)"
            fillRule="evenodd"
            clipRule="evenodd"
            opacity=".62"
          />
          <g clipPath="url(#jelly-band)" fill="none" stroke="#5362ad" strokeOpacity=".19" strokeWidth="1.2">
            {meshLines.map((line) => <path d={line} key={line} />)}
          </g>
          <path
            d="M145 335 C106 258 145 170 230 113 C319 53 449 59 544 115 C633 167 670 250 624 326 C574 409 515 468 448 483 C372 501 273 459 207 401 C177 374 158 352 145 335 Z"
            fill="none"
            stroke="url(#jelly-highlight)"
            strokeWidth="17"
            strokeLinecap="round"
            opacity=".8"
          />
          <path
            d="M176 153 C260 75 400 63 509 113"
            fill="none"
            stroke="#fff"
            strokeWidth="9"
            strokeLinecap="round"
            opacity=".68"
          />
          <path
            d="M198 406 C264 470 358 492 422 478"
            fill="none"
            stroke="#fff"
            strokeWidth="11"
            strokeLinecap="round"
            opacity=".88"
          />
        </g>
      </motion.svg>
      <div className="hero-visual-caption" aria-hidden="true">
        <span>CareerAI studio</span>
        <span>Study in motion · 01</span>
      </div>
    </div>
  );
}
