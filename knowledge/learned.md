# learned.md - lessons from real builds (append new ones; never delete)

Format: `YYYY-MM-DD · video · lesson · how it is handled now`. These are field notes from building the first 8-minute sample (stickman-8min), the five 1-minute style videos and earlier pilots. Read before a new build.

## Process
- 2026-10-07 · stickman-8min · An unattended scheduled/overnight run stalled on a tool-permission prompt and produced nothing for 16 h. · For long unattended work, first run it once interactively ("Run now") so permissions are granted; poll status early; keep a STATE.md handoff.
- 2026-10-07 · stickman-8min · Running two heavy jobs at once halves render speed (542 → ~250 frames/min); a parallel agent team hit the usage limit. · Do light work (writing, docs) while a render runs; never more than 2 agents; prefer doing the work yourself.
- 2026-10-07 · stickman-8min · The user can say "stop everything": all background renders were killed and resumed later. · Keep every long job restartable (explicit output paths, no hidden state) and log to a file; on "stop" kill your own processes and confirm none are left.
- 2026-10-07 · stickman-8min · A first narration (366 s) came out far below the 8-minute target. · Calibrate with `script_lint.py --wpm` (OmniVoice ≈ 195 wpm, Kokoro ≈ 165): plan words = minutes × wpm, then add real content (examples, a recap, an engagement moment), never padding.
- 2026-10-07 · stickman-8min · Voice-design text must be attribute style (`male, young adult, moderate pitch, american accent`); free sentences are rejected. · Documented in models-notes and vidbucks-longform-build.

## Script / retention
- Open loop in the first 3 paragraphs, a promise + teasers ("one of them feels almost unfair, I will save it for number two"), numbered sections, a quick recap midway, a "pause and answer" quiz moment (`[pause 4]` + countdown scene) that doubles as the topic's own technique, CTA after value, strongest line last.
- A recurring fictional character (Sam) turned abstract advice into drawable scenes and gave the video a through-line.
- Paragraph = scene; keep 8-35 words. 89 scenes for 8 min ≈ 11 scenes/min (avg 5.4 s) matched the studied stickman channel.
- Claims: only established facts, hedged; fictional numbers only for fictional characters; charts are schematic and say so.

## Engine / build
- Scene count must equal paragraph count. Inserting a paragraph without a scene shifts every later scene (it happened twice). · `check_anchors.py` reports a mismatch; `scenekit.move_after()` repositions a scene.
- Whisper mis-hears words (notes→note, mix→makes, shuffle→shuffled, ten→10). · The anchor matcher accepts stems and number words; `check_anchors.py` lists anchors that are not spoken at all.
- 23 of 89 scenes started blank for 0.6-3.3 s (objects anchored to late words). · `blank_start.py --fix` (run by `scenekit.finish`) makes the first object appear at once. Rule: something visible within 0.6 s.
- Dark backgrounds make ink strokes invisible, and light-filled icons vanish. · Engine takes stroke colour from context (InkContext) and darkens default fills on dark scenes.
- Default icon fills in paper colour made arrows/loops ghost-pale. · Give action icons real colours (orange arrows, blue loops).
- Text over a figure, labels on the ground line, chart labels colliding, text wider than its slot were the most common visual defects. · SCENES-SPEC layout rules + contact-sheet review of every scene (2 stills each, 6 scenes per sheet).
- The marker font draws `1` like a tick. · Prefer words or the badge font for digits.
- Wobble ("boil") filter costs ~3× render time. · `"boil": false` for drafts and long videos; keep it for hooks if the budget allows.
- Render of 14.5k frames ≈ 35-40 min on 4 workers when nothing else runs. · Always run `tsc` first, pass the explicit entry `src/index.ts`, run in the background and poll the log.
- Remotion's bundled sample sounds have an unverified licence. · Excluded from category rotation (only by explicit id).
- Sound rotation per category avoids hearing the same effect repeatedly; a whoosh on every cut is too much (use every ~5th scene).
- To change only the sound mix: render audio-only (`--codec=wav`, ~13 min for 8 min) and mux it with the existing video (`ffmpeg -map 0:v -map 1:a -c:v copy`) instead of re-rendering frames.
- Loudness: a single-pass `loudnorm=I=-16:TP=-1.5` on the final mix landed at −16.4 LUFS / −1.1 dBTP (within tolerance).
- A voice that is too fast can be slowed without TTS: `stretch_narration.py` (atempo + timing rescale); fixed-time constants in hand-made scenes must be scaled too.
- Large master (139 MB for 1 min): use `--crf 26-27` for share versions (30 MB).

## Windows / environment
- Git-bash heredocs break on quotes/backslashes → write files with the editor tool. `python` not `python3`. GNU tar from Git-bash cannot write zips → `python -m zipfile`.
- `spawnSync` with `shell:true` mangles `python -c "import x"` quoting on Windows → no shell for python/ffmpeg.
- CLI tools installed from inside the Claude desktop (MSIX) sandbox may not exist in the user's own terminal → ask the user to run installers in their own terminal.
- OmniVoice must live in a permanent folder (a scratch/temp folder was wiped once).
- Only one process may use the GPU (lock file).

## Legal / ethics (unchanged, restated)
No downloading other channels' videos, no Google Images scraping, only CC0/CC BY/CC BY-SA/Pexels/Pixabay with credits, no real faces/logos, no invented statistics, never claim to have listened/watched what you did not.

