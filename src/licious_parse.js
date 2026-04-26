// Go to licious website and paste this piece of code inside the terminal
// [].slice.apply(document.querySelectorAll('.OrderHistory_headerContainer__GQfBn')).map(a => a.outerText).map(entry => {
//   const lines = entry.split('\n').map(l => l.trim());

//   // --- 1. Extract amount ---
//   const amountLineIndex = lines.findIndex(line => line.startsWith('₹'));
//   const amount = amountLineIndex !== -1
//     ? parseFloat(lines[amountLineIndex].replace('₹', ''))
//     : null;

//   // --- 2. Extract date ---
//   const dateLine = lines.find(line =>
//     /\d{1,2} \w{3} \d{4}/.test(line)
//   );

//   const date = dateLine
//     ? dateLine.split(',')[0]  // remove time
//     : null;

//   // --- 3. Extract items ---
//   const items = [];

//   for (let i = amountLineIndex + 1; i < lines.length; i++) {
//     const line = lines[i];

//     if (
//       line.includes('Repeat') ||
//       line.includes('Rate order') ||
//       line.includes('Get Help')
//     ) break;

//     if (line.includes('₹') || line.includes('Qty') || line === '') continue;

//     items.push(line);
//   }

//   return { date, amount, items };
// });

function formatDate(input) {
  const [day, mon, year] = input.split(' ');

  const months = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04',
    May: '05', Jun: '06', Jul: '07', Aug: '08',
    Sep: '09', Oct: '10', Nov: '11', Dec: '12'
  };

  return `${day}-${months[mon]}-${year}`;
}

export function parseLiciousData() {
    const liciousData = [
        {
            "date": "23 Apr 2026",
            "amount": 394,
            "items": [
                "Chicken Curry Cut - Large Pieces (Large Pack)"
            ]
        },
        {
            "date": "20 Apr 2026",
            "amount": 794.88,
            "items": [
                "Loaded Chicken Momos",
                "Chicken Curry Cut - Large Pieces (Large Pack)",
                "Pabda (Butterfish) Medium - Whole Cleaned & Gutted With Head"
            ]
        },
        {
            "date": "15 Apr 2026",
            "amount": 386.77,
            "items": [
                "Chicken Curry Cut - Large Pieces (Large Pack)"
            ]
        },
        {
            "date": "13 Apr 2026",
            "amount": 764,
            "items": [
                "Freshwater Prawns (Small Sized) - Cleaned and Deveined",
                "Premium Chicken Leg Curry Cut"
            ]
        },
        {
            "date": "09 Apr 2026",
            "amount": 736,
            "items": [
                "Premium Chicken Thigh Boneless"
            ]
        },
        {
            "date": "07 Apr 2026",
            "amount": 668.35,
            "items": [
                "Tilapia Medium - Fillet",
                "Chicken Curry Cut - Large Pieces (Large Pack)"
            ]
        },
        {
            "date": "03 Apr 2026",
            "amount": 336,
            "items": [
                "Chicken Drumstick - Pack Of 6"
            ]
        },
        {
            "date": "01 Apr 2026",
            "amount": 624.3,
            "items": [
                "Chicken Boneless Cubes"
            ]
        }
    ];


    return liciousData.map(entry => ({
      description: entry.items.join(', '),
      dateOfInvoice: formatDate(entry.date),
      totalAmount: entry.amount,
    }));
};