import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const docsDir = path.resolve('docs/client-handover');
const screensDir = path.join(docsDir, 'screenshots');

function getBase64Img(filename) {
  const p = path.join(screensDir, filename);
  if (fs.existsSync(p)) {
    const ext = path.extname(p).replace('.', '');
    const data = fs.readFileSync(p).toString('base64');
    return `data:image/${ext};base64,${data}`;
  }
  return '';
}

const imgDesktopHome = getBase64Img('desktop_home.png');
const imgMobileHome = getBase64Img('mobile_home.png');
const imgDesktopDresses = getBase64Img('desktop_dresses.png');
const imgMobileDresses = getBase64Img('mobile_dresses.png');
const imgDesktopCakes = getBase64Img('desktop_cakes.png');
const imgDesktopCheckout = getBase64Img('desktop_checkout.png');
const imgMobileCheckout = getBase64Img('mobile_checkout.png');
const imgDesktopTrack = getBase64Img('desktop_track.png');
const imgMobileTrack = getBase64Img('mobile_track.png');
const imgAdminLogin = getBase64Img('admin_login.png');
const imgMobileAdminLogin = getBase64Img('mobile_admin_login.png');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Ababil’s Attire - Client Handover Documentation</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap');

  @page {
    size: A4 portrait;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {
      content: counter(page);
    }
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #2c2523;
    background-color: #ffffff;
    line-height: 1.6;
    font-size: 13.5px;
    margin: 0;
    padding: 0;
  }

  .page-break {
    page-break-after: always;
    break-after: page;
  }

  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Header & Footer styling for running headers */
  .running-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ebdcd5;
    padding-bottom: 8px;
    margin-bottom: 24px;
    font-size: 11px;
    color: #8c7268;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .running-header span.brand {
    font-family: 'Cinzel', serif;
    font-weight: 700;
    color: #5a2e36;
  }

  /* Brand Typography */
  h1, h2, h3, h4 {
    font-family: 'Playfair Display', Georgia, serif;
    color: #3b1b22;
    margin-top: 0;
  }

  h1 {
    font-size: 28px;
    line-height: 1.25;
    margin-bottom: 12px;
    border-bottom: 2px solid #5a2e36;
    padding-bottom: 8px;
  }

  h2 {
    font-size: 20px;
    line-height: 1.3;
    margin-top: 24px;
    margin-bottom: 10px;
    color: #5a2e36;
    border-bottom: 1px solid #f0e2db;
    padding-bottom: 6px;
  }

  h3 {
    font-size: 16px;
    margin-top: 18px;
    margin-bottom: 8px;
    color: #4a2930;
  }

  p {
    margin: 8px 0 12px 0;
    color: #3d3431;
  }

  /* COVER PAGE */
  .cover-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 40px 30px;
    background: radial-gradient(circle at 80% 20%, #fbf5f2 0%, #f7ece6 50%, #f2dfd6 100%);
    border: 2px solid #dfc3b5;
    border-radius: 8px;
    position: relative;
    box-sizing: border-box;
  }

  .cover-badge {
    display: inline-block;
    background: #5a2e36;
    color: #ffffff;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    padding: 6px 14px;
    border-radius: 20px;
    margin-bottom: 24px;
  }

  .cover-title-area h1.brand-main {
    font-family: 'Cinzel', serif;
    font-size: 42px;
    letter-spacing: 0.05em;
    color: #3b141c;
    margin: 0 0 10px 0;
    border-bottom: none;
    padding: 0;
  }

  .cover-title-area .sub-brand {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 24px;
    color: #8c4351;
    margin-bottom: 24px;
  }

  .cover-title-area .doc-subtitle {
    font-size: 18px;
    font-weight: 500;
    color: #523f38;
    line-height: 1.5;
    max-width: 540px;
    border-left: 3px solid #8c4351;
    padding-left: 16px;
    margin-top: 20px;
  }

  .cover-meta {
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid #e5cdc2;
    padding: 20px 24px;
    border-radius: 8px;
    backdrop-filter: blur(5px);
  }

  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    font-size: 12.5px;
  }

  .meta-item label {
    display: block;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.08em;
    color: #886d63;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .meta-item span {
    font-weight: 600;
    color: #2b1a1e;
  }

  /* TABLE OF CONTENTS */
  .toc-card {
    background: #faf6f4;
    border: 1px solid #ebdcd5;
    border-radius: 8px;
    padding: 24px 28px;
    margin-top: 16px;
  }

  .toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .toc-item {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px dashed #d8c3b9;
    font-size: 13.5px;
  }

  .toc-item:last-child {
    border-bottom: none;
  }

  .toc-title {
    font-weight: 600;
    color: #4a212a;
  }

  .toc-section {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #8c6b61;
  }

  /* CALLOUT / ALERT BOXES */
  .alert-box {
    padding: 12px 16px;
    border-radius: 6px;
    margin: 14px 0;
    font-size: 13px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .alert-box.info {
    background: #fdf5f2;
    border-left: 4px solid #8c4351;
    color: #4a2f2a;
  }

  .alert-box.warning {
    background: #fff8eb;
    border-left: 4px solid #d97706;
    color: #78350f;
  }

  .alert-box.success {
    background: #f0fdf4;
    border-left: 4px solid #16a34a;
    color: #14532d;
  }

  .alert-icon {
    font-weight: bold;
    font-size: 15px;
  }

  /* SCREENSHOT CONTAINERS & SIDE-BY-SIDE */
  .step-with-shot {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 18px;
    align-items: center;
    margin: 18px 0;
    background: #ffffff;
    border: 1px solid #ebdcd5;
    border-radius: 8px;
    padding: 14px 16px;
  }

  .step-with-shot.reverse {
    grid-template-columns: 0.85fr 1.15fr;
  }

  .step-text {
    font-size: 13px;
  }

  .step-text h4 {
    margin: 0 0 6px 0;
    font-size: 15px;
    color: #5a2e36;
  }

  .badge-step {
    display: inline-block;
    width: 22px;
    height: 22px;
    background: #5a2e36;
    color: #ffffff;
    border-radius: 50%;
    text-align: center;
    line-height: 22px;
    font-weight: 600;
    font-size: 11px;
    margin-right: 6px;
  }

  /* MOCKUPS */
  .mobile-mockup {
    width: 175px;
    margin: 0 auto;
    background: #111;
    border: 5px solid #2d2627;
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 8px 18px rgba(0,0,0,0.14);
    display: block;
  }

  .mobile-mockup img {
    width: 100%;
    height: auto;
    display: block;
  }

  .desktop-mockup {
    width: 100%;
    border: 1px solid #d3c4bc;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    background: #fbf9f8;
  }

  .desktop-bar {
    background: #ebdcd5;
    padding: 5px 8px;
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #bc9c90;
  }

  .desktop-mockup img {
    width: 100%;
    height: auto;
    display: block;
  }

  /* TABLES */
  table.custom-table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 12.5px;
  }

  table.custom-table th {
    background: #5a2e36;
    color: #ffffff;
    text-align: left;
    padding: 8px 12px;
    font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  table.custom-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #ebdcd5;
    color: #3b302c;
  }

  table.custom-table tr:nth-child(even) td {
    background: #faf5f2;
  }

  /* CHECKLIST */
  .check-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 16px 0;
  }

  .check-card {
    background: #faf6f4;
    border: 1px solid #ebdcd5;
    border-radius: 6px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12.5px;
  }

  .check-box {
    width: 16px;
    height: 16px;
    border: 2px solid #5a2e36;
    border-radius: 3px;
    display: inline-block;
    background: #ffffff;
  }

  .sign-box {
    margin-top: 30px;
    border: 1px dashed #bba398;
    padding: 20px;
    border-radius: 8px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }

  .sign-line {
    border-top: 1px solid #4a2930;
    margin-top: 45px;
    padding-top: 6px;
    font-size: 12px;
    color: #55443e;
    font-weight: 600;
  }
