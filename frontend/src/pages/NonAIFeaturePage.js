import React, { useState, useEffect, useCallback } from 'react';
import { customerProfilesAPI, supportTicketsAPI, paymentHistoryAPI, appointmentsAPI, usageTrackingAPI } from '../services/api';

const featureConfig = {
  'customer-profiles': {
    title: 'Customer Profiles',
    api: customerProfilesAPI,
    columns: ['customer_name', 'email', 'phone_number', 'plan_type', 'account_status', 'city', 'monthly_bill'],
    columnLabels: { customer_name: 'Customer', email: 'Email', phone_number: 'Phone', plan_type: 'Plan', account_status: 'Status', city: 'City', monthly_bill: 'Bill ($)' },
    fields: [
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone_number', label: 'Phone Number', type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'state', label: 'State', type: 'text' },
      { key: 'zip_code', label: 'ZIP Code', type: 'text' },
      { key: 'plan_type', label: 'Plan Type', type: 'select', options: ['Basic', 'Standard', 'Premium', 'Unlimited', 'Family'] },
      { key: 'account_status', label: 'Account Status', type: 'select', options: ['Active', 'Suspended', 'Cancelled', 'Pending'] },
      { key: 'join_date', label: 'Join Date', type: 'date' },
      { key: 'monthly_bill', label: 'Monthly Bill ($)', type: 'number' },
      { key: 'preferred_contact', label: 'Preferred Contact', type: 'select', options: ['Phone', 'Email', 'SMS', 'Mail'] },
    ],
    detailFields: ['customer_name', 'email', 'phone_number', 'address', 'city', 'state', 'zip_code', 'plan_type', 'account_status', 'join_date', 'monthly_bill', 'preferred_contact'],
  },
  'support-tickets': {
    title: 'Support Tickets',
    api: supportTicketsAPI,
    columns: ['ticket_number', 'customer_name', 'subject', 'category', 'priority', 'status', 'assigned_agent'],
    columnLabels: { ticket_number: 'Ticket #', customer_name: 'Customer', subject: 'Subject', category: 'Category', priority: 'Priority', status: 'Status', assigned_agent: 'Agent' },
    fields: [
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'subject', label: 'Subject', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'category', label: 'Category', type: 'select', options: ['Billing', 'Technical', 'Network', 'Account', 'Plan Change', 'General Inquiry'] },
      { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed'] },
      { key: 'assigned_agent', label: 'Assigned Agent', type: 'text' },
      { key: 'channel', label: 'Channel', type: 'select', options: ['Phone', 'Chat', 'Email', 'In-Store', 'Social Media'] },
      { key: 'resolution_notes', label: 'Resolution Notes', type: 'text' },
    ],
    detailFields: ['ticket_number', 'customer_name', 'subject', 'description', 'category', 'priority', 'status', 'assigned_agent', 'channel', 'resolution_notes'],
  },
  'payment-history': {
    title: 'Payment History',
    api: paymentHistoryAPI,
    columns: ['customer_name', 'account_number', 'payment_date', 'amount', 'payment_method', 'payment_status', 'billing_period'],
    columnLabels: { customer_name: 'Customer', account_number: 'Account', payment_date: 'Date', amount: 'Amount ($)', payment_method: 'Method', payment_status: 'Status', billing_period: 'Period' },
    fields: [
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'account_number', label: 'Account Number', type: 'text' },
      { key: 'payment_date', label: 'Payment Date', type: 'date' },
      { key: 'amount', label: 'Amount ($)', type: 'number' },
      { key: 'payment_method', label: 'Payment Method', type: 'select', options: ['Credit Card', 'Debit Card', 'Bank Transfer', 'Auto-Pay', 'Cash', 'Check'] },
      { key: 'transaction_id', label: 'Transaction ID', type: 'text' },
      { key: 'billing_period', label: 'Billing Period', type: 'text' },
      { key: 'plan_type', label: 'Plan Type', type: 'select', options: ['Basic', 'Standard', 'Premium', 'Unlimited', 'Family'] },
      { key: 'payment_status', label: 'Payment Status', type: 'select', options: ['Completed', 'Pending', 'Failed', 'Refunded'] },
      { key: 'late_fee', label: 'Late Fee ($)', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'text' },
    ],
    detailFields: ['customer_name', 'account_number', 'payment_date', 'amount', 'payment_method', 'transaction_id', 'billing_period', 'plan_type', 'payment_status', 'late_fee', 'notes'],
  },
  'appointments': {
    title: 'Appointments',
    api: appointmentsAPI,
    columns: ['customer_name', 'appointment_date', 'appointment_time', 'appointment_type', 'technician_name', 'status', 'location'],
    columnLabels: { customer_name: 'Customer', appointment_date: 'Date', appointment_time: 'Time', appointment_type: 'Type', technician_name: 'Technician', status: 'Status', location: 'Location' },
    fields: [
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'appointment_date', label: 'Date', type: 'date' },
      { key: 'appointment_time', label: 'Time', type: 'time' },
      { key: 'appointment_type', label: 'Type', type: 'select', options: ['Installation', 'Repair', 'Upgrade', 'Maintenance', 'Inspection', 'Consultation'] },
      { key: 'technician_name', label: 'Technician', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled'] },
      { key: 'contact_phone', label: 'Contact Phone', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'text' },
      { key: 'estimated_duration_min', label: 'Est. Duration (min)', type: 'number' },
    ],
    detailFields: ['customer_name', 'appointment_date', 'appointment_time', 'appointment_type', 'technician_name', 'location', 'status', 'contact_phone', 'notes', 'estimated_duration_min'],
  },
  'usage-tracking': {
    title: 'Usage Tracking',
    api: usageTrackingAPI,
    columns: ['customer_name', 'usage_date', 'data_used_gb', 'data_limit_gb', 'call_minutes_used', 'sms_sent', 'plan_type'],
    columnLabels: { customer_name: 'Customer', usage_date: 'Date', data_used_gb: 'Data (GB)', data_limit_gb: 'Limit (GB)', call_minutes_used: 'Minutes', sms_sent: 'SMS', plan_type: 'Plan' },
    fields: [
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'usage_date', label: 'Usage Date', type: 'date' },
      { key: 'data_used_gb', label: 'Data Used (GB)', type: 'number' },
      { key: 'data_limit_gb', label: 'Data Limit (GB)', type: 'number' },
      { key: 'call_minutes_used', label: 'Call Minutes Used', type: 'number' },
      { key: 'call_minutes_limit', label: 'Call Minutes Limit', type: 'number' },
      { key: 'sms_sent', label: 'SMS Sent', type: 'number' },
      { key: 'sms_limit', label: 'SMS Limit', type: 'number' },
      { key: 'roaming_data_mb', label: 'Roaming Data (MB)', type: 'number' },
      { key: 'hotspot_usage_gb', label: 'Hotspot Usage (GB)', type: 'number' },
      { key: 'plan_type', label: 'Plan Type', type: 'select', options: ['Basic', 'Standard', 'Premium', 'Unlimited', 'Family'] },
    ],
    detailFields: ['customer_name', 'usage_date', 'data_used_gb', 'data_limit_gb', 'call_minutes_used', 'call_minutes_limit', 'sms_sent', 'sms_limit', 'roaming_data_mb', 'hotspot_usage_gb', 'plan_type'],
  },
};

