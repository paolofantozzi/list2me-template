(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function pinIcon(color) {
    var L = window.L;
    return L.divIcon({
      className: '',
      html: '<div style="position:relative;width:24px;height:32px">'
        + '<span style="position:absolute;left:50%;top:0;transform:translateX(-50%) rotate(45deg);width:20px;height:20px;border-radius:50% 50% 50% 0;background:' + color + ';border:2.5px solid #fff;box-shadow:0 3px 7px -1px rgba(0,0,0,.5)"></span>'
        + '<span style="position:absolute;left:50%;top:7px;transform:translateX(-50%);width:6px;height:6px;border-radius:50%;background:#fff"></span>'
        + '</div>',
      iconSize: [24, 32],
      iconAnchor: [12, 30],
      popupAnchor: [0, -28]
    });
  }

  function buildPopup(it, onOpenList) {
    var wrap = document.createElement('div');
    wrap.style.cssText = "font-family:'Instrument Sans',system-ui,sans-serif;min-width:210px;color:#0a2239";
    var rows = [];
    rows.push('<div style="display:flex;align-items:center;gap:6px;margin-bottom:7px">'
      + '<span style="width:9px;height:9px;border-radius:50%;background:' + it.kindColor + ';flex-shrink:0"></span>'
      + '<span style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:' + it.kindColor + '">' + esc(it.kindOne) + '</span>'
      + '<span style="margin-left:auto;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:#5d7488;background:#eef2f6;padding:2px 8px;border-radius:999px">' + esc(it.typeLabel) + '</span>'
      + '</div>');
    rows.push('<div style="font-family:\'Bricolage Grotesque\',sans-serif;font-weight:700;font-size:16px;line-height:1.25;margin-bottom:3px">' + esc(it.text) + '</div>');
    if (it.detail) rows.push('<div style="color:#5d7488;font-size:12.5px;line-height:1.4">' + esc(it.detail) + '</div>');
    if (it.meta) rows.push('<div style="color:#5d7488;font-size:12px;line-height:1.4;margin-top:2px">' + esc(it.meta) + '</div>');
    var facts = [];
    if (it.place) facts.push('<div style="font-size:12.5px;margin-top:5px"><span style="color:#5d7488">Luogo:</span> ' + esc(it.place) + '</div>');
    if (it.whenLabel) facts.push('<div style="font-size:12.5px"><span style="color:#5d7488">Quando:</span> ' + esc(it.whenLabel) + '</div>');
    rows.push(facts.join(''));
    rows.push('<div style="font-family:ui-monospace,monospace;font-size:10px;color:#8ba7bd;margin-top:5px">' + esc(it.coordLabel) + (it.ext ? ' &middot; ' + esc(it.ext) : '') + '</div>');
    wrap.innerHTML = rows.join('');

    var link = document.createElement('button');
    link.type = 'button';
    link.style.cssText = 'margin-top:9px;display:inline-flex;align-items:center;gap:6px;font-family:inherit;font-size:13px;font-weight:600;color:#fff;background:' + it.kindColor + ';border:none;border-radius:9px;padding:7px 12px;cursor:pointer;width:100%;justify-content:center';
    link.innerHTML = 'Vai alla lista: ' + esc(it.listTitle) + ' &rarr;';
    link.addEventListener('click', function (e) { e.preventDefault(); if (onOpenList) onOpenList(it.listId); });
    wrap.appendChild(link);
    return wrap;
  }

  function ListMap(props) {
    var items = props.items || [];
    var onOpenList = props.onOpenList;
    var hostRef = React.useRef(null);
    var mapRef = React.useRef(null);
    var layerRef = React.useRef(null);
    var sigRef = React.useRef('');

    React.useEffect(function () {
      var cancelled = false;
      function start() {
        if (cancelled) return;
        var L = window.L;
        if (!L || !hostRef.current) { setTimeout(start, 60); return; }
        var map = L.map(hostRef.current, { zoomControl: true, scrollWheelZoom: true, worldCopyJump: true });
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
        }).addTo(map);
        map.setView([42.2, 12.4], 5);
        mapRef.current = map;
        layerRef.current = L.layerGroup().addTo(map);
        setTimeout(function () { if (mapRef.current) mapRef.current.invalidateSize(); }, 80);
        render(true);
      }
      start();
      return function () { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    }, []);

    React.useEffect(function () { render(false); });

    function render(force) {
      var L = window.L;
      var map = mapRef.current, layer = layerRef.current;
      if (!L || !map || !layer) return;
      var sig = items.map(function (i) { return i.uid + ',' + i.lat + ',' + i.lng + ',' + i.kindColor; }).join('|');
      if (!force && sig === sigRef.current) return;
      sigRef.current = sig;
      layer.clearLayers();
      var pts = [];
      items.forEach(function (it) {
        var m = L.marker([it.lat, it.lng], { icon: pinIcon(it.kindColor), title: it.text });
        m.bindPopup(function () { return buildPopup(it, onOpenList); }, { minWidth: 210, maxWidth: 300, autoPan: true });
        m.addTo(layer);
        pts.push([it.lat, it.lng]);
      });
      if (pts.length === 1) {
        map.setView(pts[0], Math.max(map.getZoom(), 11));
      } else if (pts.length > 1) {
        map.fitBounds(pts, { padding: [46, 46], maxZoom: 13 });
      }
      setTimeout(function () { if (mapRef.current) mapRef.current.invalidateSize(); }, 60);
    }

    return React.createElement('div', { ref: hostRef, style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } });
  }

  window.ListMap = ListMap;
})();
