# React Bits component catalog (TS + Tailwind variant)

Generated from DavidHDev/react-bits @ ca44b3f (2026-10-03). Regenerate with `node .claude/skills/react-bits/scripts/add.mjs --list` if it looks stale.

### Animations

| Component | What it does | npm deps |
|---|---|---|
| AnimatedContent | Wrapper that animates any children on scroll or mount with configurable direction, distance, duration, easing and disappear options. | gsap |
| Antigravity | 3D antigravity particle field that repels from the cursor with smooth motion. | @react-three/fiber, three |
| BlobCursor | Organic blob cursor that smoothly follows the pointer with inertia and elastic morphing. | gsap |
| ClickSpark | Creates particle spark bursts at click position. | — |
| Crosshair | Custom crosshair cursor with tracking, and link hover effects. | gsap |
| Cubes | 3D rotating cube cluster. Supports auto-rotation or hover interaction. | gsap |
| CursorGrid | Canvas grid whose cells light up around the cursor with configurable radius, falloff and click pulses. | — |
| DitherVeil | A photo printed as a 1-bit dither that the cursor burns through to full colour, leaving a trail that knits back cell by cell. | ogl |
| ElasticMesh | Spring-mesh surface that stretches under the pointer and settles back with damped physics. | ogl |
| ElectricBorder | Jittery electric energy border with animated arcs, glow and adjustable intensity. | — |
| ElectricLogo | Turns any SVG or PNG into a living lightning outline, with flowing strands, arcs that leap off the edges and a charge that follows the cursor. | ogl |
| FadeContent | Simple directional fade / slide entrance / exit wrapper with threshold-based activation. | gsap |
| GhostCursor | Semi-transparent ghost cursor that smoothly follows the real cursor with a trailing effect. | three |
| GlareHover | Adds a realistic moving glare highlight on hover over any element. | — |
| GlowCursor | Shader-powered light trail that smoothly follows the pointer with customizable glow, color, taper and pulse. | ogl |
| GradualBlur | Progressively un-blurs content based on scroll or trigger creating a cinematic reveal. | — |
| HalftoneReveal | Print-style halftone dot matrix that resolves into sharp content around the cursor. | ogl |
| ImageTrail | Cursor-based image trail with several built-in variants. | gsap |
| LaserFlow | Dynamic laser light that flows onto a surface, customizable effect. | three |
| LogoLoop | Continuously looping marquee of brand or tech logos with seamless repeat and hover pause. | — |
| MagicRings | Interactive magic rings effect with customizable parameters. | three |
| Magnet | Elements magnetically ease toward the cursor then settle back with spring physics. | — |
| MagnetLines | Animated field lines bend toward the cursor. | — |
| MetaBalls | Liquid metaball blobs that merge and separate with smooth implicit surface animation. | ogl |
| MetallicPaint | Liquid metallic paint shader which can be applied to SVG elements. | — |
| Noise | Animated film grain / noise overlay adding subtle texture and motion. | — |
| OrbitImages | SVG Path customizable orbiting images effect | motion |
| PixelSwap | Pixel fragments assemble into a full cover, swap arbitrary content, then dissolve away with reversible colors and triggers. | — |
| PixelTrail | Pixelated cursor trail emitting fading squares with retro digital feel. | @react-three/drei, @react-three/fiber, three |
| PixelTransition | Pixel dissolve transition for content reveal on hover. | gsap |
| Ribbons | Flowing responsive ribbons/cursor trail driven by physics and pointer motion. | ogl |
| RippleDistortion | Pointer-driven water displacement that warps content and leaves a decaying wake. | ogl |
| ScrollExpand | A rounded media frame that grows to full bleed as it scrolls through the viewport. | — |
| ShapeBlur | Morphing blurred geometric shape. The effect occurs on hover. | three |
| SplashCursor | Liquid splash burst at cursor with curling ripples and waves. | — |
| StarBorder | Animated star / sparkle border orbiting content with twinkle pulses. | — |
| StickerPeel | Sticker corner lift + peel interaction using 3D transform and shadow depth. | gsap |
| Strands | Glowing ribbon-like strands that ripple and weave across a transparent canvas. | ogl |
| SwarmCursor | Flocking particle swarm that chases the pointer, jostles for space and drifts apart at rest. | ogl |
| TargetCursor | A cursor follow animation with 4 corners that lock onto targets. | react-dom, gsap |

