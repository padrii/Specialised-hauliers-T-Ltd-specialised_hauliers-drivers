/**
 * Excel export — muundo sawa na spreadsheet ya kampuni (vichwa vya buluu, safu mbili za leseni).
 * Inahitaji ExcelJS (CDN) kwenye ukurasa unaopakua.
 */
(function () {
  function formatDateMDY(value) {
    if (value == null || value === "") return "";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-");
      return `${m}/${d}/${y}`;
    }
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return String(value);
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    const y = dt.getFullYear();
    return `${m}/${day}/${y}`;
  }

  function inchargeNameById(incharges, id) {
    if (!id) return "";
    const f = incharges.find((i) => i.id === id);
    return f ? f.name : "";
  }

  function thinBorder() {
    return {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  }

  /**
   * @returns {Promise<Blob>}
   */
  async function buildWorkbookBlob() {
    if (typeof ExcelJS === "undefined") {
      throw new Error("ExcelJS haijapakiwa. Hakikisha script ya CDN imeunganishwa.");
    }

    const drivers = window.SHTL.getDrivers();
    const incharges = window.SHTL.getIncharges();
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Madereva", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    const headers = [
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

    ws.addRow(headers);
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FF000000" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF00AEEF" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.border = thinBorder();
    });

    const widths = [6, 12, 28, 12, 12, 14, 18, 14, 12, 12, 16, 14, 16, 14, 12, 16, 14, 10, 14];
    widths.forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });

    drivers.forEach((d, idx) => {
      const lic = d.drivingLicence != null ? String(d.drivingLicence) : "";
      const name = (d.driverName || "").toString().toUpperCase();
      const mobile = d.mobile != null ? String(d.mobile) : "";
      const incharge =
        inchargeNameById(incharges, d.inchargeId) ||
        (d.inchargeName || "").toString();

      const dropped = !!d.dropped;
      const driverCode = d.driverCode != null ? String(d.driverCode) : "";
      const driverAssignmentStatus = d.driverAssignmentStatus != null ? String(d.driverAssignmentStatus) : "";
      const operationalStatus = d.operationalStatus != null ? String(d.operationalStatus) : "";
      const row = ws.addRow([
        idx + 1,
        d.truckNumber || "",
        name,
        driverCode,
        formatDateMDY(d.doj),
        lic,
        mobile,
        d.position || "",
        formatDateMDY(d.licenseIssueDate),
        formatDateMDY(d.licenseExpiryDate),
        incharge,
        d.tippers || "",
        driverAssignmentStatus,
        formatDateMDY(d.assignedDate),
        operationalStatus,
        d.currentStatus || "",
        formatDateMDY(d.sinceDate),
        dropped ? "YES" : "NO",
        dropped && d.droppedAt ? formatDateMDY(String(d.droppedAt).slice(0, 10)) : "",
      ]);

      row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      row.eachCell((cell, colNumber) => {
        cell.border = thinBorder();
        const textCols = [2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
        if (textCols.includes(colNumber)) {
          cell.numFmt = "@";
        }
      });
    });

    const buf = await workbook.xlsx.writeBuffer();
    return new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadDriversReport() {
    const blob = await buildWorkbookBlob();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `SHTL_Madereva_${stamp}.xlsx`);
  }

  window.SHTLExcel = {
    buildWorkbookBlob,
    downloadDriversReport,
    formatDateMDY,
  };
})();
