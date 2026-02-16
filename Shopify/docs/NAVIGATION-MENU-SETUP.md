# Navigation Menu Setup — Main Menu (main-menu)

The header uses the **main-menu** navigation. Configure it in Shopify Admin to link to Blending Lab, The Dojo, and product flows.

---

## Where to Edit

1. Go to your store admin: `https://YOUR-STORE.myshopify.com/admin`
2. In the left sidebar: **Online Store** → **Navigation**
3. Click **main-menu** (or whatever menu is assigned to the header in Theme Editor)

---

## Recommended MNKY VERSE Menu Structure

To align with the MNKY VERSE (The Experience, The Dojo, The Foundation), add these links:

| Menu Item      | Link / URL                                                                 |
|----------------|-----------------------------------------------------------------------------|
| Blending Lab   | `http://localhost:3000/blending` (dev) or `https://app.moodmnky.com/blending` (prod) |
| Match My Mood  | `http://localhost:3000/craft` (dev) or `https://app.moodmnky.com/craft` (prod) |
| The Dojo       | Your community/blog URL or `https://docs.moodmnky.com`                      |
| Shop           | `/collections/all` or your main collection                                 |
| Subscriptions  | `/collections/subscriptions`                                               |

---

## Development vs Production

- **Development**: Use `http://localhost:3000` as the base for app links (Blending Lab, Match My Mood) so nav items point to your local mnky-command-app.
- **Production**: Replace with your deployed app URL (e.g. `https://app.moodmnky.com`).

---

## Header Layout (Theme Editor)

The header uses:

- **Logo position**: middle-left (brand-focused)
- **Menu type**: mega (desktop)
- **Sticky**: on-scroll-up

To change these: **Customize** → select the header section → adjust in the right sidebar.
