/**
 * LocalStorage helpers — Specialised Hauliers (T) Ltd
 * Keys: shtl_admins, shtl_incharges, shtl_drivers, shtl_session
 */
(function () {
  const PREFIX = "shtl_";

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  }

  function uid() {
    return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
  }

  window.SHTL = {
    read,
    write,
    uid,

    getAdmins() {
      return read("admins", []);
    },

    saveAdmins(list) {
      write("admins", list);
    },

    getIncharges() {
      return read("incharges", []);
    },

    saveIncharges(list) {
      write("incharges", list);
    },

    getDrivers() {
      return read("drivers", []);
    },

    saveDrivers(list) {
      write("drivers", list);
    },

    getSession() {
      return read("session", null);
    },

    setSession(session) {
      if (session == null) {
        localStorage.removeItem(PREFIX + "session");
      } else {
        write("session", session);
      }
    },
  };
})();
