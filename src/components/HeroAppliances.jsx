import React from 'react';

// SVG original embebido para mostrar la escena sin depender de una URL externa.
// Los detalles permanecen vectoriales y accesibles en cualquier tamaño.
const HeroAppliances = () => (
<svg className="evh-appliances-illustration" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 560" role="img" aria-labelledby="title desc">
<title id="title">Colección de electrodomésticos para el hogar</title>
<desc id="desc">Composición vectorial de refrigerador, lavadora, aire acondicionado, televisor, horno, lavavajillas, microondas, freidora, cafetera, aspiradora, licuadora, ventilador, portátil y pequeños aparatos.</desc>
<defs>
 <linearGradient id="bg" x2="1" y2="1"><stop stopColor="#eaf5ff"/><stop offset=".52" stopColor="#f7faff"/><stop offset="1" stopColor="#deecfa"/></linearGradient>
 <linearGradient id="metal" x2="1" y2=".35"><stop stopColor="#fff"/><stop offset=".48" stopColor="#e4ebf3"/><stop offset="1" stopColor="#bccbda"/></linearGradient>
 <linearGradient id="steel" x2="1" y2=".2"><stop stopColor="#d9e3ef"/><stop offset=".45" stopColor="#fff"/><stop offset="1" stopColor="#aab9ca"/></linearGradient>
 <linearGradient id="dark" x2="1" y2="1"><stop stopColor="#294866"/><stop offset="1" stopColor="#102b4b"/></linearGradient>
 <linearGradient id="screen" x2=".1" y2=".1" x2="1" y2="1"><stop stopColor="#216ab0"/><stop offset=".55" stopColor="#103355"/><stop offset="1" stopColor="#34a5c9"/></linearGradient>
 <linearGradient id="warm" x2="0" y2="0" x2="1" y2="1"><stop stopColor="#ffa94b"/><stop offset="1" stopColor="#e8741e"/></linearGradient>
 <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#18416b" floodOpacity=".16"/></filter>
 <filter id="blur"><feGaussianBlur stdDeviation="23"/></filter>
</defs>
<rect width="760" height="560" rx="30" fill="url(#bg)"/>
<ellipse cx="548" cy="120" rx="250" ry="145" fill="#83bbec" opacity=".16" filter="url(#blur)"/>
<circle cx="94" cy="90" r="145" fill="#ffd4a1" opacity=".19" filter="url(#blur)"/>
<path d="M22 428Q380 394 738 428" fill="none" stroke="#b6cce0" strokeWidth="2" opacity=".8"/>
<g stroke="#d0e0ee" strokeWidth="1.5" opacity=".7"><path d="M18 222H742M18 420H742"/></g>
<!-- Top collection -->
<g filter="url(#shadow)">
 <!-- refrigerator -->
 <g transform="translate(34 42)">
 <rect width="130" height="235" rx="17" fill="url(#steel)" stroke="#a3b6c9" strokeWidth="2"/>
 <path d="M0 112H130" stroke="#91a8bf" strokeWidth="4"/>
 <rect x="103" y="49" width="6" height="45" rx="3" fill="#718ba2"/><rect x="103" y="136" width="6" height="45" rx="3" fill="#718ba2"/>
 <rect x="12" y="14" width="51" height="10" rx="5" fill="#edf8ff" opacity=".8"/>
 <rect x="29" y="181" width="30" height="19" rx="5" fill="#d3e6f3" opacity=".7"/>
 </g>
 <!-- washer -->
 <g transform="translate(177 91)">
 <rect width="142" height="184" rx="17" fill="url(#metal)" stroke="#afc0cf" strokeWidth="2"/>
 <rect width="142" height="31" rx="15" fill="#d2e0ec"/><path d="M1 29H141" stroke="#a9bdcf"/>
 <circle cx="26" cy="16" r="8" fill="#e6f4fb" stroke="#93adc1" strokeWidth="2"/><rect x="73" y="12" width="32" height="8" rx="2" fill="#1c5d90"/>
 <circle cx="71" cy="106" r="57" fill="#a4bacb"/><circle cx="71" cy="106" r="49" fill="#eef6ff"/><circle cx="71" cy="106" r="39" fill="url(#screen)" stroke="#a3bccf" strokeWidth="4"/>
 <path d="M40 111q16-24 31 0t31-1" stroke="#70c9e6" strokeWidth="5" fill="none" opacity=".65"/>
 </g>
 <!-- television -->
 <g transform="translate(342 40)">
 <rect width="228" height="136" rx="11" fill="#122b48" stroke="#6b8196" strokeWidth="7"/>
 <rect x="11" y="11" width="206" height="112" rx="4" fill="url(#screen)"/>
 <path d="M12 98 91 43l53 37 74-49" stroke="#69cadd" strokeWidth="10" opacity=".5" fill="none"/>
 <path d="M112 136v16m-44 4h88" stroke="#4b6071" strokeWidth="8" strokeLinecap="round"/>
 </g>
 <!-- air conditioner -->
 <g transform="translate(580 55)">
 <rect width="153" height="62" rx="13" fill="url(#metal)" stroke="#aebfd0" strokeWidth="2"/>
 <path d="M13 41H141M26 49H129" stroke="#95b7d1" strokeWidth="3" strokeLinecap="round"/>
 <circle cx="126" cy="20" r="4" fill="#f28c28"/>
 </g>
</g>
<!-- Middle collection -->
<g filter="url(#shadow)">
 <!-- oven -->
 <g transform="translate(340 201)">
 <rect width="163" height="186" rx="13" fill="url(#steel)" stroke="#9cb1c3" strokeWidth="2"/>
 <rect x="8" y="10" width="147" height="32" rx="7" fill="#c5d7e4"/>
 <g fill="#56778f"><circle cx="25" cy="26" r="6"/><circle cx="48" cy="26" r="6"/><circle cx="72" cy="26" r="6"/></g>
 <rect x="15" y="53" width="132" height="120" rx="7" fill="url(#dark)"/><rect x="25" y="63" width="112" height="94" rx="4" fill="#28577e"/>
 <path d="M40 120h80M56 120v12h49v-12" stroke="#e89b57" strokeWidth="5" strokeLinecap="round"/>
 </g>
 <!-- microwave -->
 <g transform="translate(29 300)">
 <rect width="155" height="99" rx="13" fill="url(#steel)" stroke="#98acbf" strokeWidth="2"/>
 <rect x="11" y="13" width="107" height="72" rx="7" fill="url(#dark)" />
 <path d="M24 68 89 27" stroke="#78bbd3" strokeWidth="6" opacity=".5"/>
 <rect x="125" y="20" width="19" height="9" rx="2" fill="#1a547f"/>
 <g fill="#8ca6bb"><circle cx="134" cy="49" r="5"/><circle cx="134" cy="69" r="5"/></g>
 </g>
 <!-- dishwasher -->
 <g transform="translate(191 295)">
 <rect width="130" height="115" rx="12" fill="url(#metal)" stroke="#9bb4c8" strokeWidth="2"/>
 <rect width="130" height="26" rx="10" fill="#ccdae8"/><rect x="23" y="10" width="55" height="7" rx="3" fill="#6d94b3"/>
 <path d="M21 44H109M25 53H105" stroke="#b5c8d7" strokeWidth="3"/>
 <circle cx="65" cy="80" r="23" fill="#c3d9e9" stroke="#93aec1" strokeWidth="3"/><path d="m58 80 6 7 13-17" fill="none" stroke="#2d8aab" strokeWidth="4" strokeLinecap="round"/>
 </g>
 <!-- air fryer -->
 <g transform="translate(525 211)">
 <rect width="99" height="149" rx="31" fill="url(#dark)"/>
 <rect x="14" y="12" width="71" height="53" rx="20" fill="#355876"/>
 <circle cx="50" cy="38" r="17" fill="#112b46" stroke="#94bacb" strokeWidth="2"/><path d="M50 26v13l7 5" stroke="#f28c28" strokeWidth="3" fill="none"/>
 <path d="M16 79H83" stroke="#7896ac" strokeWidth="3"/><rect x="37" y="106" width="26" height="8" rx="4" fill="#99b2c4"/>
 </g>
 <!-- espresso machine -->
 <g transform="translate(638 205)">
 <rect width="89" height="152" rx="15" fill="url(#steel)" stroke="#9db1c3" strokeWidth="2"/>
 <rect x="12" y="13" width="65" height="48" rx="8" fill="url(#dark)"/>
 <circle cx="45" cy="37" r="11" fill="#305d86" stroke="#9ccbdc" strokeWidth="2"/>
 <path d="M27 70h36v8H27m18 0v27" stroke="#476176" strokeWidth="5" fill="none"/>
 <path d="M20 115h50M29 114v15h31v-15" stroke="#8b5c49" strokeWidth="5" fill="none"/>
 </g>
</g>
<!-- Compact bottom countertop items -->
<g filter="url(#shadow)">
 <!-- vacuum -->
 <g transform="translate(24 431)">
 <path d="M32 10 53 86M32 10l12-5" stroke="#496b8a" strokeWidth="10" strokeLinecap="round"/>
 <path d="M31 12 49 8l7 31-15 6Z" fill="#e98630"/><path d="M42 81h59l10 15H25Z" fill="url(#dark)" />
 </g>
 <!-- blender -->
 <g transform="translate(155 433)">
 <path d="M23 3h61l-8 57H32Z" fill="#d5eef9" stroke="#7ba1b9" strokeWidth="3"/>
 <path d="M39 10 59 51M74 16 50 45" stroke="#a5d7e7" strokeWidth="7" opacity=".55"/>
 <rect x="18" y="65" width="70" height="37" rx="11" fill="url(#steel)"/><circle cx="54" cy="83" r="8" fill="#f28c28"/>
 </g>
 <!-- toaster -->
 <g transform="translate(268 457)">
 <rect x="2" y="4" width="98" height="74" rx="24" fill="url(#steel)" stroke="#9dafbe" strokeWidth="2"/>
 <path d="M25 12h52" stroke="#7c92a6" strokeWidth="7" strokeLinecap="round"/>
 <circle cx="80" cy="43" r="8" fill="#db8332"/><path d="M18 79v9m66-9v9" stroke="#5c7388" strokeWidth="7"/>
 </g>
 <!-- fan -->
 <g transform="translate(385 430)">
 <circle cx="48" cy="41" r="40" fill="#f0f7fb" stroke="#7b9fb9" strokeWidth="5"/>
 <path d="M49 38c-21-29-41-15-26 3 7 10 16 10 26-3m0 0c34 0 36 25 12 27-12 1-18-8-12-27m0 0c-14 30-36 23-36 3" fill="#8ebdd4" stroke="#4f88a5" strokeWidth="3"/>
 <circle cx="48" cy="41" r="7" fill="#df892e"/><path d="M48 83v23m-25 0h50" stroke="#57768c" strokeWidth="8" strokeLinecap="round"/>
 </g>
 <!-- laptop -->
 <g transform="translate(494 449)">
 <rect x="16" y="5" width="126" height="76" rx="7" fill="#304861" stroke="#7895ac" strokeWidth="4"/>
 <rect x="24" y="12" width="110" height="60" rx="3" fill="url(#screen)"/>
 <path d="M3 86h153l-14 13H17Z" fill="url(#steel)" stroke="#839aab" strokeWidth="2"/>
 </g>
 <!-- hair dryer -->
 <g transform="translate(663 448)">
 <path d="M17 18Q17 5 43 5h29l15 17-15 18H43Q17 40 17 18Z" fill="url(#dark)"/>
 <path d="M47 39 34 88H58L66 39" fill="#6d9ebd" stroke="#24445e" strokeWidth="3"/>
 <path d="M88 18h14v7H88" stroke="#f28c28" strokeWidth="6"/><path d="M38 87h22" stroke="#2e556e" strokeWidth="6"/>
 </g>
</g>
<!-- Small warm accents -->
<circle cx="726" cy="395" r="5" fill="#f28c28"/><circle cx="20" cy="270" r="4" fill="#f28c28"/>
<path d="m694 151 5 10 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2Z" fill="#f6a44a" opacity=".9"/>
</svg>
);

export default HeroAppliances;
