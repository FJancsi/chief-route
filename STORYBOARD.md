# Career Quest: Storyboard

The source of truth for the storyline. One row = one SPACE press = one LV (R39).
Based on **timeline v1.2** from the planning chat (`chat_export.json`), plus the **TMP mentor scene** (added 2026-11-05).
Total: **26 presses** (`LV_MAX = 26`), about 6.5–7 minutes at roughly 15 seconds per scene.

## Locked rules
| # | Rule |
|---|---|
| R1 | SPACE is the only key. Each scene plays its own animation. SPACE during a scene jumps to its end. |
| R37 | The hero is always drawn at 2×. Outfit and age changes are sprite swaps, never zooms. |
| R38 | Home, elementary school, high school and university are separate scenes, each with its own GUILD. |
| R39 | LV = scene index, +1 per SPACE press. |
| R40 | The last frame of a scene stays on screen until the next SPACE, even when the scene is skipped. |
| R41 | The HUD has a YEAR field, so the ~20 years still show. |
| R42 | NodeJS is learned in the Hotels.com scene. |
| R43 | 2026: PATH changes FRONT-END → FULLSTACK, after D5. |

## Content decisions
| # | Decision |
|---|---|
| R26 | Alfresco/KES belongs to **Hotels.com**. It appears as an info line in the D3 scene: *"Still in Hotel Empire: KES re-architecture, CMS → FLEX"* |
| R28 | Outfits: hoodie *Procrastination +1*, D2 *Impostor syndrome ++*, D3 flip-flops *Review speed ++, Responsibility ++*, D4 backwards QA cap *Scalability ++, Availability ++, Trade-off Vision ++*, D5 Chief's Brew. No matching team shirts. |
| R36 | Closing line: *"You have one life, don't blow it. Mahalo 🤙"*. *"The age of human coding is over"* is not used anywhere. |
| R21 | Open ending: **A NEW GAME BEGINS…** |
| — | Real client names are shown in dialogs; `?anon` hides them. |

## Titles and years
| Grade | Title | Years |
|---|---|---|
| — | No title (led 2 teams at CAS) | 2007–2016 |
| D2 | Mid Software Engineer | 2016–2018 |
| D3 | Senior Software Engineer | 2018–2022 |
| D4 | Lead Software Engineer | 2022–2025 |
| D5 | Chief Software Engineer I | 2025– |

## Hero outfits
`kid → teen → student → casual (coffee starts) → frontend (shades) → d2 (Hawaiian shirt) → d3 (shorts + flip-flops) → d4 (backwards QA cap, legendary shirt) → d5 (Chief's Brew 🍺)`

## Scenes