### Backgrounds

| Component | What it does | npm deps |
|---|---|---|
| AcidSquares | A crystalline corridor of stacked squares receding into depth. | ogl |
| AeroShards | A GPU-driven wind sculpture of folded foil shards with crisp detail, content-safe placements, and responsive pointer interactions. | vgpu |
| Aurora | Flowing aurora gradient background. | ogl |
| Balatro | The balatro shader, fully customizalbe and interactive. | ogl |
| Ballpit | Physics ball pit simulation with bouncing colorful spheres. | gsap, three |
| Beams | Crossing animated ribbons with customizable properties. | three, @react-three/fiber, @react-three/drei |
| CRTWarp | Full-canvas CRT plasma with curved distortion, scanlines, bloom and pointer interaction. | three |
| ColorBends | Vibrant color bends with smooth flowing animation. | three |
| DarkVeil | Subtle dark background with a smooth animation and postprocessing. | ogl |
| Dither | Retro dithered noise shader background. | @react-three/fiber, @react-three/postprocessing, postprocessing, three |
| DotField | Interactive dot grid with cursor bulge, glow, sparkle, and wave effects. | — |
| DotGrid | Animated dot grid with cursor interactions. | gsap |
| EvilEye | Procedural evil eye shader with animated iris, slit pupil, and fiery outer glow. | ogl |
| FaultyTerminal | Terminal CRT scanline squares effect with flicker + noise. | ogl |
| Ferrofluid | A churning magnetic fluid traced by glowing contour lines, with a cursor magnet. | ogl |
| FloatingLines | 3D floating lines that react to cursor movement. | three |
| Galaxy | Parallax realistic starfield with pointer interactions. | ogl |
| GhostFibers | A deep-blue recursive fiber field with luminous bands, radial twisting and soft atmospheric glow. | ogl |
| GradientBlinds | Layered gradient blinds with spotlight and noise distortion. | ogl |
| GradientWaves | Raymarched sine waves rolling toward a soft, hazy horizon. | ogl |
| Grainient | Grainy gradient swirls with soft wave distortion. | ogl |
| GridDistortion | Warped grid mesh distorts smoothly reacting to cursor. | three |
| GridMotion | Perspective moving grid lines based on cusror position. | gsap |
| GridScan | Animated grid room 3D scan effect and cool interactions. | face-api.js, postprocessing, three |
| Hyperspeed | Animated lines continuously moving to simulate hyperspace travel on click hold. | postprocessing, three |
| Iridescence | Slick iridescent shader with shifting waves. | ogl |
| LetterGlitch | Matrix style letter animation. | — |
| LightPillar | Vertical pillar of light with glow effects. | three |
| LightRays | Volumetric light rays/beams with customizable direction. | ogl |
| LightTunnel | A radial fibre-optic tunnel with light pulses racing into depth. | ogl |
| Lightfall | Colorful light streaks raining down a glowing tunnel with a cursor light. | ogl |
| Lightning | Procedural lightning bolts with branching and glow flicker. | — |
| LineWaves | Animated line wave pattern with colorful warped distortion. | ogl |
| LiquidChrome | Liquid metallic chrome shader with flowing reflective surface. | ogl |
| LiquidEther | Interactive liquid shader with flowing distortion and customizable colors. | three |
| MicroSlats | A wall of tiny slats that becomes a rolling sea in perspective, with glinting crests, four presets, a real fluid the cursor stirs and an intro that rolls in from the horizon. | ogl |
| MoltenMetal | Swirling caustic plasma filaments with molten, white-hot cores. | ogl |
| Orb | Floating energy orb with customizable hover effect. | ogl |
| Particles | Configurable particle system. | ogl |
| PatternWaves | A lit halftone surface of dots, lines, crosses or glyphs that moves like draped silk, rolling swells or ripples, with six presets, one-color theming and a cursor that sends ripples through it. | ogl |
| PixelBlast | Exploding pixel particle bursts with optional liquid postprocessing. | postprocessing, three |
| PixelSnow | Falling pixelated snow effect with customizable density and speed. | three |
| Plasma | Organic plasma gradients swirl + morph with smooth turbulence. | ogl |
| PlasmaWave | Raymarched plasma waves with dual-wave interference and OGL. | ogl |
| Prism | Rotating prism with configurable intensity, size, and colors. | ogl |
| PrismaticBurst | Burst of light rays with controllable color, distortion, amount. | ogl |
| Radar | Radar sweep effect with concentric rings, radial spokes, and a rotating beam. | ogl |
| RippleGrid | A grid that continuously animates with a ripple effect. | ogl |
| Scanner | Calm interference bands sweeping across the screen like an oscilloscope. | ogl |
| ShapeGrid | Animated grid with shape variants (square, hexagon, circle, triangle) + direction customization. | — |
| ShapeWaves | A WebGPU field of triangles, circles and squares that brighten and grow along rolling waves, with an optional text cutout the waves flow around. | vgpu |
| SideRays | Animated light rays emanating from the side with customizable colors and speed. | ogl |
| Silk | Smooth waves background with soft lighting. | @react-three/fiber, three |
| SlicedWaves | A grid of soft glowing bars rippling like a slatted equalizer. | ogl |
| SoftAurora | Soft aurora borealis shader with 3D Perlin noise and cosine gradient palettes. | ogl |
| Threads | Animated pattern of lines forming a fabric-like motion. | ogl |
| Topography | A living contour map with glowing, elevation-tinted lines. | ogl |
| Waves | Layered lines that form smooth wave patterns with animation. | — |
| WebThreads | Glowing sine threads woven through a luminous convergence point. | ogl |

