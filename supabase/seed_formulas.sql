-- Whole Elise Formulas Seed
-- Source: https://wholeelise.com/calculators/
-- Manually curated from blog tutorials

-- Whipped Body Butter (250g) - https://wholeelise.com/blog/whipped-body-butter/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Whipped Body Butter', 'whipped-body-butter', 'Whipped, creamy and impossibly light body butter. Velvety smooth, melt at a touch.', 'skincare', 250, 'whole-elise', 'https://wholeelise.com/blog/whipped-body-butter/', '{"body-butter", "whipped"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Heated Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Mango Butter', 'Emollient', 39.2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Cocoa Butter', 'Emollient', 14.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Cetyl Alcohol', 'Fatty Alcohol', 4.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Fractionated Coconut Oil', 'Carrier / Emollient', 19.6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Brazil Nut Oil', 'Carrier / Emollient', 14.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Vitamin E Oil', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Essential Oils (Optional)', 'Fragrance', 1, true);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Arrowroot Powder', 'Powder / Texture', 4.9, false);
END $;

-- Emulsified Body Butter (200g) - https://wholeelise.com/blog/emulsified-body-butter-formula/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Emulsified Body Butter', 'emulsified-body-butter', 'Water and oil emulsified body butter with velvety soft whipped cream texture.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/emulsified-body-butter-formula/', '{"body-butter", "emulsified"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 46.1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Aloe Vera Concentrate', 'Aqueous Phase', 9.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Glycerine', 'Humectant', 1.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Xanthan Gum', 'Thickener', 0.5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 19.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Avocado Oil', 'Carrier / Emollient', 9.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Emulsifying Wax NF', 'Emulsifier', 7.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Cetearyl Alcohol', 'Fatty Alcohol', 1.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Optiphen Plus (Preservative)', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oil (Optional Fragrance)', 'Fragrance', 1, true);
END $;

-- Body Butter Bars (100g) - https://wholeelise.com/blog/body-butter-bars/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Body Butter Bars', 'body-butter-bars', 'Simple 3-ingredient body butter bars. Perfect for beginners.', 'skincare', 100, 'whole-elise', 'https://wholeelise.com/blog/body-butter-bars/', '{"body-butter", "bars"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Main') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Cocoa Butter', 'Emollient', 50, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Olive Oil', 'Carrier / Emollient', 33, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Beeswax', 'Stabilizer', 16, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Vitamin E Oil (optional)', 'Antioxidant', 1, false);
END $;

-- Lotion Bars (150g) - https://wholeelise.com/blog/lotion-bars/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Lotion Bars', 'lotion-bars', 'Solid emulsified bars for use on wet or dry skin. Creamy when mixed with water.', 'skincare', 150, 'whole-elise', 'https://wholeelise.com/blog/lotion-bars/', '{"lotion", "bars"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 34.3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Cocoa Butter', 'Emollient', 9.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Almond Oil', 'Carrier / Emollient', 14.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Fractionated Coconut Oil', 'Carrier / Emollient', 11.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Candelilla Wax', 'Stabilizer', 7.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Olivem 1000 Emulsifying Wax', 'Emulsifier', 14.7, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Arrowroot Powder', 'Powder / Texture', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Optiphen Preservative', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Vitamin E Oil', 'Antioxidant', 1, false);
END $;

-- Candy Cane Whipped Butter (200g) - https://wholeelise.com/blog/candy-cane-whipped-butter/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Candy Cane Whipped Butter', 'candy-cane-whipped-butter', 'Festive peppermint whipped butter with candy cane swirl. Light and easy to make.', 'diy', 200, 'whole-elise', 'https://wholeelise.com/blog/candy-cane-whipped-butter/', '{"body-butter", "whipped", "festive"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Heated Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Cocoa Butter', 'Emollient', 60, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Sunflower Oil or MCT Oil', 'Carrier / Emollient', 38, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Peppermint Essential Oil (optional)', 'Fragrance', 1, true);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil (optional)', 'Antioxidant', 1, false);
END $;

-- Whipped Shea Body Butter (204g) - https://wholeelise.com/blog/whipped-shea-body-butter/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Whipped Shea Body Butter', 'whipped-shea-body-butter', 'Classic whipped shea body butter with kokum butter for stability. Smooth and non-greasy.', 'skincare', 204, 'whole-elise', 'https://wholeelise.com/blog/whipped-shea-body-butter/', '{"body-butter", "whipped", "shea"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Heated Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 39.2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Kokum Butter', 'Emollient', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Ayurvedic Herbal Oil', 'Carrier / Emollient', 44.1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Cetearyl Alcohol', 'Fatty Alcohol', 4.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Cornstarch', 'Powder / Texture', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oil (Optional)', 'Fragrance', 1, true);
END $;

-- Gingerbread Body Butter Bars (201g) - https://wholeelise.com/blog/gingerbread-body-butter-bars/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Gingerbread Body Butter Bars', 'gingerbread-body-butter-bars', 'Festive gingerbread-spiced butter bars. Last-minute DIY gift.', 'diy', 201, 'whole-elise', 'https://wholeelise.com/blog/gingerbread-body-butter-bars/', '{"body-butter", "bars", "festive"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Heated Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Cocoa Butter', 'Emollient', 49.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'MCT Oil', 'Carrier / Emollient', 30.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Beeswax', 'Stabilizer', 17.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Ginger Essential Oil', 'Fragrance', 0.5, true);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Cinnamon Essential Oil (optional)', 'Fragrance', 0.5, true);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Vitamin E Oil (optional)', 'Antioxidant', 0.5, false);
END $;

-- Peppermint Lip Scrub (100g) - https://wholeelise.com/blog/peppermint-lip-scrub/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Peppermint Lip Scrub', 'peppermint-lip-scrub', 'Gentle exfoliating lip scrub with peppermint. Sugar and oil based.', 'skincare', 100, 'whole-elise', 'https://wholeelise.com/blog/peppermint-lip-scrub/', '{"lip", "scrub", "exfoliant"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Main') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Sugar', 'Exfoliant', 70, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Sunflower Oil or MCT Oil', 'Carrier / Emollient', 28, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Peppermint Essential Oil', 'Fragrance', 2, true);
END $;

-- Foaming Whipped Sugar Scrub (207g) - https://wholeelise.com/blog/foaming-whipped-sugar-scrub/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Foaming Whipped Sugar Scrub', 'foaming-whipped-sugar-scrub', 'Foaming sugar scrub with rich lather. SCI surfactant, gentle exfoliation.', 'skincare', 207, 'whole-elise', 'https://wholeelise.com/blog/foaming-whipped-sugar-scrub/', '{"scrub", "exfoliant", "foaming"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Sodium Cocoyl Isethionate (SCI)', 'Surfactant', 17.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Distilled Water', 'Aqueous Phase', 9.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Cocamidopropyl Betaine', 'Surfactant', 8.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Sorbitol', 'Humectant', 4.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Glycerine', 'Humectant', 2.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Mango Butter', 'Emollient', 4.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Fractionated Coconut Oil', 'Carrier / Emollient', 6.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Emulsifying Wax', 'Emulsifier', 4.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Stearic Acid', 'Thickener', 2.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Preservative Eco', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils (optional)', 'Fragrance', 1, true);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 4, 'Cool Down 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Granulated Sugar', 'Exfoliant', 29, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Poppy Seeds', 'Exfoliant', 4.8, false);
END $;

-- Shimmer Body Butter Bars (201g) - https://wholeelise.com/blog/shimmer-body-butter-bars/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Shimmer Body Butter Bars', 'shimmer-body-butter-bars', 'Festive body butter bars with gold shimmer. Melt-on-skin bars with sparkle.', 'diy', 201, 'whole-elise', 'https://wholeelise.com/blog/shimmer-body-butter-bars/', '{"body-butter", "bars", "shimmer"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Heated Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 49.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Almond Oil', 'Carrier / Emollient', 32.3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Candelilla Wax', 'Stabilizer', 14.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Gold Shimmer Mica Powder', 'Colour', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils (Orange & Vanilla)', 'Fragrance', 1, true);
END $;