| LV | Scene | GUILD | YEAR | Main moment | Status |
|---|---|---|---|---|---|
| — | Title | — | — | CAREER QUEST: FROM C64 TO CHIEF | built |
| 1 | 🏢 Home | HOME | age 12 | Block of flats. The chest opens with a **C64**, and the `READY.` screen stays up | built |
| 2 | 🏫 Elementary school | ELEMENTARY SCHOOL | 1995+ | Win95 lessons: **POINT & CLICK** | built |
| 3 | 🏫 High school | HIGH SCHOOL | — | Grows into the teen sprite. **Pascal Spellbook**, **dBase Scroll** | built |
| 4 | 🔴 The Matrix | HIGH SCHOOL | 1999 | Code rain, Morpheus, the red pill. Quest: become a software engineer | built |
| 5 | 🎓 University | UNIVERSITY | — | Hoodie. Nokia Brick (SZTE), C Dagger + bird (Ornithological Institute), Objective-C Bow (CAS iOS internship) | built |
| 6 | First job | SMALL CO. | 2007 | Automation tester: **Selenium Crossbow**, Markup & Style (HTML/CSS), casual wear + ☕ | built |
| 7 | Merchant Town | SMALL CO. | — | Web shops: Cart Bugs, Payment Goblin, **IE6 Troll**. Drupal Droplet, JS basics | built |
| 8 | CAS | CAS | 2012 | Silverlight Shield (1 year) cracks → **Vaadin Halberd** (1 year) | built |
| 9 | The Great Choice | CAS | 2014 | PoC: JS beats Vaadin. **PATH: FRONT-END**, shades, JS Sword, TypeScript Armour, AngularJS Beta Blade + Dojo (*"This weapon may return…"*) | built |
| 10 | Party Leader | CAS | 2015 | 2 teams, 2 projects, **SDLC Cycle**. Still `TITLE: ---` | built |
| 11 | **D2**: first title | EPAM | 2016 | The EPAM gate opens. 🌺 Hawaiian shirt: *Impostor syndrome ++* | built |
| 12 | 🥤 Soda Kingdom | EPAM | 2016 | **Coca-Cola**: you build the JS SDK core. **Widget Forge**, which "launches sites in days" (payoff for Merchant Town) | built |
| 13 | 🏨 Hotel Empire | EPAM | 2017 | **Hotels.com**: SEO Crawler Spiders, **9 UIE companions** join (UIE pool lead, Nov 2017, first mentee), **Hackathon Arena** won, **NodeJS** learned | built |
| 14 | **D3** | EPAM | 2018 | 🩴 Flip-flops: *Review speed ++, Responsibility ++*. **Gatekeeper** (tech interviews + ASMT expert), the counters start. KES info line (R26) | built |
| 15 | 🏦 Emerald Vault | EPAM | — | **Bank of Ireland** (D3–D5): Audience Builder on GCP, **BigQuery Telescope**, learns **Microfrontend Shards** (GCP MFE PoC) | built |
| 16 | **D4** | EPAM | 2022 | 🧢 Backwards QA cap, legendary shirt. **GWS army of 26** (13 Dev, 6 QA, 5 DevOps, 1 BA, 1 SA). Loan Calculator Amulet, Web Chat Crystal, Pattern Library Tome. AWS Cloud Ascension (SQS, SNS, Lambda) | built |
| 17 | 🐉 AngularJS Sunset Dragon | EPAM | — | *"The blade you forged at CAS has turned against you!"* | built |
| 18 | Quality arsenal | EPAM | — | **Lighthouse Lantern** (CLI on AWS), **Artillery Cannon**, **Playwright+Axe Shield** (WCAG 2.1 AA), crafting bench: npm `adaptive-loading-helper`, `image-optimizer` | built |
| 19 | 🗿 On-Prem Golem | EPAM | — | **Monocle of Audit** first (Bungie and VAS code audits). SAS graduate work: **Ticket X** moves from on-premises to GCP | built |
| 20 | 🐍 RFP Hydra | EPAM | — | **Landis IoT** RFP and the **GWS UK migration** RFP | built |
| **21** | ⭐ **TMP: The Mentor** (NEW) | EPAM | **2024** | **Andrii**, mentor and friend: *"There is no associate."* Joins the party. See below | built |
| 22 | **D5**: ASMT Trial | EPAM | 2025 | ⚖️ The ASMT Trial, then **TITLE UP: Chief Software Engineer I**. 🍺 Chief's Brew. Andrii: *"Chief, now you are. Proud, I am."* (`mentorNod`) | built |
| 23 | Mentoring council | EPAM | — | **ASE Mentoring**, **JSCC Ambassador**. Counters: 51 interviews, 46 ASMT sessions (9 committees), 27 mentees (20 + 5 + 2). The Hydra keeps growing heads and you cut them faster (more RFPs) | built |
| 24 | 🆕 Fullstack | EPAM | 2026 | **PATH: FULLSTACK** with the `stack` icon (front end + NodeJS + cloud) | built |
| 25 | 🤖 AI era | EPAM | 2026 | The Matrix rain returns (callback to LV 4). The JS Sword dissolves → **Agent Staff**, AI companions (Copilot, Claude Code, MCP portals). The hero relaxes in a beach chair while agents code | built |
| 26 | 🏁 Finale | — | — | Trophy room (408 badges), final stats, *"You have one life, don't blow it. Mahalo 🤙"*, then **A NEW GAME BEGINS…** | built |

## ⭐ TMP: The Mentor (LV 21, 2024, D4)
In 2024, while D4, Janos joined **TMP (Technology Mentoring Program)**. TMP is also listed among his certifications. His mentor **Andrii** prepared him for the Chief title, became a friend, and encouraged him to go for **Chief** instead of **Associate Chief**. *"He was kinda Yoda to me."*

It sits after the RFP Hydra (the last D4 scene) and right before the D5 promotion, which it leads into.

| Beat | On screen |
|---|---|
| 1 | Wipe to the misty green **dojo** world. YEAR → 2024. Banner: *SIDE QUEST: TMP – TECHNOLOGY MENTORING PROGRAM* |
| 2 | The hero walks in. **Master Andrii**, hooded robe and a staff with a glowing tip, faces him |
| 3 | ANDRII: *"Hmm. Long you have walked, D4. Ready for the Chief path, you are."* |
| 4 | YOU: *"Associate Chief first, maybe? Safer, it sounds..."* |
| 5 | ANDRII: *"Associate Chief? No! Chief, or Chief not. There is no associate."* (small screen shake) |
| 6 | SKILL UP: **CHIEF MINDSET**, Confidence ++, Impostor syndrome -- (pays off the D2 *"Impostor syndrome ++"*) |
| 7 | ANDRII: *"Train you, I will. And a friend, I will be."* |
| 8 | Andrii walks behind the hero and joins the party. Banner: *NEW PARTY MEMBER: ANDRII – MENTOR & FRIEND* |
| Final frame | Andrii stands behind the hero (R40) |
| LV 22 (D5) | ANDRII: *"Chief, now you are. Proud, I am."* He stays in the party until here |

Notes:
- **Yoda reference:** the wording is Yoda-like, but Andrii has his own look. He is a hooded mentor, not a green-skinned Yoda copy.
- **Real name:** dialogs show `MASTER ANDRII (TMP mentor)`. `?anon` hides the part in brackets.