### Components

| Component | What it does | npm deps |
|---|---|---|
| AccordionGallery | Panels expand on hover or focus, revealing parallax imagery and captions. | gsap |
| AnimatedList | List items enter with staggered motion variants for polished reveals. | motion |
| BorderGlow | Glowing mesh-gradient border that follows cursor direction and intensifies near edges. | — |
| BounceCards | Cards bounce that bounce in on mount. | gsap |
| BubbleMenu | Floating circular expanding menu with staggered item reveal. | gsap |
| CardNav | Expandable navigation bar with card panels revealing nested links. | gsap, react-icons |
| CardSwap | Cards animate position swapping with smooth layout transitions. | gsap |
| Carousel | Responsive carousel with touch gestures, looping and transitions. | motion, react-icons |
| ChromaGrid | A responsive grid of grayscale tiles. Hovering the grid reaveals their colors. | gsap |
| CircularCarousel | A 3D ring of images with four layouts, bendable cards, depth fade, momentum drag, snapping and click to focus. | — |
| CircularGallery | Circular orbit gallery rotating images. | ogl |
| Counter | Flexible animated counter supporting increments + easing. | motion |
| CurvedInput | Arc-bent input bar with text, caret and submit button all following the curve. | — |
| DecayCard | Hover parallax effect that disintegrates the content of a card. | gsap |
| DepthCarousel | Cards recede into depth on a 3D rail, with drag, keyboard and auto-advance. | gsap |
| Dock | macOS style magnifying dock with proximity scaling of icons. | motion |
| DomeGallery | Immersive 3D dome gallery projecting images on a hemispheric surface. | @use-gesture/react |
| DriftWall | An endless perspective wall of tiles drifting past, lifting on hover. | — |
| ElasticSlider | Slider handle stretches elastically then snaps with spring physics. | motion |
| FlexCarousel | An infinite image row that flows through invisible liquid glass at its edges, with four bend presets, five entrances, a speed squeeze and click to focus. | ogl |
| FlowingMenu | Liquid flowing active indicator glides between menu items. | gsap |
| FluidGlass | Glassmorphism container with animated liquid distortion refraction. | three, @react-three/fiber, @react-three/drei, maath |
| FlyingPosters | 3D posters rotate on scroll infinitely. | ogl |
| Folder | Interactive folder opens to reveal nested content smooth motion. | — |
| GlassIcons | Icon set styled with frosted glass blur. | — |
| GlassSurface | Advanced Apple-style glass surface with real-time distortion + lighting. | — |
| GooeyNav | Navigation indicator morphs with gooey blob transitions between items. | — |
| InfiniteMenu | Horizontally looping menu effect that scrolls endlessly with seamless wrap. | gl-matrix |
| InfiniteSpiral | An endlessly looping 3D helix of images with customizable motion, depth, spacing and interaction. | — |
| Lanyard | Swinging 3D lanyard / badge card with realistic inertial motion. | — |
| LineSidebar | Static list navigation with a cursor-proximity effect that shifts and highlights nearby items. | — |
| MagicBento | Interactive bento grid tiles expand + animate with various options. | gsap |
| Masonry | Responsive masonry layout with animated reflow + gaps optimization. | gsap |
| ModelViewer | Three.js model viewer with orbit controls and lighting presets. | @react-three/fiber, @react-three/drei, three |
| MorphSlider | WebGL slider that melts between images with a displacement transition. | ogl, gsap |
| OptionWheel | Curved option picker that spins via scroll, drag, or arrow keys, fading and tilting items away from the selection. | — |
| PillNav | Minimal pill nav with sliding active highlight + smooth easing. | react-router-dom, gsap |
| PixelCard | Card content revealed through pixel expansion transition. | — |
| ProfileCard | Animated profile card glare with 3D hover effect. | — |
| ReflectiveCard | Card with dynamic webcam reflection and glare effects that respond to cursor movement. | lucide-react |
| ScrollStack | Overlapping card stack reveals on scroll with depth layering. | lenis |
| SpecularButton | Glass button with a shader-driven specular rim light that sweeps around the edge and follows the cursor. | ogl |
| SpotlightCard | Dynamic spotlight follows cursor casting gradient illumination. | — |
| Stack | Layered stack with swipe animations, autoplay and smooth transitions. | motion |
| StaggeredMenu | Menu with staggered item animations and smooth transitions on open/close. | gsap |
| Stepper | Animated multi-step progress indicator with active state transitions. | motion |
| TiltedCard | 3D perspective tilt card reacting to pointer. | motion |

