/**
 * Kusoma faili la Excel (.xlsx) na kuagiza madereva — muundo sawa na ripoti ya kutolea.
 * Inahitaji SheetJS (XLSX) kutoka CDN.
 */
(function () {
  function normHeader(h) {
    return String(h == null ? "" : h)
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ");
  }

  function cellStr(v) {
    if (v == null || v === "") return "";
    if (typeof v === "number") {
      if (v > 200 && v < 100000) {
        var utc = Date.UTC(1899, 11, 30) + Math.round(v) * 86400000;
        var d = new Date(utc);
        if (!isNaN(d.getTime())) {
          var y = d.getUTCFullYear();
          var m = String(d.getUTCMonth() + 1).padStart(2, "0");
          var day = String(d.getUTCDate()).padStart(2, "0");
          return y + "-" + m + "-" + day;
        }
      }
    }
    return String(v).trim();
  }

  function parseYesNo(s) {
    var t = String(s || "")
      .trim()
      .toUpperCase();
    if (t === "YES" || t === "Y" || t === "1" || t === "TRUE") return true;
    if (t === "NO" || t === "N" || t === "0" || t === "FALSE" || t === "") return false;
    return !!t;
  }

  function findColIndex(headers, candidates) {
    for (var i = 0; i < headers.length; i++) {
      var h = normHeader(headers[i]);
      for (var c = 0; c < candidates.length; c++) {
        if (h === candidates[c] || h.indexOf(candidates[c]) === 0) return i;
      }
    }
    return -1;
  }

  function findColIndexExact(headers, exact) {
    var e = normHeader(exact);
    for (var i = 0; i < headers.length; i++) {
      if (normHeader(headers[i]) === e) return i;
    }
    return -1;
  }

  /**
   * Namba za lori zisome kama maandishi kamili — si tarehe za Excel.
   */
  function cellTruck(v) {
    if (v == null || v === "") return "";
    if (typeof v === "number") {
      if (Number.isFinite(v) && Math.floor(v) === v) {
        return String(Math.floor(v));
      }
      return String(v).trim();
    }
    return String(v).trim();
  }

  /**
   * Tafuta safu ya TRUCK NUMBER kwa majina mbalimbali au safu ya 2 baada ya S/N.
   */
  function findTruckCol(headers) {
    var idx = findColIndex(headers, [
      "TRUCK NUMBER",
      "TRUCK NO",
      "TRUCK#",
      "TRUCK",
      "LORI NO",
      "LORI NUMBER",
      "VEHICLE NO",
      "UNIT NO",
      "UNIT",
    ]);
    if (idx >= 0) return idx;
    var i;
    for (i = 0; i < headers.length; i++) {
      var h = normHeader(headers[i]);
      if (
        h.indexOf("TRUCK") !== -1 ||
        (h.indexOf("LORI") !== -1 && h.indexOf("LICENCE") === -1) ||
        (h.indexOf("VEHICLE") !== -1 && h.indexOf("STATUS") === -1)
      ) {
        return i;
      }
    }
    if (headers.length >= 2) {
      var h0 = normHeader(headers[0]);
      if (h0 === "S/N" || h0 === "SN" || h0.indexOf("S/N") !== -1) {
        return 1;
      }
    }
    return -1;
  }

  function findFirstLicenceCol(headers) {
    var idx = -1;
    for (var i = 0; i < headers.length; i++) {
      var h = normHeader(headers[i]);
      if (h.indexOf("DRIVING LICENCE") !== -1 || h.indexOf("LICENSE NUMBER") !== -1) {
        idx = i;
        break;
      }
    }
    return idx;
  }

  /**
   * Badilisha tarehe kutoka Excel (namba, ISO, M/D/Y, D/M/Y) kuwa YYYY-MM-DD.
   */
  function parseFlexibleDate(raw) {
    if (raw == null || raw === "") return "";
    if (typeof raw === "number") {
      return cellStr(raw);
    }
    var str = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (str.indexOf("/") !== -1 || str.indexOf("-") !== -1) {
      var sep = str.indexOf("/") !== -1 ? "/" : "-";
      var p = str.split(sep);
      if (p.length === 3) {
        var a = parseInt(p[0], 10);
        var b = parseInt(p[1], 10);
        var y = parseInt(String(p[2]).slice(0, 4), 10);
        if (a > 12) {
          return y + "-" + String(b).padStart(2, "0") + "-" + String(a).padStart(2, "0");
        }
        return y + "-" + String(a).padStart(2, "0") + "-" + String(b).padStart(2, "0");
      }
    }
    return "";
  }

  /**
   * @param {ArrayBuffer} buf
   * @returns {{ rows: object[], errors: string[], rawRows: number }}
   */
  function parseWorkbook(buf) {
    if (typeof XLSX === "undefined") {
      throw new Error("SheetJS (XLSX) haijapakiwa.");
    }
    var wb = XLSX.read(buf, { type: "array", cellDates: true });
    var name = wb.SheetNames[0];
    var sheet = wb.Sheets[name];
    var aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
    if (!aoa.length) {
      return {
        rows: [],
        errors: ["Faili ni tupu."],
        rawRows: 0,
        truckNumbers: [],
        truckColumnFound: false,
      };
    }

    var headerRow = aoa[0];
    var headers = headerRow.map(function (h) {
      return String(h);
    });
    var colTruck = findTruckCol(headers);
    var colName = findColIndex(headers, ["DRIVER NAME"]);
    var colLic = findFirstLicenceCol(headers);
    var colMobile = findColIndex(headers, ["MOBILE", "CONTACT NUMBER", "CONTACT"]);
    var colIncharge = findColIndex(headers, ["INCHARGE"]);
    var colPos = findColIndex(headers, ["POSITION"]);
    var colTip = findColIndex(headers, ["TIPPERS", "VEHICLE TYPE"]);
    var colStat = findColIndex(headers, ["CURRENT STATUS"]);
    var colSince = findColIndex(headers, ["SINCE (DATE)", "SINCE"]);
    var colDropped = findColIndex(headers, ["DROPPED"]);
    var colDropDate = findColIndex(headers, ["DROPPED DATE"]);
    var colDriverCode = findColIndex(headers, ["DRIVER CODE"]);
    var colDoj = findColIndex(headers, ["DOJ", "DATE OF JOINING"]);
    var colIssue = findColIndex(headers, ["ISSUE DATE", "LICENSE ISSUE"]);
    var colExpire = findColIndex(headers, ["EXPIRE DATE", "EXPIREE DATE", "EXPIRY DATE", "LICENSE EXPIRY"]);
    var colDriverStatus = findColIndex(headers, ["DRIVER STATUS"]);
    var colAssigned = findColIndex(headers, ["ASSIGNED DATE"]);
    var colOperational = findColIndexExact(headers, "Status");
    if (colOperational === -1) {
      colOperational = findColIndex(headers, ["OPERATIONAL STATUS", "VEHICLE STATUS"]);
    }

    if (colName === -1) {
      return {
        rows: [],
        errors: ["Hakuna safu ya DRIVER NAME. Tumia faili lenye vichwa kama vya ripoti ya SHTL."],
        rawRows: 0,
        truckNumbers: [],
        truckColumnFound: false,
      };
    }

    var rows = [];
    var errors = [];
    if (colTruck === -1) {
      errors.push(
        "Haijapatikana safu ya TRUCK NUMBER. Weka kichwa TRUCK NUMBER (au TRUCK / LORI NO) au tumia muundo wa ripoti ya SHTL."
      );
    }
    for (var r = 1; r < aoa.length; r++) {
      var line = aoa[r];
      if (!line || !line.length) continue;
      var driverName = cellStr(line[colName]);
      if (!driverName) continue;

      var truckNumber = colTruck >= 0 ? cellTruck(line[colTruck]) : "";
      var drivingLicence = colLic >= 0 ? cellStr(line[colLic]) : "";
      var mobile = colMobile >= 0 ? cellStr(line[colMobile]) : "";
      var inchargeName = colIncharge >= 0 ? cellStr(line[colIncharge]) : "";
      var position = colPos >= 0 ? cellStr(line[colPos]) : "";
      var tippers = colTip >= 0 ? cellStr(line[colTip]) : "";
      var currentStatus = colStat >= 0 ? cellStr(line[colStat]) : "";
      var sinceDate = colSince >= 0 ? parseFlexibleDate(line[colSince]) : "";
      var driverCode = colDriverCode >= 0 ? cellStr(line[colDriverCode]) : "";
      var doj = colDoj >= 0 ? parseFlexibleDate(line[colDoj]) : "";
      var licenseIssueDate = colIssue >= 0 ? parseFlexibleDate(line[colIssue]) : "";
      var licenseExpiryDate = colExpire >= 0 ? parseFlexibleDate(line[colExpire]) : "";
      var driverAssignmentStatus = colDriverStatus >= 0 ? cellStr(line[colDriverStatus]) : "";
      var assignedDate = colAssigned >= 0 ? parseFlexibleDate(line[colAssigned]) : "";
      var operationalStatus = colOperational >= 0 ? cellStr(line[colOperational]) : "";
      var dropped = colDropped >= 0 ? parseYesNo(line[colDropped]) : false;
      var droppedAt = colDropDate >= 0 ? parseFlexibleDate(line[colDropDate]) : "";
      if (dropped && !droppedAt) {
        droppedAt = new Date().toISOString().slice(0, 10);
      }

      rows.push({
        truckNumber: truckNumber,
        drivingLicence: drivingLicence,
        driverName: driverName,
        mobile: mobile,
        inchargeName: inchargeName,
        position: position,
        tippers: tippers,
        currentStatus: currentStatus,
        sinceDate: sinceDate,
        driverCode: driverCode,
        doj: doj,
        licenseIssueDate: licenseIssueDate,
        licenseExpiryDate: licenseExpiryDate,
        driverAssignmentStatus: driverAssignmentStatus,
        assignedDate: assignedDate,
        operationalStatus: operationalStatus,
        dropped: dropped,
        droppedAt: dropped ? (droppedAt || new Date().toISOString().slice(0, 10)) : "",
      });
    }

    if (!rows.length) {
      errors.push("Hakuna safu yenye jina la dereva.");
    }

    var truckNumbers = rows
      .map(function (r) {
        return (r.truckNumber || "").trim();
      })
      .filter(function (t) {
        return !!t;
      });

    return {
      rows: rows,
      errors: errors,
      rawRows: aoa.length - 1,
      truckNumbers: truckNumbers,
      truckColumnFound: colTruck >= 0,
    };
  }

  function resolveOrCreateIncharge(name) {
    var n = String(name || "").trim();
    if (!n) {
      return { ok: true, id: "" };
    }
    var list = window.SHTL.getIncharges();
    var found = list.find(function (i) {
      return i.name.toLowerCase() === n.toLowerCase();
    });
    if (found) return { ok: true, id: found.id };
    var inc = {
      id: window.SHTL.uid(),
      name: n,
      createdAt: new Date().toISOString(),
    };
    list.push(inc);
    window.SHTL.saveIncharges(list);
    return { ok: true, id: inc.id, created: true };
  }

  function rowToDriver(row, inchargeId) {
    return {
      id: window.SHTL.uid(),
      truckNumber: String(row.truckNumber != null ? row.truckNumber : "").trim(),
      drivingLicence: row.drivingLicence,
      driverName: row.driverName,
      mobile: row.mobile,
      inchargeId: inchargeId,
      position: row.position,
      tippers: row.tippers,
      currentStatus: row.currentStatus,
      sinceDate: row.sinceDate,
      driverCode: row.driverCode || "",
      doj: row.doj || "",
      licenseIssueDate: row.licenseIssueDate || "",
      licenseExpiryDate: row.licenseExpiryDate || "",
      driverAssignmentStatus: row.driverAssignmentStatus || "",
      assignedDate: row.assignedDate || "",
      operationalStatus: row.operationalStatus || "",
      dropped: !!row.dropped,
      droppedAt: row.dropped ? row.droppedAt || new Date().toISOString() : "",
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * @param {object[]} parsedRows from parseWorkbook result.rows
   * @param {"merge"|"replace"} mode
   */
  function applyImport(parsedRows, mode) {
    var errs = [];
    var drivers = [];
    var i;
    for (i = 0; i < parsedRows.length; i++) {
      var row = parsedRows[i];
      var r = resolveOrCreateIncharge(row.inchargeName);
      if (!r.ok) {
        errs.push("Mstari " + (i + 2) + ": " + r.message);
        continue;
      }
      drivers.push(rowToDriver(row, r.id));
    }
    if (!drivers.length) {
      return {
        ok: false,
        errors: errs.length ? errs : ["Hakuna mstari uliofanikiwa. Hakikisha kuna DRIVER NAME na safu sahihi."],
      };
    }
    if (mode === "replace") {
      window.SHTL.saveDrivers(drivers);
    } else {
      var existing = window.SHTL.getDrivers();
      window.SHTL.saveDrivers(existing.concat(drivers));
    }
    return {
      ok: true,
      imported: drivers.length,
      warnings: errs,
    };
  }

  function downloadTemplate() {
    if (typeof XLSX === "undefined") return;
    var headers = [
      "S/N",
      "TRUCK",
      "DRIVER NAME",
      "DRIVER CODE",
      "DOJ",
      "LICENSE NUMBER",
      "Contact Number",
      "POSITION",
      "ISSUE DATE",
      "EXPIRE DATE",
      "Incharge",
      "Vehicle Type",
      "Driver Status",
      "ASSIGNED DATE",
      "Status",
      "CURRENT STATUS",
      "SINCE (DATE)",
      "DROPPED",
      "DROPPED DATE",
    ];
    var sample = [
      "1",
      "T160DBL",
      "MFANO JINA DEREWA",
      "CBF2582",
      "01/15/2020",
      "123456789",
      "0689000000",
      "FLATBED",
      "01/01/2020",
      "01/01/2030",
      "JINA LA INCHARGE",
      "FLATBED",
      "WITH DRIVER",
      "15/03/2025",
      "RUNNING",
      "ON THE TRUCK",
      "01/15/2025",
      "NO",
      "",
    ];
    var ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Madereva");
    XLSX.writeFile(wb, "SHTL_kiolezo_madereva.xlsx");
  }

  window.SHTLExcelImport = {
    parseWorkbook: parseWorkbook,
    applyImport: applyImport,
    downloadTemplate: downloadTemplate,
  };
})();
