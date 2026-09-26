import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ordersService, type AdminOrderSummary } from '../../services/orders.service';
import { productsService } from '../../services/products.service';
import { adminService } from '../../services/admin.service';
import { supabase } from '../../lib/supabase';

export const AdminDashboard: React.FC = () => {
  const { admin, user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    dressCount: 0,
    cakeCount: 0,
    totalCustomers: 0,
    repeatRate: 0,
    totalRevenue: 0,
    inProductionCount: 0,
    dispatchedCount: 0,
  });

  const [pendingDeposits, setPendingDeposits] = useState<AdminOrderSummary[]>([]);
  const [productionOrders, setProductionOrders] = useState<AdminOrderSummary[]>([]);

  const loadStats = async () => {
    try {
      const [ordersRes, prods, custDir] = await Promise.all([
        ordersService.getOrdersAdmin(),
        productsService.getAllProductsAdmin(),
        adminService.getCustomersDirectory(),
      ]);

      const orders: AdminOrderSummary[] = Array.isArray(ordersRes) ? ordersRes : [];

      const activeOrders = orders.filter((o) => o.status !== 'cancelled');
      const pendingOrders = activeOrders.filter((o) => o.status === 'review_required' || o.advance_status === 'pending');
      const inProdOrders = activeOrders.filter((o) => o.status === 'in_production');
      const dispatchedOrders = activeOrders.filter((o) => o.status === 'dispatch_ready' || o.status === 'out_for_delivery');

      // Calculate exact total revenue from active client orders
      const revenue = activeOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

      // Pending deposits for priority verification table
      setPendingDeposits(pendingOrders.slice(0, 5));
      setProductionOrders(inProdOrders);

      const dresses = prods.filter((p: any) => p.category === 'dress').length;
      const cakes = prods.filter((p: any) => p.category === 'cake').length;

      setStats({
        totalOrders: activeOrders.length,
        pendingOrders: pendingOrders.length,
        totalProducts: prods.length,
        dressCount: dresses,
        cakeCount: cakes,
        totalCustomers: custDir.metrics?.total_customers || 0,
        repeatRate: custDir.metrics?.repeat_customer_rate || 0,
        totalRevenue: revenue,
        inProductionCount: inProdOrders.length,
        dispatchedCount: dispatchedOrders.length,
      });
    } catch (err) {
      console.warn('Dashboard stats load error:', err);
    }
  };

  useEffect(() => {
    loadStats();

    const channel = supabase
      .channel('dashboard-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, loadStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={styles.container} className="admin-dashboard-container">
      {/* ===================================================================== */}
      {/* DESKTOP STITCH STUDIO OVERVIEW (Visible >= 960px)                     */}
      {/* ===================================================================== */}
      <div className="stitch-admin-desktop-view">
        {/* Top Header Row: Title & Action */}
        <div className="stitch-dash-header-row">
          <div>
            <div className="stitch-dash-subhead">
              <span className="stitch-dash-live-dot"></span>
              <span>STUDIO LIVE OPS • Bespoke Atelier &amp; Pâtisserie</span>
            </div>
            <h1 className="stitch-dash-title">Studio Atelier Overview</h1>
          </div>

          <div className="stitch-dash-header-actions">
            <div className="stitch-dash-cycle-chip">
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7e544f' }}>
                skillet
              </span>
              <div>
                <span className="stitch-dash-cycle-label">Baking Prep Cycle: Morning</span>
                <span className="stitch-dash-cycle-status">Batch active</span>
              </div>
            </div>

            <Link to="/admin/orders" className="stitch-dash-create-btn">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                add_circle
              </span>
              <span>Create Bespoke Order</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="stitch-dash-metrics-grid">
          {/* Card 1: Today's Revenue */}
          <div className="stitch-dash-metric-card">
            <div className="stitch-dash-metric-head">
              <span className="stitch-dash-metric-label">TOTAL REVENUE</span>
              <span className="material-symbols-outlined stitch-dash-metric-icon">payments</span>
            </div>
            <div className="stitch-dash-metric-value">৳ {stats.totalRevenue.toLocaleString()}</div>
            <div className="stitch-dash-metric-foot">
              <span className="stitch-dash-growth-positive">↗ Studio Ledger</span>
              <span className="stitch-dash-foot-text">from {stats.totalOrders} active client orders</span>
            </div>
          </div>

          {/* Card 2: Pending Orders */}
          <Link to="/admin/orders" className="stitch-dash-metric-card" style={{ textDecoration: 'none' }}>
            <div className="stitch-dash-metric-head">
              <span className="stitch-dash-metric-label">PENDING ORDERS</span>
              <span className="material-symbols-outlined stitch-dash-metric-icon">mark_email_unread</span>
            </div>
            <div className="stitch-dash-metric-value">{stats.pendingOrders} Orders</div>
            <div className="stitch-dash-metric-foot">
              <span className={stats.pendingOrders > 0 ? "stitch-dash-dot-warn" : "stitch-dash-dot-live"}>●</span>
              <span className="stitch-dash-foot-text">{stats.pendingOrders > 0 ? 'Requires bKash TrxID check' : 'All deposits reconciled'}</span>
            </div>
          </Link>

          {/* Card 3: In Production */}
          <Link to="/admin/orders" className="stitch-dash-metric-card" style={{ textDecoration: 'none' }}>
            <div className="stitch-dash-metric-head">
              <span className="stitch-dash-metric-label">IN PRODUCTION</span>
              <span className="material-symbols-outlined stitch-dash-metric-icon">accessibility_new</span>
            </div>
            <div className="stitch-dash-metric-value">{stats.inProductionCount} Dockets</div>
            <div className="stitch-dash-metric-foot">
              <span className="stitch-dash-foot-text">{stats.dressCount} Catalog Dresses • {stats.cakeCount} Confections</span>
            </div>
          </Link>

          {/* Card 4: Dispatches */}
          <Link to="/admin/orders" className="stitch-dash-metric-card" style={{ textDecoration: 'none' }}>
            <div className="stitch-dash-metric-head">
              <span className="stitch-dash-metric-label">DISPATCHES</span>
              <span className="material-symbols-outlined stitch-dash-metric-icon">local_shipping</span>
            </div>
            <div className="stitch-dash-metric-value">{stats.dispatchedCount} Active Routes</div>
            <div className="stitch-dash-metric-foot">
              <span className="stitch-dash-dot-live">●</span>
              <span className="stitch-dash-foot-text">{stats.dispatchedCount > 0 ? `${stats.dispatchedCount} couriers on transit` : 'Fleet on standby'}</span>
            </div>
          </Link>
        </div>

        {/* 2-Column Operational Grid */}
        <div className="stitch-dash-operational-grid">
          {/* LEFT 65%: bKash Deposits Table + Dual Craft Schedule */}
          <div className="stitch-dash-left-col">
            {/* bKash Customer Advance Deposits Priority Verification */}
            <div className="stitch-dash-card">
              <div className="stitch-dash-card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="stitch-dash-tag-red">PRIORITY VERIFICATION</span>
                    <span className="stitch-dash-tag-gray">Deposit Reconcile</span>
                  </div>
                  <h3 className="stitch-dash-card-title">bKash Customer Advance Deposits</h3>
                </div>
                <div className="stitch-dash-sync-badge">
                  <span className="stitch-dash-live-dot"></span>
                  <span>Auto-fetch: Live API Sync</span>
                </div>
              </div>

              {/* Table */}
              <div className="stitch-dash-table-wrapper">
                <table className="stitch-dash-table">
                  <thead>
                    <tr>
                      <th>ORDER REF &amp; PATRON</th>
                      <th>TRANSACTION DETAILS</th>
                      <th>BESPOKE LINE ITEMS</th>
                      <th>ADVANCE</th>
                      <th>ARTISAN ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDeposits.length > 0 ? (
                      pendingDeposits.map((order) => {
                        const payment = order.payments?.[0];
                        const items = order.items || [];
                        return (
                          <tr key={order.id}>
                            <td>
                              <strong className="stitch-dash-ref">#{order.invoice_number}</strong>
                              <div className="stitch-dash-patron">{order.customer?.name || 'Patron'}</div>
                              <span className={order.delivery_address?.toLowerCase().includes('pickup') ? 'stitch-dash-pickup-pill' : 'stitch-dash-delivery-pill'}>
                                {order.delivery_address?.toLowerCase().includes('pickup') ? 'PICKUP' : 'DELIVERY'}
                              </span>
                            </td>
                            <td>
                              <div className="stitch-dash-mono-box">{payment?.trx_id || 'PENDING'}</div>
                              <div className="stitch-dash-phone">{order.customer?.phone || '017XXXXXXXX'}</div>
                            </td>
                            <td>
                              {items.length > 0 ? (
                                items.slice(0, 2).map((item, idx) => {
                                  const isCake = !!item.cake_weight || (item.product_name_snapshot?.toLowerCase().includes('cake') ?? false);
                                  return (
                                    <div key={idx} className="stitch-dash-item-line">
                                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#7e544f' }}>
                                        {isCake ? 'cake' : 'checkroom'}
                                      </span>
                                      <span>{item.product_name_snapshot} {item.selected_size ? `(${item.selected_size})` : (item.cake_weight ? `(${item.cake_weight})` : '')}</span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="stitch-dash-item-line">
                                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#7e544f' }}>checkroom</span>
                                  <span>Bespoke Attire Piece</span>
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="stitch-dash-price">৳ {order.advance_amount || 500}</div>
                              <div className="stitch-dash-sub">{order.advance_status?.toUpperCase() || 'PENDING'}</div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Link to="/admin/orders" className="stitch-dash-verify-btn">
                                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                                  <span>Verify &amp; Tailor</span>
                                </Link>
                                <button type="button" className="stitch-dash-flag-btn" title="Flag Issue">
                                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>flag</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ padding: '36px 20px', textAlign: 'center', backgroundColor: '#fcfbf9' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#065f46', marginBottom: '8px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>check_circle</span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2d2421' }}>All Customer Advances Reconciled</div>
                          <p style={{ fontSize: '12px', color: '#7e726b', margin: '3px 0 0 0' }}>
                            There are currently no unverified bKash transaction deposits awaiting review.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="stitch-dash-table-foot">
                <span style={{ fontSize: '12px', color: '#7e726b' }}>
                  Displaying pending unverified customer remittances
                </span>
                <Link to="/admin/orders" className="stitch-dash-link">
                  <span>View All Reconciliations</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Today's Baking & Tailoring Schedule */}
            <div className="stitch-dash-card">
              <div className="stitch-dash-card-header">
                <div>
                  <span className="stitch-dash-subhead-small">DUAL CRAFT DISCIPLINE</span>
                  <h3 className="stitch-dash-card-title">Today's Baking &amp; Tailoring Schedule</h3>
                </div>
                <div className="stitch-dash-checkin-badge">
                  4 Artisans Checked-in
                </div>
              </div>

              <div className="stitch-dash-dual-grid">
                {/* Confections Schedule */}
                <div className="stitch-dash-craft-col">
                  <div className="stitch-dash-craft-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7e544f' }}>cake</span>
                      <strong style={{ fontSize: '13px', color: '#432821' }}>Confections Schedule</strong>
                    </div>
                    {(() => {
                      const cakeItems = productionOrders.flatMap(o => (o.items || []).filter(i => !!i.cake_weight || (i.product_name_snapshot?.toLowerCase().includes('cake') ?? false)));
                      return <span className="stitch-dash-badge-sm">{cakeItems.length > 0 ? `${cakeItems.length} In Oven / Prep` : '0 Scheduled'}</span>;
                    })()}
                  </div>

                  {(() => {
                    const cakeItems = productionOrders.flatMap(o => 
                      (o.items || [])
                        .filter(i => !!i.cake_weight || (i.product_name_snapshot?.toLowerCase().includes('cake') ?? false))
                        .map(i => ({ item: i, order: o }))
                    );

                    if (cakeItems.length === 0) {
                      return (
                        <div style={{ padding: '28px 16px', textAlign: 'center', backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px dashed #ebdcd6' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#b5a8a4', marginBottom: '4px' }}>skillet</span>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#432821' }}>No Confection Bakes In Production</div>
                          <p style={{ fontSize: '11px', color: '#7e726b', margin: '2px 0 0 0' }}>Baking prep cycle runs upon client deposit verification.</p>
                        </div>
                      );
                    }

                    return cakeItems.slice(0, 3).map(({ item, order }, idx) => (
                      <div key={idx} className="stitch-dash-craft-card">
                        <div className="stitch-dash-craft-card-top">
                          <span className="stitch-dash-time-slot">#{order.invoice_number} • {order.delivery_time || 'MORNING SLOT'}</span>
                          <span className="stitch-dash-weight-tag">{item.cake_weight || '2.0 lb'}</span>
                        </div>
                        <h4 className="stitch-dash-craft-item-title">{item.product_name_snapshot}</h4>
                        <p className="stitch-dash-craft-desc">
                          {item.cake_flavor ? `Flavor: ${item.cake_flavor}. ` : ''}
                          {item.cake_message ? `Custom inscription: "${item.cake_message}". ` : 'Freshly baked upon confirmed slot.'}
                        </p>
                        <div className="stitch-dash-craft-foot">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#504441' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#7e544f' }}>location_on</span>
                            <span>{order.delivery_address?.toLowerCase().includes('pickup') ? 'Studio Pickup' : 'Chilled Courier'}</span>
                          </div>
                          <span className="stitch-dash-van-tag">In Oven Batch</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Tailoring Queue */}
                <div className="stitch-dash-craft-col">
                  <div className="stitch-dash-craft-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7e544f' }}>checkroom</span>
                      <strong style={{ fontSize: '13px', color: '#432821' }}>Tailoring Queue</strong>
                    </div>
                    {(() => {
                      const dressItems = productionOrders.flatMap(o => (o.items || []).filter(i => !i.cake_weight && !(i.product_name_snapshot?.toLowerCase().includes('cake') ?? false)));
                      return <span className="stitch-dash-badge-sm">{dressItems.length > 0 ? `${dressItems.length} On Atelier Floor` : '0 Active'}</span>;
                    })()}
                  </div>

                  {(() => {
                    const dressItems = productionOrders.flatMap(o => 
                      (o.items || [])
                        .filter(i => !i.cake_weight && !(i.product_name_snapshot?.toLowerCase().includes('cake') ?? false))
                        .map(i => ({ item: i, order: o }))
                    );

                    if (dressItems.length === 0) {
                      return (
                        <div style={{ padding: '28px 16px', textAlign: 'center', backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px dashed #ebdcd6' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#b5a8a4', marginBottom: '4px' }}>straighten</span>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#432821' }}>Tailoring Queue Idle</div>
                          <p style={{ fontSize: '11px', color: '#7e726b', margin: '2px 0 0 0' }}>Bespoke stitching starts once order measurements are approved.</p>
                        </div>
                      );
                    }

                    return dressItems.slice(0, 3).map(({ item, order }, idx) => (
                      <div key={idx} className="stitch-dash-craft-card">
                        <div className="stitch-dash-craft-card-top">
                          <span className="stitch-dash-time-slot">#{order.invoice_number} • HAND STITCHING</span>
                          <span className="stitch-dash-weight-tag">{item.selected_size ? `Size ${item.selected_size}` : 'Custom Fit'}</span>
                        </div>
                        <h4 className="stitch-dash-craft-item-title">{item.product_name_snapshot}</h4>
                        <div className="stitch-dash-progress-meta">
                          <span>Patron: <strong>{order.customer?.name || 'Client'}</strong></span>
                          <span style={{ color: '#065f46', fontWeight: 600 }}>Active Smocking</span>
                        </div>
                        <div className="stitch-dash-craft-foot">
                          <span style={{ fontSize: '11px', color: '#6f6764' }}>{order.delivery_date ? `Due: ${order.delivery_date}` : 'Studio Workshop'}</span>
                          <span className="stitch-dash-pleat-tag">Needlework</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="stitch-dash-table-foot">
                <span style={{ fontSize: '12px', color: '#7e726b' }}>
                  Next bake inspection: 12:15 PM (Temp logs active)
                </span>
                <Link to="/admin/products" className="stitch-dash-link">
                  <span>Full Atelier Ledger</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT 35%: Studio Quick Actions + Chilled Fleet + Supply Alerts */}
          <div className="stitch-dash-right-col">
            {/* Studio Quick Actions */}
            <div className="stitch-dash-card">
              <span className="stitch-dash-subhead-small">COMMAND SUITE</span>
              <h3 className="stitch-dash-card-title">Studio Quick Actions</h3>

              <div className="stitch-dash-actions-stack">
                <Link to="/admin/products" className="stitch-dash-btn-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                  <span>Add New Dress / Cake</span>
                  <span className="material-symbols-outlined" style={{ marginLeft: 'auto', fontSize: '16px' }}>arrow_forward</span>
                </Link>

                <Link to="/admin/orders" className="stitch-dash-btn-outline">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7e544f' }}>download</span>
                  <span>Download Delivery Slips (PDF)</span>
                </Link>

                <a
                  href="https://web.whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="stitch-dash-btn-outline"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#25D366' }}>chat</span>
                  <span>Send WhatsApp Updates</span>
                  <span className="stitch-dash-live-dot" style={{ marginLeft: 'auto' }}></span>
                </a>
              </div>
            </div>

            {/* Chilled Fleet Status */}
            <div className="stitch-dash-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <span className="stitch-dash-subhead-small">LOGISTICS</span>
                  <h3 className="stitch-dash-card-title" style={{ margin: 0 }}>Chilled Fleet Status</h3>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#7e544f' }}>ac_unit</span>
              </div>

              <div className="stitch-dash-fleet-stack">
                <div className="stitch-dash-fleet-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#432821' }}>airport_shuttle</span>
                      <strong style={{ fontSize: '13px', color: '#432821' }}>Chilled Van #1</strong>
                    </div>
                    <span className="stitch-dash-fleet-badge-ready">Ready to Load</span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#6f6764', margin: '4px 0 6px 0' }}>
                    Active Courier Circuit: Scheduled Route
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7e726b' }}>
                    <span>4 deliveries</span>
                    <span>Departs 11:30 AM</span>
                  </div>
                </div>

                <div className="stitch-dash-fleet-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#432821' }}>airport_shuttle</span>
                      <strong style={{ fontSize: '13px', color: '#432821' }}>Chilled Van #2</strong>
                    </div>
                    <span className="stitch-dash-fleet-badge-slot">Afternoon Slot</span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#6f6764', margin: '4px 0 6px 0' }}>
                    Extended Service Routes
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7e726b' }}>
                    <span>2 deliveries</span>
                    <span>Departs 2:00 PM</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8c827a' }}>
                <span>Van Temperature: <strong>4.2°C Stabilized</strong></span>
                <span>GPS Track: Active</span>
              </div>
            </div>

            {/* Atelier Supply Alerts */}
            <div className="stitch-dash-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <span className="stitch-dash-subhead-small">INVENTORY MONITOR</span>
                  <h3 className="stitch-dash-card-title" style={{ margin: 0 }}>Atelier Supply Alerts</h3>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#dc2626' }}>warning</span>
              </div>

              <div className="stitch-dash-supply-stack">
                <div className="stitch-dash-supply-row">
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7e544f' }}>texture</span>
                    <div>
                      <strong style={{ fontSize: '12.5px', color: '#2d2421', display: 'block' }}>Organic Belgian Linen</strong>
                      <span style={{ fontSize: '11px', color: '#6f6764' }}>Shade: Bleached Ivory</span>
                      <div style={{ fontSize: '11px', color: '#9a3412', fontWeight: 600, marginTop: '2px' }}>
                        8 meters remaining in rolls
                      </div>
                    </div>
                  </div>
                  <Link to="/admin/settings" className="stitch-dash-reorder-btn">Reorder</Link>
                </div>

                <div className="stitch-dash-supply-row">
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7e544f' }}>bakery_dining</span>
                    <div>
                      <strong style={{ fontSize: '12.5px', color: '#2d2421', display: 'block' }}>Madagascar Bourbon Pods</strong>
                      <span style={{ fontSize: '11px', color: '#6f6764' }}>Grade A Gourmet Confection Pods</span>
                      <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700, marginTop: '2px' }}>
                        ★ Critical low: 14 pods left
                      </div>
                    </div>
                  </div>
                  <Link to="/admin/settings" className="stitch-dash-reorder-btn">Reorder</Link>
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8c827a' }}>
                <span>Consignment: In route</span>
                <Link to="/admin/products" style={{ color: '#432821', fontWeight: 600, textDecoration: 'none' }}>Full Stockroom ↗</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MOBILE PROTECTED VIEW (Visible < 960px)                               */}
      {/* ===================================================================== */}
      <div className="stitch-admin-mobile-view">
        {/* Welcome Banner */}
        <div style={styles.banner}>
          <div style={styles.bannerText}>
            <div style={styles.badgeRow}>
              <span style={styles.badge}>ADMIN AUTHENTICATION VERIFIED</span>
              <span style={styles.liveStoreBadge}>● STUDIO LIVE</span>
            </div>
            <h1 style={styles.welcomeTitle}>Welcome, {admin?.full_name || 'Administrator'}</h1>
            <p style={styles.welcomeSubtitle}>
              Administrative access confirmed for <strong style={{ color: '#2d2421' }}>{user?.email}</strong> with active role{' '}
              <span style={styles.roleHighlight}>[{admin?.role?.toUpperCase() || 'STAFF'}]</span>.
            </p>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div style={styles.metricsGrid}>
          <Link to="/admin/orders" style={{ ...styles.metricCard, textDecoration: 'none' }}>
            <div style={styles.metricHeader}>
              <span style={styles.metricLabel}>Total Orders</span>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#8c5e51' }}>
                receipt_long
              </span>
            </div>
            <div style={styles.metricValueRow}>
              <span style={styles.metricValue}>{stats.totalOrders}</span>
              {stats.pendingOrders > 0 && (
                <span style={styles.pendingBadge}>{stats.pendingOrders} pending</span>
              )}
            </div>
            <p style={styles.metricHint}>Client inquiries and placed orders</p>
          </Link>

          <Link to="/admin/products" style={{ ...styles.metricCard, textDecoration: 'none' }}>
            <div style={styles.metricHeader}>
              <span style={styles.metricLabel}>Product Archive</span>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#8c5e51' }}>
                checkroom
              </span>
            </div>
            <div style={styles.metricValueRow}>
              <span style={styles.metricValue}>{stats.totalProducts}</span>
              <span style={styles.categorySplit}>
                {stats.dressCount} dresses • {stats.cakeCount} cakes
              </span>
            </div>
            <p style={styles.metricHint}>Handmade dresses and fresh cakes</p>
          </Link>

          <Link to="/admin/customers" style={{ ...styles.metricCard, textDecoration: 'none' }}>
            <div style={styles.metricHeader}>
              <span style={styles.metricLabel}>Atelier Clients</span>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#8c5e51' }}>
                group
              </span>
            </div>
            <div style={styles.metricValueRow}>
              <span style={styles.metricValue}>{stats.totalCustomers}</span>
              <span style={styles.repeatBadge}>{stats.repeatRate}% repeat</span>
            </div>
            <p style={styles.metricHint}>Client directory &amp; order history</p>
          </Link>

          <Link to="/admin/settings" style={{ ...styles.metricCard, textDecoration: 'none' }}>
            <div style={styles.metricHeader}>
              <span style={styles.metricLabel}>bKash Advance</span>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#8c5e51' }}>
                verified
              </span>
            </div>
            <div style={styles.metricValueRow}>
              <span style={styles.metricValue}>৳ 500</span>
              <span style={styles.verifiedBadge}>Standard</span>
            </div>
            <p style={styles.metricHint}>Per order booking requirement</p>
          </Link>
        </div>

        {/* Quick Actions Hub */}
        <div style={styles.actionsCard}>
          <div style={styles.actionsHeader}>
            <h2 style={styles.actionsTitle}>Quick Atelier Actions</h2>
            <p style={styles.actionsSubtitle}>Direct shortcuts to manage the boutique catalog and dockets</p>
          </div>
          <div style={styles.actionBtnGroup}>
            <Link to="/admin/products" style={styles.primaryActionBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                add_circle
              </span>
              <span>Manage Products</span>
            </Link>

            <Link to="/admin/orders" style={styles.secondaryActionBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                orders
              </span>
              <span>Review Orders</span>
            </Link>

            <Link to="/admin/customers" style={styles.secondaryActionBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                person_search
              </span>
              <span>Client Directory</span>
            </Link>

            <Link to="/admin/settings" style={styles.secondaryActionBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                tune
              </span>
              <span>Store Settings</span>
            </Link>
          </div>
        </div>

        {/* Security & Verification Matrix */}
        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Identity & Role</h2>
            <div style={styles.detailRow}>
              <span style={styles.label}>Full Name:</span>
              <span style={styles.value}>{admin?.full_name || 'Sanjida Bethi'}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.label}>Email Address:</span>
              <span style={styles.value}>{admin?.email || user?.email}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.label}>Administrative Role:</span>
              <span style={styles.value}>
                <span style={styles.rolePill}>{admin?.role || 'SUPERADMIN'}</span>
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.label}>Account UUID:</span>
              <span style={styles.monoValue}>{user?.id?.slice(0, 18) || 'Authenticated'}...</span>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Security & Access Enforcement</h2>
            <div style={styles.statusItem}>
              <span style={styles.checkIcon}>✓</span>
              <div>
                <strong style={styles.statusLabel}>Supabase Auth Session:</strong>
                <p style={styles.statusDesc}>Active, persisted, auto-refreshing JWT token.</p>
              </div>
            </div>
            <div style={styles.statusItem}>
              <span style={styles.checkIcon}>✓</span>
              <div>
                <strong style={styles.statusLabel}>Table Authorization:</strong>
                <p style={styles.statusDesc}>Verified against <code>admin_users</code> with active status.</p>
              </div>
            </div>
            <div style={styles.statusItem}>
              <span style={styles.checkIcon}>✓</span>
              <div>
                <strong style={styles.statusLabel}>PostgreSQL RLS:</strong>
                <p style={styles.statusDesc}>Full CRUD permissions granted via security definer function.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1280px',
    margin: '0 auto',
    width: '100%',
  },
  banner: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '14px',
    padding: '24px 28px',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.04))',
  },
  bannerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '4px',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    padding: '3px 10px',
    borderRadius: '9999px',
  },
  liveStoreBadge: {
    display: 'inline-block',
    backgroundColor: '#f5ede9',
    color: '#5c3e36',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    padding: '3px 10px',
    borderRadius: '9999px',
  },
  welcomeTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '26px',
    color: '#2d2421',
    fontWeight: 600,
    lineHeight: 1.3,
    margin: '4px 0',
  },
  welcomeSubtitle: {
    fontSize: '14px',
    color: '#6f6764',
    lineHeight: 1.6,
    margin: '2px 0 0 0',
  },
  roleHighlight: {
    color: '#5c3e36',
    fontWeight: 700,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '12px',
    padding: '20px 22px',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.04))',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#6f6764',
    letterSpacing: '0.02em',
  },
  metricValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
    margin: '4px 0',
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#2d2421',
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    lineHeight: 1.1,
  },
  pendingBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#b45309',
    backgroundColor: '#fef3c7',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  categorySplit: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#8c5e51',
  },
  repeatBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#065f46',
    backgroundColor: '#ecfdf5',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  verifiedBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#065f46',
    backgroundColor: '#ecfdf5',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  metricHint: {
    fontSize: '12px',
    color: '#988e8a',
    margin: 0,
    lineHeight: 1.4,
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '12px',
    padding: '20px 24px',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.04))',
  },
  actionsHeader: {
    marginBottom: '14px',
  },
  actionsTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '18px',
    fontWeight: 600,
    color: '#2d2421',
    margin: '0 0 4px 0',
    lineHeight: 1.3,
  },
  actionsSubtitle: {
    fontSize: '13px',
    color: '#6f6764',
    margin: 0,
    lineHeight: 1.5,
  },
  actionBtnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  primaryActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    minHeight: '42px',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.12))',
    transition: 'all 0.15s ease',
  },
  secondaryActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#f5f3ef',
    color: '#5c3e36',
    border: '1px solid #dfd8ce',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    minHeight: '42px',
    transition: 'all 0.15s ease',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.04))',
  },
  cardTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '18px',
    fontWeight: 600,
    color: '#2d2421',
    marginBottom: '16px',
    borderBottom: '1px solid #ece8e1',
    paddingBottom: '10px',
    lineHeight: 1.3,
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f5f3ef',
    fontSize: '13px',
    gap: '12px',
  },
  label: {
    color: '#6f6764',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  value: {
    color: '#2d2421',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  monoValue: {
    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
    fontSize: '12px',
    color: '#5c3e36',
    backgroundColor: '#f5ede9',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  rolePill: {
    backgroundColor: '#f5ede9',
    color: '#5c3e36',
    padding: '3px 10px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '10px 0',
  },
  checkIcon: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    flexShrink: 0,
    marginTop: '2px',
  },
  statusLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#2d2421',
    display: 'block',
    lineHeight: 1.4,
    marginBottom: '2px',
  },
  statusDesc: {
    fontSize: '12px',
    color: '#6f6764',
    lineHeight: 1.5,
    margin: 0,
  },
};