## Reference analysis and the fidelity gate (reference-to-video route)
- Measure, do not guess: `analyze_reference.py` replaces eyeballed numbers. File mode gives cuts/min, shot-length distribution, palette (k-means), brightness, motion, transitions (hard cut / flash / blur-whip-zoom), loudness, tempo, sound hits and 3-second curves; link mode gives metadata, engagement, title skeleton, thumbnail palette, captions, chapters and channel context. `--compare` scores a render against the reference; `--sidebyside` makes the visual comparison. Looking at the side-by-side is mandatory - a clean score does not replace it.
- Caption tags like `[music]` and `>>` must be stripped, otherwise near-wordless films produce nonsense scenes; use chapters as the scene backbone when speech is sparse. yt-dlp flat playlists carry no view counts: fetch the last ~12 videos with `--print`.
- A single global cut threshold fails on videos in constant motion or on filmed screens. A cut = a local spike of the mean of the 8 % most-changed pixels (>= 2.2x its +-0.5 s neighbourhood). Every fast eased move registers as a cut: slow easing (sine curves, longer swings) to match a calmer reference.
- Tempo from autocorrelation is octave-ambiguous (86 vs 172) and unreliable on quiet music mixed with effects: compare modulo octave, skip when the rhythm strength is below 0.15, treat it as a hint. With `--no-transcript` the tool must not claim "music-only".
- Link only (no file): do the link analysis, then a visual pass in the Browser pane (mobile viewport, `video.currentTime` seeks, 0.3-scale screenshots every ~0.7 s for a Short); view only. State what stays unknown (audio, exact timings, cut statistics).
- What the score predicts: references made of drawable things (typography, vector icons, cut-out objects, particles) reach 70-100 %; references whose look is photographic (a filmed room, a real head) cap around 50 % with code-drawn stand-ins. A filmed screen puts the room's colours in the palette. For those, use real licensed footage/photos or accept and state the lower fidelity.
- First-time results of the loop: fidelity went from ~45 % to 100 % on a graphic reference by (1) slowing big moves so fewer "cuts" are detected, (2) a synthesised track at the reference tempo with the big moments on beats (BPM = 60*n/T), (3) sound effects placed on the detected transition times, (4) loudness matched to the reference.

## Assets and cut-outs
- Gather reference imagery yourself; never ask the user for photos. Google Images in the Browser pane is for viewing only. Usable assets come from licensed sources with credits; specific Wikimedia queries ("human brain lateral view anatomy", "anatomical model of an eye") beat Openverse's loose ranking - always check a contact sheet. Use statues, busts, models and objects instead of portraits of real people.
- `cutout.py` lessons: key a plain red backdrop on "redness" (R minus mean(G,B)) plus saturation, not on a single channel (shadows get eaten); estimate a gradient studio backdrop per row from the image edges; fade a flat crop edge; clear JPEG-block leftovers with rectangles/polygons; always look at the result on a grey ground.
- Real licensed photographs lifted visual fidelity far more than procedural drawings. A procedural face never reads as photoreal (it turns uncanny): substitute a subject that code can draw well (a word made of particles, a vector icon) and say so.
- Procedural folds from raw noise look like crumpled foil; turn smooth warped noise into sinuous bands (`|sin(k*n)|`) for gyri-like surfaces.

## Audio for reference-driven videos
- `vo_words.py`: English voice-over + Whisper word times; caption timing comes from word times, never by eye. Each phrase must end ~0.25 s before the next starts, otherwise consecutive captions overlap while fading.
- `make_pulse_track.py` makes a royalty-free mood track at an exact BPM; choose BPM = 60*n/T so a chosen moment T lands on beat n. Place sound effects on the visual change points; one clear hit per meaningful change.
- Match the loudness of the reference (unknown: -16 LUFS); normalise with loudnorm then trim with a small gain; keep a limiter. You cannot hear the result: report the measured numbers and say that listening was not done.

## Build technique (templates)
- Build heavy textures/geometry once (module load, `useMemo`) and show them as images or draw them once per frame; use `delayRender`/`continueRender` for anything async (fonts, geometry); keep randomness deterministic (seeded, or `random("key"+frame)`). ~40k canvas particles drawn with ImageData splats plus stroked ropes render in ~0.1 s per frame.
- One responsive composition serves 9:16 and 16:9: size unit `u = min(W,H)/1080`, positions as fractions of width/height. Check both formats.
- `mix-blend-mode: difference` keeps text readable over both a dark stage and a light beam. A split-open frame is two `clip-path` halves sliding apart. CSS `drop-shadow` gives cut-out objects depth.
- Review checklist before delivery: captions overlapping, text outside the frame, a leftover artefact on a cut-out, an element hidden behind another, the first 0.3 s empty, the last frame abrupt.
- Shell quirks (zsh): unquoted variables are not word-split (use functions with `"$@"`), `echo ====` is parsed as a command (quote separators).
- Keep a user's private work separate from the distributable package: the release builder copies from an allow-list and runs a brand/personal-data scan before zipping.

## 2026-10-15 - "dollar up, lira down" Short (ObjectStory, link-only reference)
- Coin cut-outs: `cutout.py --mode key-grad` leaves a faint backdrop halo around round objects; mask with an anti-aliased circle instead (radius from the HORIZONTAL extent - the drop shadow inflates the vertical one). Low-res stock (<400 px) looks soft when the template scales it to 560-780 px: search again for >= 900 px sources.
- Interior holes of a white-backed cut-out (eye whites, highlights): `scipy.ndimage.binary_fill_holes` on the alpha, fill with plain light grey; `--fill-rows` bleeds into the edges.
- Coins/banknotes: pick the value side (no portrait). Short voice-over (8 s) for a 14 s template: split the VO per phrase by word times and place each phrase on its scene (vo_spaced.wav + shifted words), on a 90 BPM grid (split = beat 4, second object = beat 8, cut = beat 12).

## 2026-10-15 - "Dolar" brand promo (new template HoloPromo, link-only reference)
- Abstract holographic motion-design Shorts (wireframe + glowing gradient fills + a travelling white ball + ray burst + wordmark) are fully drawable in SVG: new template `src/templates/HoloPromo.tsx` (scene devices cone/discs/slab/tunnel/tower/bars/burst, config-driven words/palette/logo/audio).
- Glow needs a strong bloom to read like the reference: Gaussian blur ~14 px merged TWICE under the source; one merge looked flat. Bring the main object close to the camera (scale > 1.2) - distant, small geometry reads as "diagram", not "3D promo".
- Captions over busy wireframe: a soft radial backing in the ground colour behind the word; over a light cone use dark ink instead of blend modes (difference turned grey and unreadable).
- Music-only promo loudness: -14 LUFS (reference loudness unknown from a link).

