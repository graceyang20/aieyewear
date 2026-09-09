// Same-origin HLS proxy for public ITS CCTV streams.
// Rewrites m3u8 manifests and proxies their media/playlist URLs through Vercel.

function absolute(base, value) {
  try { return new URL(value, base).toString(); } catch (_) { return ''; }
}
function proxyUrl(u) { return '/api/hls?url=' + encodeURIComponent(u); }
function rewriteManifest(text, sourceUrl) {
  return text.split(/\r?\n/).map(function(line) {
    var trimmed = line.trim();
    if (!trimmed || trimmed[0] === '#') {
      return line.replace(/URI="([^"]+)"/g, function(_, uri) {
        var abs = absolute(sourceUrl, uri);
        return abs ? 'URI="' + proxyUrl(abs) + '"' : _;
      });
    }
    var abs = absolute(sourceUrl, trimmed);
    return abs ? proxyUrl(abs) : line;
  }).join('\n');
}

module.exports = async function handler(req, res) {
  var raw = req.query && req.query.url;
  if (!raw) return res.status(400).send('missing url');

  var target;
  try { target = new URL(String(raw)); }
  catch (_) { return res.status(400).send('invalid url'); }
  if (!/^https?:$/.test(target.protocol)) return res.status(400).send('http(s) only');

  try {
    var upstream = await fetch(target.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' }
    });
    var ct = upstream.headers.get('content-type') || '';
    var buf = Buffer.from(await upstream.arrayBuffer());
    if (!upstream.ok) return res.status(upstream.status).send(buf.toString('utf8').slice(0, 500));

    var preview = buf.slice(0, 32).toString('utf8');
    var isManifest = /\.m3u8(?:$|\?)/i.test(target.pathname + target.search) ||
      /mpegurl/i.test(ct) || preview.indexOf('#EXTM3U') === 0;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    if (isManifest) {
      var text = buf.toString('utf8');
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.status(200).send(rewriteManifest(text, target.toString()));
    }

    res.setHeader('Content-Type', ct || 'application/octet-stream');
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(502).send('upstream error: ' + String((e && e.message) || e));
  }
};
