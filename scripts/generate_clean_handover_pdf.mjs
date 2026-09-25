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

const imgMobileHome = getBase64Img('mobile_home.png');
const imgMobileDresses = getBase64Img('mobile_dresses.png');
const imgMobileCakes = getBase64Img('mobile_cakes.png');
const imgMobileBag = getBase64Img('mobile_bag.png');
const imgMobileCheckout = getBase64Img('mobile_checkout.png');
const imgMobileTrack = getBase64Img('mobile_track.png');
const imgMobileAdminLogin = getBase64Img('mobile_admin_login.png');
const imgMobileContact = getBase64Img('mobile_contact.png');

const htmlContent = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<title>Ababil’s Attire by Sanjida Bethi - Client Handover Manual</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=Hind+Siliguri:wght@400;500;600;700&display=swap');

  @page {
    size: A4 portrait;
    margin: 12mm 14mm 12mm 14mm;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: 'Plus Jakarta Sans', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #2b2320;
    background-color: #ffffff;
    line-height: 1.55;
    font-size: 13px;
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

  /* Header & Footer */
  .running-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ebdcd5;
    padding-bottom: 6px;
    margin-bottom: 16px;
    font-size: 10.5px;
    color: #8c7268;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .running-header span.brand {
    font-family: 'Cinzel', serif;
    font-weight: 700;
    color: #5a2e36;
  }

  /* Headings */
  h1, h2, h3, h4 {
    font-family: 'Playfair Display', 'Hind Siliguri', Georgia, serif;
    color: #3b1b22;
    margin-top: 0;
  }

  h1 {
    font-size: 24px;
    line-height: 1.25;
    margin-bottom: 10px;
    color: #4a212a;
    border-bottom: 2px solid #5a2e36;
    padding-bottom: 6px;
  }

  h2 {
    font-size: 17px;
    line-height: 1.3;
    margin-top: 16px;
    margin-bottom: 8px;
    color: #5a2e36;
    border-bottom: 1px solid #f0e2db;
    padding-bottom: 4px;
  }

  h3 {
    font-size: 14.5px;
    margin-top: 12px;
    margin-bottom: 6px;
    color: #523139;
  }

  p {
    margin: 6px 0 8px 0;
    color: #3d3431;
  }

  .bangla-text {
    font-family: 'Hind Siliguri', 'Plus Jakarta Sans', sans-serif;
  }

  /* COVER PAGE */
  .cover-container {
    height: 98vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 36px 30px;
    background: radial-gradient(circle at 85% 15%, #fbf5f2 0%, #f7ece6 50%, #f2ded5 100%);
    border: 2px solid #dfc3b5;
    border-radius: 12px;
    box-sizing: border-box;
  }

  .cover-badge {
    display: inline-block;
    background: #5a2e36;
    color: #ffffff;
    font-size: 10.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    padding: 5px 12px;
    border-radius: 20px;
  }

  .brand-main {
    font-family: 'Cinzel', serif;
    font-size: 38px;
    letter-spacing: 0.05em;
    color: #3b141c;
    margin: 16px 0 4px 0;
    border: none;
    padding: 0;
  }

  .sub-brand {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 22px;
    color: #8c4351;
    margin-bottom: 18px;
  }

  .doc-subtitle {
    font-size: 15px;
    font-weight: 500;
    color: #523f38;
    line-height: 1.5;
    border-left: 3px solid #8c4351;
    padding-left: 14px;
    margin-top: 16px;
    max-width: 580px;
  }

  .cover-meta {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #e5cdc2;
    padding: 16px 20px;
    border-radius: 8px;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    font-size: 12px;
  }

  .meta-item label {
    display: block;
    text-transform: uppercase;
    font-size: 9.5px;
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
    padding: 18px 24px;
    margin-top: 12px;
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
    padding: 6px 0;
    border-bottom: 1px dashed #dec9bf;
    font-size: 12.5px;
  }

  .toc-title {
    font-weight: 600;
    color: #4a212a;
  }

  .toc-bangla {
    color: #8c584a;
    font-size: 11.5px;
    margin-left: 8px;
    font-weight: normal;
  }

  /* CALLOUT / ALERT BOXES */
  .alert-box {
    padding: 10px 14px;
    border-radius: 6px;
    margin: 10px 0;
    font-size: 12px;
    display: flex;
    gap: 10px;
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

  /* BALANCED MOBILE POV MOCKUP & STEP CARDS */
  .mobile-step-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin: 12px 0;
    background: #ffffff;
    border: 1px solid #ebdcd5;
    border-radius: 10px;
    padding: 14px 18px;
  }

  .mobile-step-card.reverse {
    flex-direction: row-reverse;
  }

  .step-details {
    flex: 1;
    min-width: 0;
  }

  .step-details h4 {
    margin: 0 0 6px 0;
    font-size: 14.5px;
    color: #5a2e36;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .badge-step {
    width: 22px;
    height: 22px;
    background: #5a2e36;
    color: #ffffff;
    border-radius: 50%;
    text-align: center;
    line-height: 22px;
    font-weight: 600;
    font-size: 11px;
    display: inline-block;
    flex-shrink: 0;
  }

  .step-details ul, .step-details ol {
    margin: 4px 0;
    padding-left: 18px;
    font-size: 12px;
  }

  .step-details li {
    margin-bottom: 3px;
  }

  /* SLEEK SMARTPHONE FRAME (PROPERLY ALIGNED) */
  .phone-holder {
    flex-shrink: 0;
    width: 175px;
    text-align: center;
  }

  .phone-device {
    width: 175px;
    background: #2b2526;
    border-radius: 24px;
    padding: 6px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    border: 1px solid #dfc7bc;
    margin: 0 auto;
    display: block;
  }

  .phone-speaker {
    width: 36px;
    height: 3.5px;
    background: #5a5354;
    border-radius: 3px;
    margin: 2px auto 5px auto;
  }

  .phone-screen {
    border-radius: 18px;
    overflow: hidden;
    background: #fbf9f5;
    border: 1px solid #4a4243;
    display: block;
    line-height: 0;
  }

  .phone-screen img {
    width: 100%;
    height: auto;
    display: block;
    object-fit: cover;
  }

  .phone-caption {
    font-size: 10px;
    color: #7a6660;
    margin-top: 5px;
    font-weight: 600;
  }

  /* TABLES */
  table.custom-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 12px;
  }

  table.custom-table th {
    background: #5a2e36;
    color: #ffffff;
    text-align: left;
    padding: 7px 10px;
    font-weight: 600;
  }

  table.custom-table td {
    padding: 7px 10px;
    border-bottom: 1px solid #ebdcd5;
    color: #3b302c;
  }

  table.custom-table tr:nth-child(even) td {
    background: #fbf6f3;
  }

  /* CHECKLIST */
  .check-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 10px 0;
  }

  .check-card {
    background: #faf6f4;
    border: 1px solid #ebdcd5;
    border-radius: 6px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11.5px;
  }

  .check-box {
    width: 14px;
    height: 14px;
    border: 2px solid #5a2e36;
    border-radius: 3px;
    display: inline-block;
    background: #5a2e36;
    flex-shrink: 0;
  }

  .sign-box {
    margin-top: 18px;
    border: 1px dashed #bba398;
    padding: 16px 20px;
    border-radius: 8px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }

  .sign-line {
    border-top: 1px solid #4a2930;
    margin-top: 40px;
    padding-top: 4px;
    font-size: 11px;
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
    <div style="margin-top: 24px;">
      <h1 class="brand-main">Ababil’s Attire</h1>
      <div class="sub-brand">by Sanjida Bethi</div>
      <div class="doc-subtitle bangla-text">
        <strong>ক্লায়েন্ট হ্যান্ডওভার ও সম্পূর্ণ ব্যবহার নির্দেশিকা</strong><br>
        ওয়েবসাইট ও মোবাইল স্টোরফ্রন্ট পরিচালনা, বিকাশ অগ্রিম পেমেন্ট ভেরিফিকেশন, ইনভয়েস জেনারেশন এবং অ্যাডমিন পোর্টাল ব্যবহারের পূর্ণাঙ্গ গাইডলাইন।
      </div>
    </div>
  </div>

  <div class="cover-meta">
    <div class="meta-grid">
      <div class="meta-item">
        <label>প্রজেক্টের নাম (Project)</label>
        <span>Ababil’s Attire Online Store</span>
      </div>
      <div class="meta-item">
        <label>সম্মানিত ক্লায়েন্ট (Client)</label>
        <span>Sanjida Bethi</span>
      </div>
      <div class="meta-item">
        <label>ডকুমেন্ট সংস্করণ (Version)</label>
        <span>v1.0.0 (Production Release)</span>
      </div>
      <div class="meta-item">
        <label>কাজের অবস্থা (Status)</label>
        <span>সফলভাবে সম্পন্ন ও হস্তান্তরিত</span>
      </div>
      <div class="meta-item">
        <label>প্রযুক্তি (Tech Stack)</label>
        <span>React 19, TypeScript, Supabase, Cloud Storage</span>
      </div>
      <div class="meta-item">
        <label>ব্যবস্থাপনা পোর্টাল (Admin)</label>
        <span>নিরাপদ অ্যাডমিন কন্ট্রোল প্যানেল</span>
      </div>
    </div>
  </div>
</div>

<!-- ==================== 2. TABLE OF CONTENTS ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>সূচিপত্র • Table of Contents</span>
</div>

<h1>সূচিপত্র (Table of Contents)</h1>
<p class="bangla-text">সহজে ব্যবহারের সুবিধার্থে পুরো ডকুমেন্টেশনটি কাস্টমার ও অ্যাডমিন দুটি প্রধান অংশে ভাগ করা হয়েছে:</p>

<div class="toc-card page-break">
  <ul class="toc-list">
    <li class="toc-item">
      <div><span class="toc-title">১. প্রজেক্ট পরিচিতি ও অর্জিত সুবিধাসমূহ</span> <span class="toc-bangla">(Executive Summary)</span></div>
      <span style="font-weight:600; color:#5a2e36;">Overview</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">২. কাস্টমার জার্নি ও মোবাইল শপিং গাইড</span> <span class="toc-bangla">(Customer Storefront Manual)</span></div>
      <span style="font-weight:600; color:#5a2e36;">Customer</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">৩. বিকাশ অগ্রিম ও ক্যাশ অন ডেলিভারি (COD) নিয়মাবলী</span> <span class="toc-bangla">(bKash Advance & COD)</span></div>
      <span style="font-weight:600; color:#5a2e36;">Payment</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">৪. সহজ অর্ডার ট্র্যাকিং পদ্ধতি</span> <span class="toc-bangla">(Self-Service Order Tracking)</span></div>
      <span style="font-weight:600; color:#5a2e36;">Tracking</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">৫. কাস্টমার কুইক-স্টার্ট সামারি</span> <span class="toc-bangla">(Customer Quick Reference)</span></div>
      <span style="font-weight:600; color:#5a2e36;">Quick Start</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">৬. অ্যাডমিন পোর্টাল লগইন ও ড্যাশবোর্ড পরিচিতি</span> <span class="toc-bangla">(Admin Portal Access & KPI)</span></div>
      <span style="font-weight:600; color:#5a2e36;">Admin Suite</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">৭. পণ্য ব্যবস্থাপনা (ড্রেস ও কেক আপলোড/এডিট)</span> <span class="toc-bangla">(Product Management)</span></div>
      <span style="font-weight:600; color:#5a2e36;">Products</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">৮. অর্ডার লাইফসাইকেল ও বিকাশ অগ্রিম মেলানো (SOP)</span> <span class="toc-bangla">(Order & bKash Reconciliation)</span></div>
      <span style="font-weight:600; color:#5a2e36;">Reconciliation</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">৯. কাস্টমার তালিকা ও অফলাইন ফোন/ইনবক্স অর্ডার তৈরি</span> <span class="toc-bangla">(Customer & Manual Orders)</span></div>
      <span style="font-weight:600; color:#5a2e36;">Orders</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">১০. স্টোর সেটিংস ও প্রিন্টযোগ্য ইনভয়েস স্লিপ</span> <span class="toc-bangla">(Settings & Delivery Slips)</span></div>
      <span style="font-weight:600; color:#5a2e36;">Settings</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">১১. অ্যাডমিন কুইক-স্টার্ট গাইড</span> <span class="toc-bangla">(Admin Quick-Start Steps)</span></div>
      <span style="font-weight:600; color:#5a2e36;">Quick Steps</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">১২. সাধারণ সমস্যা ও সহজ সমাধান</span> <span class="toc-bangla">(Troubleshooting & FAQs)</span></div>
      <span style="font-weight:600; color:#5a2e36;">Troubleshoot</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">১৩. সিস্টেম রক্ষণাবেক্ষণ ও সীমাবদ্ধতা</span> <span class="toc-bangla">(System & Known Limitations)</span></div>
      <span style="font-weight:600; color:#5a2e36;">Technical</span>
    </li>
    <li class="toc-item">
      <div><span class="toc-title">১৪. কাজের দায়িত্ব হস্তান্তর চেকলিস্ট ও স্বাক্ষর</span> <span class="toc-bangla">(Handover Sign-off)</span></div>
      <span style="font-weight:600; color:#5a2e36;">Acceptance</span>
    </li>
  </ul>
</div>

<!-- ==================== 3. CUSTOMER STOREFRONT MANUAL ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>কাস্টমার শপিং নির্দেশিকা • Customer Manual</span>
</div>

<h1>১. কাস্টমার শপিং ও ব্রাউজিং নির্দেশিকা</h1>
<p class="bangla-text">কাস্টমাররা কোনো রেজিস্ট্রেশন বা পাসওয়ার্ডের ঝামেলা ছাড়াই সরাসরি মোবাইল ফোন থেকে ড্রেস ও কেক দেখে অর্ডার করতে পারেন।</p>

<!-- Step 1: Home & Catalog -->
<div class="mobile-step-card avoid-break">
  <div class="step-details">
    <h4><span class="badge-step">১</span> হোমপেজ ও ড্রেস নির্বাচন (Browsing Dresses)</h4>
    <p class="bangla-text">কাস্টমাররা ওপরের মেনু বা ব্যানারে ক্লিক করে সরাসরি ড্রেস কালেকশন দেখতে পারেন:</p>
    <ul class="bangla-text">
      <li>প্রতিটি ড্রেসের নিখুঁত ছবি ও বিস্তারিত কাজের বিবরণ।</li>
      <li>সাইজ চার্ট (S, M, L, XL, XXL) অথবা নিজের মাপ অনুযায়ী <strong>Custom Sizing</strong> নির্বাচন।</li>
      <li>বুকের মাপ (Chest) ও ঝুলের দৈর্ঘ্য (Length) যাচাই করার সহজ অপশন।</li>
    </ul>
  </div>
  <div class="phone-holder">
    <div class="phone-device">
      <div class="phone-speaker"></div>
      <div class="phone-screen">
        <img src="${imgMobileDresses}" alt="Mobile Dresses Catalog">
      </div>
    </div>
    <div class="phone-caption">ড্রেস কালেকশন (Mobile POV)</div>
  </div>
</div>

<!-- Step 2: Cakes & Customization -->
<div class="mobile-step-card reverse avoid-break">
  <div class="step-details">
    <h4><span class="badge-step">২</span> সেলিব্রেশন কেক ও কাস্টমাইজেশন (Celebration Cakes)</h4>
    <p class="bangla-text">হাতে তৈরি স্পেশাল কেক অর্ডারের জন্য বিশেষ সুবিধা রাখা হয়েছে:</p>
    <ul class="bangla-text">
      <li>কেকের ওজন নির্বাচন (যেমন ১ পাউন্ড, ২ পাউন্ড বা ৩ পাউন্ড টিয়ার্ড)।</li>
      <li>প্রিয়জনের জন্য কেকের ওপর লেখার বিশেষ বার্তা (Custom Message on Cake)।</li>
      <li>পছন্দমতো ফ্লেভার বাছাই এবং <strong>"Add to My Bag"</strong> এ এক ট্যাপে যোগ।</li>
    </ul>
  </div>
  <div class="phone-holder">
    <div class="phone-device">
      <div class="phone-speaker"></div>
      <div class="phone-screen">
        <img src="${imgMobileCakes}" alt="Mobile Cakes Catalog">
      </div>
    </div>
    <div class="phone-caption">কেক সিলেকশন (Mobile POV)</div>
  </div>
</div>

<div class="page-break"></div>

<!-- ==================== 4. CHECKOUT & BKASH PAYMENT ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>বিকাশ অগ্রিম ও চেকআউট • bKash Advance & Checkout</span>
</div>

<h1>২. চেকআউট ও বিকাশ অগ্রিম পেমেন্ট প্রক্রিয়া</h1>
<p class="bangla-text">অর্ডার নিশ্চিত করতে ও ভুয়া অর্ডার রোধ করতে গ্রাহককে নির্দিষ্ট বিকাশ অগ্রিম প্রদান করতে হয়। বাকি টাকা পণ্য হাতে পেয়ে <strong>ক্যাশ অন ডেলিভারিতে (COD)</strong> পরিশোধ করবেন।</p>

<!-- Step 3: Checkout Details & bKash -->
<div class="mobile-step-card avoid-break">
  <div class="step-details">
    <h4><span class="badge-step">৩</span> চেকআউটে ঠিকানা ও বিকাশ তথ্য প্রদান</h4>
    <p class="bangla-text">চেকআউট পেজে কাস্টমার নিচের সহজ তথ্যগুলো পূরণ করেন:</p>
    <ol class="bangla-text">
      <li><strong>গ্রাহকের নাম ও মোবাইল নম্বর:</strong> ডেলিভারির জন্য সচল ১১ ডিজিটের ফোন নম্বর।</li>
      <li><strong>সম্পূর্ণ ডেলিভারি ঠিকানা:</strong> বাসা, রোড, এলাকা ও জেলা (ঢাকা বা ঢাকার বাইরে)।</li>
      <li><strong>বিকাশ নম্বরে সেন্ড মানি:</strong> স্ক্রিনে প্রদর্শিত স্টোরের বিকাশ নম্বরে অগ্রিম টাকা পাঠানো।</li>
      <li><strong>TrxID (ট্রানজেকশন আইডি):</strong> বিকাশ থেকে প্রাপ্ত TrxID ঘরে বসানো।</li>
      <li><strong>বিকাশ নম্বরের শেষ ৪ ডিজিট:</strong> যে নম্বর থেকে টাকা পাঠানো হয়েছে তার শেষ চার সংখ্যা।</li>
      <li><strong>Place Order এ ট্যাপ:</strong> অর্ডার প্লেস করে ইউনিক ইনভয়েস নম্বর পাওয়া।</li>
    </ol>
  </div>
  <div class="phone-holder">
    <div class="phone-device">
      <div class="phone-speaker"></div>
      <div class="phone-screen">
        <img src="${imgMobileCheckout}" alt="Mobile Checkout & bKash">
      </div>
    </div>
    <div class="phone-caption">চেকআউট পেজ (Mobile POV)</div>
  </div>
</div>

<div class="alert-box warning avoid-break">
  <div style="font-size:16px;">⚠️</div>
  <div class="bangla-text"><strong>গুরুত্বপূর্ণ তথ্য:</strong> এখানে কোনো অটোমেটিক ব্যাংক বা বিকাশ API গেটওয়ে নেই। কাস্টমারের দেওয়া TrxID স্টোর অ্যাডমিন নিজের মোবাইলের বিকাশ স্টেটমেন্টের সাথে মিলিয়ে ম্যানুয়ালি যাচাই করেন। এতে তৃতীয় পক্ষের গেটওয়ে চার্জ বা জটিলতা থাকে না।</div>
</div>

<div class="page-break"></div>

<!-- ==================== 5. ORDER TRACKING & QUICK GUIDES ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>অর্ডার ট্র্যাকিং ও দ্রুত নির্দেশিকা • Order Tracking</span>
</div>

<h1>৩. লাইভ অর্ডার ট্র্যাকিং ও কাস্টমার কুইক-স্টার্ট</h1>
<p class="bangla-text">গ্রাহক ফোন বা মেসেজ না দিয়েই যেকোনো সময় ওয়েবসাইটে গিয়ে তার অর্ডারের রিয়েল-টাইম কাজের অগ্রগতি দেখতে পারেন।</p>

<div class="mobile-step-card avoid-break">
  <div class="step-details">
    <h4><span class="badge-step">৪</span> যেভাবে অর্ডার ট্র্যাক করতে হয় (Track Order)</h4>
    <ol class="bangla-text">
      <li>মেনু থেকে <strong>"Track Order"</strong> পেজে প্রবেশ করুন।</li>
      <li>অর্ডারে ব্যবহৃত <strong>১১ ডিজিটের মোবাইল নম্বর</strong> দিন।</li>
      <li>অর্ডার শেষে পাওয়া <strong>ইনভয়েস কোড (যেমন: AB-260923-1042)</strong> লিখুন।</li>
      <li><strong>"Track Order"</strong> বাটনে চাপলেই বর্তমান স্ট্যাটাস দেখা যাবে।</li>
    </ol>
    <div class="alert-box info bangla-text" style="margin-top:10px;">
      ℹ️ স্ট্যাটাসে দেখা যায়: <em>পেমেন্ট যাচাই পেন্ডিং ➔ ড্রেস সেলাই / কেক বেকিং চলছে ➔ কুরিয়ারে হ্যান্ডওভার ➔ সফল ডেলিভারি</em>।
    </div>
  </div>
  <div class="phone-holder">
    <div class="phone-device">
      <div class="phone-speaker"></div>
      <div class="phone-screen">
        <img src="${imgMobileTrack}" alt="Mobile Order Tracking">
      </div>
    </div>
    <div class="phone-caption">অর্ডার ট্র্যাকিং (Mobile POV)</div>
  </div>
</div>

<h3>গ্রাহকের জন্য সহজ ১ মিনিটের গাইড (Customer Quick-Start)</h3>
<table class="custom-table avoid-break">
  <tr>
    <th style="width: 25%;">ধাপ (Step)</th>
    <th style="width: 35%;">করণীয় (Action)</th>
    <th>সহজ বিবরণ (Details)</th>
  </tr>
  <tr>
    <td><strong>১. প্রোডাক্ট পছন্দ করুন</strong></td>
    <td>ড্রেস বা কেক সিলেক্ট করুন</td>
    <td class="bangla-text">সাইজ বা পাউন্ড সিলেক্ট করে "Add to Bag" চাপুন।</td>
  </tr>
  <tr>
    <td><strong>২. ব্যাগে যান</strong></td>
    <td>Shopping Bag এ ট্যাপ করুন</td>
    <td class="bangla-text">আইটেম সংখ্যা ও মোট মূল্য দেখে "Proceed to Checkout" চাপুন।</td>
  </tr>
  <tr>
    <td><strong>৩. ঠিকানা লিখুন</strong></td>
    <td>নাম, ফোন ও ঠিকানা পূরণ</td>
    <td class="bangla-text">সঠিক ফোন নম্বর ও বিস্তারিত ঠিকানা লিখুন।</td>
  </tr>
  <tr>
    <td><strong>৪. বিকাশ অগ্রিম দিন</strong></td>
    <td>বিকাশে Send Money করুন</td>
    <td class="bangla-text">প্রদর্শিত নম্বরে অগ্রিম পাঠিয়ে TrxID ও শেষ ৪ সংখ্যা বসান।</td>
  </tr>
  <tr>
    <td><strong>৫. অর্ডার নিশ্চিত করুন</strong></td>
    <td>Place Order চাপুন</td>
    <td class="bangla-text">স্ক্রিনে ইনভয়েস কোড দেখা যাবে, এটি সংরক্ষণ করুন।</td>
  </tr>
</table>

<div class="page-break"></div>

<!-- ==================== 6. ADMIN MANUAL - LOGIN & WORKFLOW ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>অ্যাডমিন পোর্টাল গাইড • Admin Portal Manual</span>
</div>

<h1>৪. অ্যাডমিন পোর্টাল ও ড্যাশবোর্ড পরিচালনা</h1>
<p class="bangla-text">সঞ্জিদা বেথী ও অনুমোদিত টিম মেম্বারদের জন্য রয়েছে সম্পূর্ণ সুরক্ষিত অ্যাডমিন কন্ট্রোল প্যানেল (<code>/admin/login</code>)।</p>

<div class="mobile-step-card avoid-break">
  <div class="step-details">
    <h4><span class="badge-step">৫</span> অ্যাডমিন লগইন ও ড্যাশবোর্ড ওভারভিউ</h4>
    <p class="bangla-text">মোবাইল বা কম্পিউটার থেকে অ্যাডমিন পোর্টালে লগইন করা যায়:</p>
    <ul class="bangla-text">
      <li><strong>লগইন লিংক:</strong> <code>/admin/login</code></li>
      <li><strong>তথ্য:</strong> নির্ধারিত অ্যাডমিন ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।</li>
      <li><strong>ড্যাশবোর্ড মেট্রিক্স:</strong> লগইন করলেই মোট সেলস, পেন্ডিং অর্ডার এবং একটিভ পণ্যের সংখ্যা চোখে পড়ে।</li>
      <li><strong>নিরাপত্তা:</strong> কাজ শেষে মেনুর লগআউট বাটনে চাপ দিয়ে সেশন ক্লোজ করুন।</li>
    </ul>
  </div>
  <div class="phone-holder">
    <div class="phone-device">
      <div class="phone-speaker"></div>
      <div class="phone-screen">
        <img src="${imgMobileAdminLogin}" alt="Admin Login Mobile">
      </div>
    </div>
    <div class="phone-caption">অ্যাডমিন লগইন (Mobile POV)</div>
  </div>
</div>

<h3>অর্ডার লাইফসাইকেল ও স্ট্যাটাস আপডেট (Order Lifecycle)</h3>
<table class="custom-table avoid-break">
  <tr>
    <th>স্ট্যাটাস (Status)</th>
    <th>বর্তমান অর্থ (Meaning)</th>
    <th>অ্যাডমিনের দায়িত্ব (Action Required)</th>
  </tr>
  <tr>
    <td><span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:10px; font-weight:600;">Pending</span></td>
    <td class="bangla-text">নতুন অর্ডার এসেছে, অগ্রিম ভেরিফাই করা বাকি।</td>
    <td class="bangla-text">বিকাশ অ্যাপে TrxID মিলিয়ে অর্ডার ওপেন করুন।</td>
  </tr>
  <tr>
    <td><span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:10px; font-weight:600;">Processing</span></td>
    <td class="bangla-text">অগ্রিম নিশ্চিত হয়েছে। পোশাক সেলাই বা কেক তৈরি চলছে।</td>
    <td class="bangla-text">কারিগর বা কিচেনে কাজ বুঝিয়ে দিন।</td>
  </tr>
  <tr>
    <td><span style="background:#f3e8ff; color:#6b21a8; padding:2px 8px; border-radius:10px; font-weight:600;">Shipped</span></td>
    <td class="bangla-text">প্যাকেট কুরিয়ার বা রাইডারের কাছে হস্তান্তর করা হয়েছে।</td>
    <td class="bangla-text">বাকি টাকা (COD) সংগ্রহে রাইডারকে ইনভয়েস স্লিপ দিন।</td>
  </tr>
  <tr>
    <td><span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:10px; font-weight:600;">Delivered</span></td>
    <td class="bangla-text">গ্রাহক পণ্য পেয়েছেন এবং বাকি টাকা পরিশোধ করেছেন।</td>
    <td class="bangla-text">অর্ডারটি সফল সেলস হিসেবে পূর্ণাঙ্গ রূপ পেল।</td>
  </tr>
  <tr>
    <td><span style="background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:10px; font-weight:600;">Cancelled</span></td>
    <td class="bangla-text">ভুয়া TrxID বা কাস্টমার অর্ডার বাতিল করেছে।</td>
    <td class="bangla-text">স্ট্যাটাস ক্যানসেল করে স্টক ঠিক রাখুন।</td>
  </tr>
</table>

<div class="page-break"></div>

<!-- ==================== 7. BKASH RECONCILIATION & ADMIN TOOLS ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>বিকাশ রিকনসিলিয়েশন ও প্রোডাক্ট গাইড • SOP & Management</span>
</div>

<h1>৫. বিকাশ অগ্রিম মেলানো (SOP) ও পণ্য ব্যবস্থাপনা</h1>

<div class="toc-card avoid-break" style="background:#fffcf9; border-color:#e2cbbe;">
  <h3 style="margin-top:0; color:#5a2e36;">বিকাশ অগ্রিম টাকা মেলানোর ৪টি সহজ নিয়ম (SOP)</h3>
  <ol class="bangla-text" style="padding-left:18px; margin-bottom:0;">
    <li style="margin-bottom:6px;"><strong>অর্ডার ওপেন করুন:</strong> <code>/admin/orders</code> এ গিয়ে <em>Pending</em> অর্ডারে ক্লিক করে কাস্টমারের দেওয়া <strong>TrxID</strong>, <strong>টাকার পরিমাণ</strong> এবং <strong>নম্বরের শেষ ৪ ডিজিট</strong> দেখুন।</li>
    <li style="margin-bottom:6px;"><strong>নিজের বিকাশ স্টেটমেন্ট চেক করুন:</strong> দোকান বা ব্যক্তিগত বিকাশ অ্যাপে স্টেটমেন্ট খুলুন অথবা ইনকামিং SMS দেখুন।</li>
    <li style="margin-bottom:6px;"><strong>TrxID হুবহু মেলান:</strong> কাস্টমারের দেওয়া TrxID এবং বিকাশ স্টেটমেন্টের TrxID অক্ষরে অক্ষরে মিলেছে কিনা এবং সঠিক টাকা ঢুকেছে কিনা নিশ্চিত হন।</li>
    <li style="margin-bottom:0;"><strong>স্ট্যাটাস "Processing" করুন:</strong> টাকা নিশ্চিত হলে সাথে সাথে স্ট্যাটাস বদলে <strong>Processing</strong> করে দিন। কাস্টমার তার ট্র্যাকিং পেজে দেখতে পাবেন তার পেমেন্ট অ্যাপ্রুভ হয়েছে।</li>
  </ol>
</div>

<div class="check-grid avoid-break" style="margin-top:14px;">
  <div class="check-card">
    <div>
      <strong class="bangla-text">নতুন পণ্য যোগ করা (Add Product):</strong>
      <p class="bangla-text" style="margin: 3px 0 0 0; font-size: 11.5px; color: #55443e;">
        <code>/admin/products</code> এ গিয়ে <strong>"+ Add Product"</strong> চাপুন। নাম, ক্যাটাগরি (ড্রেস বা কেক), সাইজ, দাম লিখে ছবি আপলোড করে সেভ করুন। সাথে সাথে ওয়েবসাইটে লাইভ হয়ে যাবে।
      </p>
    </div>
  </div>

  <div class="check-card">
    <div>
      <strong class="bangla-text">ম্যানুয়াল অফলাইন অর্ডার (Manual Order):</strong>
      <p class="bangla-text" style="margin: 3px 0 0 0; font-size: 11.5px; color: #55443e;">
        ফেসবুক বা ফোনে কোনো কাস্টমার অর্ডার দিলে অ্যাডমিন প্যানেল থেকে <strong>"Create Manual Order"</strong> এ গিয়ে তথ্য এন্ট্রি করে দিন। এতে সব কাস্টমার ডাটা এক জায়গায় থাকবে।
      </p>
    </div>
  </div>
</div>

<div class="check-grid avoid-break">
  <div class="check-card">
    <div>
      <strong class="bangla-text">ইনভয়েস ও ডেলিভারি স্লিপ প্রিন্ট:</strong>
      <p class="bangla-text" style="margin: 3px 0 0 0; font-size: 11.5px; color: #55443e;">
        যেকোনো অর্ডারের পাশে থাকা <strong>"Print Delivery Slip"</strong> এ চাপলেই ঠিকানাসহ স্লিপ তৈরি হয়। প্যাকেটের গায়ে এটি লাগিয়ে রাইডারের হাতে দিন।
      </p>
    </div>
  </div>

  <div class="check-card">
    <div>
      <strong class="bangla-text">স্টোর সেটিংস ও বিকাশ নম্বর পরিবর্তন:</strong>
      <p class="bangla-text" style="margin: 3px 0 0 0; font-size: 11.5px; color: #55443e;">
        <code>/admin/settings</code> পেজে গিয়ে যেকোনো সময় বিকাশ নম্বর, ডেলিভারি চার্জ (ঢাকার ভেতরে ৮০ টাকা, বাইরে ১৫০ টাকা) নিজে নিজেই আপডেট করতে পারবেন।
      </p>
    </div>
  </div>
</div>

<div class="page-break"></div>

<!-- ==================== 8. TROUBLESHOOTING & SYSTEM NOTES ==================== -->
<div class="running-header">
  <span class="brand">Ababil’s Attire by Sanjida Bethi</span>
  <span>সমস্যা সমাধান ও টেকনিক্যাল নোট • Support & Technical</span>
</div>

<h1>৬. সাধারণ সমস্যা সমাধান (Troubleshooting)</h1>

<table class="custom-table avoid-break">
  <tr>
    <th style="width: 28%;">সমস্যা (Issue)</th>
    <th style="width: 32%;">সম্ভাব্য কারণ (Reason)</th>
    <th>সহজ সমাধান (Solution)</th>
  </tr>
  <tr>
    <td class="bangla-text"><strong>বিকাশ TrxID স্টেটমেন্টে মিলছে না</strong></td>
    <td class="bangla-text">কাস্টমার টাইপে ভুল করেছেন অথবা ভুয়া স্ক্রিনশট দিয়েছেন।</td>
    <td class="bangla-text">অর্ডার প্রসেস করবেন না। কাস্টমারের নম্বরে হোয়াটসঅ্যাপ বা ফোন দিয়ে স্টেটমেন্টের স্ক্রিনশট চান।</td>
  </tr>
  <tr>
    <td class="bangla-text"><strong>কাস্টমার ইনভয়েস কোড হারিয়ে ফেলেছেন</strong></td>
    <td class="bangla-text">অর্ডার কনফার্মেশনের স্ক্রিনশট না নিয়ে পেজ বন্ধ করেছেন।</td>
    <td class="bangla-text">অ্যাডমিন প্যানেলে গিয়ে কাস্টমারের মোবাইল নম্বর দিয়ে সার্চ করে তার ইনভয়েস কোড জানিয়ে দিন।</td>
  </tr>
  <tr>
    <td class="bangla-text"><strong>ছবি আপলোড হচ্ছে না</strong></td>
    <td class="bangla-text">ছবির সাইজ অনেক বড় (৫ মেগাবাইটের বেশি)।</td>
    <td class="bangla-text">ছবির সাইজ কিছুটা ছোট বা কম্প্রেস করে JPG/PNG ফরম্যাটে আপলোড করুন।</td>
  </tr>
  <tr>
    <td class="bangla-text"><strong>অ্যাডমিন পাসওয়ার্ড ভুলে গেছেন</strong></td>
    <td class="bangla-text">পাসওয়ার্ড মনে নেই বা ব্রাউজারের ডাটা মুছে গেছে।</td>
    <td class="bangla-text">টেকনিক্যাল সাপোর্টে যোগাযোগ করুন, Supabase Auth থেকে পাসওয়ার্ড রিসেট করে দেওয়া হবে।</td>
  </tr>
</table>

<hr style="border: none; border-top: 1px solid #ebdcd5; margin: 16px 0;">

<h1>৭. সিস্টেম রক্ষণাবেক্ষণ ও সীমাবদ্ধতা (Technical Notes)</h1>
<ul class="bangla-text avoid-break" style="font-size:12px; padding-left:20px;">
  <li><strong>প্রযুক্তি:</strong> আধুনিক React 19 ও TypeScript এর মাধ্যমে নির্মিত, ডাটাবেজ হিসেবে ক্লাউড-সার্টিফায়েড Supabase PostgreSQL ব্যবহৃত হয়েছে।</li>
  <li><strong>Row Level Security (RLS):</strong> ডাটাবেজের প্রতিটি টেবিল সুরক্ষিত। অনুমোদনহীন কোনো ব্যক্তি কাস্টমারের তথ্য বা অ্যাডমিন ডাটা দেখতে পারবে না।</li>
  <li><strong>স্বয়ংক্রিয় ব্যাকআপ:</strong> ক্লাউড সিস্টেমে প্রতিদিন ডাটাবেজের স্বয়ংক্রিয় ব্যাকআপ সংরক্ষিত থাকে। চাইলে অ্যাডমিন থেকে যেকোনো সময় অর্ডারের CSV ডাউনলোড করা যায়।</li>
  <li><strong>সীমাবদ্ধতা (No Automated bKash API):</strong> কোনো থার্ড পার্টি অটোমেটেড পেমেন্ট গেটওয়ে রাখা হয়নি। কাস্টমার নিজে বিকাশ করে TrxID দেন এবং অ্যাডমিন মিলিয়ে নেন। এটি সম্পূর্ণ ইচ্ছাকৃত ও নিরাপদ পদ্ধতি।</li>
</ul>

<hr style="border: none; border-top: 1px solid #ebdcd5; margin: 16px 0;">

<h1>৮. কাজের দায়িত্ব হস্তান্তর চেকলিস্ট (Handover Sign-off)</h1>
<p class="bangla-text">এই দলিলের মাধ্যমে নিশ্চিত করা হচ্ছে যে <strong>Ababil’s Attire by Sanjida Bethi</strong> প্রজেক্টের যাবতীয় ফিচার ও অ্যাক্সেস সফলভাবে সঞ্জিদা বেথীর কাছে হস্তান্তর করা হলো:</p>

<div class="check-grid avoid-break">
  <div class="check-card"><span class="check-box"></span><span class="bangla-text">লাইভ অনলাইন স্টোরফ্রন্ট সম্পূর্ণ চালু</span></div>
  <div class="check-card"><span class="check-box"></span><span class="bangla-text">সুরক্ষিত অ্যাডমিন পোর্টাল ও ক্রেডেনশিয়াল হস্তান্তর</span></div>
  <div class="check-card"><span class="check-box"></span><span class="bangla-text">বিকাশ অগ্রিম ও COD অর্ডার সিস্টেম পরীক্ষিত</span></div>
  <div class="check-card"><span class="check-box"></span><span class="bangla-text">মোবাইল অপ্টিমাইজড ও রেসপন্সিভ ডিজাইন সম্পন্ন</span></div>
  <div class="check-card"><span class="check-box"></span><span class="bangla-text">ইনভয়েস স্লিপ ও ট্র্যাকিং মডিউল অ্যাক্টিভ</span></div>
  <div class="check-card"><span class="check-box"></span><span class="bangla-text">ব্যবহার নির্দেশিকা ও গাইডলাইন প্রদান করা হলো</span></div>
</div>

<div class="sign-box avoid-break">
  <div>
    <p style="margin: 0; font-weight: 700; color: #5a2e36;" class="bangla-text">হস্তান্তরকারী (Lead Developer):</p>
    <div class="sign-line">
      Signature & Seal<br>
      <span style="font-weight: normal; color: #77655e;">Engineering & Implementation Team</span>
    </div>
  </div>
  <div>
    <p style="margin: 0; font-weight: 700; color: #5a2e36;" class="bangla-text">গ্রহণকারী (Client):</p>
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
console.log('Clean master HTML written successfully.');

console.log('Rendering polished clean Master PDF...');
// Edge headless command without headers/footers to keep clean
const cmd = `"${edge}" --headless=new --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${masterPdfPath}" --print-to-pdf-margins="none" --no-pdf-header-footer "file:///${masterHtmlPath.replace(/\\/g, '/')}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  const stat = fs.statSync(masterPdfPath);
  console.log(`Generated Clean Master PDF: ${path.basename(masterPdfPath)} (${stat.size} bytes)`);
} catch (err) {
  console.error('Failed to generate clean master PDF:', err.message);
}