## 2026-10-15 - "AI agents don't just chat" 16:9 explainer (AI-tool Short reference, link-only)
- A vertical "floating UI card + word captions + neo-brutal step badges + comment CTA" Short transfers to 16:9 as: card 1000x540 centred near the top, caption block under it (~y 0.64), badge at ~y 0.85, stickers at the card's top corners. New composition `src/templates/AiAgents.tsx` (word-synced from words.json, scenes keyed to word indices).
- Count word indices from the generated words.json before keying scenes to them (an off-by-one put every later beat one word early). Typing effects must finish while their words are spoken - start them on the previous word.
- A spoken bridge line ("Want the full guide?") needs its own card; leaving only a caption on the empty ground reads as a gap. Memes in the reference are copyrighted characters: replaced by own stickers.

## 2026-10-16 - glassy device-UI motion graphic, phone reference -> laptop 16:9 (LaptopGlass)
- Phone-UI references transfer to a laptop with a CSS-3D model: lid (screen 1920x1200 + bezel) and a base hinged at the lid's bottom (`transformOrigin: 50% 0; rotateX(82deg)`), inside `perspective` + `preserve-3d`. At scale 1 with no rotation the 16:10 screen fills the 16:9 frame (60 px cropped top/bottom) - keep UI out of those bands. One keyframed camera (scale/rotX/Y/Z/translate/blur) gives the "no cuts, the camera flies into the device" feel.
- The morphing glass bubble = one div whose rect is interpolated between states; show content only while the rect holds still and use an empty glass "morph" phase in between, otherwise text squashes. Bug to avoid: destructure keyframes WITHOUT the time column.
- Licence check: some Wikimedia CC BY-SA photos carry author add-ons ("excludes use in social media") - skip those; prefer plain CC BY / CC0.

## 2026-10-16 - Jerico revision of the laptop video (JericoLaptop)
- Revising a finished motion piece for a product: read the product site first (facts + its own CSS tokens via `getComputedStyle` / `:root` rules) and map the product's real flow onto the existing beats (here SPEC -> PLAN -> APPROVE -> DISPATCH -> REVIEW onto desktop / approval bar / camera-shutter / map). Keep the camera path; share it by exporting `camAt`/`T` from the original template.
- In a filled 16:10 screen the top/bottom 60 px are cropped: app chrome must start at y >= 60. A travelling bubble that the camera follows sits at screen centre - route waypoints must stop ABOVE the panels it visits, or it hides their headers.
- Third-party agent names shown as text only (as the product site does); never their logos.

## 2026-10-16 - 4K cinematic cut with Higgsfield (JericoCinematic)
- Best use of a paid video model on a code-drawn piece: keyframe it on OUR OWN renders (start_image/end_image = stills of the composition at the exact source times) so every AI clip is a match cut back into the crisp UI; keep text-heavy UI segments in code (render at --scale 2 for true 4K). MiniMax H3 2K, 5 s = 10 credits (FLUX 3 4K 5 s = 65): 4 transitions cost 40 credits. Clips came back 2560x1440 @ 24 fps, 5.17 s, no audio.
- The model preserved our UI faithfully when the prompt said "keep the interface unchanged"; the strongest result was the fly-through between two UI states (motion-blurred cards, light lines). A start+end pair that differ only slightly (intro) gives little motion: speed it up or give it a bigger camera change.
- Edit as an EDL of segments (src, from, len, rate) with a 0.2 s dissolve at each join; place SFX by mapping source event times through the EDL.
- Upload flow: media_upload -> curl PUT (Content-Type) -> media_confirm; results download from the returned CloudFront URL.
- v2 (35.5 s, 92 % AI): chain AI clips end-to-start (each clip's end_image = the next clip's start_image, or reuse an earlier clip as the bridge) and keep code-drawn UI only as 1-2 s anchors. A start_image of a blurred macro edge + end_image of the wide hero gave the strongest opening (rack focus + orbit). Higgsfield may answer a batch item with a preset recommendation instead of a job: resubmit with `declined_preset_id`.
- Never run 10+ `remotion still` processes in parallel on this Mac (headless browser timeouts, low disk ~7 GB): extract check frames from the final render with ffmpeg instead, and render 4K with --concurrency=2 --timeout=120000.

## 2026-10-24 - flow-bridge (Flow automation with the user's own credits)
- What: `flow-bridge/` = Chrome MV3 extension + local Python job queue (127.0.0.1:8765) + `make_video.py brief.yaml`. Creates characters, sends scene prompts with named references to Flow's agent, approves credit gates inside a budget, downloads the 720p upscale, runs vision QA (`claude -p`, needs a logged-in terminal), concats with ffmpeg.
- Flow ignores synthetic (untrusted) clicks/typing on prompt boxes and submit: use `chrome.debugger` Input.insertText / dispatchMouseEvent. Chat list scrolls: scrollIntoView before clicking the approval row. Pending gate = last `flow-permission-message` with no `.read-only` rows.
- Never rely on tile titles for new-clip detection (duplicates); compare video-tile count and the first tile's `generating` state. Selectors live in `extension/selectors.js` (Turkish verified, English guessed).
- Chrome must allow downloads for flow.google.com, otherwise Flow's own 720p download silently never lands.
- flow-bridge: per-scene duration works by writing "Generation settings: use Omni 1.1 Flash, duration exactly N seconds, resolution 360p, aspect ratio 16:9" into the agent prompt (4 s -> 4.0 s clip, 4 credits, verified 2026-10-24). While a clip is queued Flow shows the raw prompt as the tile title: only treat short titles as finished. UI = `python3 ui.py` (owns the bridge port; stop it before running make_video.py from a shell).
- flow-bridge: sending the SAME prompt again in the same agent chat makes Flow's agent answer "already created" and generate nothing (no credit gate appears). Regenerations/retries now append "This is a NEW take (take N). Generate a new video now". The pipeline also gives up after 90 s without a credit question (printing the agent's words), retries up to 4 times, and logs a heartbeat while waiting, so it can no longer look frozen for 15 minutes. Flow can also answer "agent under heavy demand": detected and retried, nothing is charged.

