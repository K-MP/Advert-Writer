// Prompts for the advert/social writer and the price check.

const line = (label, value) => (value !== undefined && value !== null && String(value).trim() !== '' ? `- ${label}: ${String(value).trim()}` : null);

export function advertPrompt({ bike = {}, details = {}, settings = {}, tweak = '' }) {
  const dealerName = settings.dealerName || 'The Bike Bunker';
  const facts = [
    line('Make', bike.make),
    line('Model', bike.model),
    line('Derivative / trim', bike.derivative),
    line('Year', bike.year),
    line('Colour', bike.colour),
    line('Mileage', bike.mileage && `${Number(String(bike.mileage).replace(/[^0-9]/g, '')).toLocaleString('en-GB')} miles`),
    line('Owners', bike.owners),
    line('Engine size', bike.engine && `${bike.engine}cc`),
    line('Price', bike.price && `£${Number(String(bike.price).replace(/[^0-9.]/g, '')).toLocaleString('en-GB')}`),
    line('Service history', details.serviceHistory),
    line('Number of service stamps', details.serviceStamps),
    line('Recent major work (e.g. major service, valve clearances, belts)', details.majorWork),
    line('Serviced by us before sale', details.servicedByUs),
    line('MOT', details.mot),
    line('MOT expiry date', details.motExpiry),
    line('Keys', details.keys),
    line('Overall condition', details.condition),
    line('Tyres', details.tyres),
    line('Paperwork', details.paperwork),
    line('HPI / history check', details.hpi),
    line('Warranty', details.warranty),
    line('Licence', details.licence),
    line('Ideal for', details.idealFor),
    line('Modifications & upgrades', details.mods),
    line('Features & extras', details.features),
    line('Marks, wear or known issues', details.marks),
    line('Extra notes', details.notes),
  ].filter(Boolean).join('\n');

  const standard = settings.usps || 'Fresh oil & filter service before collection\n12 months MOT\nFull pre-delivery inspection\n3 months warranty\nPart exchange welcome\nFinance available\nDelivery available';

  const tone = {
    enthusiastic: 'Warm and confident, like an experienced rider who knows the bike - but never cheesy.',
    professional: 'Professional, confident and factual. Calm, trustworthy dealer voice.',
    punchy: 'Tight and to the point. Short sentences, no filler.',
  }[details.tone] || 'Warm and confident, like an experienced rider who knows the bike - but never cheesy.';

  return `You write used-motorcycle adverts for ${dealerName}, a motorcycle dealer in ${settings.location || 'Hayling Island, Hampshire'}. British English. Match the dealer's existing house style described below exactly.

BIKE FACTS
${facts}

DEALER'S STANDARD OFFER (what every bike gets / what's available)
${standard}

TONE: ${tone}

GOLDEN RULES
- Use ONLY the facts above for anything about THIS bike: never invent service stamps, dates, owners, extras, tyre brands, marks or history. If something isn't given, leave it out (never write "unknown").
- You MAY add well-known factory specs for the model (engine capacity and layout, e.g. "999cc inline-four engine", and approximate power, e.g. "120bhp") and genuine factory features of that model, but only when you are confident they are correct. If unsure, leave them out.
- Be specific: numbers and brand names sell (e.g. "17 service stamps in the service book", "Matching Bridgestone T31 tyres", "Oxford heated grips").
- Be honest about wear in a matter-of-fact, reassuring way, and say the marks are shown in the photographs.
- Plain text only: no markdown, no asterisks, no emojis in outputs 1-3.
- No phone numbers, email or web links in outputs 1-3.

OUTPUT 1 - "title": the listing subtitle in the house format "<Make> <Model> – <Selling point> & <Selling point>", using an en dash. Put the year first when the bike is 2 years old or newer (e.g. "2025 Kawasaki Z400 – 1 Owner & Low Mileage"). Title case, under 60 characters. House examples: "BMW F850 GS Adventure – Full Luggage & Full History", "Yamaha XSR700 – SC Project Exhaust & Low Miles", "Suzuki Burgman 400 – 13 Service Stamps & Heated Grips".

OUTPUT 2 - "attention_grabber": AutoTrader attention grabber, max 30 characters including spaces, the strongest 2-3 facts (e.g. "1 Owner, FSH, 2 Keys").

OUTPUT 3 - "advert": the full advert for AutoTrader and the website. Roughly 330-480 words. Follow this structure EXACTLY, in this order, with a blank line between each part:

1. Heading line: "<Year> <Make> <Model> – £<price>" (e.g. "2005 Honda CBR1000RR Fireblade – £3,500"). If no price is given, just "<Year> <Make> <Model>".
2. Intro paragraph (2-3 sentences, no heading): starts "${dealerName} is pleased to offer this fantastic <Make> <Model>, finished in <colour> and showing <mileage> miles." Then the ownership and history highlights, ending with a line like "this is a particularly appealing / well-equipped example of <Maker>'s <short description of the bike type, e.g. legendary litre-class superbike / versatile adventure-tourer>."
3. Condition paragraph (no heading, 2-3 sentences): overall condition (in context of age and mileage), then honest specific notes on any marks, saying they are shown in the photographs and do little to detract from the overall presentation. If there are no marks, say so ("There are no significant marks worth noting.").
4. The word "Highlights" on its own line, then a list with each point on its own line starting with "- ". Order: mileage; owners ("Just 2 owners from new" if from new); engine capacity and layout; power if known; colour if notable; notable factory features; "Standard factory specification" if no mods; service stamps; history; each extra/modification with brand names; Datatag if given; tyres (brand/model) if given; keys; "Owner's manual & service book" / paperwork as given; then the preparation items from the dealer's standard offer that apply (e.g. "Fresh service before collection", "Full pre-delivery inspection", "3 month warranty" - use the Warranty fact if given). Keep each point short - no full sentences.
5. Model paragraph (no heading, 2-3 sentences): what this model is known for and its benefits, and the kind of riding/rider it suits. Enthusiastic but credible.
6. This-bike paragraph (no heading, 3-4 sentences): why THIS example stands out - ownership, maintenance history, condition, equipment and modifications, each tied to a benefit for the buyer. If the mileage is higher than typical for its age, add a short, honest sentence that acknowledges it and points to the condition and history (only if relevant).
7. Preparation sentence (only if a fresh service or PDI applies): e.g. "The bike will receive a fresh service and full pre-delivery inspection before collection, along with our usual three-month warranty."
8. Roundup line: one sentence summing up the bike, in the house style, e.g. "A fantastic opportunity to own an iconic Fireblade with just two owners, extensive service history and excellent overall presentation." or "A very well-equipped, great-condition Versys 1000 with excellent touring potential and a strong maintenance history."
9. Call to action, one sentence starting "If you're looking for a..." that names the kind of bike in a few words tailored to this bike (e.g. "a well-rounded tourer with a strong history", "a characterful sports bike with low miles", "a reliable A2 commuter"), ending "get in touch to arrange a viewing now."
10. Final line, exactly: ${settings.footer || 'Part Exchange Welcome | Delivery Available'}

HERE ARE TWO REAL ADVERTS IN THE HOUSE STYLE. Copy their voice, structure, sentence patterns and level of detail. Do NOT copy their facts. (They predate the call-to-action line in step 9 - always include it.)

--- EXAMPLE 1 ---
2005 Honda CBR1000RR Fireblade – £3,500

The Bike Bunker is pleased to offer this fantastic Honda CBR1000RR Fireblade, finished in the iconic Red, Silver & Blue colour scheme and showing 51,464 miles. With just two owners from new and an impressive 17 service stamps in the service book, this is a particularly appealing example of Honda's legendary litre-class superbike.

The bike is in very good condition throughout, especially considering its age and mileage. The paintwork presents very nicely, with just a couple of scuff marks on the lower nearside fairing and a small mark on the tail section where a boot has caught the bodywork. These are shown in the photographs and do little to detract from the overall presentation.

Highlights
- 51,464 miles
- Just 2 owners from new
- 999cc inline-four engine
- Iconic Red, Silver & Blue colour scheme
- Honda Electronic Steering Damper
- Standard factory specification
- 17 service stamps in the service book
- Extensive service history
- 2 keys
- Owner's manual & service book
- Supporting paperwork
- Fresh service before collection
- Full pre-delivery inspection
- 3 month warranty

The CBR1000RR Fireblade is a true modern classic, delivering the thrilling performance, sharp handling and unmistakable character that have made the Fireblade name legendary. It remains a dream bike for many enthusiasts, offering serious superbike performance in a package that still feels special every time you ride it.

This example really stands out for its ownership and maintenance history. With only two owners from new and 17 service stamps recorded in the service book, it offers a reassuring level of documented maintenance for a bike of this age. It has also remained in standard factory specification, which will appeal to buyers looking for an original example.

The mileage is higher than some examples on the market, but the overall condition is particularly good for the miles covered. The paintwork remains smart, and the few cosmetic imperfections are minor and clearly shown in the photographs.

The bike will receive a fresh service and full pre-delivery inspection before collection, along with our usual three-month warranty.

A fantastic opportunity to own an iconic Fireblade with just two owners, extensive service history and excellent overall presentation. A proper superbike at an attractive price.

Part Exchange Welcome | Delivery Available
--- END EXAMPLE 1 ---

--- EXAMPLE 2 ---
2017 Kawasaki Versys 1000 – £5,250

The Bike Bunker is pleased to offer this fantastic Kawasaki Versys 1000, finished in orange and showing 28,585 miles. With just three owners and a strong history of maintenance, this is a particularly well-equipped example of Kawasaki's versatile adventure-tourer.

The bike is in fantastic condition throughout and has clearly been cared for during its life. There are no significant marks worth noting. The only cosmetic point to mention is some slight fading to the colour of the top box, which does not detract from the overall presentation.

Highlights
- 28,585 miles
- 3 owners
- 1,043cc four-cylinder engine
- 120bhp
- 6 service stamps
- Multiple recorded owner self-services
- Kawasaki hard-case panniers & top box
- Lextech aftermarket exhaust
- Oxford heated grips
- Puig touring screen
- Kawasaki crash protection
- Garmin Zumo sat nav
- Datatag
- Matching Bridgestone T31 tyres
- 2 keys
- Owner's manual & service book
- Full pre-delivery inspection
- 3 month warranty

The Versys 1000 is a fantastic choice for riders wanting the comfort and practicality of an adventure bike with the smoothness and performance of a four-cylinder engine. The upright riding position, generous luggage capacity and touring-focused equipment make it particularly well suited to long-distance trips and commuting.

This example has an impressive maintenance history for its age, with six recorded service stamps alongside multiple owner-performed services. It has clearly been looked after throughout its life and the overall condition reflects that. The bike is already equipped for touring, with genuine Kawasaki hard panniers and top box, Oxford heated grips, a Puig touring screen and Garmin Zumo sat nav. The Lextech exhaust also adds some extra character to the smooth 1,043cc engine.

A very well-equipped, great-condition Versys 1000 with excellent touring potential and a strong maintenance history.

Part Exchange Welcome | Finance Available | Delivery Available
--- END EXAMPLE 2 ---

OUTPUT 4 - "facebook_post": 60-110 words. Friendly and local, a scroll-stopping first line (e.g. "Just in at ${dealerName}..."), the key facts on short lines starting with "✅", the price if given${settings.phone ? ' and phone number' : ''}, and a call to action. 2-4 emojis is fine here.

OUTPUT 5 - "instagram_caption": 50-90 words, punchier, 2-4 emojis, price if given, "DM us" or "Link in bio" call to action, then a blank line and 12-18 hashtags (make/model, bike type, #ukbikers #bikelife, and local: #hampshire #haylingisland #portsmouth #usedmotorbikes).
${tweak ? `\nEXTRA INSTRUCTIONS FROM THE DEALER (follow these): ${tweak}\n` : ''}
Reply with ONLY a JSON object, no other text, in exactly this shape:
{"title": "...", "attention_grabber": "...", "advert": "...", "facebook_post": "...", "instagram_caption": "..."}
Use \\n for line breaks inside the strings.`;
}