function getBadgeClass(key, value) {
  if (key === 'priority') {
    if (value === 'Urgent') return 'badge-danger';
    if (value === 'High') return 'badge-warning';
    if (value === 'Medium') return 'badge-info';
    return 'badge-success';
  }
  if (key === 'status' || key === 'account_status' || key === 'payment_status') {
    if (value === 'Open' || value === 'Pending' || value === 'Failed') return 'badge-warning';
    if (value === 'In Progress' || value === 'Scheduled') return 'badge-info';
    if (value === 'Resolved' || value === 'Closed' || value === 'Completed' || value === 'Active') return 'badge-success';
    if (value === 'Cancelled' || value === 'Suspended' || value === 'Refunded') return 'badge-danger';
    return 'badge-purple';
  }
  return '';
}

function formatFieldLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    .replace('Pct', '%').replace('Ms', '(ms)').replace('Gb', '(GB)');
}

function NonAIFeaturePage({ feature }) {
  const config = featureConfig[feature];
  const [data, setData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await config.api.getAll();
      setData(res.data);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [config.api]);

  useEffect(() => {
    loadData();
    setSelectedItem(null);
    setShowForm(false);
    setSearchQuery('');
  }, [feature, loadData]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setShowForm(false);
  };

  const handleNew = () => {
    setFormData({});
    setEditItem(null);
    setShowForm(true);
    setSelectedItem(null);
  };

  const handleEdit = (item) => {
    const fd = {};
    config.fields.forEach(f => {
      let val = item[f.key];
      if (f.type === 'date' && val) {
        val = new Date(val).toISOString().slice(0, 10);
      }
      fd[f.key] = val ?? '';
    });
    setFormData(fd);
    setEditItem(item);
    setShowForm(true);
    setSelectedItem(null);
  };

  const handleDelete = async (id) => {
    try {
      await config.api.delete(id);
      showToast('Record deleted successfully');
      setShowDeleteConfirm(null);
      setSelectedItem(null);
      loadData();
    } catch {
      showToast('Failed to delete record', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await config.api.update(editItem.id, formData);
        showToast('Record updated successfully');
      } else {
        await config.api.create(formData);
        showToast('Record created successfully');
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const filteredData = data.filter(item =>
    searchQuery === '' || Object.values(item).some(v =>
      String(v).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const isBadgeField = (key) => ['priority', 'status', 'account_status', 'payment_status'].includes(key);

  return (
    <div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <h1>{config.title}</h1>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleNew}>+ New Record</button>
        </div>
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Search records..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {config.columns.map(col => (
                <th key={col}>{config.columnLabels[col] || formatFieldLabel(col)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={config.columns.length} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={config.columns.length}>
                <div className="empty-state"><p>No records found</p><button className="btn btn-primary" onClick={handleNew}>Add First Record</button></div>
              </td></tr>
            ) : (
              filteredData.map(item => (
                <tr key={item.id} onClick={() => handleRowClick(item)}>
                  {config.columns.map(col => (
                    <td key={col}>
                      {isBadgeField(col) && item[col] != null ? (
                        <span className={`badge ${getBadgeClass(col, item[col])}`}>{item[col]}</span>
                      ) : col === 'payment_date' || col === 'appointment_date' || col === 'usage_date' || col === 'join_date' ? (
                        item[col] ? new Date(item[col]).toLocaleDateString() : '—'
                      ) : (
                        String(item[col] ?? '—')
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedItem(null); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>{selectedItem.customer_name || selectedItem.ticket_number || 'Record Details'}</h2>
              <button className="modal-close" onClick={() => setSelectedItem(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {config.detailFields.map(key => (
                  <div key={key} className="detail-item">
                    <label>{formatFieldLabel(key)}</label>
                    <span>
                      {(key === 'payment_date' || key === 'appointment_date' || key === 'usage_date' || key === 'join_date') && selectedItem[key]
                        ? new Date(selectedItem[key]).toLocaleDateString()
                        : String(selectedItem[key] ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => handleEdit(selectedItem)}>Edit</button>
              <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(selectedItem.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editItem ? 'Edit Record' : 'New Record'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  {config.fields.map(field => (
                    <div key={field.key} className="form-group">
                      <label>{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                          required
                        >
                          <option value="">Select...</option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          step={field.type === 'number' ? 'any' : undefined}
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                          required={field.key === 'customer_name'}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(null); }}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-body">
              <div className="confirm-dialog">
                <p>Are you sure you want to delete this record? This action cannot be undone.</p>
                <div className="btn-group">
                  <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NonAIFeaturePage;