### Micro

| Component | What it does | npm deps |
|---|---|---|
| BellToggle | Pill toggle that answers a press at three tempos: the bell rings on damped keyframes, the label blur-crossfades, and the pill unfurls to the longer label through a clip-path on a critically damped spring. The pressed state is the receipt. | motion, @hugeicons/react, @hugeicons/core-free-icons |
| BranchedMenu | Collapsible menu whose sections unfold into a trunk with a curved branch to each child, and an accent line that travels down the trunk and around the curve to whatever you pick, while a marker glides to the open section. | @hugeicons/react, @hugeicons/core-free-icons |
| CallChip | Inline tool-call chip whose fill wipes across while a live ms counter ticks, completing with a green wash on success or stopping short and shaking red with a retry glyph on error. | @hugeicons/react, @hugeicons/core-free-icons |
| CodeSlots | One-time-code input where a hidden overlay input owns focus, paste and SMS autofill while each slot lands its digit on one spring: the fill swells from the centre, the digit rises and the caret glides; a wrong code drains the slots in a cascade, a right one merges them into a single accent wash. | motion, @hugeicons/react, @hugeicons/core-free-icons |
| CometDial | Tick-ring dial you flick by angle: the reading launches on a spring and a velocity-driven comet streaks behind the lit head, trailing the direction of travel and vanishing at rest. | motion |
| DodgeField | Wrapper that makes any child flee the pointer inside a bounded field, dodges once per approach, then relents after a few tries and glides home. | motion |
| FlipCard | Two-faced card that flips in 3D on a click, a drag or a flick, settling on a spring that carries your release velocity, with an optional cursor tilt, a sheen that follows the pointer and a shadow that narrows as it turns edge on. | motion |
| FolderFloat | Folder that opens on hover or press: the flap tilts toward you, a paper edge rises, and its notes spring out from behind the flap into a floating cloud to pick from, then sink back when the folder closes. | matter-js |
| FuseButton | Action button whose done state carries its own undo on a burning fuse: press, the label crossfades to Undo, a hairline burns for the undo window, and Undo or Escape runs it back. | @hugeicons/react, @hugeicons/core-free-icons |
| GlideSelect | Select chip whose menu pops out of its own corner and whose single hover highlight glides between rows, remembering where you left it so re-entry slides from there instead of blinking in. | @hugeicons/react, @hugeicons/core-free-icons |
| HoldButton | Hold-to-confirm button whose liquid fill rises while pressed, snaps back on an early release and swaps its label through a blur when the hold completes. | — |
| JellyRadio | Radio group of labelled chips where the chosen one swells wide-then-tall on two springs and barges its neighbours outward with a travelling stagger, so a selection reads as a force moving through the row. | motion |
| LatticeLoader | Inline agent-status row: a 3x3 or 4x4 lattice whose cells brighten in a phase-offset wave beside a verb and a live stopwatch, resolving into a check or a cross when the task ends. | — |
| PaperCrumple | An image that crumples into a textured 3D sheet while held and follows the grabbed point as you drag. Release it as a crumpled ball, unfold it flat, or leave the paper creased, with customizable folds, paper grain, lighting and shadows. | three |
| PeekRating | Star rating you can try before you commit: sweeping the row lifts a trailing wave of stars up to the pointer while a tip hops along with the label; a click commits with a pop. | @hugeicons/react, @hugeicons/core-free-icons |
| PromptBar | Chat composer with an @ sources menu, a / commands menu, a model picker, dictation and attachments, whose send tile charges to ink the moment there is something to send and morphs its arrow into a stop square while busy. | motion, @hugeicons/react, @hugeicons/core-free-icons |
| PulseHeart | Like button that contracts to a dot, flips colour at its smallest frame and pulses back while the count swaps one glyph. | @hugeicons/core-free-icons |
| RefineFrame | Reserved-aspect frame that walks any media through queued, generating, refining and complete without layout shift: each stage is one blur, saturate, scale and opacity tween, a soft band sweeps while it works, a chip reports the stage, and an error dims the picture behind a retry pill. | @hugeicons/react, @hugeicons/core-free-icons |
| RubberSegment | Segmented control with a rubber thumb: taps stretch it across the gap and squash it onto the target, and you can grab, drag and flick it between slots. | motion |
| ScrubField | Number chip you drag to scrub: the value follows the hand, pushes past the range on a rubber band, and a click without moving opens it for typing. | motion |
| Shredder | A list with a paper shredder at the bottom. Drag a row into the slit and the rollers tug it in, pull it through and cut it into strips that curl out underneath, tumble away and fade out. The rest of the list settles down on a spring and the shredded item is handed to you to delete. | react-dom |
| SlideCommit | Slide-to-confirm handle that plants with a spinner while your action runs, unfurls into a done pill on success and springs home with a squash and shake on failure. | motion, @hugeicons/react, @hugeicons/core-free-icons |
| SlingButton | Send button you pull back like a slingshot: the band stretches, a power arc arms it, and releasing fires the action with the flick's velocity. | motion, @hugeicons/react, @hugeicons/core-free-icons |
| SloshGauge | Tank gauge whose liquid chases the value with mass, tilts with its own speed and splashes against the top when it slams full; optionally a vertical slider. | — |
| SpringCheck | Checkbox row where a single spring fills the box, draws the tick, strikes the label and dims the words in one press. | motion, @hugeicons/core-free-icons |
| SquishSwitch | Drag-scrubbable switch whose thumb stretches by how fast it moves, flips at the midpoint and squashes against the track end on a flick. | motion |
| StatusMark | A 20px status glyph for agent task lists that morphs in place from a dashed idle ring to a spinning or real-progress arc, then draws a check or a cross, with an optional label strike. | motion |
| SwipeRow | List row that swipes open to reveal actions, snaps by flick velocity, and deletes on a full swipe that stretches the action colour across the row. | motion, @hugeicons/react, @hugeicons/core-free-icons |
| SwipeToast | Single toast that rises through its bottom edge, swipes down to dismiss on a flick or a distance, and burns a thin fuse for exactly its remaining time; hover pauses it and an inline mode keeps it inside any container. | motion, @hugeicons/react, @hugeicons/core-free-icons |
| TearTicket | Ticket whose perforated stub tears off by hand: paper bridges stretch into fibres and snap one by one from the far end, the torn edges are jagged and fit each other, the freed stub dangles and drops, and the body is stamped as used. The artwork tilts in 3D with parallax on hover. | motion |
| ThoughtLine | Reasoning-trace header: a glyph and a label breathe beside a live clock while steps appear beneath, then the line settles on one beat into "Thought for 4.2s" through a blur crossfade and the trace folds into it. | motion, @hugeicons/react, @hugeicons/core-free-icons |
| VoicePill | Mic button that swells into a tinted capsule of level-driven equalizer bars and an elapsed clock while held or toggled, then relaxes back into the mic on release; simulated voice by default, real microphone as an opt-in. | @hugeicons/react, @hugeicons/core-free-icons |
| WakeSlider | Range slider drawn as thin bars with no thumb: drag speed raises a wake that trails behind the handle and flattens again at rest. | motion |
| WarmTooltip | Tooltip group with one shared delay: the first label waits and pops from its trigger, then siblings open instantly while the group is warm, with an optional velocity lean. | react-dom, motion |