## 2026-10-31 flow-bridge lessons
- Flow's media grid is virtualised: detect new clips by tile signature (tile_sig), not tile count.
- One fresh agent session per scene ("Yeni oturum"); long chats get stuck and answer "already created".
- Keep the Flow tab visible/active: Chrome throttles timers in hidden tabs, making sends take minutes or time out (extension now activates the tab).
- Flow queue under demand can take >10 min: wait up to 30 min for a new tile; character creation leaves Flow on the Characters view, so navigate back to All media.
- Model sometimes burns garbled on-screen text into a clip (corner-shop scene 1) despite "no text": check frame 0 of every clip.
- 2026-10-31 flow-bridge batch mode: one agent message with N "Video <TAG>-Sxx:" blocks makes Flow generate all N in parallel under ONE credit question ("12 kredi ... 3 video"); the agent honours the requested titles, so finished tiles map to scenes by title. Downloads stay serial (~33 s each; Flow file names are not reliable per tile). Character tile names update in Flow with a delay: re-check before deciding the name did not stick.
- 2026-10-31 flow-bridge: when the agent gets 10 videos at once it may IGNORE the title instruction (3 videos honoured it). Never map clips to scenes by creation order (the tiles come in scrambled order); use the tag in the title, or match the descriptive title words, and check frames. Flow's "Yeni proje" button on flow.google.com ignores clicks while the page settles: re-read its position and click again. A brand-new project has no tiles: do not wait for tiles there.

- 2026-11-01 flow-bridge: in a 10-scene batch Flow sometimes leaves a failed tile titled "Yeniden dene" (retry); the run downloaded it as a scene and produced duplicate/wrong clips (found by md5 + looking at frames). Now failed-title tiles are skipped and the scene is regenerated. Always md5-check clips for duplicates and look at one frame per suspicious scene; never pipe a long run through `| tail` (hides a stall).

- 2026-11-05 flow-bridge (team feedback: one video took 5-6 h, "do it by hand"): a failed Flow generation (tile "Yeniden dene" / agent reply "visit the Help Center" + "Tekrar dene") was never treated as finished, so each batch waited the full 70 min and the same 10 scenes were retried 3 times. Now: failed tiles end the wait at once, batch cap 15 min + 90 s/scene, retry rounds shrink (10 -> 3 -> 1 per message), clips with no shared wording are never force-matched, and `make_video.py --lint` (also run at start) checks prompts for risky words before any credit is spent. Not live-tested against a real failure.

- 2026-11-05 flow-bridge: teammates got Flow's "unusual activity" warning from the agent. Root cause we CAN see in our code: on any agent error the run re-sent the same message up to 9 times (3 send tries x 3 heal rounds, each after a page reload), plus 10 download clicks in 5 s, 5 character creations back to back, instant paste+submit. The installed "Flow Automation" extension (uses the same chrome.debugger trusted input, so that is NOT the difference) paces with random delays and key jitter and processes one prompt at a time. Fix: stop at the warning (never resend), 45-min cool-down file, batch 5, random pauses between messages/downloads/characters, 40-90 s cool-off before a resend. Cannot be proven live; our own account was never flagged in ~150 clips.

- 2026-11-05 flow-bridge: Flow's own generation box (agent chip OFF) offers Video / Kareler / Ingredients, 16:9|9:16, Omni 1.1 Flash, 360p|720p, 4/6/8/10 s, x1-x4 and shows "Üretme işlemi için 6 kredi kullanılır" (8 s 360p = same price as via the agent). Agent toggle = `flow-agent-mode-toggle-chip button` (aria-pressed). The installed Flow Automation extension offers both routes, default 1 concurrent prompt, random 0-20 s delay. Added `mode: standard` (one prompt per clip, no approval gate). NOT yet live-tested; reference attach via the "+" picker in the standard bar is unverified.

