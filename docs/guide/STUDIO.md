# Studio (AI Image Generation)

Generate AI fragrance scene images for your oils. Select a fragrance, customize the prompt, and publish to Media Library.

## Generating an Image

1. Go to **Studio** in the sidebar
2. Select a **fragrance** from the dropdown (or use URL params `?fragranceId=` or `?fragranceName=`)
3. The **prompt** is auto-filled from the fragrance scene prompts
4. Optionally add a **reference image** from Brand Assets for mascot consistency
5. Click **Generate** – The image is created via OpenAI and stored in the ai-generations bucket

## After Generation

- **Copy URL** – Copy the public URL for use elsewhere
- **Sync to Notion** – Push the image URL to the fragrance's Notion page
- The image appears in **Media Library** under ai-generations

## Reference Images

- Use **Brand Assets** bucket for mascot or brand reference images
- Reference images help maintain visual consistency across fragrance scenes

## Workflow Links

- **n8n** – Use the generate API for batch workflows (see Admin Docs)
- **Media Library** – Assign existing images to fragrances and sync to Notion