-- Natural Shampoo Bar (205g) - https://wholeelise.com/blog/natural-shampoo-bar/
-- Note: Recipe total 205g; scaled to 100g equivalent for display. Using actual weights.
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Natural Shampoo Bar', 'natural-shampoo-bar', 'Sulphate-free powdered SCI shampoo bar. pH balanced, mild for all hair types.', 'haircare', 205, 'whole-elise', 'https://wholeelise.com/blog/natural-shampoo-bar/', '{"shampoo", "bar", "sulphate-free"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase A') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Sodium Cocoyl Isethionate (SCI)', 'Surfactant', 63.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Cocamidopropyl Betaine', 'Surfactant', 14.6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Kaolin Clay', 'Cleansing Agent', 2.4, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase B') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Glycerine', 'Humectant', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Cationic Guar Gum', 'Thickener', 0.5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Phase C') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Jojoba Oil', 'Carrier / Emollient', 6.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Rosehip Oil', 'Carrier / Emollient', 2.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'D Panthenol', 'Conditioner', 2, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 4, 'Phase D') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Iscaguard PFA Preservative', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil', 'Antioxidant', 0.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential or Fragrance Oils (Optional)', 'Fragrance', 1, true);
END $;

-- Body Butter Bronzer (206g actual, recipe states 100g) - https://wholeelise.com/blog/body-butter-bronzer/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Body Butter Bronzer', 'body-butter-bronzer', 'Ultra-moisturising body butter with rich bronzing hue that evens out skin tone and deeply nourishes skin.', 'skincare', 206, 'whole-elise', 'https://wholeelise.com/blog/body-butter-bronzer/', '{"body-butter", "bronzer", "makeup"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase A') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Cupuaçu Butter', 'Emollient', 25.2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Kokum Butter', 'Emollient', 14.6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Coco-Caprylate/Capric', 'Carrier / Emollient', 12.6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Grapeseed Oil', 'Carrier / Emollient', 9.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Stearic Acid', 'Fatty Acid / Thickener', 6.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Cetearyl Alcohol', 'Fatty Alcohol', 4.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase B') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Coco-Caprylate/Capric', 'Carrier / Emollient', 14.6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Cornstarch', 'Powder / Texture', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Red-Brown Iron Oxide', 'Colour / Texture', 1.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Bronze Mica Powder', 'Colour / Texture', 1.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Gold Mica Powder', 'Colour / Texture', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Honey Pigment Powder', 'Colour / Texture', 0.5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Optiphen (Preservative)', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 0.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential or Fragrance Oils (Optional)', 'Fragrance', 1, true);
END $;

-- DIY Body Balm Tube (150g) - https://wholeelise.com/blog/diy-body-balm-tube/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Body Balm Tube', 'body-balm-tube', 'Soft-set balm in a squeeze container. Semi-set state allows instant melting when squeezed. Perfect for on-the-go applications.', 'skincare', 150, 'whole-elise', 'https://wholeelise.com/blog/diy-body-balm-tube/', '{"balm", "tube", "on-the-go"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Heated Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Almond Oil', 'Carrier / Emollient', 46.1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Jojoba Oil', 'Carrier / Emollient', 29.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Shea Butter', 'Emollient', 9.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Cetearyl Alcohol', 'Fatty Alcohol', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Candelilla Wax', 'Stabilizer', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Berry Wax', 'Stabilizer', 2.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Essential Oils (Optional Fragrance)', 'Fragrance', 1, true);
END $;

-- Emulsified Sugar Scrub (200g) - https://wholeelise.com/blog/emulsified-sugar-scrub/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Emulsified Sugar Scrub', 'emulsified-sugar-scrub', 'Creamy, luxurious exfoliating scrub. Emulsifiers create lotion-like texture that rinses clean without greasy residue.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/emulsified-sugar-scrub/', '{"scrub", "exfoliant", "emulsified"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Oil Phase (heated)') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Mango Butter', 'Emollient', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Cocoa Butter', 'Emollient', 3.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Almond Oil', 'Carrier / Emollient', 26.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Fractionated Coconut Oil', 'Carrier / Emollient', 14.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'BTMS-50 Emulsifying Wax', 'Emulsifier', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Cetyl Alcohol', 'Fatty Alcohol', 2, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Optiphen Preservative', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil (antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils (optional)', 'Fragrance', 1, true);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Mica Powder (optional)', 'Colour / Texture', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'White Granulated Sugar (exfoliant)', 'Exfoliant', 39.1, false);
END $;

-- Basic Natural Face Cream (200g) - https://wholeelise.com/blog/basic-natural-face-cream/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Basic Natural Face Cream', 'basic-natural-face-cream', 'Lightweight face cream with minimal ingredients. Only 12% oil content, boosted with colloidal oatmeal for moisture without greasiness.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/basic-natural-face-cream/', '{"face-cream", "lightweight", "natural"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 78.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Colloidal Oatmeal', 'Moisturiser / Soothing', 1, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Avocado Butter', 'Emollient', 2.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Grapeseed Oil', 'Carrier / Emollient', 8.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Emulsifying Wax BP', 'Emulsifier', 4.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Leucidal Liquid SF (Natural Preservative)', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Fragrance Blend (Essential Oils)', 'Fragrance', 0, true);
END $;

-- Magnesium Oil Foot Butter (200g) - https://wholeelise.com/blog/magnesium-oil-foot-butter/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Magnesium Oil Foot Butter', 'magnesium-oil-foot-butter', 'Intensive moisturising foot butter with magnesium. Boosts moisturising potential and helps fight fungal infections.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/magnesium-oil-foot-butter/', '{"foot-butter", "magnesium", "intensive"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Magnesium Flakes', 'Mineral / Exfoliant', 13.2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Warm Water', 'Aqueous Phase', 13.2, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 52.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Jojoba Oil', 'Carrier / Emollient', 15.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Emulsifying Wax', 'Emulsifier', 2.6, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Preservative Eco (Natural Preservative)', 'Preservative', 1.1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil', 'Antioxidant', 1.1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils Blend', 'Fragrance', 0.5, true);
END $;

-- Hair Conditioner Bars (200g) - https://wholeelise.com/blog/hair-conditioner-bars/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Hair Conditioner Bars', 'hair-conditioner-bars', 'Solid conditioner bars that restore moisture, shine and bounce. Perfect for travel and hassle-free wash days.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/hair-conditioner-bars/', '{"conditioner", "bars", "hair"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Oil phase (heated)') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Mango Butter', 'Emollient', 19.2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Unrefined Avocado Oil', 'Carrier / Emollient', 12.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'BTMS-50 Emulsifying Wax', 'Emulsifier / Conditioner', 33.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Cetyl Alcohol', 'Fatty Alcohol', 17.3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Stearic Acid', 'Fatty Acid / Thickener', 2.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool down 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Glycerine', 'Humectant', 6.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Panthenol Powder (vitamin B5)', 'Conditioner', 1.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Cationic Guar gum', 'Thickener / Conditioner', 1.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool down 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Optiphen Preservative', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil (antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils (optional)', 'Fragrance', 1.9, true);
END $;

-- DIY 'Mac' Fix+ Prep Prime (200g) - https://wholeelise.com/blog/diy-mac-fix-plus-prep-prime/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('DIY ''Mac'' Fix+ Prep Prime', 'diy-mac-fix-plus-prep-prime', 'All-natural recreation of Mac makeup setting spray. Hydrates, refreshes and sets makeup and skin.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/diy-mac-fix-plus-prep-prime/', '{"makeup-spray", "setting-spray", "diy-recreation"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Main') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 87, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Butylene Glycol', 'Humectant', 5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Glycerine', 'Humectant', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Cucumber Extract', 'Soothing / Antioxidant', 3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Chamomile extract', 'Soothing / Anti-inflammatory', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Green Tea extract', 'Antioxidant / Soothing', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 7, 'D Panthenol (vitamin B5)', 'Conditioner', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 8, 'Preservative Eco', 'Preservative', 1, false);
END $;

