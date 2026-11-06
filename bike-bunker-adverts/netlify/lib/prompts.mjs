// Prompts for the advert/social writer and the price check.

const line = (label, value) => (value !== undefined && value !== null && String(value).trim() !== '' ? `- ${label}: ${String(value).trim()}` : null);

export function advertPrompt({ bike = {}, details = {}, settings = {}, tweak = '' }) {
  const facts = [
    line('Registration', bike.reg),
    line('Make', bike.make),
    line('Model', bike.model),
    line('Derivative / trim', bike.derivative),
    line('Year', bike.year),
    line('Mileage', bike.mileage && `${bike.mileage} miles`),
    line('Previous owners', bike.owners),
    line('Colour', bike.colour),
    line('Engine size', bike.engine && `${bike.engine}cc`),
    line('Price (for context only)', bike.price && `£${bike.price}`),
    line('Service history', details.serviceHistory),
    line('Serviced by The Bike Bunker before sale', details.servicedByUs),
    line('MOT', details.mot),
    line('Keys', details.keys),
    line('Overall condition', details.condition),
    line('Tyres', details.tyres),
    line('Paperwork (V5C, manual, receipts)', details.paperwork),
    line('HPI / history check', details.hpi),
    line('Warranty included', details.warranty),
    line('Licence category', details.licence),
    line('Best suited to', details.idealFor),
    line('Modifications & upgrades', details.mods),
    line('Key features & extras', details.features),
    line('Marks, wear or known issues (be honest about these)', details.marks),
    line('Extra notes / story', details.notes),
  ].filter(Boolean).join('\n');

  const dealer = [
    line('Dealer name', settings.dealerName || 'The Bike Bunker'),
    line('Location', settings.location || 'Hayling Island, Hampshire'),
    line('Phone', settings.phone),
    line('Website', settings.website || 'bike-bunker.co.uk'),
    line('Standard selling points we offer', settings.usps),
  ].filter(Boolean).join('\n');

  const tone = {
    enthusiastic: 'Enthusiastic and warm, like a rider talking to a rider, but never cheesy or full of exclamation marks.',
    professional: 'Professional, confident and factual. Calm, trustworthy dealer voice.',
    punchy: 'Short and punchy. Tight sentences, scannable, no filler.',
  }[details.tone] || 'Enthusiastic and warm, like a rider talking to a rider, but never cheesy.';

  return `You write used-motorcycle adverts for a UK dealer. Write in British English.

BIKE FACTS
${facts}

DEALER
${dealer}

TONE: ${tone}

RULES
- Use ONLY the facts above. Never invent service dates, features, specs, owners, warranty terms or history. If something isn't given, leave it out.
- You may add a sentence of well-known, uncontroversial character about the model (e.g. what kind of riding it suits), but no specific performance figures unless given.
- Lead with what makes THIS bike worth buying: the strongest facts (low owners, full history, mods, condition, keys) go early.
- Mention modifications clearly, and say any original parts come with it only if stated.
- If marks or issues are listed, mention them briefly and honestly - it builds trust.
- No emojis. No ALL CAPS sentences. No clichés like "don't miss out" or "won't last long".

OUTPUT 1 - AutoTrader attention grabber: max 30 characters including spaces. The single strongest selling point (e.g. "1 owner, full history, 2 keys").

OUTPUT 2 - AutoTrader description: 110-180 words. Plain text only (no markdown, no asterisks). Short opening paragraph, then a few key points each on its own line starting with "- ", then one closing line. Do NOT include price, phone numbers, email, website links or opening hours - AutoTrader shows those elsewhere and links aren't clickable.

OUTPUT 3 - Website advert title: a clean listing title like "2019 Yamaha MT-07 - 1 Owner, Full Service History".

OUTPUT 4 - Website advert: 180-280 words. Plain text, no markdown symbols. Opening paragraph, a "Highlights" line followed by points each starting with "- ", a short paragraph on condition, then a short "Why buy from ${settings.dealerName || 'The Bike Bunker'}" paragraph using only the dealer selling points given, ending with a clear call to action${settings.phone ? ' including the phone number' : ''}.
OUTPUT 5 - Facebook post: 60-110 words. Friendly, local and scroll-stopping first line (e.g. "Just in at ${settings.dealerName || 'The Bike Bunker'}..."). A few short lines with the key facts, each starting with "- " or a simple check mark (✅). You MAY use 2-4 relevant emojis here. Include the price${settings.phone ? ', phone number' : ''} and website if given. End with a call to action (message us / call / pop in).

OUTPUT 6 - Instagram caption: 50-90 words, same facts but punchier, 2-4 emojis allowed, include the price if given and "Link in bio" or "DM us" as the call to action. Then a blank line and 12-18 relevant hashtags: make/model tags (e.g. #yamaha #mt07), bike-type tags, UK biking tags (#ukbikers #bikelife) and local tags (#hampshire #haylingisland #portsmouth #usedmotorbikes).
Note: the "no emojis" rule above applies to outputs 1-4 only.
${tweak ? `\nEXTRA INSTRUCTIONS FROM THE DEALER (follow these): ${tweak}\n` : ''}
Reply with ONLY a JSON object, no other text, in exactly this shape:
{"attention_grabber": "...", "autotrader_description": "...", "website_title": "...", "website_description": "...", "facebook_post": "...", "instagram_caption": "..."}
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