</style>
</head>
<body>

<!-- ==================== 1. COVER PAGE ==================== -->
<div class="cover-container page-break">
  <div>
    <span class="cover-badge">Official Client Handover Documentation</span>
    <div class="cover-title-area">
      <h1 class="brand-main">Ababil’s Attire</h1>
      <div class="sub-brand">by Sanjida Bethi</div>
      <div class="doc-subtitle">
        Complete Storefront & Admin Portal Operations Manual, bKash Reconciliation Standard, and System Handover Specification
      </div>
    </div>
  </div>

  <div class="cover-meta">
    <div class="meta-grid">
      <div class="meta-item">
        <label>Project Name</label>
        <span>Ababil’s Attire E-Commerce Platform</span>
      </div>
      <div class="meta-item">
        <label>Client</label>
        <span>Sanjida Bethi</span>
      </div>
      <div class="meta-item">
        <label>Document Version</label>
        <span>v1.0.0 (Production Release)</span>
      </div>
      <div class="meta-item">
        <label>Status</label>
        <span>Verified, Tested & Handed Over</span>
      </div>
      <div class="meta-item">
        <label>Tech Stack</label>
        <span>React 19, TypeScript, Supabase, Edge Hosting</span>
      </div>
      <div class="meta-item">
        <label>Release Date</label>
        <span>September 2026</span>
      </div>
    </div>
  </div>
</div>

<!-- ==================== 2. TABLE OF CONTENTS ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>Client Handover Manual</span>
</div>

<h1>Table of Contents</h1>
<p>This manual provides exhaustive instructions for both storefront customers and administrative personnel managing inventory, orders, payments, and store settings.</p>