-- DIY 'Fenty Skin' Fat Water Toner (200g) - https://wholeelise.com/blog/diy-fenty-skin-fat-water-toner/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('DIY ''Fenty Skin'' Fat Water Toner', 'diy-fenty-skin-fat-water-toner', 'All-natural recreation of Fenty Skin Fat Water. Thickened toner with botanical extracts for pore-refining and hydration.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/diy-fenty-skin-fat-water-toner/', '{"toner", "diy-recreation", "pore-refining"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 78.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Carbomer', 'Thickener', 0.2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Triethanolamine (TEA)', 'pH Adjuster', 0, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Witch Hazel', 'Astringent / Pore Refiner', 10, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Butylene Glycol', 'Humectant', 5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Niacinamide (vitamin B3)', 'Conditioner', 3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Green Tea extract', 'Antioxidant / Soothing', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Fig extract', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Ginkgo Biloba Leaf extract', 'Antioxidant', 1, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Phase 3') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Citric Acid', 'pH Adjuster', 0, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Phenoxyethanol (preservative)', 'Preservative', 1, false);
END $;

-- In Shower Body Lotion (300g) - https://wholeelise.com/blog/in-shower-body-lotion/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('In Shower Body Lotion', 'in-shower-body-lotion', 'Locks in moisture when skin is most hydrated. Contains occlusive agents to seal moisture in during shower.', 'skincare', 300, 'whole-elise', 'https://wholeelise.com/blog/in-shower-body-lotion/', '{"lotion", "in-shower", "moisturising"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Water', 'Aqueous Phase', 48, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Aloe Vera Juice', 'Aqueous Phase / Soothing', 20, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Glycerine', 'Humectant', 5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Almond Oil', 'Carrier / Emollient', 15, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Shea Butter', 'Emollient', 3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Emulsifying Wax NF', 'Emulsifier', 5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Almond Wax', 'Occlusive Agent', 2, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Vitamin E', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Preservative Eco', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils (max)', 'Fragrance', 1, true);
END $;

-- Creamy Body Wash (200g) - https://wholeelise.com/blog/creamy-body-wash/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Creamy Body Wash', 'creamy-body-wash', 'Cleansing and conditioning body wash. Mild surfactants with shea butter and oats for effective cleansing without stripping skin.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/creamy-body-wash/', '{"body-wash", "cleanser", "moisturising"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Water', 'Aqueous Phase', 48.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Decyl Glucoside', 'Surfactant', 29.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Cocamidopropyl Betaine (Cocobetaine)', 'Surfactant', 9.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Colloidal Oatmeal', 'Moisturiser / Soothing', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Glycerine', 'Humectant', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Xanthan Gum', 'Thickener', 0.5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 2.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Olive Emulsifier', 'Emulsifier', 2.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Cetyl Alcohol', 'Fatty Alcohol', 1, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Preservative Eco', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 1, false);
END $;

-- DIY 'Body Shop' Body Butter (250g) - https://wholeelise.com/blog/diy-body-shop-body-butter/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('DIY ''Body Shop'' Body Butter', 'diy-body-shop-body-butter', 'All-natural recreation of The Body Shop''s signature body butter. Thick, buttery smooth, spreadable body butter that effortlessly disappears into skin.', 'skincare', 250, 'whole-elise', 'https://wholeelise.com/blog/diy-body-shop-body-butter/', '{"body-butter", "diy-recreation", "emulsified"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 59.1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Xanthan Gum', 'Thickener', 0.5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Fractionated Coconut Oil', 'Carrier / Emollient', 14.6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Mango Butter', 'Emollient', 9.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Olive-derived Emulsifier', 'Emulsifier', 3.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Glyceryl Stearate', 'Emulsifier', 1.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Cetyl Alcohol', 'Fatty Alcohol', 2.4, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Vitamin E', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Preservative Eco', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils (Optional Fragrance)', 'Fragrance', 1, true);
END $;

-- Intensive Oat Lotion (400g) - https://wholeelise.com/blog/intensive-oat-lotion/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Intensive Oat Lotion', 'intensive-oat-lotion', 'Simple but effective oat lotion that penetrates deep into skin''s outer layers, providing lasting hydration. Packed with oats, shea butter and almond oil.', 'skincare', 400, 'whole-elise', 'https://wholeelise.com/blog/intensive-oat-lotion/', '{"lotion", "oat", "intensive", "moisturising"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 58.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 2.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Colloidal Oatmeal', 'Moisturiser / Soothing', 1, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 14.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Almond Oil', 'Carrier / Emollient', 14.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Emulsifying Wax', 'Emulsifier', 5.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Preservative Eco (Natural Preservative)', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils for Fragrance (Optional)', 'Fragrance', 0, true);
END $;

-- DIY 'Aesop' Hand Wash (500g) - https://wholeelise.com/blog/diy-aesop-hand-wash/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('DIY ''Aesop'' Hand Wash', 'diy-aesop-hand-wash', 'All-natural recreation of Aesop''s Resurrection Aromatique Hand Wash. Viscous, silky smooth hand wash with signature citrus fragrance.', 'skincare', 500, 'whole-elise', 'https://wholeelise.com/blog/diy-aesop-hand-wash/', '{"hand-wash", "diy-recreation", "luxury"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 39.2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Sodium Laureth Sulphate', 'Surfactant', 35.2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Cocamidopropyl Betaine', 'Surfactant', 7.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'PEG-40 Hydrogenated Castor Oil', 'Emollient / Surfactant', 7.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Glycerine', 'Humectant', 3.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Citric Acid', 'pH Adjuster', 0.2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Sodium Chloride', 'Thickener', 3.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Essential Oil Blend', 'Fragrance', 1, true);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Phenoxyethanol', 'Preservative', 1, false);
END $;

-- Natural Body Yogurt (200g) - https://wholeelise.com/blog/natural-body-yogurt/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Natural Body Yogurt', 'natural-body-yogurt', 'Lightweight yogurt-textured moisturiser. Signature wobble and jelly-like consistency. Fast-absorbing, silky texture.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/natural-body-yogurt/', '{"yogurt", "lightweight", "moisturising"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 78.3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Xanthan Gum', 'Thickener', 0.5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Fractionated Coconut Oil', 'Carrier / Emollient', 9.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Jojoba Oil', 'Carrier / Emollient', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Vegetal Emulsifying Wax', 'Emulsifier', 4.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Optiphen (Preservative)', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 0.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils (Optional Fragrance)', 'Fragrance', 1, true);
END $;

-- Non-Comedogenic Face Moisturiser (300g) - https://wholeelise.com/blog/non-comedogenic-face-moisturiser/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Non-Comedogenic Face Moisturiser', 'non-comedogenic-face-moisturiser', 'All natural, non-comedogenic, oil-free, anti-inflammatory face moisturiser. Perfect for sensitive and acne-prone skin.', 'skincare', 300, 'whole-elise', 'https://wholeelise.com/blog/non-comedogenic-face-moisturiser/', '{"face-cream", "non-comedogenic", "oil-free", "sensitive-skin"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 72, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Aloe Vera Concentrate', 'Aqueous Phase / Soothing', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Glycerine', 'Humectant', 2, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 10, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Olivem 1000 Emulsifying Wax', 'Emulsifier', 8, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Hyaluronic Acid Gel', 'Humectant', 5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Green Tea Extract', 'Antioxidant / Soothing', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Preservative Eco', 'Preservative', 1, false);
END $;

