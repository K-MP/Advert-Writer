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
    line('Price (for social posts only)', bike.price && `£${Number(String(bike.price).replace(/[^0-9.]/g, '')).toLocaleString('en-GB')}`),
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
- Use ONLY the facts above. Never invent service dates, stamps, MOT dates, owners, extras, tyre brands or history. If something isn't given, leave it out (don't write "unknown").
- Be specific: numbers sell (e.g. "8 service stamps", "valve clearances done", "MOT until 27/03/2027", brand names of extras and tyres).
- Be honest about wear in a matter-of-fact way (e.g. "minor stone chips to the lower fairing"). If service history is missing or partial, say so plainly and mention what we've done to make up for it.
- If original parts come with the bike (e.g. standard exhaust), say so.
- Plain text only: no markdown, no asterisks, no emojis in outputs 1-3. Use a plain line for each heading, and "- " at the start of each list point.
- Do NOT put the price, phone numbers, email or web links in outputs 1-3 (price shows on the listing automatically and can change).

OUTPUT 1 - "title": the listing subtitle in the house format "<Make> <Model> – <Selling point> & <Selling point>", using an en dash. Put the year first when the bike is 2 years old or newer (e.g. "2025 Kawasaki Z400 – 1 Owner & Low Mileage"). Use title case and keep it under 60 characters. Examples of the house style: "BMW F850 GS Adventure – Full Luggage & Full History", "Yamaha XSR700 – SC Project Exhaust & Low Miles", "Suzuki Burgman 400 – 13 Service Stamps & Heated Grips", "Royal Enfield Meteor 350 – Ideal First Cruiser".

OUTPUT 2 - "attention_grabber": AutoTrader attention grabber, max 30 characters including spaces, the strongest 2-3 facts (e.g. "1 Owner, FSH, 2 Keys").

OUTPUT 3 - "advert": the full advert used on AutoTrader and the website, 220-340 words, in this exact structure:
<Year> <Make> <Model>
(blank line)
An opening paragraph that starts "${dealerName} is pleased to offer this..." and gives the colour, mileage, number of owners and the one or two things that make this bike stand out. 2-3 sentences.
(blank line)
Condition
1-2 sentences on overall condition, including any honest notes on wear.
(blank line)
Key Details
- one point per fact: mileage, owners, service history (with stamps), recent major work, MOT, keys, paperwork, licence (A2 etc.) - only those given
(blank line)
Features & Extras
- one point per extra/modification, with brand names; include tyres if given
(blank line)
Ideal For
One sentence on the type of rider and riding it suits (e.g. touring, commuting, weekend riding, A2 riders).
(blank line)
Why This One?
2-3 sentences recapping the strongest reasons to buy this particular bike.
(blank line)
Before Collection
- one point per item from the dealer's standard offer that is done to the bike (service, MOT, PDI, warranty). Use the Warranty fact above if given, otherwise the standard offer.
(blank line)
A one-line closing pitch in the house style, e.g. "A superb opportunity to own a well-maintained <Model>." followed by a line that lists what's available (part exchange, finance, delivery) from the standard offer.

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