<div class="toc-card page-break">
  <ul class="toc-list">
    <li class="toc-item">
      <div><span class="toc-title">1. Executive Summary & Deliverables</span></div>
      <span class="toc-section">Overview</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">2. Customer Storefront User Manual</span></div>
      <span class="toc-section">Customer Guide</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">3. Mobile Experience & Ordering Workflow</span></div>
      <span class="toc-section">Mobile POV</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">4. bKash Minimum Advance + COD Mechanism</span></div>
      <span class="toc-section">Payments</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">5. Customer Quick-Start Reference</span></div>
      <span class="toc-section">Quick Start</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">6. Admin Portal Operations Manual</span></div>
      <span class="toc-section">Admin Portal</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">7. Product Management (Dresses & Cakes)</span></div>
      <span class="toc-section">Catalog</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">8. Order Lifecycle & Status Progression</span></div>
      <span class="toc-section">Fulfillment</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">9. bKash Reconciliation Standard Operating Procedure</span></div>
      <span class="toc-section">Financial SOP</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">10. Customer Directory & Manual Offline Orders</span></div>
      <span class="toc-section">Admin Tools</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">11. Store Settings, Delivery & Printing Invoices</span></div>
      <span class="toc-section">Operations</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">12. Admin Quick-Start Guides</span></div>
      <span class="toc-section">Quick Start</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">13. Troubleshooting & Practical FAQs</span></div>
      <span class="toc-section">Support</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">14. System Architecture, Security & Maintenance</span></div>
      <span class="toc-section">Technical</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">15. Known System Limitations</span></div>
      <span class="toc-section">Governance</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">16. Handover Checklist & Formal Sign-Off</span></div>
      <span class="toc-section">Acceptance</span>
    </li>
  </ul>
</div>

<!-- ==================== 3. EXECUTIVE SUMMARY ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>Section 1 • Executive Summary</span>
</div>

<h1>1. Executive Summary & Deliverables</h1>
<p>The **Ababil’s Attire by Sanjida Bethi** e-commerce platform has been engineered to deliver a seamless shopping experience for boutique dresses and artisanal cakes, paired with an intuitive back-office administrative portal.</p>

<div class="desktop-mockup avoid-break" style="margin-bottom: 20px;">
  <div class="desktop-bar">
    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
    <span style="font-size: 10px; color: #735950; margin-left: 10px;">Storefront Homepage — Desktop View</span>
  </div>
  <img src="${imgDesktopHome}" alt="Storefront Homepage">
</div>

<h3>Key Deliverables</h3>
<div class="check-grid avoid-break">
  <div class="check-card"><span class="check-box" style="background:#5a2e36;"></span><span><strong>Guest-Accessible Storefront:</strong> Zero friction browsing without mandatory customer login</span></div>
  <div class="check-card"><span class="check-box" style="background:#5a2e36;"></span><span><strong>Curated Catalog:</strong> Dresses with sizing and custom artisanal Cakes with weight/flavor</span></div>
  <div class="check-card"><span class="check-box" style="background:#5a2e36;"></span><span><strong>Integrated Bag & Checkout:</strong> Clear cost breakdown, delivery calculation, advance calculation</span></div>
  <div class="check-card"><span class="check-box" style="background:#5a2e36;"></span><span><strong>bKash Advance + COD Flow:</strong> Captures TrxID, sender last 4 digits, and payer reference</span></div>
  <div class="check-card"><span class="check-box" style="background:#5a2e36;"></span><span><strong>Self-Service Order Tracking:</strong> Real-time status lookup using phone number and invoice ID</span></div>
  <div class="check-card"><span class="check-box" style="background:#5a2e36;"></span><span><strong>Admin Management Suite:</strong> Full CRUD for products, orders, customers, and store settings</span></div>
</div>

<div class="page-break"></div>

<!-- ==================== 4. CUSTOMER STOREFRONT MANUAL ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>Section 2 • Customer User Manual</span>
</div>

<h1>2. Customer Storefront User Manual</h1>
<p>The storefront is optimized for elegance, responsiveness, and zero customer friction. Customers can browse, select options, and place orders directly without needing to remember account passwords.</p>

<div class="step-with-shot avoid-break">
  <div class="step-text">
    <h4><span class="badge-step">1</span> Browsing Dresses & Cakes</h4>
    <p>Customers can access the catalog from the top navigation bar. Categories are distinctively organized into **Dresses** and **Cakes**.</p>
    <ul>
      <li>High-definition product imagery with zoom capability.</li>
      <li>Instant pricing and stock availability indicators.</li>
      <li>Category filtering and quick sorting.</li>
    </ul>
  </div>
  <div>
    <div class="desktop-mockup">
      <div class="desktop-bar"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
      <img src="${imgDesktopDresses}" alt="Dresses Catalog">
    </div>
  </div>
</div>

<div class="step-with-shot reverse avoid-break">
  <div class="mobile-mockup">
    <img src="${imgMobileDresses}" alt="Mobile Dresses Catalog">
  </div>
  <div class="step-text">
    <h4><span class="badge-step">2</span> Product Details & Options (Mobile POV)</h4>
    <p>Over 80% of boutique customers browse from mobile phones. The product view is designed to fit mobile viewports effortlessly.</p>
    <ul>
      <li><strong>Dresses:</strong> Select sizes (S, M, L, XL, Custom) with chest and length specifications.</li>
      <li><strong>Cakes:</strong> Select weight (1 Pound, 2 Pound) and custom message for the cake banner.</li>
      <li>Single-tap <strong>"Add to My Bag"</strong> button with persistent floating badge.</li>
    </ul>
  </div>