-- Oil Body Wash (300g) - https://wholeelise.com/blog/oil-body-wash/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Oil Body Wash', 'oil-body-wash', 'Rich and moisturising oil-based cleanser. Gently cleanses without stripping skin. Up to 50% oils for intensive moisture.', 'skincare', 300, 'whole-elise', 'https://wholeelise.com/blog/oil-body-wash/', '{"body-wash", "oil-based", "moisturising"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Soybean Oil', 'Carrier / Emollient', 25, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Grapeseed Oil', 'Carrier / Emollient', 8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Fractionated Coconut Oil', 'Carrier / Emollient', 5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Olive Oil', 'Carrier / Emollient', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Essential Oils (Optional)', 'Fragrance', 2, true);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Vitamin E Oil', 'Antioxidant', 1, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Lumorol Waterless Surfactant', 'Surfactant', 57, false);
END $;

-- Oil-Free Face Cleanser (200g) - https://wholeelise.com/blog/oil-free-face-cleanser/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Oil-Free Face Cleanser', 'oil-free-face-cleanser', 'Mild daily face cleanser, oil-free and pH balanced. Silky smooth foaming cleanser with kaolin clay and mild surfactants.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/oil-free-face-cleanser/', '{"face-cleanser", "oil-free", "ph-balanced", "foaming"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase A') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Decyl Glucoside', 'Surfactant', 25, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Essential Oils (optional)', 'Fragrance', 1, true);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase B') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 66.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Kaolin Clay', 'Cleansing Agent / Texture', 2, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Phase C') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Glycerine', 'Humectant', 5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Xanthan Gum', 'Thickener', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Preservative Eco', 'Preservative', 1, false);
END $;

-- Orange Clove Hand Lotion (250g) - https://wholeelise.com/blog/orange-clove-hand-lotion/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Orange Clove Hand Lotion', 'orange-clove-hand-lotion', 'Hand lotion infused with warm seasonal spices. Leaves hands soft, moisturised and protected during winter months.', 'skincare', 260, 'whole-elise', 'https://wholeelise.com/blog/orange-clove-hand-lotion/', '{"hand-lotion", "festive", "moisturising"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Water', 'Aqueous Phase', 68.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 1.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 9.6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Almond Oil', 'Carrier / Emollient', 11.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Olive-Oil Derived Emulsifying Wax', 'Emulsifier', 5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Preservative Eco', 'Preservative', 1.2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil', 'Antioxidant', 1.2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oil Blend', 'Fragrance', 1.1, true);
END $;

-- Shimmer Body Lotion (200g) - https://wholeelise.com/blog/shimmer-body-lotion/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Shimmer Body Lotion', 'shimmer-body-lotion', 'Buildable shimmery lotion that adds warmth and luminosity to the skin. Uses natural micas for a buildable glow.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/shimmer-body-lotion/', '{"lotion", "shimmer", "glow"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 79.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 1.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Camelina Oil', 'Carrier / Emollient', 7.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glyceryl Stearate S/E', 'Emulsifier', 4.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Preservative Eco', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils (Optional)', 'Fragrance', 1, true);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Mica Powder', 'Colour / Texture', 2.9, false);
END $;

-- Winter Face Moisturiser (200g) - https://wholeelise.com/blog/winter-face-moisturiser/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Winter Face Moisturiser', 'winter-face-moisturiser', 'Rich, creamy face moisturiser with skin rejuvenating properties. Protects skin throughout colder months with Alpha Hydroxy Acids.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/winter-face-moisturiser/', '{"face-cream", "winter", "moisturising", "aha"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Water', 'Aqueous Phase', 74.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Coconut Milk Powder', 'Moisturiser / Soothing', 1, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 5.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Jojoba Oil', 'Carrier / Emollient', 7.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Emulsifying Wax', 'Emulsifier', 3.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Cetyl Alcohol', 'Fatty Alcohol', 2, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Fruit Extract AHA (Alpha Hydroxy Acids)', 'Exfoliant / Humectant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Preservative eco', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Vitamin E Oil', 'Antioxidant', 1, false);
END $;

-- Ayurvedic Hair Butter (200g) - https://wholeelise.com/blog/ayurvedic-hair-butter/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Ayurvedic Hair Butter', 'ayurvedic-hair-butter', 'Herbal ayurvedic hair butter combining moisture-boosting butters with ayurvedic herbs. Boosts hair growth, reduces shedding and breakage.', 'haircare', 200, 'whole-elise', 'https://wholeelise.com/blog/ayurvedic-hair-butter/', '{"hair-butter", "ayurvedic", "hair-growth"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Heated Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Mafura Butter', 'Emollient', 42.1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Kokum Butter', 'Emollient', 6.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Ayurvedic Oil', 'Carrier / Emollient', 29.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Safflower Oil', 'Carrier / Emollient', 12.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Cetearyl Alcohol', 'Fatty Alcohol', 6.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Vitamin E Oil (antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Essential Oil (optional fragrance)', 'Fragrance', 1, true);
END $;

-- Ayurvedic Hair Cream (200g) - https://wholeelise.com/blog/ayurvedic-hair-cream/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Ayurvedic Hair Cream', 'ayurvedic-hair-cream', 'Nourishing, moisture-rich intensive hair cream with ayurvedic herbs and mafura butter. Fast-absorbing, non-greasy application.', 'haircare', 200, 'whole-elise', 'https://wholeelise.com/blog/ayurvedic-hair-cream/', '{"hair-cream", "ayurvedic", "moisturising"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 51.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Lavender Hydrosol', 'Aqueous Phase / Soothing', 19.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Glycerine', 'Humectant', 1.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Ayurvedic Oil', 'Carrier / Emollient', 9.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Mafura Butter', 'Emollient', 7.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Emulsifying Wax NF', 'Emulsifier', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Cetearyl Alcohol', 'Fatty Alcohol', 1.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Optiphen Plus (preservative)', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil (antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oil (optional fragrance)', 'Fragrance', 1, true);
END $;

-- Ayurvedic Hair Oil (300g) - https://wholeelise.com/blog/ayurvedic-hair-oil/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Ayurvedic Hair Oil', 'ayurvedic-hair-oil', 'Herbal oil made by infusing carrier oil with ayurvedic botanical extracts. Stimulates hair growth, reduces shedding and breakage, strengthens hair.', 'haircare', 300, 'whole-elise', 'https://wholeelise.com/blog/ayurvedic-hair-oil/', '{"hair-oil", "ayurvedic", "hair-growth"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Fractionated Coconut Oil', 'Carrier / Emollient', 70, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Fenugreek Seeds', 'Herbal Extract', 6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Hibiscus Flowers (dried)', 'Herbal Extract', 6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Amla Fruit (dried)', 'Herbal Extract', 6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Neem Leaves (dried)', 'Herbal Extract', 6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Marshmallow Root (dried)', 'Herbal Extract', 6, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Vitamin E Oil (antioxidant)', 'Antioxidant', 0.5, false);
END $;

-- Curl Defining Hair Gel (200g) - https://wholeelise.com/blog/curl-defining-hair-gel/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Curl Defining Hair Gel', 'curl-defining-hair-gel', 'Thick natural gel using xanthan gum. Lasts for months, leaves hair soft, defined and moisturised. Excellent hold for curls and coils.', 'haircare', 200, 'whole-elise', 'https://wholeelise.com/blog/curl-defining-hair-gel/', '{"hair-gel", "curl-defining", "natural"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Glycerine', 'Humectant', 5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Xanthan Gum', 'Thickener', 2, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Water', 'Aqueous Phase', 91, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Hydrolysed Wheat Protein', 'Conditioner', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Aloe Vera Powder', 'Soothing / Strengthening', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Preservative Eco', 'Preservative', 1, false);
END $;

