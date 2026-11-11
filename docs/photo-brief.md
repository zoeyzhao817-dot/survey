# Photo tiles: shot list

Sensory questions (Q3 to Q7) should be photos, not emoji: they're what people screenshot. Until a photo exists, the tile falls back to gradient + emoji.

## How to add one

1. Save it as `public/tiles/{questionId}-{optionId}.webp`, e.g. `public/tiles/q4-rainforest.webp`.
2. Add its licence to `data/photo-credits.json`:
   ```json
   { "q4-rainforest": { "license": "Unsplash License", "source": "https://unsplash.com/photos/…", "author": "Jane Doe" } }
   ```
3. Run `npm run tiles`. The build fails if a photo has no credit entry.

## Specs

- Square crop, **800 × 800 px WebP, under 80 KB** (sharp at 2× on a 375 px phone).
- Licensed stock (Unsplash, Pexels, Adobe Stock, Getty) or generated. **Never brand bottles, logos or recognisable people.**
- The label sits on a dark gradient at the bottom, so keep the subject in the top two-thirds.
- One look across all tiles: natural light, warm, slightly desaturated, no text in the image. Shoot or pick the set together so a screenshot of one screen looks like one brand.

## Shot list

| File | Option | What to show | Search terms |
| --- | --- | --- | --- |
| q3-lift | Heavy perfume in a lift | Empty lift interior, hazy light | elevator interior, lift doors |
| q3-candy | Sugary candy | Pile of bright candy / lollipops | candy close up, lollipops |
| q3-powder | Grandma's powder | Powder puff, vintage compact | powder puff, vintage vanity |
| q3-smoke | Smoke and incense | Incense stick with a smoke curl | incense smoke |
| q3-cleaner | Cleaning-product citrus | Lemon next to a spray bottle | lemon cleaning |
| q3-none | None of these | Clean, calm empty surface / linen | neutral texture, linen |
| q4-rainforest | Rainforest after rain | Wet tropical leaves, droplets | rainforest leaves rain |
| q4-beach | Beach house morning | Open window to the sea, white curtains | beach house window |
| q4-flowers | Flower market | Buckets of fresh flowers | flower market |
| q4-bakery | Bakery at 8am | Croissants on a tray, warm light | bakery croissants morning |
| q4-temple | Temple or old library | Old wooden shelves or temple incense hall | old library, temple interior |
| q4-laundry | Clean sheets, fresh laundry | White sheets on a line in sun | laundry line white sheets |
| q4-nightmarket | Night market spices | Spice stall at night, lanterns | night market spices |
| q4-fruitstall | Summer fruit stall | Peaches, lychees, mangoes piled | tropical fruit stall |
| q5-lemontea | Iced lemon tea | Glass of iced tea with lemon slices | iced lemon tea |
| q5-matcha | Matcha | Matcha being whisked, top-down | matcha whisk |
| q5-coconut | Coconut water | Green coconut with straw | coconut drink |
| q5-lychee | Lychee rose soda | Pink soda with lychees / petals | lychee drink, rose soda |
| q5-latte | Vanilla latte | Latte art, warm tones | latte art |
| q5-chai | Chai | Spiced milk tea with cinnamon sticks | masala chai |
| q5-oolong | Oolong or whisky | Amber tea or whisky glass, low light | oolong tea, whisky glass |
| q6-shirt | Crisp white shirt | Folded white cotton shirt | white shirt folded |
| q6-linen | Linen | Natural linen texture | linen fabric texture |
| q6-silk | Silk | Blush silk drape | silk fabric |
| q6-cashmere | Cashmere | Oatmeal knit close-up | cashmere knit |
| q6-velvet | Velvet | Deep red/burgundy velvet | velvet texture |
| q6-leather | Leather jacket | Black leather texture / jacket detail | leather jacket detail |
| q7-office | Office with aircon | Bright minimal desk | minimal office desk |
| q7-heat | Outdoors in the heat | Sun-bleached street, strong shadows | tropical street sun |
| q7-evening | Dates and evenings | City lights at dusk, bokeh | city night bokeh |
| q7-casual | Weekends and travel | Suitcase / airport window | travel weekend |
| q7-everywhere | Everywhere | Map or globe, soft | world map texture |

Q1, Q8, Q11 and Q12 are fine as icon tiles.