</div>

<div class="step-with-shot avoid-break">
  <div class="step-text">
    <h4><span class="badge-step">3</span> Shopping Bag ("My Bag")</h4>
    <p>Clicking the bag icon slides open the itemized cart view where customers can:</p>
    <ul>
      <li>Adjust quantities or remove items instantly.</li>
      <li>View the dynamic subtotal calculation.</li>
      <li>Review applicable delivery charges prior to proceeding to checkout.</li>
    </ul>
  </div>
  <div>
    <div class="desktop-mockup">
      <div class="desktop-bar"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
      <img src="${imgDesktopCakes}" alt="Cakes Collection">
    </div>
  </div>
</div>

<div class="page-break"></div>

<!-- ==================== 5. CHECKOUT & BKASH INSTRUCTIONS ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>Section 3 • Checkout & bKash Advance Flow</span>
</div>

<h1>3. bKash Minimum Advance + COD Workflow</h1>
<p>To eliminate bogus orders while making checkout simple, the store implements a **Minimum bKash Advance** model. The remaining balance is collected via **Cash on Delivery (COD)** upon delivery.</p>

<div class="step-with-shot avoid-break">
  <div class="step-text">
    <h4><span class="badge-step">1</span> Customer Checkout Entry</h4>
    <p>At <code>/checkout</code>, the customer provides:</p>
    <ul>
      <li>Full recipient name</li>
      <li>Active 11-digit Bangladesh phone number</li>
      <li>Complete shipping address (City, Area, Road/House)</li>
      <li>Special delivery instructions or customization notes</li>
    </ul>
    <div class="alert-box info">
      <div class="alert-icon">ℹ</div>
      <div>The required bKash advance is automatically calculated based on store settings (e.g., delivery fee or flat advance amount).</div>
    </div>
  </div>
  <div class="mobile-mockup">
    <img src="${imgMobileCheckout}" alt="Mobile Checkout POV">
  </div>
</div>

<div class="step-with-shot reverse avoid-break">
  <div>
    <div class="desktop-mockup">
      <div class="desktop-bar"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
      <img src="${imgDesktopCheckout}" alt="Desktop Checkout">
    </div>
  </div>
  <div class="step-text">
    <h4><span class="badge-step">2</span> bKash Payment & Submission</h4>
    <p>The checkout interface clearly displays the store's bKash number and instructions:</p>
    <ol>
      <li>Customer opens their personal bKash mobile app.</li>
      <li>Sends the required advance via <strong>"Send Money"</strong> or <strong>"Payment"</strong>.</li>
      <li>Inputs the <strong>bKash TrxID</strong> (Transaction ID, e.g., <code>BL9A4X...</code>).</li>
      <li>Enters the <strong>Sender Number's Last 4 Digits</strong> for instant cross-matching.</li>
      <li>Provides a <strong>Reference Name</strong> used in bKash app.</li>
      <li>Clicks <strong>"Confirm & Place Order"</strong>.</li>
    </ol>
  </div>
</div>

<div class="alert-box warning avoid-break">
  <div class="alert-icon">⚠</div>
  <div><strong>Important Operational Note:</strong> There is NO direct banking API connection. Customer submissions are stored in the database and must be validated by the store administrator using the standard reconciliation procedure in Section 8.</div>
</div>

<div class="page-break"></div>

<!-- ==================== 6. ORDER TRACKING & CUSTOMER QUICK START ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>Section 4 • Order Tracking & Customer Quick-Start</span>
</div>

<h1>4. Self-Service Order Tracking</h1>
<p>Customers can track their order lifecycle at any time at <code>/track-order</code> without contacting support directly.</p>

<div class="step-with-shot avoid-break">
  <div class="step-text">
    <h4>How Customers Track Their Order:</h4>
    <ol>
      <li>Visit the <strong>"Track Order"</strong> page from the top navigation.</li>
      <li>Enter their <strong>11-digit Contact Phone Number</strong>.</li>
      <li>Enter their unique <strong>Invoice / Order Number</strong> (received on order confirmation).</li>
      <li>Click <strong>"Track"</strong> to view real-time production and shipping progress.</li>
    </ol>
    <p>The tracking display shows progress bars from <em>Pending Verification</em> to <em>Production</em>, <em>Shipped</em>, and <em>Delivered</em>.</p>
  </div>
  <div class="mobile-mockup">
    <img src="${imgMobileTrack}" alt="Mobile Order Tracking">
  </div>
</div>

<hr style="border: none; border-top: 1px solid #ebdcd5; margin: 24px 0;">

<h1>5. Customer Quick-Start Guides</h1>