-- DIY Eco Styler Gel (500g) - https://wholeelise.com/blog/diy-eco-styler-gel/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('DIY Eco Styler Gel', 'diy-eco-styler-gel', 'All-natural recreation of Eco Styler Gel. Ultra-thick hair gel with strong hold and stability. Crystal clear, glossy gel with excellent curl definition.', 'haircare', 500, 'whole-elise', 'https://wholeelise.com/blog/diy-eco-styler-gel/', '{"hair-gel", "diy-recreation", "strong-hold"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 85.3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Carbomer 940', 'Thickener', 0.6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Triethanolamine (TEA)', 'pH Adjuster', 0, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 10, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Polyvinylpyrrolidone (PVP)', 'Fixative / Hold', 1, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Phase 3') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Glycerine', 'Humectant', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Hydrolysed Wheat Protein', 'Conditioner', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Preservative Eco', 'Preservative', 1, false);
END $;

-- DIY Hair Grease (100g) - https://wholeelise.com/blog/diy-hair-grease/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('DIY Hair Grease', 'diy-hair-grease', 'All-natural recreation of traditional hair grease. Uses petroleum jelly and mineral oil for sealing and styling.', 'haircare', 100, 'whole-elise', 'https://wholeelise.com/blog/diy-hair-grease/', '{"hair-grease", "diy-recreation", "styling"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Heated Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Vaseline or Cosmetic Grade Petroleum', 'Occlusive Agent', 44.1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Beeswax', 'Stabilizer', 5.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Baby Oil or Mineral Oil', 'Carrier / Emollient', 40.2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Castor Oil', 'Carrier / Emollient', 7.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Essential Oil (Optional)', 'Fragrance', 1, true);
END $;

-- DIY Hair Serum (30g) - https://wholeelise.com/blog/diy-hair-serum/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('DIY Hair Serum', 'diy-hair-serum', 'Lightweight silicone-based styling product. Improves appearance and manageability by coating hair surface. Adds shine, smoothness, reduces frizz.', 'haircare', 30, 'whole-elise', 'https://wholeelise.com/blog/diy-hair-serum/', '{"hair-serum", "styling", "silicone"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Main') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Marula Oil', 'Carrier / Emollient', 49, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Dimethicone 1000', 'Silicone / Slip', 29.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Squalane (Olive Derived)', 'Carrier / Emollient', 19.6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 0.3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Essential Oils (Optional Fragrance)', 'Fragrance', 1.7, true);
END $;

-- DIY Moroccan Oil Treatment (100g) - https://wholeelise.com/blog/diy-moroccan-oil-treatment/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('DIY Moroccan Oil Treatment', 'diy-moroccan-oil-treatment', 'All-natural recreation of MoroccanOil Treatment. Lightweight silicone-based serum that enhances shine, tames frizz and prolongs straight styles.', 'haircare', 100, 'whole-elise', 'https://wholeelise.com/blog/diy-moroccan-oil-treatment/', '{"hair-serum", "diy-recreation", "silicone"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Main') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Cyclopentasiloxane', 'Silicone / Volatile', 48.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Dimethicone 1000', 'Silicone / Slip', 29.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Cyclomethicone', 'Silicone / Volatile', 9.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Argan Oil', 'Carrier / Emollient', 9.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Essential Oils (Optional Fragrance)', 'Fragrance', 2, true);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Vitamin E Oil', 'Antioxidant', 0.1, false);
END $;

-- DIY 'Shea Moisture' Deep Conditioner (300g) - https://wholeelise.com/blog/diy-shea-moisture-deep-conditioner/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('DIY ''Shea Moisture'' Deep Conditioner', 'diy-shea-moisture-deep-conditioner', 'All-natural recreation of Shea Moisture Raw Shea Butter Deep Treatment Masque. Thick, creamy deep conditioner with excellent slip and conditioning properties.', 'haircare', 300, 'whole-elise', 'https://wholeelise.com/blog/diy-shea-moisture-deep-conditioner/', '{"deep-conditioner", "diy-recreation", "conditioning"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 58, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 4.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 9.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Cetearyl Alcohol', 'Fatty Alcohol', 3.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Cetyl Alcohol', 'Fatty Alcohol', 2.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'BTMS-25 Emulsifying Wax', 'Emulsifier / Conditioner', 5.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Olive Oil', 'Carrier / Emollient', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Castor Oil', 'Carrier / Emollient', 4.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'D Panthenol Solution (Vitamin B5)', 'Conditioner', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Hydrolysed Wheat Protein', 'Conditioner', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Preservative Eco (Natural Preservative)', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Essential Oils (optional)', 'Fragrance', 1, true);
END $;

-- Hair Shine Spray (50g) - https://wholeelise.com/blog/hair-shine-spray/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Hair Shine Spray', 'hair-shine-spray', 'Ultra-light, glossy shine spray. Instantly revitalises dull or lifeless hair. Lightweight formula adds shine, gloss and vibrancy.', 'haircare', 50, 'whole-elise', 'https://wholeelise.com/blog/hair-shine-spray/', '{"shine-spray", "styling", "silicone"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Main') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Cyclomethicone', 'Silicone / Volatile', 68.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Dimethicone 1000', 'Silicone / Slip', 14.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Marula Oil', 'Carrier / Emollient', 9.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Squalane (Olive-derived)', 'Carrier / Emollient', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Essential Oils (Optional Fragrance)', 'Fragrance', 2, true);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Vitamin E Oil (antioxidant)', 'Antioxidant', 0.2, false);
END $;

-- Leave In Conditioning Spray (100g) - https://wholeelise.com/blog/leave-in-conditioning-spray/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Leave In Conditioning Spray', 'leave-in-conditioning-spray', 'Water-based conditioner providing intense hydration and moisturisation. High water content penetrates hair easily for quick refresh and moisture.', 'haircare', 103, 'whole-elise', 'https://wholeelise.com/blog/leave-in-conditioning-spray/', '{"leave-in", "conditioning-spray", "moisturising"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Rose & Hibiscus Hydrosol (Floral Waters)', 'Aqueous Phase / Soothing', 83.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 1.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential oils: Geranium, Grapefruit', 'Fragrance', 1, true);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Jojoba Oil', 'Carrier / Emollient', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Emulsifying Wax', 'Emulsifier', 1.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Preservative Eco', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E', 'Antioxidant', 0.9, false);
END $;

-- Lightweight Hair Oil (60g) - https://wholeelise.com/blog/lightweight-hair-oil/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Lightweight Hair Oil', 'lightweight-hair-oil', 'Ultra-light nourishing hair oil for soft, shiny, healthy-looking hair. Formulated to be extremely lightweight for wet and dry hair application.', 'haircare', 60, 'whole-elise', 'https://wholeelise.com/blog/lightweight-hair-oil/', '{"hair-oil", "lightweight", "moisturising"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Main') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Argan Oil', 'Carrier / Emollient', 34, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Marula Oil', 'Carrier / Emollient', 29.3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Camelina Oil', 'Carrier / Emollient', 24.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Squalane (Olive-derived)', 'Carrier / Emollient', 9.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 0.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Essential Oils (Optional Fragrance)', 'Fragrance', 1.7, true);
END $;

-- Mango Hair Butter (100g) - https://wholeelise.com/blog/mango-hair-butter/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Mango Hair Butter', 'mango-hair-butter', 'Thick hair butter combining soft mango butter with firm cocoa butter. Seals in moisture and prevents water loss. Intensive moisturiser for soft, moisturised coils.', 'haircare', 100, 'whole-elise', 'https://wholeelise.com/blog/mango-hair-butter/', '{"hair-butter", "moisturising", "sealing"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Heated Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Mango Butter', 'Emollient', 29.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Cocoa Butter', 'Emollient / Occlusive', 34.3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Olive Oil', 'Carrier / Emollient', 19.6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Castor Oil', 'Carrier / Emollient', 14.7, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Vitamin E Oil', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Essential Oils (Optional Fragrance)', 'Fragrance', 1, true);
END $;

