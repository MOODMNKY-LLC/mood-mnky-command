# Theme App Extension — Your Dashboard Walkthrough

The theme app extension and app blocks are set up in the codebase. Follow these steps to deploy and use them in your store.

---

## One-time setup (you run these in terminal)

### Step 1: Link your app (creates or connects Partner app)

From the project root:

```bash
cd c:\DEV-MNKY\MOOD_MNKY\mood-mnky-command
shopify app config link
```

- Log in to Shopify if prompted
- Choose **Create new app** or **Link to existing app**
- Select your dev store
- When done, `client_id` will be added to `shopify.app.toml`

### Step 2: Deploy the extension

```bash
shopify app deploy
```

- Confirm when asked
- When it finishes, the MOOD MNKY app and its blocks are deployed to your Partner app

---

## Part 1: Install the app on your store (Partner Dashboard)

1. Go to **[partners.shopify.com](https://partners.shopify.com)** → sign in
2. Open **Apps** in the left sidebar
3. Click **MOOD MNKY** (or whatever you named it)
4. Open the **Test your app** (or **Install app**) area
5. Choose your dev store and click **Install**
6. Approve access when prompted

---

## Part 2: Add app blocks to your theme (Theme Editor / Store Admin)

1. Go to your store admin: `https://YOUR-STORE.myshopify.com/admin`
2. In the left sidebar, go to **Online Store** → **Themes**
3. On your active theme, click **Customize**
4. In the theme editor:
   - Select a section (e.g. homepage “Featured collection”, “Rich text”, etc.)
   - Click **Add block**
   - Under **Apps**, choose **MOOD MNKY Theme**
   - Pick one of:
     - **Blending Lab CTA**
     - **Match My Mood CTA**
     - **Subscription CTA**
     - **Latest from MNKY VERSE**
5. In the block settings (right sidebar), set:
   - **App base URL**: your mood-mnky-command app URL  
     - Dev: `http://localhost:3000`  
     - Prod: `https://mnky-command.moodmnky.com` (or your deployed URL)
6. Adjust heading, subheading, and button label if needed
7. Click **Save**

---

## Where you can add blocks

App blocks can be added to any section that supports apps, for example:

| Page   | Sections that usually support app blocks |
|--------|------------------------------------------|
| Home   | Featured collection, Rich text, Image with text, Custom liquid |
| Product| Main product, Product recommendations    |
| Collection | Collection list, Featured collection  |
| Page   | Custom sections                        |

---

## App embed: MNKY Assistant (chat bubble)

The **MNKY Assistant** is an app embed block that shows a floating chat button on the storefront. When visitors click it, an AI assistant helps with product discovery, FAQs, and shipping info.

### Enable MNKY Assistant

1. In the theme editor, go to **Theme settings** (gear icon) in the left sidebar
2. Scroll to **App embeds**
3. Find **MOOD MNKY Theme** → **MNKY Assistant**
4. Enable it (toggle on)
5. Configure:
   - **Enable MNKY Assistant**: checked
   - **App base URL**: e.g. `https://mnky-command.moodmnky.com` (dev: `http://localhost:3000`)
   - **Button position**: Bottom right or Bottom left
   - **Button color**: Optional accent color
6. Click **Save**

The chat button will appear on all store pages (unless restricted by template settings). The widget loads from `{app_base_url}/assistant/widget` in an iframe.

---

## Quick reference: block purposes

| Block                 | Use for                          | Default path |
|-----------------------|----------------------------------|--------------|
| Blending Lab CTA      | Link to fragrance Blending Lab  | `/blending`  |
| Match My Mood CTA     | Link to fragrance finder        | `/craft`     |
| Subscription CTA     | Link to subscription experience | `/blending`  |
| Latest from MNKY VERSE | Fetches blog posts from app API | `GET /api/verse/blog` |

| App embed             | Use for                                |
|-----------------------|----------------------------------------|
| MNKY Assistant        | Floating AI chat on native store pages |

---

## Iterative Dev Workflow (Three Environments)

| Step | Command / Action | Purpose |
|------|------------------|---------|
| 1 | `shopify theme dev` | Theme preview on port 9292; hot-reload Liquid/CSS |
| 2 | `pnpm dev` | mnky-command-app on localhost:3000 |
| 3 | `shopify app dev --reset` | App tunnel, OAuth, GraphiQL |
| 4 | Theme Editor -> set app_base_url to `http://localhost:3000` | CTAs link to local app |
| 5 | Edit Liquid/sections -> save -> refresh theme preview | Iterate on nav, copy, layout |
| 6 | Edit extension blocks -> `shopify app deploy` | Push block changes |

---

## Navigation Menu (main-menu)

The header uses **main-menu**. Add Blending Lab, Match My Mood, The Dojo, and Shop links in **Online Store -> Navigation**.

See **[NAVIGATION-MENU-SETUP.md](./NAVIGATION-MENU-SETUP.md)** for recommended MNKY VERSE menu structure and dev vs prod URLs.

---

## Troubleshooting

- **“MOOD MNKY Theme” not in Apps list** → Ensure the app is installed on the store (Part 1) and you’ve saved the theme at least once after adding a block
- **Buttons look disabled** → Set **App base URL** in the block settings
- **Blocks don’t appear** → Confirm you’re editing a section that accepts app blocks (Online Store 2.0–compatible theme)