<div class="step-with-shot avoid-break">
  <div class="step-text" style="width: 100%;">
    <h3>Quick Guide: How to Place an Order (For Customers)</h3>
    <table class="custom-table">
      <tr>
        <th style="width: 70px;">Step</th>
        <th>Action</th>
        <th>What to Look For</th>
      </tr>
      <tr>
        <td><strong>Step 1</strong></td>
        <td>Select Dress or Cake</td>
        <td>Pick your size, flavor, or weight and click <strong>Add to Bag</strong>.</td>
      </tr>
      <tr>
        <td><strong>Step 2</strong></td>
        <td>Proceed to Checkout</td>
        <td>Open your bag in the top right corner and click <strong>Checkout</strong>.</td>
      </tr>
      <tr>
        <td><strong>Step 3</strong></td>
        <td>Enter Address Details</td>
        <td>Fill in your delivery address and active WhatsApp/Mobile number.</td>
      </tr>
      <tr>
        <td><strong>Step 4</strong></td>
        <td>Send bKash Advance</td>
        <td>Send advance to the displayed number and copy your <strong>TrxID</strong>.</td>
      </tr>
      <tr>
        <td><strong>Step 5</strong></td>
        <td>Submit & Save Invoice</td>
        <td>Submit the form and take a screenshot of your <strong>Order Confirmation</strong>.</td>
      </tr>
    </table>
  </div>
</div>

<div class="page-break"></div>

<!-- ==================== 7. ADMIN MANUAL - LOGIN & DASHBOARD ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>Section 5 • Admin Portal Operations</span>
</div>

<h1>6. Admin Portal Operations Manual</h1>
<p>The Admin Portal is the secure back-office environment for Sanjida Bethi and authorized staff members. It is located at <code>/admin/login</code>.</p>

<div class="step-with-shot avoid-break">
  <div class="step-text">
    <h4>Admin Authentication & Access Control</h4>
    <p>Administrators authenticate using encrypted Supabase Auth credentials. Unauthenticated users are automatically blocked and redirected to the login portal.</p>
    <ul>
      <li><strong>Portal Route:</strong> <code>/admin/login</code></li>
      <li><strong>Session Security:</strong> Auto-expiring JWT tokens with secure browser storage.</li>
      <li><strong>Role Hierarchy:</strong> Supports <code>superadmin</code>, <code>admin</code>, and <code>staff</code> roles.</li>
      <li><strong>Logout:</strong> Click the Logout icon in the admin sidebar to invalidate the session.</li>
    </ul>
  </div>
  <div class="mobile-mockup">
    <img src="${imgMobileAdminLogin}" alt="Admin Login Mobile">
  </div>
</div>

<h3>Admin Dashboard KPI Metrics</h3>
<p>Once authenticated, the dashboard at <code>/admin</code> presents live operational statistics:</p>

<table class="custom-table avoid-break">
  <tr>
    <th>Metric Card</th>
    <th>Description</th>
    <th>Action Trigger</th>
  </tr>
  <tr>
    <td><strong>Total Revenue</strong></td>
    <td>Cumulative gross sales across verified and delivered orders.</td>
    <td>Monitor weekly and monthly business growth.</td>
  </tr>
  <tr>
    <td><strong>Pending Orders</strong></td>
    <td>Orders awaiting bKash advance verification.</td>
    <td>Priority list requiring immediate cross-checking in bKash app.</td>
  </tr>
  <tr>
    <td><strong>In Production / Processing</strong></td>
    <td>Dresses being tailored or cakes scheduled for baking.</td>
    <td>Coordinate with kitchen/tailoring staff.</td>
  </tr>
  <tr>
    <td><strong>Active Inventory</strong></td>
    <td>Total live dress designs and cake listings.</td>
    <td>Track out-of-stock items needing restocking.</td>
  </tr>
</table>

<div class="page-break"></div>

<!-- ==================== 8. PRODUCT & ORDER MANAGEMENT ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>Section 6 • Inventory & Order Lifecycle</span>
</div>

<h1>7. Product Management (Dresses & Cakes)</h1>
<p>The store admin can publish, edit, deactivate, and manage photos for both boutique dresses and custom cakes from <code>/admin/products</code>.</p>

<div class="check-grid avoid-break">
  <div class="check-card">
    <div>
      <strong>Adding a Dress:</strong>
      <p style="margin: 4px 0 0 0; font-size: 11.5px; color: #55443e;">Set title, price, fabric composition, available standard sizes (S, M, L, XL, XXL) or custom measurement options, and upload high-res photography.</p>
    </div>
  </div>
  <div class="check-card">
    <div>
      <strong>Adding a Cake:</strong>
      <p style="margin: 4px 0 0 0; font-size: 11.5px; color: #55443e;">Set base flavor, price per pound, dietary notices, banner inscription settings, and recommended lead time (e.g., 24h advance baking notice).</p>
    </div>
  </div>
</div>

<div class="alert-box info avoid-break">
  <div class="alert-icon">💡</div>
  <div><strong>Image Management:</strong> Product images are uploaded directly to the secured Supabase Storage bucket (<code>product-images</code>). Images are automatically cached and optimized on the CDN.</div>