-- Moisturising Hair Cream (250g) - https://wholeelise.com/blog/moisturising-hair-cream/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Moisturising Hair Cream', 'moisturising-hair-cream', 'Rich and creamy hair moisturiser. Provides hydration with high water content and retains moisture with effective sealing oils. Perfect for natural hair.', 'haircare', 264, 'whole-elise', 'https://wholeelise.com/blog/moisturising-hair-cream/', '{"hair-cream", "moisturising", "natural-hair"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 69.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 4.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Colloidal Oatmeal', 'Moisturiser / Soothing', 0.8, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Avocado Butter', 'Emollient', 9.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Olive Oil', 'Carrier / Emollient', 1.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Coconut Oil', 'Carrier / Emollient', 1.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Jojoba Oil', 'Carrier / Emollient', 1.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Emulsifying Wax', 'Emulsifier', 4.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Leucidal Liquid SF (Natural Preservative)', 'Preservative', 4.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 0.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils for fragrance (Optional)', 'Fragrance', 0, true);
END $;

-- Natural Hair Grease (100g) - https://wholeelise.com/blog/natural-hair-grease/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Natural Hair Grease', 'natural-hair-grease', 'Natural alternative to petroleum-based hair grease. Uses Olus oil and candelilla wax for sealing and styling. Nourishes as well as styles hair.', 'haircare', 100, 'whole-elise', 'https://wholeelise.com/blog/natural-hair-grease/', '{"hair-grease", "natural", "styling"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Heated Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Olus Oil', 'Occlusive Agent / Emollient', 66, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Candelilla Wax', 'Stabilizer', 6, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Fractionated Coconut Oil', 'Carrier / Emollient', 20, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Castor Oil', 'Carrier / Emollient', 7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Essential Oil (Optional)', 'Fragrance', 1, true);
END $;

-- Shea Butter Edge Control (100g) - https://wholeelise.com/blog/shea-butter-edge-control/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Shea Butter Edge Control', 'shea-butter-edge-control', 'Nourishing edge control balm. Mixture of nourishing oils and butters providing decent hold while feeling amazing on hair. Perfect for laying edges.', 'haircare', 100, 'whole-elise', 'https://wholeelise.com/blog/shea-butter-edge-control/', '{"edge-control", "styling", "balm"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Main') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 25, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Almond Wax', 'Stabilizer', 15, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Castor Oil', 'Carrier / Emollient', 59, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Essential Oils', 'Fragrance', 0, true);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Vitamin E Oil', 'Antioxidant', 1, false);
END $;

-- Strengthening Deep Conditioner (200g) - https://wholeelise.com/blog/strengthening-deep-conditioner/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Strengthening Deep Conditioner', 'strengthening-deep-conditioner', 'Intensive moisturising treatment with hydrolysed protein. Penetrates deep into hair shaft to moisturise, strengthen and improve hair quality.', 'haircare', 200, 'whole-elise', 'https://wholeelise.com/blog/strengthening-deep-conditioner/', '{"deep-conditioner", "strengthening", "protein"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Water', 'Aqueous Phase', 67, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Hydrolysed Wheat Protein', 'Conditioner', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Coconut Milk Powder', 'Moisturiser / Strengthening', 1, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 10, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Castor Oil', 'Carrier / Emollient', 5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Emulsifying Wax (Olive-derived)', 'Emulsifier', 6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Cetyl Alcohol', 'Fatty Alcohol', 3, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Preservative Eco', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils (max)', 'Fragrance', 1, true);
END $;

-- DIY Tinted Lip Balm (20g) - https://wholeelise.com/blog/diy-tinted-lip-balm/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('DIY Tinted Lip Balm', 'diy-tinted-lip-balm', 'Tinted lip balm bridging cosmetics and skincare. Rich colour using iron oxides and mica powders while providing lasting lip protection.', 'diy', 20, 'whole-elise', 'https://wholeelise.com/blog/diy-tinted-lip-balm/', '{"lip-balm", "tinted", "cosmetics"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Coconut Oil', 'Carrier / Emollient', 26, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Olus Oil', 'Occlusive Agent / Emollient', 24, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Beeswax', 'Stabilizer', 20, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Candelilla Wax', 'Stabilizer', 4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Shea Butter', 'Emollient', 3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Almond Oil', 'Carrier / Emollient', 7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 7, 'Lanolin', 'Occlusive Agent / Emollient', 3, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Rosemary Extract', 'Antioxidant', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Iron Oxide or Mica Powders', 'Colour / Texture', 10, false);
END $;

-- Homemade Body Cream (200g) - https://wholeelise.com/blog/homemade-body-cream/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Homemade Body Cream', 'homemade-body-cream', 'Simple and foolproof cream formula. Basic core elements: water, oil, emulsifier, stabiliser, and preservatives. Part of the Milk, Yogurt & Cream Lotion series.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/homemade-body-cream/', '{"body-cream", "lotion-series", "emulsified"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 68.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 1.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Fractionated Coconut Oil', 'Carrier / Emollient', 14.6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Mango Butter', 'Emollient', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Emulsifying Wax NF', 'Emulsifier', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Cetearyl Alcohol', 'Fatty Alcohol', 1.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Optiphen (Preservative)', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oil (Optional Fragrance)', 'Fragrance', 1, true);
END $;

-- Body Milk Lotion (200g) - https://wholeelise.com/blog/how-to-make-body-milk-lotion/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Body Milk Lotion Formula', 'body-milk-lotion', 'Ultra lightweight and thin lotion resembling milk. Pourable consistency perfect for quick application. Part of the Milk, Yogurt & Cream Lotion series.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/how-to-make-body-milk-lotion/', '{"body-milk", "lotion-series", "lightweight"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 80.3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 2, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Fractionated Coconut Oil', 'Carrier / Emollient', 9.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glyceryl Stearate & PEG 100 Stearate', 'Emulsifier', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Cetearyl Alcohol', 'Fatty Alcohol', 0.5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Optiphen (Preservative)', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 0.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils (Optional Fragrance)', 'Fragrance', 1, true);
END $;

-- Shaving Cream (200g) - https://wholeelise.com/blog/diy-shaving-cream/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Shaving Cream', 'shaving-cream', 'Moisturising shaving cream that softens hair, protects skin and glides the razor for smooth shaves. Uses BTMS for conditioning properties.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/diy-shaving-cream/', '{"shaving-cream", "moisturising", "conditioning"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Water', 'Aqueous Phase', 74.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Decyl Glucoside', 'Surfactant', 5.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Jojoba Oil', 'Carrier / Emollient', 5.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'BTMS-25', 'Emulsifier / Conditioner', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Stearic Acid', 'Fatty Acid / Thickener', 4.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Preservative Eco', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Essential Oils (Optional)', 'Fragrance', 1, true);
END $;

-- Face Mist Formula (200g) - https://wholeelise.com/blog/diy-face-mist/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Face Mist Formula', 'face-mist', 'Refreshing blend of floral hydrosols, aloe vera and skin conditioning humectants. Revitalises skin with instant hydration.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/diy-face-mist/', '{"face-mist", "hydrosols", "hydration"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Main') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Water', 'Aqueous Phase', 53, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Aloe Vera Concentrate', 'Moisturiser / Soothing', 10, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Orange Floral Water', 'Hydrosol / Fragrance', 10, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Chamomile Hydrosol', 'Hydrosol / Soothing', 10, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Rose Floral Water', 'Hydrosol / Fragrance', 10, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 7, 'Manuka Honey Floral Water', 'Hydrosol / Moisturiser', 5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 8, 'Preservative Eco', 'Preservative', 1, false);
END $;

-- Micellar Water Formula (250g) - https://wholeelise.com/blog/diy-micellar-water/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Micellar Water Formula', 'micellar-water', 'Crystal clear, light cleansing micellar water perfect for removing makeup and sensitive skin. Gentle surfactant-based cleanser with moisturising elements.', 'skincare', 250, 'whole-elise', 'https://wholeelise.com/blog/diy-micellar-water/', '{"micellar-water", "cleanser", "makeup-remover"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 94, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Cocamidopropyl Betaine', 'Surfactant', 3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Pentylene Glycol', 'Humectant / Solvent', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Cucumber Extract', 'Soothing / Anti-inflammatory', 1, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Lactic Acid (pH adjuster)', 'pH Adjuster', 0, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Preservative of choice', 'Preservative', 1, false);
END $;

