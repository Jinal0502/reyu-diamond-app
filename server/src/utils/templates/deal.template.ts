export const dealHtmlTemplate = (deal: any) => {
  const bid = deal.bidId;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Invoice</title>

<style>
  body {
    font-family: Inter, Arial, sans-serif;
    background: #ffffff;
    margin: 0;
    padding: 0;
    color: #111827;
  }

  .invoice {
    width: 820px;
    margin: 0 auto;
    padding: 48px 56px;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    border-bottom: 2px solid #d1d5db;
    padding-bottom: 22px;
  }

  h1 {
    margin: 0;
    font-size: 32px;
    color: #1f2937;
  }

  .subtitle {
    font-size: 16px;
    color: #6b7280;
    margin-top: 6px;
  }

  .meta {
    text-align: right;
    font-size: 16px;
  }

  .meta div {
    margin-bottom: 6px;
  }

  /* Parties */
  .parties {
    display: flex;
    gap: 50px;
    margin: 36px 0;
  }

  .party {
    width: 50%;
  }

  .party strong {
    font-size: 17px;
  }

  .party p {
    margin: 6px 0;
    font-size: 16px;
    color: #374151;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 28px;
  }

  th {
    background: transparent;
    color: #111827;
    font-size: 16px;
    font-weight: 600;
    padding: 12px 10px;
    text-align: left;
    border-bottom: 2px solid #d1d5db;
  }

  td {
    font-size: 16px;
    padding: 12px 10px;
    border-bottom: 1px solid #e5e7eb;
  }

  .right {
    text-align: right;
  }

  /* Total */
  .total {
    margin-top: 22px;
    width: 280px;
    margin-left: auto;
    background: #f9fafb;
    padding: 16px 18px;
    border-radius: 6px;
    font-size: 17px;
    font-weight: 600;
    border: 1px solid #e5e7eb;
  }

  /* Section title */
  .section-title {
    margin-top: 40px;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  /* Footer */
  footer {
    margin-top: 44px;
    text-align: center;
    font-size: 13px;
    color: #6b7280;
  }
</style>
</head>

<body>

<div class="invoice">

  <!-- HEADER -->
  <div class="header">
    <div>
      <h1>Invoice</h1>
      <div class="subtitle">Deal Agreement Summary</div>
    </div>

    <div class="meta">
      <div><strong>Deal ID:</strong> ${deal._id}</div>
      <div><strong>Status:</strong> ${deal.status}</div>
      <div><strong>Date:</strong> ${new Date(deal.createdAt).toDateString()}</div>
    </div>
  </div>

  <!-- PARTIES -->
  <div class="parties">
    <div class="party">
      <strong>Billed To</strong>
      <p>${deal.buyerId?.name}</p>
      <p>${deal.buyerId?.email}</p>
    </div>

    <div class="party">
      <strong>From</strong>
      <p>${deal.sellerId?.name}</p>
      <p>${deal.sellerId?.email}</p>
    </div>
  </div>

  <!-- AMOUNT TABLE -->
  <table>
    <tr>
      <th>Description</th>
      <th class="right">Amount</th>
    </tr>

    <tr>
      <td>Deal Amount</td>
      <td class="right">${deal.currency} ${deal.dealAmount}</td>
    </tr>

    ${
      bid
        ? `
    <tr>
      <td>Bid Reference (${bid._id})</td>
      <td class="right">${bid.currency || deal.currency} ${bid.bidAmount}</td>
    </tr>`
        : ""
    }
  </table>

  <div class="total">
    Total Due
    <span style="float:right;">
      ${deal.currency} ${deal.dealAmount}
    </span>
  </div>

  <!-- DEAL HISTORY -->
  ${
    deal.history?.length
      ? `
  <div class="section-title">Deal History</div>

  <table>
    <tr>
      <th>Status</th>
      <th>Changed At</th>
    </tr>
    ${deal.history
      .map(
        (h: any) => `
      <tr>
        <td>${h.status}</td>
        <td>${new Date(h.changedAt).toLocaleString()}</td>
      </tr>`
      )
      .join("")}
  </table>`
      : ""
  }

  <footer>
    This is a system-generated document. No signature required.
  </footer>

</div>

</body>
</html>
`;
};
