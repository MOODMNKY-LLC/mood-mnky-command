# Navigation Menu Setup — Main Menu & Footer

The theme header uses the **main-menu** navigation. The footer uses the **footer** menu. Configure both in Shopify Admin to align with the MNKY VERSE and link to the app where appropriate.

---

## Where to Edit

1. Go to your store admin: `https://YOUR-STORE.myshopify.com/admin`
2. In the left sidebar: **Online Store** → **Navigation**
3. Edit **main-menu** for the header and **footer** for the footer link list

---

## Main Menu (Header)

Recommended structure aligned with Verse routes and brand pillars:

| Label                 | Link / URL                                                                 |
| --------------------- | -------------------------------------------------------------------------- |
| Home                  | /                                                                          |
| Shop                  | /collections/all or /collections/available-moods                            |
| Subscriptions         | /collections/subscriptions                                                 |
| Blending Lab          | https://mnky-command.moodmnky.com/blending (or /verse for landing)                  |
| Match My Mood / Craft | https://mnky-command.moodmnky.com/craft                                             |
| The Dojo / My Dojo    | https://mnky-command.moodmnky.com/verse/dojo — *Your private portal in the MNKY VERSE app.* |
| Explore               | https://mnky-command.moodmnky.com/verse/explore                                     |
| Blog                  | /blogs/hello-welcome-to-mood-mnky (or add secondary “Verse Blog” → app)   |
| Agents                | https://mnky-command.moodmnky.com/verse/agents                                     |
| Community             | Shopify page "Community" (Discord + store blog + Verse blog) or https://mnky-command.moodmnky.com/verse/community |

**Mega menu (optional):** In **Customize** → Header group, you can group items (e.g. **Shop**: Shop, Subscriptions; **The Verse**: Blending Lab, Dojo, Explore, Blog, Agents, Community).

### MOOD LABZ on the store

To show **MOOD LABZ** in the main nav with a **landing page** and a **dropdown** (Fragrance Wheel, Blending Lab, Glossary, Formulas, Fragrance Oils), create the pages in LABZ (Store → LABZ Pages), upload the theme templates from repo, then in **Main menu** add parent **MOOD LABZ** linking to the landing page and add the five content pages as children. See [SHOPIFY-LABZ-PAGES-AND-MENU.md](../../docs/SHOPIFY-LABZ-PAGES-AND-MENU.md) for the full steps and template list.

---

## Footer Menu

The theme footer includes a **Community** text block (Discord, store blog, MNKY VERSE blog). You can also add these to the **footer** link list in Admin. Create or edit the **footer** menu with links such as:

| Label        | Link / URL                                      |
| ------------ | ----------------------------------------------- |
| About        | Link to “Who We Are” page                       |
| MNKY VERSE   | https://mnky-command.moodmnky.com/verse                  |
| Discord      | (Discord invite link — set when available)     |
| Store Blog   | /blogs/hello-welcome-to-mood-mnky              |
| Verse Blog   | https://mnky-command.moodmnky.com/verse/blog            |
| Contact      | /pages/contact (or contact page)               |
| Refund policy| /policies/refund-policy                         |
| Privacy policy | /policies/privacy-policy                     |
| Terms of service | /policies/terms-of-service                 |

---

## Development vs Production

- **Development:** Use `http://localhost:3000` as the base for app links so the nav points to your local app.
- **Production:** Use `https://mnky-command.moodmnky.com` for all app links (Blending Lab, Craft, Dojo, Explore, Agents, Community, Verse blog).

---

## Header Layout (Theme Editor)

The header uses:

- **Logo position:** middle-left (brand-focused)
- **Menu type:** mega (desktop)
- **Sticky:** on-scroll-up

To change: **Customize** → select the header section → adjust in the right sidebar.