</div>

<hr style="border: none; border-top: 1px solid #ebdcd5; margin: 24px 0;">

<h1>8. Order Lifecycle & Status Progression</h1>
<p>Each customer order follows a strictly controlled lifecycle to ensure zero delivery errors:</p>

<table class="custom-table avoid-break">
  <tr>
    <th>Status Tag</th>
    <th>Meaning & Phase</th>
    <th>Who Handles</th>
    <th>Next Action</th>
  </tr>
  <tr>
    <td><span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:12px; font-weight:600;">Pending</span></td>
    <td>Order created; customer submitted TrxID.</td>
    <td>Admin / Accounts</td>
    <td>Reconcile bKash payment in phone app.</td>
  </tr>
  <tr>
    <td><span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:12px; font-weight:600;">Processing</span></td>
    <td>Advance verified. Tailoring / baking started.</td>
    <td>Production Staff</td>
    <td>Complete item and package securely.</td>
  </tr>
  <tr>
    <td><span style="background:#f3e8ff; color:#6b21a8; padding:2px 8px; border-radius:12px; font-weight:600;">Shipped</span></td>
    <td>Handed over to delivery rider / courier.</td>
    <td>Logistics / Rider</td>
    <td>Collect remaining COD amount on delivery.</td>
  </tr>
  <tr>
    <td><span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:12px; font-weight:600;">Delivered</span></td>
    <td>Customer accepted delivery & paid balance.</td>
    <td>Courier / Admin</td>
    <td>Order completed and archived in sales.</td>
  </tr>
  <tr>
    <td><span style="background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:12px; font-weight:600;">Cancelled</span></td>
    <td>Fraudulent TrxID or customer cancellation.</td>
    <td>Admin</td>
    <td>Item restored to inventory if applicable.</td>
  </tr>
</table>

<div class="page-break"></div>

<!-- ==================== 9. BKASH RECONCILIATION & CUSTOMER MANAGEMENT ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>Section 7 • Financial SOP & Customer Operations</span>
</div>

<h1>9. bKash Advance Reconciliation SOP</h1>
<p>Because there is no automated bKash merchant API connected, the admin must follow this Standard Operating Procedure (SOP) before approving any order:</p>

<div class="toc-card avoid-break" style="background: #fffcf9; border-color: #e5cdbf;">
  <h3 style="margin-top:0; color:#5a2e36;">Standard 4-Step Reconciliation Protocol</h3>
  <ol style="margin-bottom:0; padding-left:20px;">
    <li style="margin-bottom:8px;">
      <strong>Step 1: Open New Order in Admin:</strong> Navigate to <code>/admin/orders</code> and click on the order flagged as <em>Pending</em>. Note the submitted <strong>TrxID</strong>, <strong>Last 4 Digits</strong>, and <strong>Advance Amount</strong>.
    </li>
    <li style="margin-bottom:8px;">
      <strong>Step 2: Check bKash Device:</strong> Open your bKash merchant/personal statement or check incoming transaction SMS on the store's designated bKash phone.
    </li>
    <li style="margin-bottom:8px;">
      <strong>Step 3: Cross-Match Credentials:</strong> Confirm that the TrxID matches identically, the sender number matches the last 4 digits, and the credited amount meets or exceeds the required advance.
    </li>
    <li style="margin-bottom:0;">
      <strong>Step 4: Promote to Processing:</strong> Update order status to <strong>"Processing"</strong>. The customer's tracking view will immediately reflect that their advance was verified and production has commenced.
    </li>
  </ol>
</div>

<div class="alert-box warning avoid-break">
  <div class="alert-icon">🚨</div>
  <div><strong>Fraud Warning:</strong> Never release custom dresses or fresh cakes for production until the TrxID is cross-referenced in your physical bKash app. Fake SMS alerts or altered screenshots from customers should never be accepted without statement verification.</div>
</div>

<hr style="border: none; border-top: 1px solid #ebdcd5; margin: 24px 0;">

<h1>10. Customer Directory & Manual Offline Orders</h1>

<div class="check-grid avoid-break">
  <div class="check-card">
    <div>
      <strong>Customer Directory (<code>/admin/customers</code>):</strong>
      <p style="margin: 4px 0 0 0; font-size: 11.5px; color: #55443e;">Maintains customer profiles generated from storefront checkouts. Shows total order count, lifetime spend, delivery addresses, and phone numbers for re-marketing.</p>
    </div>
  </div>
  <div class="check-card">
    <div>
      <strong>Manual Offline Orders:</strong>
      <p style="margin: 4px 0 0 0; font-size: 11.5px; color: #55443e;">When a customer places an order via Facebook Messenger, Instagram DM, or phone call, admins can click <em>"Create Manual Order"</em> to log the items, calculate delivery, and issue a tracking ID.</p>
    </div>
  </div>
</div>

<div class="page-break"></div>

<!-- ==================== 10. SETTINGS, INVOICES & ADMIN QUICK START ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>Section 8 • Settings, Invoices & Quick-Start</span>
</div>