-- Shimmer Oil Formula (150g) - https://wholeelise.com/blog/diy-shimmer-oil/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Shimmer Oil Formula', 'shimmer-oil', 'Lightweight shimmer oil for an instant glow. Combines nourishing body oil with natural shimmery pigments. Perfect summer glow product.', 'skincare', 150, 'whole-elise', 'https://wholeelise.com/blog/diy-shimmer-oil/', '{"shimmer-oil", "body-oil", "glow"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Main') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Camelina Oil', 'Carrier / Emollient', 90, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Castor Oil', 'Carrier / Emollient', 6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Gold Mica Powder', 'Colour / Texture', 3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Vitamin E Oil', 'Antioxidant', 1, false);
END $;

-- Whipped Butter Formula (200g) - https://wholeelise.com/blog/how-to-make-any-whipped-butter/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Whipped Butter Formula', 'whipped-butter', 'Vegetable butters mixed with oil to make them lighter and easier to use. Spreadable butter that works well as simple natural moisturiser. Part of the Body Butters series.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/how-to-make-any-whipped-butter/', '{"whipped-butter", "body-butter-series", "moisturiser"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Heated Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 58.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Fractionated Coconut Oil', 'Carrier / Emollient', 39.2, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Vitamin E Oil', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Essential Oils (optional fragrance)', 'Fragrance', 1, true);
END $;

-- Hair Conditioner (250g) - https://wholeelise.com/blog/how-to-make-hair-conditioner/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Hair Conditioner', 'hair-conditioner', 'Fast-acting, rinse-out conditioner that softens, detangles and strengthens hair. Replenishes moisture levels, seals the cuticle and improves hair appearance.', 'haircare', 262, 'whole-elise', 'https://wholeelise.com/blog/how-to-make-hair-conditioner/', '{"hair-conditioner", "rinse-out", "conditioning"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water or Hydrosol', 'Aqueous Phase', 74.3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Cetrimonium Chloride', 'Conditioner', 4.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Glycerine', 'Humectant', 2.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Guar Gum', 'Thickener / Conditioner', 0.5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Coconut Oil', 'Carrier / Emollient', 5.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'BTMS-25 (conditioning emulsifying wax)', 'Emulsifier / Conditioner', 3.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Cetyl Alcohol', 'Fatty Alcohol', 1.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Hydrolysed Protein', 'Conditioner', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'D Panthenol (vitamin B5)', 'Conditioner', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Preservative Eco (broad-spectrum preservative)', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Vitamin E Oil (antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Essential Oils (optional)', 'Fragrance', 1, true);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 4, 'Cool Down 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Citric Acid (pH Adjuster)', 'pH Adjuster', 0, false);
END $;

-- Hair Pomade (100g) - https://wholeelise.com/blog/diy-hair-pomade/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Hair Pomade', 'hair-pomade', 'Hair styler that seals in moisture, enhances shine and provides definition and hold. Made by combining oils with wax that set into a solid balm. Anhydrous sealant.', 'haircare', 100, 'whole-elise', 'https://wholeelise.com/blog/diy-hair-pomade/', '{"hair-pomade", "styling", "sealant"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Heated Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Mango Butter', 'Emollient', 29.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Beeswax', 'Stabilizer / Emollient', 9.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Olive Oil', 'Carrier / Emollient', 39.2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Castor Oil', 'Carrier / Emollient', 19.6, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Vitamin E Oil', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Essential Oils (Optional Fragrance)', 'Fragrance', 1, true);
END $;

-- Leave-In Conditioner (250g) - https://wholeelise.com/blog/diy-leave-in-conditioner/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Leave-In Conditioner', 'leave-in-conditioner', 'Light and creamy leave-in conditioner perfect for detangling, boosting shine and restoring elasticity and bounce to hair. High water content for maximum hydration.', 'haircare', 262, 'whole-elise', 'https://wholeelise.com/blog/diy-leave-in-conditioner/', '{"leave-in-conditioner", "detangling", "hydration"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water or Hydrosol', 'Aqueous Phase', 83.3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Cetrimonium Chloride', 'Conditioner', 1.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Glycerine', 'Humectant', 1.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Guar Gum', 'Thickener / Conditioner', 0.5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Coconut Oil', 'Carrier / Emollient', 2.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'BTMS (conditioning emulsifying wax)', 'Emulsifier / Conditioner', 3.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Cetyl Alcohol', 'Fatty Alcohol', 1, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool down 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'D Panthenol (vitamin B5)', 'Conditioner', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Preservative Eco (broad-spectrum preservative)', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Vitamin E Oil (antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Essential Oils (optional)', 'Fragrance', 1, true);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 4, 'Cool down 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Citric Acid (pH Adjuster)', 'pH Adjuster', 0, false);
END $;

-- Moisturising Shampoo (300g) - https://wholeelise.com/blog/diy-moisturising-shampoo/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Moisturising Shampoo', 'moisturising-shampoo', 'Perfect for regular washdays and everyday use. Leaves hair soft and conditioned while cleaning effectively. Focus on conditioning elements allows for detangling.', 'haircare', 312, 'whole-elise', 'https://wholeelise.com/blog/diy-moisturising-shampoo/', '{"moisturising-shampoo", "cleansing", "conditioning"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 35, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Lavender Hydrosol', 'Hydrosol / Fragrance', 19.3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Decyl Glucoside', 'Surfactant', 19.3, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Cocamidopropyl Betaine', 'Surfactant', 9.6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Glycerine', 'Humectant', 2.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Guar Gum', 'Thickener / Conditioner', 0.5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Coconut Oil', 'Carrier / Emollient', 3.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'BTMS-25', 'Emulsifier / Conditioner', 4.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Cetyl Alcohol', 'Fatty Alcohol', 1, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'D Panthenol', 'Conditioner', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Hydrolysed Wheat Protein', 'Conditioner', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Natural Preservative (Dehydroacetic acid & Benzyl alcohol)', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Vitamin E Acetate', 'Antioxidant', 1, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 4, 'Cool Down 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Citric Acid (pH Adjuster)', 'pH Adjuster', 0, false);
END $;

-- Cleansing Balm Formula (200g) - https://wholeelise.com/blog/how-to-make-cleansing-balm/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Cleansing Balm Formula', 'cleansing-balm', 'Natural cleansing balm that works like oil cleansers. Uses oils to breakdown dirt and debris without soaps or surfactants. Part of the Essential Balm Products series.', 'skincare', 200, 'whole-elise', 'https://wholeelise.com/blog/how-to-make-cleansing-balm/', '{"cleansing-balm", "oil-cleanser", "balm-series"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Emollient', 14.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Olivem 1000 Emulsifying Wax', 'Emulsifier', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Cetearyl Alcohol', 'Fatty Alcohol', 2.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Candelilla Wax', 'Stabilizer', 4.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Jojoba Wax', 'Stabilizer', 2.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Grapeseed Oil', 'Carrier / Emollient', 58.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Rosehip Oil', 'Carrier / Emollient', 8.8, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Essential Oils (Suggested mix: chamomile & lavender)', 'Fragrance', 1, true);
END $;

-- Hair and Scalp Balm Formula (150g) - https://wholeelise.com/blog/diy-hair-and-scalp-balm/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Hair and Scalp Balm Formula', 'hair-and-scalp-balm', 'Non-greasy hair balm that can be applied to both hair and scalp. Uses marula oil and ayurvedic herbs for growth, thickness and scalp health. Part of the Essential Balm Products series.', 'haircare', 150, 'whole-elise', 'https://wholeelise.com/blog/diy-hair-and-scalp-balm/', '{"hair-balm", "scalp-balm", "balm-series"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Heated Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Marula Oil', 'Carrier / Emollient', 46, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Ayurvedic Oil', 'Carrier / Emollient / Treatment', 29.4, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Extra Virgin Coconut Oil', 'Carrier / Emollient', 9.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Candelilla Wax', 'Stabilizer', 6.9, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Beeswax', 'Stabilizer / Emollient', 5.9, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Vitamin E Oil (Antioxidant)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Essential Oils (Suggested mix: Tea tree, Rosemary, Peppermint & Lavender)', 'Fragrance', 1, true);
END $;