### TextAnimations

| Component | What it does | npm deps |
|---|---|---|
| ASCIIText | Renders text with an animated ASCII background for a retro feel. | three |
| BlurText | Text starts blurred then crisply resolves for a soft-focus reveal effect. | motion |
| CircularText | Layouts characters around a circle with optional rotation animation. | motion |
| CountUp | Animated number counter supporting formatting and decimals. | motion |
| CurvedLoop | Flowing looping text path along a customizable curve with drag interaction. | — |
| DecryptedText | Hacker-style decryption cycling random glyphs until resolving to real text. | motion |
| DepthText | Layered extruded type with parallax that shifts against the pointer. | — |
| EchoText | Ghosted copies trail behind the text and settle into a single word. | — |
| FallingText | Characters fall with gravity + bounce creating a playful entrance. | matter-js |
| FoldText | Lines unfold into place like creased paper opening flat. | gsap |
| FuzzyText | Vibrating fuzzy text with controllable hover intensity. | — |
| GlitchText | RGB split and distortion glitch effect with jitter effects. | — |
| GradientText | Animated gradient sweep across live text with speed and color control. | motion |
| MaskedHeading | A large headline with a drifting colour mesh or image showing through the glyphs, revealed word by word. | gsap |
| ParticleText | Text assembles from drifting particles that scatter and reform on demand. | — |
| RotatingText | Cycles through multiple phrases with 3D rotate / flip transitions. | motion |
| ScrambledText | Detects cursor position and applies a distortion effect to text. | gsap |
| ScrollFloat | Text gently floats / parallax shifts on scroll. | gsap |
| ScrollReveal | Text gently unblurs and reveals on scroll. | gsap |
| ScrollVelocity | Text marquee animatio - speed and distortion scale with user's scroll velocity. | motion |
| ShinyText | Metallic sheen sweeps across text producing a reflective highlight. | motion |
| Shuffle | Animated text reveal where characters shuffle before settling. | gsap, @gsap/react |
| SplitFlapText | Mechanical split-flap departure board that clacks through to each new phrase. | — |
| SplitText | Splits text into characters / words for staggered entrance animation. | gsap, @gsap/react |
| StrokeText | Outlined letterforms draw themselves on, then flood with fill. | gsap |
| TechText | A wordmark whose letters turn into dashed vector paths under the cursor. Grab any letter to drag it off the baseline and it springs back home. | — |
| TextCursor | Make any text element follow your cursor, leaving a trail of copies behind it. | motion |
| TextLoop | A seamless text marquee that flows along curved SVG paths. | gsap |
| TextPressure | Characters scale / warp interactively based on pointer pressure zone. | — |
| TextType | Typewriter effect with blinking cursor and adjustable typing cadence. | gsap |
| TrueFocus | Applies dynamic blur / clarity based over a series of words in order. | motion |
| VariableProximity | Letter styling changes continuously with pointer distance mapping. | motion |
| WarpText | WebGL warp that bends and refracts the text around the pointer. | ogl |