- 2026-11-05 watched the installed Flow Automation (VEO3) extension live (screen capture; REA over a separate CDP Chrome profile lost its page session when the extension created/navigated the project). Facts: it also uses chrome.debugger (Chrome's "started debugging" banner), runs ONE prompt at a time (sends, waits for 100%, downloads, then next after a random 0-20 s gap), default outputs per prompt = 2 (doubles credits!), creates a project itself when not in one. REA needs a loopback CDP port: Chrome on the default profile has none; start a second Chrome with --remote-debugging-port=9222 --user-data-dir=<new dir>; inspect_web_page keeps only 'batchexecute' request metadata and its session dies on navigation.

- 2026-11-05 flow-bridge v2.4: standard (agent-off) route verified LIVE: 3 clips, 12 credits, ~1.9 min/clip (generation ~60 s, 720p download ~35 s, 8-20 s pause). Needed: close the agent (chip `aria-pressed`, synthetic press works), settings chip + options need TRUSTED clicks (locate with std_rect, click with click_at), options are `button[role=radio]` / menu `button[role=menuitem]` with icon text glued to the label ("videocamvideo", "volume_upomni 1.1 flash"), JS lower-cases Turkish İ into 2 chars (match "erik öğeleri" not "içerik"), a new project may start on Veo 3.1 Lite x2 (20 credits): switch model to Omni 1.1 Flash FIRST, then 360p/seconds appear; abort if the price shown differs from the table. Downloads are grouped (download_every 5) and flushed on error. Group download by position of newest tiles is untested live.

- 2026-11-06 partners (Kerem, Beyza): even the paced standard mode got "We noticed some unusual activity ... browser extensions that modify the page may cause issues" after ~6-7 clips, and stuck downloads (clips 14,15) were lost. Our content script made ~15 SYNTHETIC events per clip (press() dispatchEvent x14 call sites, el.click, execCommand, synthetic mouseover/Escape); the working VEO3 extension makes every input a trusted CDP event with key jitter. v2.5: all input via background cdp() (kept-attached debugger session, idle detach 45 s, human gaps), content asks via chrome.runtime.sendMessage({trusted}). Also pending.json: finished-but-undownloaded clips are saved and fetched FIRST on the next run; no downloads while blocked. Verified live without credits: agent toggle, settings popover, model switch, reference attach, clear keeps chips. NOT verified: whether this stops the flag (cannot be proven on our own account, which was never flagged).

## 2026-11-09 - Flow standard-box failures and the Tudor-style vlog rewrite
- flow-bridge apply_std failed ("option /video$/ not found") with no credits spent. Measured causes: (1) the Flow tab was a background tab -> settings popover never opens; (2) attaching chrome.debugger adds Chrome's "started debugging" bar, which pushes the page down ~60 CSS px after the rect was measured, so the click landed on a tile; (3) the Chrome window was on another macOS Space -> the page stops painting. Page zoom (80 %) was NOT a cause: CDP mouse x/y are CSS px (verified with a pointerdown listener). Fixes in background.js: activate the tab + attach before measuring, stay attached 15 min. Still not verified end to end.
- Fallback that worked: drive Flow by hand with Claude in Chrome (ingredient search "SELIM" -> Isteme ekle -> type -> send; tile menu -> Indir -> 720p). 8 clips, 48 credits, ~20 min.
- Tudor-style rewrite (one topic as a walking journey, an off-screen filmer gag, a modern comparison, the next clip starting where the last one ended, speech filling 7-8 s) fixed the "disconnected" feel of v1: 26 s of dead air in v1, none in v2.

## 2026-11-09 - Flow "unusual activity" names page-modifying extensions
- While generating Yarasa Aga clips by hand-driving Flow with Claude in Chrome, the 10th submit in ~25 min failed with: "Olağan dışı etkinlikler tespit ettik. Sayfayı değiştiren tarayıcı uzantılarının sorunlara neden olabileceğini unutmayın." (We detected unusual activity. Browser extensions that modify the page can cause problems.)
- On that page at the time: the Erasio extension (injects "Temiz videoyu Erasio ile kaydet" buttons into every tile), the Flow Bridge extension (debugger attached), Claude in Chrome, plus my in-page JS (file-input capture, fetch of video URLs that failed CORS, canvas reads).
- How it is handled now: stop at the first flag, no retries; before a run, disable every extension that injects into flow.google.com (Erasio, VEO3 automation, etc.) and do not run page JS (fetch/canvas/prototype patches) in the Flow tab. Tell partners to check their extension list first.

## 2026-11-10 - Discipline layer
- New tools: words_check.py, quality_gate.py (+ ocr_mac.swift), shot_review.py, analysis_selftest.py; skill vidbucks-historical-pov; jury + gates in vidbucks-qa-revise; review loop + "form, never copy" in vidbucks-reference-to-video.
- The selftest found a real analyser miss: a cut right after a fast pan was not detected (pixel-change spike drowned in motion). Fixed with a colour-distribution jump signal that needs at least one stable side (a zoom/fractal churning on both sides is not a cut). Selftest 8/8.
- quality_gate on old deliveries: Yavuz v1 (sent to the user) had the picture stop at 8 s while sound ran 80 s (same concat bug as v2); the gate now FAILs that. Fatih final passes text OCR after delogo; its ECU open fails the hook rule (2.4 < 5).
- How it is handled now: no delivery without quality_gate PASS; analysers re-validated with analysis_selftest after every change.
- 2026-11-13 · multi-style films · An auto-drafted 11-segment film (cards from the narration, 4 brief photos reused) read as repetitive templates, scattered edits and thin media. · Now every film starts with a hand-written visual treatment (`visuals.json`: one specific idea + layout + media queries per line, styles on story acts with a reason), real media hunted per line with contact sheets (`media_hunt.py`), checked by `visual_check.py`, rendered with `ShotFilm` (14 layouts in each style's skin). Auto drafts are previews only.
- 2026-11-13 · style director · Trained lexical models (perceptron, rubric+scalars, kNN) did not transfer to unseen topics (<= 61 % acceptable styles; flat learning curve); a fresh agent with a written guide + 20 worked cases scored 83 % acceptable, 100 % shortlist recall blind. · Style decisions are made by the agent from `knowledge/director/GUIDE.md` + similar cases (`director_cases.py similar`); approved films become new cases (`director_cases.py add`); the blind exam measures progress (RESULTS.md).

## 2026-11-13 - ten taught ShotFilm films (production lessons)
- On-screen words are the SCRIPT's words; Whisper only lends times (it mishears names and writes years as digits). ShotFilm `scriptWords`.
- `quality_gate.py --lang tr` spells digits out before matching, so "1898'de" = "bin sekiz yüz doksan sekizde" (was a false FAIL).
- Photo scrim only on the lower third; a 60 % scrim buried every opening photo. First shot gets a pull-back reveal (hook).
- Maps: the camera fits all stops (not a fixed zoom); a map whose bounds are narrower than the route needs a wider print. `board_map.py` now splits rings at the seam (no world-wide bands).
- Natural Earth 1:50m cannot show the Bosphorus: city-scale routes need another layout (quote, detail) or a finer map.
- Stamps on dark skins: normal blend + dark backing, multiply makes them vanish. Number cards never sit on a picture that has its own numbers.

## 2026-11-13 - a style is not a skin (direction grammar)
- Ten ShotFilm films looked alike: same Ken Burns, same photo arrival, same caption; only colours changed. Rejected by the user.
- Now: every act has a DIRECTION (camera, enter, frame, caption, fonts, treat, texture, ornament, sound) and every line picks from 25 scenes (11 new: bars, chart, pictos, diagram, steps, board, filmstrip, bigword, typed, versus, gauge). `src/kits/shots/{prims,layouts,info}.tsx`.
- The pool and its "buildable next" list live in `knowledge/director/CAPABILITIES.md`; GUIDE.md section 5 says how to decide. User examples are illustrations, never mappings.
- `tools/variety_check.py` refuses neighbouring acts that only change colour and batches where two films share >= 70 % of their direction. Sound palettes per film in `videos/films/audio_all.py`.

## 2026-11-13 - channel study: nostalgia listicle with period footage (US nostalgia channel)
- What: the format lives on period FOOTAGE (their commercials/TV clips), not photos. Copying that is off limits, so footage now comes from `core/tools/archive_clips.py`: Internet Archive items accepted only from curated collections (prelinger) AND with a PD/CC0/BY/BY-SA licence field AND no "reserved" rights text. Uploader-set licences are not trusted (a Simpsons episode was marked CC0). Prelinger with a licence field is mostly 1940s-60s; 1970s-80s footage is rare, so 80s topics need object photos (Commons), Library of Congress photo sets (e.g. John Margolies "Roadside America", public domain) or the user's approval for AI period scenes.
- What: `scan` reads single frames over HTTP and `cut` copies only the seconds needed; look at a 1-s sheet of every cut before choosing `in` points (sponsored films hide brand logos and title cards inside 10 s).
- What: Whisper (faster-whisper) reads a raw numpy array as 16 kHz. Kokoro is 24 kHz: passing it raw stretched every word time by 1.5x. Resample before transcribe (make_narration.py already does; file paths are safe).
- What: Commons returns HTTP 429 for full-size originals in a burst; ask for `iiurlwidth=1920` (a standard step) and pause between files.
- How it is handled now: ShotFilm plays clips (`Pic.src` .mp4 + `in`), `montage` cuts on word indices, `tag` chapter pills, `pops` word-timed numbers, `after` bumper card, `brand` corner bug, treatments `vhs`/`kodak`, frame `inset`. Proof: `core/videos/films/fifties` (gate PASS, 16 cuts/min).

## 2026-11-14 - animated version of a still-image stick-figure serial
- What: a frame-difference scan in the Browser pane (canvas, 0.5 s steps) showed the reference is fully still between hard cuts (difference 0.0); its quality is the painted illustration + the writing. "Make it animated" therefore means a rigged character and moving light/camera, not motion added to stills.
- What: the image-generation account had 0 credits and no unlimited allowance, so every set is drawn in code (`core/src/kits/bunker`: comic-ink sets with a 3-frame outline "boil", rigged `Hero` on the engine's FK poses, word-pinned events). Ask the user before spending credits on painted plates; code-drawn sets are the free default.
- What: overlays that must stay put (countdown numbers, slams) go OUTSIDE the camera group, or they scale and drift with it; a camera that follows a runner needs the set wider than his whole path (black edge otherwise).
- How it is handled now: demo `Bunker-demo` (65 s, gate PASS, 16.5 cuts/min), study in `knowledge/channel-studies/second-person-survival-serial.md`.

## 2026-11-15 - editing the user's own gym clip (raw footage route)
- What: a 4K HEVC phone clip had to be graded first: plain contrast/gamma buried a backlit subject; lifting the shadows with a curve (`curves=master='0/0.03 0.06/0.18 0.18/0.42 0.45/0.70 0.8/0.90 1/0.97'`) plus a warm/teal colour balance worked. Grade + denoise once in ffmpeg into a working copy, then edit in Remotion.
- What: OffthreadVideo failed on 1620x2880 and 1440x2560 working copies with "Chrome rejecting the request because the disk space is low" while 1080x1920 worked; the disk was 98-99 % full. With little free space keep working copies at output size (1080x1920) and keep punch-ins modest (<= ~1.35x).
- What: rep tops were found by eye on a 0.2 s labelled crop sheet; a motion-centroid signal was confused by head movement.
- How it is handled now: `core/src/kits/gym/GymEdit.tsx` (segments with playbackRate for ramps, punch-in + flash + shake on beats, counter, cues, freeze ending), sound from a cue list on the measured tops (`videos/gym/cues.json`), music hard-stops on the freeze.

## 2026-11-16 - quick wins from the community-repo batch
- What: timing now has a forced-alignment option (`kit_timing.py --forced` -> `align_script.py`, stable-ts): the script's own words are placed on the narration, so spelled numbers ("eleven fifty two"), names and mishearings ("flash like" heard as "flashlight") no longer break word-pinned events. Tested on an English (163/163 words) and a Turkish film (48/48). Line starts become the first word's onset (~0.4 s later than a per-clip start).
- What: `review_sheets.py` gives the strips a single-still review misses; on its first run it found a 0.4 s black gap behind a sliding panel in the bunker demo (40.1 s).
- What: motion timing by feeling, spring presets, cut seams, caption limits, sound taste, mux-outside-the-renderer and review sheets are rules 13-20 in `docs/motion-rules.md`; "every note becomes a rule" is now in the revision protocol.
- How it is handled now: use `--forced` for any narration whose script is known; run review sheets before showing a draft.

## 2026-11-16 - new route: editing the user's own footage
- What: `core/tools/footage.py` (transcribe -> pack -> tighten -> render -> verify -> finish) + skill `vidbucks-footage-edit` + Remotion `FootageEdit` (captions, title, name card, punch-in over a muted cut; sound muxed back by ffmpeg). All local (faster-whisper), no paid transcription.
- What: verification needs two passes: whole-file re-transcription drifts near joins and flagged two healthy words; re-hearing a 4 s window around each suspect removed the false alarms, and a deliberately clipped word ("parks", 0.3 s cut out) was still caught.
- What: cut strips showed head jumps at same-take joins; `jump_zoom` (default 1.1 in drafts) alternates full frame and a slight push-in on consecutive segments of one source.
- What: this ffmpeg has no drawtext/subtitles filters, so captions and labels are always a Remotion layer.
- How it is handled now: footage edits follow the skill; never show a cut before `footage.py verify` and the cut strips.

## 2026-11-16 - long -> shorts and vertical reframe
- What: `footage.py highlights` scores phrase runs (motion, relative loudness, sharpness, darkness, question/number and speech-rate bonus; never across a picture cut) and writes short EDLs, strongest moment first; `"aspect"` in an EDL reframes with a YuNet face track + dead zone + pan limit, as a piecewise ffmpeg crop expression (one encode, no Remotion needed for the crop).
- What: a 3.5 min test became a 35 s 9:16 short, 96/96 words heard back. Limit seen on the contact sheet: in a three-person panel the camera drifted to the biggest face, not the speaker; tracking now strongly prefers the face it already follows; real active-speaker detection is still open.
- How it is handled now: look at the short's contact sheet for multi-face shots before delivery.

## 2026-11-16 - active speaker for vertical reframes
- What: picking "the biggest face" drifted to a listener in panel shots. Mouth motion alone also failed: a listener turning his head moves the mouth box (33 vs 15 for the real speaker), and frame-by-frame decisions with hysteresis were 1-2.5 s late and grabbed whoever moved first.
- What works now: mouth-vs-voice correlation (syllable rhythm) blended with head-gated mouth motion, camera motion cancelled by phase correlation, centred 1 s smoothing, Viterbi with a switch cost, 1.2 s minimum speaker shot, far switches as cuts. Synthetic two-speaker test switches at 4.2 s (truth 4.0); panel shots hold the presenter.
- Lesson: when a test disagrees with my expectation, look at the evidence (mouth crops) before "fixing": one "wrong" pick was the man who actually spoke first.

## 2026-11-16 - motion-graphic card library
- What: `core/styles/cards.json` + `src/kits/cards/Cards.tsx`: 5 styles (ink-editorial, swiss-paper, neon-tech, warm-doc, pop-print; each a palette, type pair, motion feel, texture) x 8 cards in two tiers (tier 1 takeovers: stat with count-up, thesis word by word, section, quote; tier 2 panel cards that keep the footage visible: label, list with items landing on their words, lower, versus). `tools/cards.py list|suggest|gallery`; footage overlays `{"kind": "card", ...}`.
- What: the first gallery squeezed 8 cards into one row and hid every tier-2 card (they live in the right-third zone); the first edit cut a label off at the frame edge. Text in a panel is now sized to the zone width.
- How it is handled now: after adding a style or card, render the gallery and look; after an edit with cards, check a still at every card (a cropped label reads as "fine" on a thumbnail).

## 2026-11-16 - text gate (text_check.py)
- What: OCR boxes per half second -> CUT (touches the frame), OVERLAP (centres within half a line: stacked lines of one block are fine), CONTRAST (WCAG ink vs ground; FAIL < 2:1 for >= 1 s, shorter = entrance/exit WARN), SAFE (4 % margin, phone UI on 9:16), GARBLED (English: two+ long non-words, how OCR reads overlapping text). `footage.py finish` runs it automatically.
- Found on first runs: dimmed "upcoming" list items at 0.18 opacity were unreadable (now 0.45); the bunker carriage clock is cut by the camera push; in-world text (signs, archive photos) needs `--ignore` with a reason, the tool cannot tell it from our overlays.

## 2026-11-16 - B-roll engine for footage edits
- What: `footage.py broll` plans word-anchored cutaway slots from noun phrases (spaCy), respecting the hook, cards/names and 2 s of face between cutaways; media through `media_hunt.py` (licensed photos/documents) or `broll-pick` (own footage, PD archive); `finish` renders full / panel / split B-roll and writes CREDITS.md.
- What: first plan picked "hundreds", "men" and a person's name; people, quantities, abstractions and PERSON entities are now skipped. Licensed stock for a 1956 talk came back modern (skylines, private people): for period talk the right source is period archive footage, so `broll-pick` exists and the skill puts archive before stock. A paper document was cropped by cover-fit; light paper-like pictures are now shown whole.
- How it is handled now: look at every candidate sheet; an empty slot beats a generic or anachronistic picture.

## 2026-11-16 - beat map (beatmap.py)
- What: tempo by onset autocorrelation with a 120 BPM prior, phase by an attack envelope over the WHOLE period, bar phase by bass energy, hits, quiet drops, intensity curve; `snap` within 0.15 s / 0.10 s; footage `finish` uses it for music in the EDL (snapped overlays + ducked mix).
- Validation on synthetic tracks with known grids: tempo exact on 4/6, octave errors on 2/6 (140->70, 66->132), phase within ~10 ms on all once three bugs were fixed: (1) a decimated envelope indexed as 1000 Hz drifted 0.23 % (60 ms over 30 s); (2) a 5 ms envelope rippled with each bass cycle of a pitch-swept kick; (3) a quarter-beat search could not leave a coarse phase that had locked onto a reverb echo. Snapped overlays land within 11 ms of the true grid.
- How it is handled now: pass --bpm when the user knows it; treat `low` confidence as "check by ear".

## 2026-11-16 - every format from one footage edit
- What: `footage.py formats` renders one EDL as 9:16 / 4:5 / 1:1 / 16:9 (per-shape reframe with the face / active-speaker camera, caption height per shape, panel cards in a top band on narrow shapes, full B-roll -> split on narrow shapes) and writes a side-by-side sheet; all four passed the text gate on the test edit.
- What: the sheet showed a doubled "paper" behind a paper document; the extra layer is gone (a light document is already its own paper).
- Open: the Remotion kits (ShotFilm, bunker, boards) still lay out for 1920x1080; reflowing them per shape is a separate job.

## 2026-11-16 - approval gates (gates.py)
- What: STORY (beat table: time, what, bridge, sound) -> LOOK (2-4 full frames side by side) -> BOARD (one numbered panel per beat, panels sent back by number); `check` blocks a full render until all three are approved; editing story.json after approval re-opens every gate (hash). Tested on the bunker demo with test approvals (removed afterwards).
- What: board panels taken 0.6 s into a beat showed the moment before its action; panels now sit 60 % into the beat.
- How it is handled now: new builds go through the gates with one-click questions; revisions of an approved film skip them.

- 2026-11-16 · Media kit (`src/kits/media/Media.tsx`): seven drawing media rebuilt in our own code after studying community style
  kits (ideas only): boiling ink + hatching, sketchbook, cut paper, riso three-plate halftone, low-res pixel with palette snap,
  isometric hairline, math stage; bridges Iris (circle/torn/star) and Beam. Registry: renderer "media" (author) for 11 styles that
  had no engine + 7 media of our own (111 styles). Lessons: an SVG mask filter must composite SourceGraphic IN the mask, not the
  other way round (the riso plates came out white); a scene that opens through an iris must start half-drawn (blank paper in the
  window reads as an error); keep isometric stacks inside the frame when they explode (the top layer left the frame at gap 120).

- 2026-11-16 · Automatic media scenes (MediaScene + segment_draft "media"): a 65 s narration renders in three media without
  hand-drawn art. Lessons: one picture per LINE left 8+ s stills -> beats are per sentence now (median shot 4.5 s); a random
  fallback icon (a box for "tunnel") is worse than words -> fallback is a short title; English "on" matched Turkish "on" (ten)
  in the spelled-number reader -> spelled numbers only when the timing language is tr; dimming unspoken caption words to 35 %
  failed the contrast gate -> 72 %; a ring inside an icon (coin edge, globe meridian) must never be filled (`ring: true`).

- 2026-11-16 · Media icons 17 -> 40 (train, tunnel, door, phone, city, car, ship, plane, key, lock, flame, wave, mountain, gear,
  shield, envelope, flag, crown, eye, cloud, bolt, moon, burst). On the 65 s test the beats that had to fall back to words
  dropped from 5 to 2 and every remaining icon names what the sentence is about. Same icon twice in a row is now skipped
  (two "train" beats in a row read as a frozen picture). A cut-paper hue must differ from its wall (green tree on teal
  stripes vanished). Renders failing with "getStaticCompositions is undefined" were a full disk, not a code error: check
  `df -h` first; download caches (npm, pip, Homebrew) are the safe things to clear.

- 2026-11-16 · Media beats: compare + list + side layout + automatic sound (media_cues.py). Lessons: Whisper split "4,500"
  into "4" ",500" and every later word slid one line -> use `kit_timing.py --forced` for media films (the script's own words);
  a year next to a number stole the hero -> the number wins, the year goes in the label; the first beat must start drawing
  0.2 s before frame 0 (fully drawn = a static hook, not drawn = blank paper). The quality gate measures life at 64x36, where
  a slow drift and a boiling line count as still: drawn media sit near 93 % "still" under profile layers (WARN, not FAIL);
  do not add fake motion to beat the number, check the cut strips instead.

- 2026-11-16 · Motion quality package: `src/kits/motion.ts` is now the one motion language (5 personalities, role curves,
  distance-scaled durations, capped stagger, secondary lag, OKLCH colour mixing, a sync-safe speed ramp); MediaScene and the
  card library read it, the draft maps a brief's tone to it, motion-rules 23-31 document it. Checked: bezier ends at 0 and 1,
  the ramp is monotonic and back in sync 1.1 s after the hit, 20 staggered items finish at 0.8 s, OKLCH blue -> orange has a
  vivid midpoint; the four-personality filmstrip shows the difference (snappy label at +0.22 s, calm at +0.65 s).
  Before writing new motion, import from motion.ts instead of typing durations.

- 2026-11-16 · Three format kits: ChatStory (+ tools/chat_story.py), DataRace, Countdown; demos in exports/ pass the quality
  gate (profile motion) and the text gate. Lessons: chat text must be ~50 px at 1080 wide (36 px read as a screenshot, not a
  video); OCR reads UI text through a 97 % title veil, so hide the layer instead; a period watermark at 22 % failed contrast
  (it carries information: 50 %); 6 items in a 10-row chart left half the frame empty (rows = min(top, items)); whip-slide
  lists froze 2 s per entry until a slow push and an icon float were added; a music-only mix needs its own loudness pass
  (single-pass loudnorm on a short bed landed at -18.4 LUFS).

- 2026-11-16 · Analysis: `detect_gradual` finds dissolves and fades (midpoint-blend test; a light ramp is rejected because both
  ends keep their structure) and the analyser lists them as transitions; a second cut detector (PySceneDetect) is compared
  in `cut_cross_check` (on graphic films it sees only full-frame shot changes: our extra points are content swaps on a shared
  background). Self-test is now 12/12. `sync_check.py` caught a real fault in the bunker demo: Whisper started every line's
  first word ~0.4 s early (it absorbs the pause before the line), so line-start events fired before the voice;
  forced alignment fixed it -> `kit_timing.py` now force-aligns by default when stable-ts is installed.
- 2026-11-16 · MorphBridge, Whiteboard, AdSpot + ad_variants, LogoReveal + logo_prep. Lessons: open the next world when its
  bridge object is finished; place the hand by arc length and measure words in their font (an estimate put the hand far
  ahead); write every optional prop explicitly (missing props silently fell back to the demo's offer text); a dark logo
  part on a dark ground needs the ink colour for its draw-on line; make the assembly's last part land on the sound-logo beat.

- 2026-11-16 · Registry -> kits: `countdown` and `whiteboard` are native MultiStyle renderers; the director picked the
  whiteboard for a process passage unprompted; chat-story, data-race, ad-spot and logo-reveal are config templates (115
  styles). Lessons: the countdown's list title was overwritten by the last entry's title (one variable name for both) -
  check the drafted edit.json, not only the render; a title card that holds 2.4 s on a dark ground read as "black / frozen"
  to the gate, so it now has a drifting light and a push; a spoken "Number three:" duplicates the rank on screen.

## 2026-11-19 - cloud sandbox: proxy, browser, stock
- Remotion's Chrome download (remotion.media) can be blocked: set REMOTION_BROWSER_EXECUTABLE to an installed chrome-headless-shell (remotion.config.ts reads it). Google Fonts then need the proxy CA in ~/.pki/nssdb (certutil).
- Node fetch ignores HTTPS_PROXY: run fetch-stock.mjs with NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=<bundle>. Wikimedia API may answer 429 from shared egress; Openverse search + a direct upload.wikimedia.org thumb URL with a descriptive User-Agent works.
- Stickman explainers fail the "life" gate when the camera is static: give each scene its own eased push toward its subject (keep the ground inside the camera layer, keep icons/captions in screen space).