-- Toner Serum Formula (250g) - https://wholeelise.com/blog/hyaluronic-acid-toner-serum/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Toner Serum Formula', 'toner-serum', 'Enriched with botanical extracts, hyaluronic acid and film-forming humectants to seal moisture into skin. Fast-acting hydration combined with long-lasting protection of moisturising serums.', 'skincare', 250, 'whole-elise', 'https://wholeelise.com/blog/hyaluronic-acid-toner-serum/', '{"toner-serum", "hyaluronic-acid", "hydration"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Glycerine', 'Humectant', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Xanthan Gum', 'Thickener', 0.3, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 42.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Manuka Honey Floral Water', 'Hydrosol / Moisturiser', 30, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Aloe Vera Concentrate', 'Moisturiser / Soothing', 10, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Hyaluronic Acid Gel', 'Humectant', 10, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'D Panthenol (Vitamin B5)', 'Conditioner', 5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Preservative Eco', 'Preservative', 1, false);
END $;

-- Natural Clarifying Shampoo (300g) - https://wholeelise.com/blog/how-to-make-natural-shampoo/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Natural Clarifying Shampoo', 'natural-clarifying-shampoo', 'Mild clarifying shampoo that gently cleans but doesn''t strip hair of natural oils. Great cleanser for hair routines with heavier products like butters, gels and oils.', 'haircare', 300, 'whole-elise', 'https://wholeelise.com/blog/how-to-make-natural-shampoo/', '{"clarifying-shampoo", "natural", "cleansing"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 31.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Lavender Hydrosol', 'Hydrosol / Fragrance', 20, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Decyl Glucoside', 'Surfactant', 25, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Cocamidopropyl Betaine', 'Surfactant', 15, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 5, 'Glycerine', 'Humectant', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 6, 'Guar Gum', 'Thickener / Conditioner', 0.5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'D Panthenol (optional)', 'Conditioner', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Hydrolysed Wheat Protein (optional)', 'Conditioner', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Natural Preservative', 'Preservative', 1, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Phase 3') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Citric Acid (pH Adjuster)', 'pH Adjuster', 0, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 4, 'Phase 4') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Xanthan Gum', 'Thickener', 0.5, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 2, false);
END $;

-- Luxury Hand Wash (250g) - https://wholeelise.com/blog/orange-clove-hand-wash/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Luxury Hand Wash', 'luxury-hand-wash', 'Orange & Clove Hand Wash. Rich lather that effortlessly removes dirt, oil and debris without stripping hands. Utilises mild non-ionic surfactant Decyl Glucoside. Part 5 of the DIY Holiday Gifts series.', 'skincare', 258, 'whole-elise', 'https://wholeelise.com/blog/orange-clove-hand-wash/', '{"hand-wash", "luxury", "holiday-gifts"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Glycerine', 'Humectant', 5.8, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Xanthan Gum', 'Thickener', 1.6, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Water', 'Aqueous Phase', 43.6, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Cocamidopropyl Betaine', 'Surfactant', 9.7, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'PEG 40 Hydrogenated Castor Oil', 'Emollient / Solubilizer', 7.8, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Phase 3') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Decyl Glucoside', 'Surfactant', 29.1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Orange & Clove Essential Oil Blend', 'Fragrance', 1.2, true);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 4, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Citric Acid (pH Adjuster)', 'pH Adjuster', 0.2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Preservative Eco', 'Preservative', 1.2, false);
END $;

-- DIY Vegan Lip Balm (20g) - https://wholeelise.com/blog/diy-stick-lip-balm/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('DIY Vegan Lip Balm', 'diy-vegan-lip-balm', 'Vegan lip balm using candelilla wax and mango butter instead of beeswax and lanolin. Provides structure, texture and protection for dry lips.', 'diy', 20, 'whole-elise', 'https://wholeelise.com/blog/diy-stick-lip-balm/', '{"vegan-lip-balm", "stick-lip-balm", "vegan"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Phase 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Candelilla Wax', 'Stabilizer', 25, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Mango Butter', 'Emollient', 20, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Coconut Oil', 'Carrier / Emollient', 25, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Almond Oil', 'Carrier / Emollient', 27, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Phase 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Rosemary Extract', 'Antioxidant', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil', 'Antioxidant', 1, false);
END $;

-- Cocoa Butter Hand Cream (100g) - https://wholeelise.com/blog/natural-cocoa-butter-hand-cream/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Cocoa Butter Hand Cream', 'cocoa-butter-hand-cream', 'A non-greasy, easily-absorbed moisturising cream that''s perfect for our hands. Rich in fatty acids which replenish skin''s moisture and create a barrier to prevent moisture loss.', 'skincare', 100, 'whole-elise', 'https://wholeelise.com/blog/natural-cocoa-butter-hand-cream/', '{"hand-cream", "cocoa-butter", "moisturising"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 67, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Glycerine', 'Humectant', 2, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Cocoa Butter', 'Butter', 10, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Grapeseed Oil', 'Carrier Oil', 12, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Emulsifying Wax NF', 'Emulsifier', 5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Preservative Eco', 'Preservative', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil', 'Antioxidant', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils', 'Fragrance', 1, true);
END $;

-- Lotion Formula (100g) - https://wholeelise.com/blog/beginners-guide-to-lotion-making/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Lotion Formula', 'lotion-formula', 'A beginner-friendly natural lotion formula – a starting point for DIY skincare. Contains the 5 key elements: water, oil, emulsifier, antioxidant, and preservative.', 'skincare', 100, 'whole-elise', 'https://wholeelise.com/blog/beginners-guide-to-lotion-making/', '{"lotion", "beginner", "basic"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Water Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Distilled Water', 'Aqueous Phase', 67, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Honey (or Glycerine for vegan)', 'Humectant', 2, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Oil Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Butter', 10, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Almond Oil', 'Carrier Oil', 12, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Emulsifying Wax BP', 'Emulsifier', 5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Leucidal Liquid SF', 'Preservative', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E (Antioxidants)', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Fragrances (optional)', 'Fragrance', 1, true);
END $;

-- Deep Conditioning Hair Mask (200g) - https://wholeelise.com/blog/deep-conditioning-hair-masks/
DO $
DECLARE f_id uuid; p_id uuid;
BEGIN
  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)
  VALUES ('Deep Conditioning Hair Mask', 'deep-conditioning-hair-mask', 'Intensive conditioning hair treatment that moisturises, protects and restores hair. Packed full of rich oils, butters and natural ingredients. Anhydrous formula designed as a pre-shampoo treatment.', 'haircare', 200, 'whole-elise', 'https://wholeelise.com/blog/deep-conditioning-hair-masks/', '{"hair-mask", "deep-conditioner", "intensive-treatment"}')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description
  RETURNING id INTO f_id;
  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);
  DELETE FROM public.formula_phases WHERE formula_id = f_id;

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 1, 'Heated Phase') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Shea Butter', 'Butter', 25, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Coconut Oil', 'Carrier Oil', 20, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Mango Butter', 'Butter', 10, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 4, 'Cetyl Alcohol', 'Emollient', 5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 2, 'Cool Down 1') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Olive Oil', 'Carrier Oil', 23, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Jojoba Oil', 'Carrier Oil', 10, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Castor Oil', 'Carrier Oil', 5, false);

  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, 3, 'Cool Down 2') RETURNING id INTO p_id;
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 1, 'Bentonite Clay', 'Clarifying / Detoxifying', 2, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 2, 'Vitamin E Oil', 'Antioxidant', 1, false);
  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, 3, 'Essential Oils', 'Fragrance', 0.5, true);
END $;
