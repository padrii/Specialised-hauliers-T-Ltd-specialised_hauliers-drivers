/**
 * Sidebar ya ndani — ikoni za emoji (hazionekani kama maandishi ya font)
 */
(function () {
  var ITEMS = [
    { id: "dashboard", href: "dashboard.html", label: "Dashboard", icon: "\ud83d\udcca" },
    { id: "form", href: "sajili-dereva.html", label: "Fomu ya dereva", icon: "\ud83d\udcdd" },
    {
      id: "table",
      href: "orodha-madereva.html",
      label: "Orodha ya madereva",
      icon: "\ud83d\udccb",
      addHref: "sajili-dereva.html",
    },
    { id: "dropped", href: "madereva-dropped.html", label: "Dropped drivers", icon: "\ud83d\udeab" },
    { id: "incharge", href: "sajili-incharge.html", label: "Sajili incharge", icon: "\ud83d\udc54" },
    { id: "import", href: "import-madereva.html", label: "Ingiza Excel", icon: "\ud83d\udce4" },
    { id: "excel", href: "pakua-excel.html", label: "Pakua Excel", icon: "\ud83d\udce5" },
    {
      id: "strack",
      href: "https://www.strack.co.tz/",
      label: "Strack (ufuatiliaji)",
      icon: "\ud83d\uddfa",
      external: true,
    },
    { id: "users", href: "sajili-admin.html", label: "Watumiaji / Admin", icon: "\ud83d\udc65" },
  ];

  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function inchargeNameById(id) {
    if (!id || !window.SHTL) return "";
    var list = window.SHTL.getIncharges();
    var f = list.find(function (i) {
      return i.id === id;
    });
    return f ? f.name : "";
  }

  function initAdminSearch() {
    var input = document.getElementById("admin-search-drivers");
    var box = document.getElementById("admin-search-results");
    if (!input || !box) return;
    if (input.dataset.bound) return;
    input.dataset.bound = "1";

    var debounce;
    function run() {
      var q = (input.value || "").trim().toLowerCase();
      if (!q) {
        box.hidden = true;
        box.innerHTML = "";
        return;
      }
      if (!window.SHTL) return;
      var drivers = window.SHTL.getDrivers();
      var terms = q.split(/\s+/).filter(Boolean);
      var match = drivers.filter(function (d) {
        var blob = [
          d.truckNumber,
          d.driverName,
          d.driverCode,
          d.mobile,
          d.drivingLicence,
          d.currentStatus,
          d.position,
          d.tippers,
          d.driverAssignmentStatus,
          d.operationalStatus,
          inchargeNameById(d.inchargeId),
        ]
          .join(" ")
          .toLowerCase();
        return terms.every(function (t) {
          return blob.indexOf(t) !== -1;
        });
      });
      match = match.slice(0, 8);
      box.innerHTML = "";
      if (!match.length) {
        var empty = document.createElement("div");
        empty.className = "admin-sidebar__search-empty";
        empty.textContent = "Hakuna matokeo";
        box.appendChild(empty);
      } else {
        match.forEach(function (d) {
          var a = document.createElement("a");
          a.href = "sajili-dereva.html?id=" + encodeURIComponent(d.id);
          a.className = "admin-sidebar__search-item";
          var strong = document.createElement("strong");
          strong.textContent = (d.driverName || "Dereva").toUpperCase();
          var span = document.createElement("span");
          span.textContent =
            (d.truckNumber || "—") +
            " · " +
            (d.mobile || "—") +
            (d.dropped ? " · dropped" : "");
          a.appendChild(strong);
          a.appendChild(span);
          box.appendChild(a);
        });
      }
      box.hidden = false;
    }

    input.addEventListener("input", function () {
      clearTimeout(debounce);
      debounce = setTimeout(run, 180);
    });
    input.addEventListener("focus", function () {
      if ((input.value || "").trim()) run();
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".admin-sidebar__search")) {
        box.hidden = true;
      }
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        box.hidden = true;
        input.blur();
      }
    });
  }

  function render(activeId) {
    var el = document.getElementById("admin-sidebar");
    if (!el) return;

    var session = window.SHTL.getSession();
    var user = session && session.username ? session.username : "Admin";

    function itemHtml(item) {
      var active = !item.external && item.id === activeId ? " is-active" : "";
      var ext = item.external ? ' target="_blank" rel="noopener noreferrer"' : "";
      var inner =
        '<a class="admin-sidebar__link' +
        active +
        '" href="' +
        esc(item.href) +
        '"' +
        ext +
        '>' +
        '<span class="admin-sidebar__ico" aria-hidden="true">' +
        item.icon +
        "</span>" +
        '<span class="admin-sidebar__label">' +
        esc(item.label) +
        "</span>" +
        "</a>";
      if (item.addHref) {
        return (
          '<div class="admin-sidebar__row">' +
          inner +
          '<a class="admin-sidebar__add" href="' +
          esc(item.addHref) +
          '" title="Ongeza" aria-label="Ongeza">+</a>' +
          "</div>"
        );
      }
      return inner;
    }

    var navHtml = ITEMS.map(itemHtml).join("");

    el.innerHTML =
      '<div class="admin-sidebar__brand"><span class="admin-sidebar__brand-mark">SHTL</span> Admin</div>' +
      '<div class="admin-sidebar__search">' +
      '<label for="admin-search-drivers" class="admin-sidebar__search-label">Tafuta dereva</label>' +
      '<input type="search" id="admin-search-drivers" class="admin-sidebar__search-input" placeholder="Jina, lori, simu, leseni…" autocomplete="off" />' +
      '<div id="admin-search-results" class="admin-sidebar__search-results" role="listbox" hidden></div>' +
      "</div>" +
      '<nav class="admin-sidebar__nav" aria-label="Menyu">' +
      navHtml +
      "</nav>" +
      '<div class="admin-sidebar__footer">' +
      '<span class="admin-sidebar__icon-btn" title="' +
      esc(user) +
      '"><span class="admin-sidebar__ico-sm" aria-hidden="true">\ud83d\udc64</span></span>' +
      '<button type="button" class="admin-sidebar__icon-btn" disabled title="Chat"><span class="admin-sidebar__ico-sm" aria-hidden="true">\ud83d\udcac</span></button>' +
      '<button type="button" class="admin-sidebar__icon-btn" disabled title="Arifa"><span class="admin-sidebar__ico-sm" aria-hidden="true">\ud83d\udd14</span></button>' +
      '<button type="button" class="admin-sidebar__icon-btn" id="admin-shell-logout" title="Toka"><span class="admin-sidebar__ico-sm" aria-hidden="true">\ud83d\udeaa</span></button>' +
      "</div>";

    var lo = document.getElementById("admin-shell-logout");
    if (lo) {
      lo.addEventListener("click", function () {
        window.SHTLAuth.logout();
      });
    }
    initAdminSearch();
  }

  window.SHTLAdminShell = { render: render };
})();
