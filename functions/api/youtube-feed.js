import { json } from "../../src/functions-utils.js";

function decodeXml(s = "") {
  return s.replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return m ? decodeXml(m[1].trim()) : "";
}

export async function onRequestGet(context) {
  try {
    const channelId = context.env.YOUTUBE_CHANNEL_ID || "UCxaVDJ6NSpm_jQFPA_uJMjQ";
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`, {
      headers: { "user-agent": "SmartDKClasses/1.0" }
    });
    if (!res.ok) return json({ videos: [], error: "YouTube feed unavailable" }, 502, { "cache-control": "public,max-age=300" });
    const xml = await res.text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
    const videos = entries.slice(0, 12).map((entry) => {
      const id = tag(entry, "yt:videoId") || (entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i)?.[1] || "");
      return {
        id,
        title: tag(entry, "title"),
        url: `https://www.youtube.com/watch?v=${id}`,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        published: tag(entry, "published")
      };
    }).filter(v => v.id);
    return json({ videos }, 200, { "cache-control": "public,max-age=300" });
  } catch (e) {
    return json({ videos: [], error: e.message }, 500);
  }
}