<h1>11. Store Settings & Printable Invoices</h1>

<div class="step-with-shot avoid-break">
  <div class="step-text" style="width: 100%;">
    <h4>Store Settings Configuration (<code>/admin/settings</code>)</h4>
    <p>Admins can update operational parameters in real time without developer assistance:</p>
    <ul>
      <li><strong>bKash Number:</strong> Update the recipient bKash number displayed on the checkout page.</li>
      <li><strong>Advance Requirements:</strong> Adjust the default advance percentage or fixed amount.</li>
      <li><strong>Delivery Zones:</strong> Set Inside Dhaka (e.g., ৳80) and Outside Dhaka (e.g., ৳150) rates.</li>
      <li><strong>Store Notice:</strong> Post emergency alerts (e.g., holiday baking cutoffs) on the homepage banner.</li>
    </ul>

    <h4>Printable Invoices & Delivery Slips</h4>
    <p>For every verified order, clicking <strong>"Print Delivery Slip / Invoice"</strong> generates a clean A4/slip layout featuring recipient address, order items, advance paid, and COD balance due to be taped onto the packaging.</p>
  </div>
</div>

<hr style="border: none; border-top: 1px solid #ebdcd5; margin: 24px 0;">

<h1>12. Admin Quick-Start Guides</h1>

<div class="check-grid avoid-break">
  <div class="check-card">
    <div>
      <strong>Guide 1: Processing a New Order</strong>
      <ol style="margin:4px 0 0 0; padding-left:16px; font-size:11.5px;">
        <li>Log in at <code>/admin/login</code></li>
        <li>Go to <strong>Orders</strong> & filter by <em>Pending</em></li>
        <li>Verify bKash TrxID in your bKash app</li>
        <li>Switch status to <strong>Processing</strong></li>
        <li>Print invoice slip and attach to package</li>
        <li>Switch status to <strong>Shipped</strong> when rider collects</li>
      </ol>
    </div>
  </div>

  <div class="check-card">
    <div>
      <strong>Guide 2: Adding a New Product</strong>
      <ol style="margin:4px 0 0 0; padding-left:16px; font-size:11.5px;">
        <li>Go to <code>/admin/products</code></li>
        <li>Click <strong>"+ Add Product"</strong></li>
        <li>Fill Title, Category (Dress/Cake), and Price</li>
        <li>Configure sizes/weights</li>
        <li>Upload 1-3 high quality product photos</li>
        <li>Click <strong>Save & Publish</strong></li>
      </ol>
    </div>
  </div>
</div>

<div class="page-break"></div>

<!-- ==================== 11. TROUBLESHOOTING & FAQS ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>Section 9 • Troubleshooting & Support</span>
</div>

<h1>13. Troubleshooting & Practical FAQs</h1>

<table class="custom-table avoid-break">
  <tr>
    <th style="width: 25%;">Issue</th>
    <th style="width: 35%;">Probable Cause</th>
    <th>Resolution Step</th>
  </tr>
  <tr>
    <td><strong>bKash TrxID not showing in statement</strong></td>
    <td>Customer made a typing error, or sent money to wrong number, or attempted fraud.</td>
    <td>Do not fulfill order. WhatsApp the customer using their order phone number requesting a screenshot of their bKash statement.</td>
  </tr>
  <tr>
    <td><strong>Customer lost their Order ID</strong></td>
    <td>Customer closed order confirmation page before recording their invoice number.</td>
    <td>Go to <code>/admin/customers</code> or <code>/admin/orders</code>, search by the customer's phone number, and provide their invoice code.</td>
  </tr>
  <tr>
    <td><strong>Image fails to upload in Admin</strong></td>
    <td>Image file size exceeds limit (e.g. > 5MB) or format is unsupported (e.g. HEIC).</td>
    <td>Compress the image or convert to standard JPG/PNG before uploading.</td>
  </tr>
  <tr>
    <td><strong>Admin password forgotten</strong></td>
    <td>Browser cache cleared or password mislaid.</td>
    <td>Password can be reset via Supabase Auth dashboard or by contacting your technical developer.</td>
  </tr>
  <tr>
    <td><strong>Order status not updating on tracking</strong></td>
    <td>Network interruption while saving in admin portal.</td>
    <td>Refresh admin order screen, re-toggle the status dropdown, and confirm the green success toast appears.</td>
  </tr>
</table>

<div class="page-break"></div>

<!-- ==================== 12. TECHNICAL ARCHITECTURE & LIMITATIONS ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>Section 10 • Technical Architecture & Limitations</span>
</div>

<h1>14. System Architecture, Security & Maintenance</h1>
<p>This technical summary is provided for the client's IT maintenance team or future developers.</p>

