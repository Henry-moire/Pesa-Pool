# Pesa Pool

A desktop application for tracking family contributions at life events such as funerals, weddings, and medical emergencies. Built for simplicity and ease of use.

---

## Features

- Create and manage separate records for each event
- Track donations by donor name, amount, and date
- Automatically matches returning donors across multiple contributions
- Disambiguation prompt for donors with the same name
- Sort donations by name, amount, or date
- Edit or delete any donation record
- Export records to PDF, Excel, CSV, or JSON
- Fully offline — no internet connection required

---

## Installation

Download the latest installer from the [releases page](https://github.com/Henry-moire/Pesa-Pool/releases) and run it. No additional software required.

> **Note:** Windows may show a SmartScreen warning on first launch. Click **More info → Run anyway** to proceed. This is expected for unsigned installers.

---

## For Developers

**Requirements:** Node.js 18+

```bash
git clone https://github.com/Henry-moire/Pesa-Pool.git
cd Pesa-Pool
npm install
npm start
```

To build a Windows installer:

```bash
npm run build
```

---

## Data Storage

All data is saved locally to `Documents/Pesa Pool/` on your machine. Each event is stored as a separate JSON file. No data is sent anywhere.

---

## Built With

- [Electron](https://electronjs.org)
- [ExcelJS](https://github.com/exceljs/exceljs)
- [jsPDF](https://github.com/parallax/jsPDF)

---

## License

ISC
