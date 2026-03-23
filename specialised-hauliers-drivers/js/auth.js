/**
 * Admin session — login / logout / guard pages
 */
(function () {
  function isLoggedIn() {
    const s = window.SHTL.getSession();
    return !!(s && s.username);
  }

  function requireAuth(redirectTo) {
    if (!isLoggedIn()) {
      window.location.href = redirectTo || "index.html";
      return false;
    }
    return true;
  }

  function login(username, password) {
    const admins = window.SHTL.getAdmins();
    const found = admins.find(
      (a) => a.username === username && a.password === password
    );
    if (!found) return { ok: false, message: "Jina la mtumiaji au nenosiri si sahihi." };
    window.SHTL.setSession({
      adminId: found.id,
      username: found.username,
      at: new Date().toISOString(),
    });
    return { ok: true };
  }

  function logout() {
    window.SHTL.setSession(null);
    window.location.href = "index.html";
  }

  function registerAdmin(username, password, email) {
    if (!username || !password) {
      return { ok: false, message: "Jaza jina la mtumiaji na nenosiri." };
    }
    const em = email != null ? String(email).trim() : "";
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      return { ok: false, message: "Barua pepe si sahihi." };
    }
    const admins = window.SHTL.getAdmins();
    if (admins.some((a) => a.username === username)) {
      return { ok: false, message: "Jina hili la mtumiaji limesajiliwa tayari." };
    }
    admins.push({
      id: window.SHTL.uid(),
      username: username.trim(),
      password: password,
      email: em,
      createdAt: new Date().toISOString(),
    });
    window.SHTL.saveAdmins(admins);
    return { ok: true };
  }

  function hasAnyAdmin() {
    return window.SHTL.getAdmins().length > 0;
  }

  window.SHTLAuth = {
    isLoggedIn,
    requireAuth,
    login,
    logout,
    registerAdmin,
    hasAnyAdmin,
  };
})();
