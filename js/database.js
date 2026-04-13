/* Galette des Rois Tokyo - Database filter/sort/render */
(function () {
  "use strict";

  let shops = [];
  const grid = document.getElementById("shop-grid");
  const countEl = document.getElementById("shop-count");
  const searchInput = document.getElementById("search");
  const areaFilter = document.getElementById("filter-area");
  const styleFilter = document.getElementById("filter-style");
  const reservationFilter = document.getElementById("filter-reservation");
  const sortSelect = document.getElementById("sort");

  const AREA_LABELS = {
    "tokyo-central": "Tokyo Central",
    "tokyo-west": "Tokyo West",
    "tokyo-east": "Tokyo East",
    "yokohama": "Yokohama",
    "osaka": "Osaka",
    "kyoto": "Kyoto"
  };

  const STYLE_LABELS = {
    "classic-puff": "Classic Puff",
    "almond-cream": "Almond Cream"
  };

  function getMinPrice(priceStr) {
    var match = priceStr.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  function filterAndRender() {
    var query = searchInput.value.toLowerCase().trim();
    var area = areaFilter.value;
    var style = styleFilter.value;
    var reservation = reservationFilter.value;
    var sortBy = sortSelect.value;

    var filtered = shops.filter(function (s) {
      if (area && s.area !== area) return false;
      if (style && s.pastry_style !== style) return false;
      if (reservation === "true" && !s.reservation_required) return false;
      if (reservation === "false" && s.reservation_required) return false;
      if (query) {
        var haystack = (s.shop_name + " " + s.neighborhood + " " + s.brand + " " + s.highlight).toLowerCase();
        if (haystack.indexOf(query) === -1) return false;
      }
      return true;
    });

    filtered.sort(function (a, b) {
      if (sortBy === "price-low") return getMinPrice(a.price_range_yen) - getMinPrice(b.price_range_yen);
      if (sortBy === "price-high") return getMinPrice(b.price_range_yen) - getMinPrice(a.price_range_yen);
      return a.shop_name.localeCompare(b.shop_name);
    });

    countEl.textContent = filtered.length + " shop" + (filtered.length !== 1 ? "s" : "") + " found";

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="no-results">No shops match your filters. Try broadening your search.</div>';
      return;
    }

    grid.innerHTML = filtered.map(function (s) {
      var icons = [];
      if (s.reservation_required) icons.push('<span title="Reservation required">&#128203; Reservation</span>');
      if (s.delivery) icons.push('<span title="Delivery available">&#128666; Delivery</span>');
      if (s.online_order) icons.push('<span title="Online ordering">&#128187; Online</span>');

      return '<div class="shop-card">' +
        '<h3>' + escapeHtml(s.shop_name) + '</h3>' +
        '<div class="shop-meta">' +
          '<span class="badge badge-area">' + (AREA_LABELS[s.area] || s.area) + '</span>' +
          '<span class="badge badge-style">' + (STYLE_LABELS[s.pastry_style] || s.pastry_style) + '</span>' +
          '<span class="badge badge-style">' + escapeHtml(s.feve_type) + ' feve</span>' +
        '</div>' +
        '<div style="color:#6B5B4B;font-size:0.85rem">' + escapeHtml(s.neighborhood) + '</div>' +
        '<div class="shop-price">&yen;' + escapeHtml(s.price_range_yen) + '</div>' +
        (icons.length ? '<div class="shop-icons">' + icons.join("") + '</div>' : '') +
        (s.highlight ? '<div class="shop-highlight">' + escapeHtml(s.highlight) + '</div>' : '') +
      '</div>';
    }).join("");
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Event listeners
  [searchInput, areaFilter, styleFilter, reservationFilter, sortSelect].forEach(function (el) {
    el.addEventListener("input", filterAndRender);
    el.addEventListener("change", filterAndRender);
  });

  // Fetch data
  fetch("data/shops.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      shops = data;
      filterAndRender();
    })
    .catch(function () {
      grid.innerHTML = '<div class="no-results">Failed to load shop data. Please try refreshing.</div>';
    });
})();
