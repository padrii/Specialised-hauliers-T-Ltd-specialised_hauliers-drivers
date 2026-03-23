/**
 * Navigation bar for authenticated pages
 */
(function () {
  const pages = [
    { href: "dashboard.html", label: "Dashibodi", id: "dashboard" },
    { href: "sajili-incharge.html", label: "Sajili Incharge", id: "incharge" },
    { href: "sajili-dereva.html", label: "Sajili Dereva", id: "driver" },
    { href: "orodha-madereva.html", label: "Orodha ya Madereva", id: "list" },
    { href: "pakua-excel.html", label: "Pakua Excel", id: "excel" },
  ];

  function renderNav(containerId, activeId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const frag = document.createDocumentFragment();
    pages.forEach((p) => {
      const a = document.createElement("a");
      a.href = p.href;
      a.textContent = p.label;
      if (p.id === activeId) a.classList.add("active");
      frag.appendChild(a);
    });
    const spacer = document.createElement("span");
    spacer.className = "nav-spacer";
    frag.appendChild(spacer);
    const out = document.createElement("a");
    out.href = "#";
    out.textContent = "Toka (Logout)";
    out.addEventListener("click", function (e) {
      e.preventDefault();
      window.SHTLAuth.logout();
    });
    frag.appendChild(out);
    el.appendChild(frag);
  }

  window.SHTLNav = { renderNav };
})();