<table class="custom-table avoid-break">
  <tr>
    <th style="width: 28%;">Subsystem</th>
    <th>Implementation Specification</th>
  </tr>
  <tr>
    <td><strong>Frontend Engine</strong></td>
    <td>React 19, TypeScript, React Router v7, Vite builder. Zero external heavy UI libraries.</td>
  </tr>
  <tr>
    <td><strong>Backend as a Service</strong></td>
    <td>Supabase Cloud (PostgreSQL 15+, Supabase Auth, Storage CDN, Realtime engine).</td>
  </tr>
  <tr>
    <td><strong>Row Level Security (RLS)</strong></td>
    <td>Enabled across all tables. Public access restricted to inserting guest orders and viewing public products. Admin operations guarded by authenticated role policies.</td>
  </tr>
  <tr>
    <td><strong>Environment Secrets</strong></td>
    <td><code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>. Service-role master keys are strictly excluded from frontend builds.</td>
  </tr>
  <tr>
    <td><strong>Data Backup</strong></td>
    <td>Managed via Supabase automated daily backups. Admin can also export CSV data from <code>/admin/orders</code> at any time.</td>
  </tr>
</table>

<hr style="border: none; border-top: 1px solid #ebdcd5; margin: 24px 0;">

<h1>15. Known System Limitations</h1>
<p>To avoid false assumptions, the following intentional architectural boundaries are noted:</p>

<div class="alert-box info avoid-break">
  <div class="alert-icon">ℹ</div>
  <div>
    <strong>1. No Direct bKash Gateway API:</strong> The platform intentionally uses customer-submitted payment metadata and manual reconciliation. There is no automated callback from bKash. This eliminates monthly gateway maintenance fees and merchant compliance hurdles for the business.
  </div>
</div>

<div class="alert-box info avoid-break">
  <div class="alert-icon">ℹ</div>
  <div>
    <strong>2. Guest-First Checkout:</strong> Customers do not have accounts with passwords. Order tracking is keyed to Phone Number + Invoice ID.
  </div>
</div>

<div class="alert-box info avoid-break">
  <div class="alert-icon">ℹ</div>
  <div>
    <strong>3. Admin Access:</strong> Single unified admin team access. Granular permission partitioning (e.g., masking financials from kitchen staff) can be added in Phase 2 if team scales.
  </div>
</div>

<div class="page-break"></div>

<!-- ==================== 13. FINAL HANDOVER CHECKLIST ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>Section 11 • Handover Sign-Off</span>
</div>

<h1>16. Handover Checklist & Formal Acceptance</h1>
<p>This checklist confirms that all contractual deliverables, access credentials, and operational assets have been transferred to **Sanjida Bethi**.</p>

<div class="check-grid avoid-break">
  <div class="check-card"><span class="check-box" style="background:#5a2e36;"></span><span><strong>Live Storefront Delivered:</strong> Fully functional at production URL</span></div>
  <div class="check-card"><span class="check-box" style="background:#5a2e36;"></span><span><strong>Admin Portal Configured:</strong> <code>/admin</code> access verified with credentials</span></div>
  <div class="check-card"><span class="check-box" style="background:#5a2e36;"></span><span><strong>bKash Workflow Verified:</strong> End-to-end checkout & TrxID capture tested</span></div>
  <div class="check-card"><span class="check-box" style="background:#5a2e36;"></span><span><strong>Order Tracking Tested:</strong> Lookup by Phone & Invoice ID operational</span></div>
  <div class="check-card"><span class="check-box" style="background:#5a2e36;"></span><span><strong>Database Migrations Applied:</strong> Schema, indexes, and RLS policies locked</span></div>
  <div class="check-card"><span class="check-box" style="background:#5a2e36;"></span><span><strong>Documentation Provided:</strong> Full manual & quick-start guides transferred</span></div>
</div>

<div class="sign-box avoid-break">
  <div>
    <p style="margin: 0; font-weight: 700; color: #5a2e36;">Delivered By (Lead Developer):</p>
    <div class="sign-line">
      Signature & Date<br>
      <span style="font-weight: normal; color: #77655e;">Engineering & Implementation Team</span>
    </div>
  </div>
  <div>
    <p style="margin: 0; font-weight: 700; color: #5a2e36;">Accepted By (Client):</p>
    <div class="sign-line">
      Signature & Date<br>
      <span style="font-weight: normal; color: #77655e;">Sanjida Bethi • Ababil’s Attire</span>
    </div>
  </div>
</div>

</body>
</html>`;

const masterHtmlPath = path.join(docsDir, 'Ababil_Attire_Client_Handover_Master.html');
const masterPdfPath = path.join(docsDir, 'Ababil_Attire_Client_Handover_Manual.pdf');

fs.writeFileSync(masterHtmlPath, htmlContent, 'utf8');
console.log('Master HTML written successfully.');

console.log('Rendering Master PDF using Edge headless...');
const cmd = `"${edge}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${masterPdfPath}" --print-to-pdf-margins="none" "file:///${masterHtmlPath.replace(/\\/g, '/')}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  const stat = fs.statSync(masterPdfPath);
  console.log(`Generated: ${path.basename(masterPdfPath)} (${stat.size} bytes)`);
} catch (err) {
  console.error('Failed to generate master PDF:', err.message);
}