export function pricePrompt({ bike = {}, details = {} }) {
  const facts = [
    line('Make', bike.make), line('Model', bike.model), line('Derivative / trim', bike.derivative),
    line('Year', bike.year), line('Mileage', bike.mileage && `${bike.mileage} miles`),
    line('Previous owners', bike.owners), line('Engine size', bike.engine && `${bike.engine}cc`),
    line('Condition', details.condition), line('Service history', details.serviceHistory),
    line('Modifications', details.mods),
  ].filter(Boolean).join('\n');
  const ourPrice = bike.price ? `£${bike.price}` : 'not set yet';

  return `You are a UK used-motorcycle pricing analyst helping a small dealer on Hayling Island, Hampshire price a bike for retail sale.

BIKE
${facts}
Dealer's current asking price: ${ourPrice}

TASK
Search the web for comparable bikes currently or recently advertised for sale in the UK - AutoTrader (autotrader.co.uk/bikes), eBay UK, Gumtree, MCN Bikes for Sale, and UK dealer websites. Comparable = same make and model (same generation if possible), within about 2 years of the same year, ideally similar mileage. Run several searches with different wording (e.g. "${bike.year || ''} ${bike.make || ''} ${bike.model || ''} for sale", "used ${bike.make || ''} ${bike.model || ''} price UK"). Only use listings with a visible price.

RULES
- Base the numbers on the actual listings you find, not on general knowledge. Never invent a listing, price or URL.
- Asking prices are not selling prices: private sellers usually accept a little less, dealers charge more because they include prep, warranty and MOT. Separate dealer and private listings where you can.
- Adjust for mileage, year and condition differences, and say how.
- If you find fewer than 3 real comparables, say so clearly and widen the year range, and set confidence to "low".
- Be realistic, not optimistic: it's better to be slightly conservative than to overprice and have the bike sit.

Reply with ONLY a JSON object, no other text, in exactly this shape (prices as whole numbers in pounds, no £ sign):
{
  "retail_low": 0,
  "retail_high": 0,
  "suggested_retail": 0,
  "quick_sale": 0,
  "trade_buy_in_estimate": 0,
  "verdict": "under-priced" | "about right" | "over-priced" | "no price set",
  "confidence": "high" | "medium" | "low",
  "summary": "2-3 sentences explaining the recommendation and how it compares to the current asking price",
  "adjustments": "1-2 sentences on how mileage/year/condition/mods affected the figure",
  "comparables": [
    {"title": "e.g. 2019 Yamaha MT-07", "year": "2019", "mileage": "9,200", "price": 5495, "seller": "dealer" | "private", "source": "AutoTrader", "url": "https://..."}
  ]
}
List up to 8 comparables, closest match first.`;
}
