const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  console.log('🌱 Starting database seed...');

  // Create tables
  await pool.query(`
    DROP TABLE IF EXISTS call_quality CASCADE;
    DROP TABLE IF EXISTS dropped_calls CASCADE;
    DROP TABLE IF EXISTS plan_recommendations CASCADE;
    DROP TABLE IF EXISTS proactive_issues CASCADE;
    DROP TABLE IF EXISTS nps_predictions CASCADE;
    DROP TABLE IF EXISTS churn_analysis CASCADE;
    DROP TABLE IF EXISTS network_outages CASCADE;
    DROP TABLE IF EXISTS customer_sentiment CASCADE;
    DROP TABLE IF EXISTS billing_disputes CASCADE;
    DROP TABLE IF EXISTS sla_compliance CASCADE;
    DROP TABLE IF EXISTS tower_performance CASCADE;
    DROP TABLE IF EXISTS customer_profiles CASCADE;
    DROP TABLE IF EXISTS support_tickets CASCADE;
    DROP TABLE IF EXISTS payment_history CASCADE;
    DROP TABLE IF EXISTS appointments CASCADE;
    DROP TABLE IF EXISTS usage_tracking CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'analyst',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE call_quality (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(20),
      call_duration INTEGER,
      signal_strength INTEGER,
      network_type VARCHAR(10),
      location VARCHAR(255),
      jitter_ms DECIMAL(10,2),
      packet_loss_pct DECIMAL(5,2),
      latency_ms INTEGER,
      quality_score INTEGER,
      ai_analysis TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE dropped_calls (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(20),
      call_time TIMESTAMP,
      duration_before_drop INTEGER,
      location VARCHAR(255),
      cell_tower_id VARCHAR(50),
      network_type VARCHAR(10),
      signal_strength INTEGER,
      weather_condition VARCHAR(50),
      concurrent_users INTEGER,
      root_cause TEXT,
      ai_analysis TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE plan_recommendations (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      current_plan VARCHAR(100),
      monthly_bill DECIMAL(10,2),
      data_usage_gb DECIMAL(10,2),
      call_minutes INTEGER,
      sms_count INTEGER,
      roaming_usage VARCHAR(50),
      contract_end_date DATE,
      satisfaction_score INTEGER,
      recommended_plan VARCHAR(100),
      ai_analysis TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE proactive_issues (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      issue_type VARCHAR(100),
      severity VARCHAR(20),
      affected_service VARCHAR(100),
      region VARCHAR(100),
      ticket_count_30d INTEGER,
      avg_resolution_hours DECIMAL(10,2),
      customer_tenure_months INTEGER,
      is_premium BOOLEAN DEFAULT FALSE,
      last_contact_reason VARCHAR(255),
      resolution_plan TEXT,
      status VARCHAR(50) DEFAULT 'Open',
      ai_analysis TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE nps_predictions (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_segment VARCHAR(100),
      tenure_months INTEGER,
      monthly_charges DECIMAL(10,2),
      total_charges DECIMAL(10,2),
      num_support_tickets INTEGER,
      avg_response_time_hours DECIMAL(10,2),
      service_outages_30d INTEGER,
      billing_issues_90d INTEGER,
      feature_adoption_score INTEGER,
      predicted_nps INTEGER,
      nps_category VARCHAR(20),
      ai_analysis TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE churn_analysis (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      account_age_months INTEGER,
      contract_type VARCHAR(50),
      monthly_charges DECIMAL(10,2),
      total_charges DECIMAL(10,2),
      num_complaints INTEGER,
      payment_delays INTEGER,
      competitor_offers INTEGER,
      usage_decline_pct DECIMAL(5,2),
      last_interaction_days INTEGER,
      churn_probability DECIMAL(5,2),
      risk_level VARCHAR(20),
      ai_analysis TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE network_outages (
      id SERIAL PRIMARY KEY,
      region VARCHAR(100),
      outage_type VARCHAR(100),
      affected_towers INTEGER,
      affected_customers INTEGER,
      start_time TIMESTAMP,
      duration_minutes INTEGER,
      severity VARCHAR(20),
      root_cause TEXT,
      restoration_status VARCHAR(50) DEFAULT 'Ongoing',
      sla_breached BOOLEAN DEFAULT FALSE,
      ai_analysis TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE customer_sentiment (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      channel VARCHAR(50),
      feedback_text TEXT,
      interaction_type VARCHAR(100),
      agent_name VARCHAR(255),
      resolution_provided BOOLEAN DEFAULT FALSE,
      wait_time_minutes INTEGER,
      call_duration_seconds INTEGER,
      language VARCHAR(20) DEFAULT 'English',
      sentiment_score DECIMAL(4,2),
      sentiment_label VARCHAR(50),
      ai_analysis TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE billing_disputes (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      account_number VARCHAR(50),
      dispute_type VARCHAR(100),
      disputed_amount DECIMAL(10,2),
      billing_period VARCHAR(50),
      plan_type VARCHAR(100),
      overage_charges DECIMAL(10,2),
      roaming_charges DECIMAL(10,2),
      disputed_services VARCHAR(255),
      previous_disputes INTEGER DEFAULT 0,
      resolution_status VARCHAR(50) DEFAULT 'Open',
      ai_analysis TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE sla_compliance (
      id SERIAL PRIMARY KEY,
      service_name VARCHAR(255),
      sla_target_pct DECIMAL(5,2),
      actual_uptime_pct DECIMAL(5,2),
      measurement_period VARCHAR(50),
      region VARCHAR(100),
      downtime_minutes INTEGER,
      incidents_count INTEGER,
      mttr_minutes INTEGER,
      customer_tier VARCHAR(50),
      penalty_clause VARCHAR(255),
      compliance_status VARCHAR(50),
      ai_analysis TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE tower_performance (
      id SERIAL PRIMARY KEY,
      tower_id VARCHAR(50),
      tower_name VARCHAR(255),
      location VARCHAR(255),
      tower_type VARCHAR(50),
      max_capacity INTEGER,
      current_load_pct DECIMAL(5,2),
      avg_signal_strength INTEGER,
      uptime_pct DECIMAL(5,2),
      maintenance_due BOOLEAN DEFAULT FALSE,
      last_maintenance_date DATE,
      health_score INTEGER,
      ai_analysis TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE customer_profiles (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone_number VARCHAR(20),
      address VARCHAR(255),
      city VARCHAR(100),
      state VARCHAR(50),
      zip_code VARCHAR(10),
      plan_type VARCHAR(100),
      account_status VARCHAR(50) DEFAULT 'Active',
      join_date DATE,
      monthly_bill DECIMAL(10,2),
      preferred_contact VARCHAR(50) DEFAULT 'Phone',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE support_tickets (
      id SERIAL PRIMARY KEY,
      ticket_number VARCHAR(50) UNIQUE,
      customer_name VARCHAR(255) NOT NULL,
      subject VARCHAR(255),
      description TEXT,
      category VARCHAR(100),
      priority VARCHAR(20) DEFAULT 'Medium',
      status VARCHAR(50) DEFAULT 'Open',
      assigned_agent VARCHAR(255),
      channel VARCHAR(50),
      resolution_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE payment_history (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      account_number VARCHAR(50),
      payment_date DATE,
      amount DECIMAL(10,2),
      payment_method VARCHAR(50),
      transaction_id VARCHAR(100),
      billing_period VARCHAR(50),
      plan_type VARCHAR(100),
      payment_status VARCHAR(50) DEFAULT 'Completed',
      late_fee DECIMAL(10,2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE appointments (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      appointment_date DATE,
      appointment_time TIME,
      appointment_type VARCHAR(100),
      technician_name VARCHAR(255),
      location VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Scheduled',
      contact_phone VARCHAR(20),
      notes TEXT,
      estimated_duration_min INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE usage_tracking (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      usage_date DATE,
      data_used_gb DECIMAL(10,2),
      data_limit_gb DECIMAL(10,2),
      call_minutes_used INTEGER,
      call_minutes_limit INTEGER,
      sms_sent INTEGER,
      sms_limit INTEGER,
      roaming_data_mb DECIMAL(10,2) DEFAULT 0,
      hotspot_usage_gb DECIMAL(10,2) DEFAULT 0,
      plan_type VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Tables created');

  // Seed users
  const passwordHash = await bcrypt.hash('admin123', 10);
  await pool.query(`
    INSERT INTO users (name, email, password_hash, role) VALUES
    ('Admin User', 'admin@telecom.com', $1, 'admin'),
    ('Sarah Johnson', 'sarah@telecom.com', $1, 'analyst'),
    ('Mike Chen', 'mike@telecom.com', $1, 'manager')
  `, [passwordHash]);
  console.log('✅ Users seeded');

  // Seed Call Quality (15 records)
  await pool.query(`
    INSERT INTO call_quality (customer_name, phone_number, call_duration, signal_strength, network_type, location, jitter_ms, packet_loss_pct, latency_ms, quality_score) VALUES
    ('James Wilson', '+1-555-0101', 342, -65, '5G', 'New York, NY', 12.5, 0.3, 25, 8),
    ('Maria Garcia', '+1-555-0102', 128, -82, '4G', 'Los Angeles, CA', 45.2, 2.1, 85, 4),
    ('Robert Smith', '+1-555-0103', 567, -71, '5G', 'Chicago, IL', 8.3, 0.1, 18, 9),
    ('Jennifer Lee', '+1-555-0104', 89, -95, '3G', 'Houston, TX', 78.6, 5.4, 150, 2),
    ('David Brown', '+1-555-0105', 445, -68, '5G', 'Phoenix, AZ', 15.1, 0.5, 30, 7),
    ('Lisa Anderson', '+1-555-0106', 234, -77, '4G', 'Philadelphia, PA', 32.4, 1.8, 65, 5),
    ('Michael Taylor', '+1-555-0107', 678, -62, '5G', 'San Antonio, TX', 6.7, 0.2, 15, 9),
    ('Sarah Martinez', '+1-555-0108', 156, -88, '4G', 'San Diego, CA', 55.3, 3.2, 110, 3),
    ('Christopher Davis', '+1-555-0109', 412, -73, '4G', 'Dallas, TX', 22.1, 0.9, 42, 6),
    ('Amanda White', '+1-555-0110', 289, -69, '5G', 'San Jose, CA', 10.4, 0.4, 22, 8),
    ('Daniel Harris', '+1-555-0111', 534, -85, '3G', 'Austin, TX', 61.8, 4.1, 130, 3),
    ('Michelle Clark', '+1-555-0112', 167, -66, '5G', 'Jacksonville, FL', 9.2, 0.3, 20, 8),
    ('Kevin Lewis', '+1-555-0113', 398, -79, '4G', 'Fort Worth, TX', 38.7, 2.5, 78, 5),
    ('Stephanie Robinson', '+1-555-0114', 223, -91, '3G', 'Columbus, OH', 70.4, 4.8, 145, 2),
    ('Brian Walker', '+1-555-0115', 501, -64, '5G', 'Charlotte, NC', 7.8, 0.2, 16, 9)
  `);
  console.log('✅ Call Quality data seeded (15 records)');

  // Seed Dropped Calls (15 records)
  await pool.query(`
    INSERT INTO dropped_calls (customer_name, phone_number, call_time, duration_before_drop, location, cell_tower_id, network_type, signal_strength, weather_condition, concurrent_users) VALUES
    ('Patricia Young', '+1-555-0201', '2024-03-15 09:23:00', 45, 'Downtown Manhattan, NY', 'NYC-T-0451', '4G', -92, 'Clear', 1250),
    ('Thomas King', '+1-555-0202', '2024-03-15 14:11:00', 120, 'LAX Airport, CA', 'LAX-T-0089', '5G', -78, 'Foggy', 2100),
    ('Nancy Wright', '+1-555-0203', '2024-03-14 16:45:00', 30, 'I-95 Highway, FL', 'FL-T-1234', '4G', -98, 'Rain', 450),
    ('George Hill', '+1-555-0204', '2024-03-14 11:30:00', 200, 'Financial District, SF', 'SF-T-0567', '5G', -85, 'Clear', 1800),
    ('Karen Scott', '+1-555-0205', '2024-03-13 08:15:00', 67, 'Suburban Denver, CO', 'DEN-T-0234', '4G', -88, 'Snow', 320),
    ('Steven Adams', '+1-555-0206', '2024-03-13 19:55:00', 15, 'Rural Iowa', 'IA-T-0012', '3G', -105, 'Storm', 80),
    ('Betty Nelson', '+1-555-0207', '2024-03-12 12:30:00', 180, 'Mall of America, MN', 'MN-T-0789', '4G', -90, 'Clear', 3200),
    ('Edward Mitchell', '+1-555-0208', '2024-03-12 07:45:00', 90, 'Subway Tunnel, Boston', 'BOS-T-0456', '4G', -102, 'Clear', 560),
    ('Dorothy Roberts', '+1-555-0209', '2024-03-11 15:20:00', 55, 'Stadium, Dallas, TX', 'DAL-T-0678', '5G', -83, 'Clear', 4500),
    ('Frank Turner', '+1-555-0210', '2024-03-11 10:00:00', 140, 'Mountain Pass, CO', 'CO-T-0045', '3G', -110, 'Snow', 25),
    ('Sandra Phillips', '+1-555-0211', '2024-03-10 13:15:00', 25, 'Parking Garage, Chicago', 'CHI-T-0891', '4G', -96, 'Clear', 890),
    ('Paul Campbell', '+1-555-0212', '2024-03-10 17:30:00', 300, 'Beach Area, Miami, FL', 'MIA-T-0234', '4G', -87, 'Cloudy', 1100),
    ('Margaret Parker', '+1-555-0213', '2024-03-09 09:00:00', 40, 'Hospital Zone, Houston', 'HOU-T-0567', '5G', -76, 'Clear', 750),
    ('Charles Evans', '+1-555-0214', '2024-03-09 20:45:00', 75, 'Concert Venue, Nashville', 'NSH-T-0123', '4G', -94, 'Clear', 5000),
    ('Ruth Edwards', '+1-555-0215', '2024-03-08 11:10:00', 160, 'Office Building, Seattle', 'SEA-T-0345', '5G', -80, 'Rain', 670)
  `);
  console.log('✅ Dropped Calls data seeded (15 records)');

  // Seed Plan Recommendations (15 records)
  await pool.query(`
    INSERT INTO plan_recommendations (customer_name, current_plan, monthly_bill, data_usage_gb, call_minutes, sms_count, roaming_usage, contract_end_date, satisfaction_score) VALUES
    ('Alice Cooper', 'Premium', 79.99, 42.5, 890, 150, 'None', '2024-08-15', 7),
    ('Bob Morrison', 'Basic', 29.99, 4.8, 320, 45, 'None', '2024-06-01', 5),
    ('Carol Foster', 'Standard', 49.99, 14.2, 1200, 280, 'Occasional', '2024-12-30', 6),
    ('Dennis Gray', 'Unlimited', 99.99, 85.3, 2100, 500, 'Frequent', '2025-03-15', 8),
    ('Eva Richardson', 'Basic', 29.99, 3.1, 150, 20, 'None', '2024-05-20', 9),
    ('Fred Hamilton', 'Premium', 79.99, 12.8, 450, 90, 'None', '2024-09-10', 4),
    ('Grace Morgan', 'Standard', 49.99, 48.7, 1800, 350, 'Occasional', '2024-07-25', 3),
    ('Henry Sullivan', 'Family', 129.99, 67.4, 3200, 800, 'Frequent', '2025-01-15', 7),
    ('Irene Crawford', 'Basic', 29.99, 4.5, 280, 60, 'None', '2024-11-01', 6),
    ('Jack Patterson', 'Unlimited', 99.99, 22.1, 900, 200, 'None', '2024-08-30', 5),
    ('Kelly Brooks', 'Standard', 49.99, 15.6, 750, 180, 'Occasional', '2024-10-15', 7),
    ('Larry Price', 'Premium', 79.99, 38.9, 1100, 250, 'Frequent', '2025-02-28', 6),
    ('Monica Bennett', 'Basic', 29.99, 4.9, 500, 100, 'None', '2024-06-15', 4),
    ('Nathan Wood', 'Family', 129.99, 92.1, 4500, 1200, 'Frequent', '2025-04-01', 8),
    ('Olivia Reed', 'Standard', 49.99, 8.3, 600, 140, 'None', '2024-07-10', 7)
  `);
  console.log('✅ Plan Recommendations data seeded (15 records)');

  // Seed Proactive Issues (15 records)
  await pool.query(`
    INSERT INTO proactive_issues (customer_name, issue_type, severity, affected_service, region, ticket_count_30d, avg_resolution_hours, customer_tenure_months, is_premium, last_contact_reason, status) VALUES
    ('Peter Maxwell', 'Network Congestion', 'High', 'Mobile Data', 'Northeast', 5, 12.5, 36, true, 'Slow data speeds', 'Open'),
    ('Quinn Sanders', 'Billing Discrepancy', 'Medium', 'Billing', 'West', 2, 24.0, 18, false, 'Overcharged', 'Open'),
    ('Rachel Torres', 'Service Outage', 'Critical', 'Voice & Data', 'Southeast', 8, 4.2, 48, true, 'Complete outage', 'In Progress'),
    ('Samuel Green', 'Device Compatibility', 'Low', 'VoLTE', 'Midwest', 1, 48.0, 6, false, 'Calls not connecting', 'Open'),
    ('Tina Howard', 'Roaming Issues', 'Medium', 'International', 'West', 3, 36.0, 24, true, 'No service abroad', 'Open'),
    ('Ulysses Perry', 'Data Throttling', 'High', 'Mobile Data', 'South', 6, 8.0, 42, false, 'Speed reduction', 'In Progress'),
    ('Violet Foster', 'SMS Failures', 'Medium', 'Messaging', 'Northeast', 4, 16.0, 12, false, 'Messages not delivering', 'Open'),
    ('Walter Russell', 'WiFi Calling', 'Low', 'Voice', 'Midwest', 1, 72.0, 30, true, 'WiFi calls dropping', 'Open'),
    ('Xena Collins', 'Account Security', 'Critical', 'Account', 'West', 7, 2.0, 54, true, 'Unauthorized access', 'In Progress'),
    ('Yuri Volkov', 'Coverage Gap', 'High', 'Voice & Data', 'Southeast', 4, 168.0, 8, false, 'No signal at home', 'Open'),
    ('Zara Mitchell', '5G Access', 'Low', '5G Network', 'Northeast', 2, 24.0, 15, false, 'Cannot access 5G', 'Open'),
    ('Aaron Blake', 'Voicemail Issues', 'Medium', 'Voice', 'South', 3, 12.0, 60, true, 'Voicemail not working', 'Open'),
    ('Bella Cruz', 'App Connectivity', 'Low', 'Mobile App', 'West', 1, 48.0, 9, false, 'App crashes', 'Open'),
    ('Carlos Diaz', 'Number Porting', 'High', 'Account', 'Midwest', 5, 96.0, 3, false, 'Port taking too long', 'In Progress'),
    ('Diana Evans', 'International Calls', 'Medium', 'Voice', 'Northeast', 2, 8.0, 72, true, 'Calls to India failing', 'Open')
  `);
  console.log('✅ Proactive Issues data seeded (15 records)');

  // Seed NPS Predictions (15 records)
  await pool.query(`
    INSERT INTO nps_predictions (customer_name, customer_segment, tenure_months, monthly_charges, total_charges, num_support_tickets, avg_response_time_hours, service_outages_30d, billing_issues_90d, feature_adoption_score, predicted_nps, nps_category) VALUES
    ('Emma Watson', 'Enterprise', 48, 299.99, 14399.52, 3, 2.5, 0, 0, 9, 9, 'Promoter'),
    ('Frank Castle', 'Consumer', 12, 49.99, 599.88, 8, 18.0, 3, 2, 4, 3, 'Detractor'),
    ('Gina Rodriguez', 'SMB', 24, 149.99, 3599.76, 2, 6.0, 1, 0, 7, 8, 'Passive'),
    ('Harry Styles', 'Consumer', 36, 79.99, 2879.64, 1, 4.0, 0, 1, 8, 9, 'Promoter'),
    ('Iris Chang', 'Enterprise', 60, 499.99, 29999.40, 5, 1.5, 1, 0, 10, 8, 'Passive'),
    ('Jake Peralta', 'Consumer', 6, 29.99, 179.94, 12, 24.0, 4, 3, 2, 2, 'Detractor'),
    ('Kara Zor-El', 'SMB', 30, 199.99, 5999.70, 0, 0.0, 0, 0, 9, 10, 'Promoter'),
    ('Liam Neeson', 'Consumer', 18, 59.99, 1079.82, 4, 12.0, 2, 1, 5, 5, 'Detractor'),
    ('Mia Khalifa', 'Enterprise', 42, 399.99, 16799.58, 2, 3.0, 0, 0, 8, 9, 'Promoter'),
    ('Noah Davis', 'Consumer', 9, 39.99, 359.91, 6, 15.0, 2, 2, 3, 4, 'Detractor'),
    ('Olivia Pope', 'SMB', 36, 179.99, 6479.64, 1, 5.0, 0, 0, 7, 8, 'Passive'),
    ('Pablo Escobar', 'Consumer', 24, 69.99, 1679.76, 3, 8.0, 1, 1, 6, 6, 'Detractor'),
    ('Rosa Diaz', 'Enterprise', 54, 349.99, 18899.46, 1, 2.0, 0, 0, 9, 10, 'Promoter'),
    ('Sam Wilson', 'Consumer', 15, 49.99, 749.85, 7, 20.0, 3, 2, 4, 3, 'Detractor'),
    ('Tina Fey', 'SMB', 48, 129.99, 6239.52, 2, 6.0, 1, 0, 8, 7, 'Passive')
  `);
  console.log('✅ NPS Predictions data seeded (15 records)');

  // Seed Churn Analysis (15 records)
  await pool.query(`
    INSERT INTO churn_analysis (customer_name, account_age_months, contract_type, monthly_charges, total_charges, num_complaints, payment_delays, competitor_offers, usage_decline_pct, last_interaction_days, churn_probability, risk_level) VALUES
    ('Alan Turing', 36, 'Annual', 79.99, 2879.64, 1, 0, 0, 5.0, 15, 12.5, 'Low'),
    ('Barbara Streisand', 6, 'Month-to-Month', 49.99, 299.94, 5, 2, 3, 35.0, 45, 78.3, 'Critical'),
    ('Clark Kent', 24, 'Annual', 99.99, 2399.76, 0, 0, 1, 2.0, 5, 8.2, 'Low'),
    ('Diana Prince', 12, 'Month-to-Month', 39.99, 479.88, 8, 3, 4, 50.0, 60, 92.1, 'Critical'),
    ('Edwin Hubble', 48, 'Biennial', 129.99, 6239.52, 2, 1, 1, 10.0, 20, 25.4, 'Medium'),
    ('Fiona Apple', 18, 'Annual', 59.99, 1079.82, 3, 1, 2, 20.0, 30, 45.6, 'Medium'),
    ('Gordon Ramsay', 60, 'Biennial', 149.99, 8999.40, 0, 0, 0, 0.0, 3, 5.1, 'Low'),
    ('Helen Mirren', 9, 'Month-to-Month', 69.99, 629.91, 6, 2, 3, 40.0, 55, 85.7, 'Critical'),
    ('Isaac Newton', 30, 'Annual', 89.99, 2699.70, 1, 0, 1, 8.0, 12, 18.3, 'Low'),
    ('Julia Roberts', 15, 'Month-to-Month', 44.99, 674.85, 4, 2, 2, 28.0, 40, 62.4, 'High'),
    ('Karl Marx', 42, 'Biennial', 109.99, 4619.58, 1, 0, 0, 3.0, 8, 10.7, 'Low'),
    ('Laura Croft', 3, 'Month-to-Month', 34.99, 104.97, 7, 3, 5, 55.0, 75, 95.3, 'Critical'),
    ('Martin Luther', 54, 'Biennial', 159.99, 8639.46, 2, 1, 1, 12.0, 25, 22.8, 'Medium'),
    ('Nikola Tesla', 21, 'Annual', 74.99, 1574.79, 3, 1, 2, 18.0, 35, 48.9, 'Medium'),
    ('Oscar Wilde', 8, 'Month-to-Month', 54.99, 439.92, 9, 4, 4, 45.0, 65, 88.6, 'Critical')
  `);
  console.log('✅ Churn Analysis data seeded (15 records)');

  // Seed Network Outages (15 records)
  await pool.query(`
    INSERT INTO network_outages (region, outage_type, affected_towers, affected_customers, start_time, duration_minutes, severity, root_cause, restoration_status, sla_breached) VALUES
    ('Northeast', 'Full Outage', 12, 45000, '2024-03-15 02:30:00', 180, 'Critical', 'Fiber cut on main backbone', 'Restored', true),
    ('West Coast', 'Partial Degradation', 3, 8500, '2024-03-14 14:00:00', 45, 'Medium', 'Software update failure', 'Restored', false),
    ('Southeast', 'Full Outage', 8, 32000, '2024-03-13 18:45:00', 360, 'Critical', 'Hurricane damage to infrastructure', 'Restored', true),
    ('Midwest', 'Intermittent', 5, 12000, '2024-03-12 09:15:00', 90, 'High', 'Power grid instability', 'Restored', false),
    ('Southwest', 'Partial Degradation', 2, 5200, '2024-03-11 11:30:00', 30, 'Low', 'Routine maintenance overrun', 'Restored', false),
    ('Northeast', 'Data Only', 15, 55000, '2024-03-10 16:00:00', 240, 'Critical', 'DDoS attack on core network', 'Restored', true),
    ('West Coast', 'Full Outage', 6, 22000, '2024-03-09 03:00:00', 120, 'High', 'Earthquake damaged cell sites', 'Restored', true),
    ('Southeast', 'Intermittent', 4, 9800, '2024-03-08 20:30:00', 60, 'Medium', 'Overheating equipment', 'Restored', false),
    ('Midwest', 'Voice Only', 7, 18000, '2024-03-07 07:00:00', 150, 'High', 'VoLTE gateway failure', 'Restored', true),
    ('Northwest', 'Full Outage', 10, 38000, '2024-03-06 12:15:00', 300, 'Critical', 'Ice storm tower collapse', 'Restored', true),
    ('South Central', 'Partial Degradation', 3, 7500, '2024-03-05 15:45:00', 55, 'Medium', 'Congestion during event', 'Restored', false),
    ('Northeast', 'Intermittent', 2, 4200, '2024-03-04 22:00:00', 75, 'Low', 'Configuration drift', 'Restored', false),
    ('West Coast', 'Data Only', 9, 28000, '2024-03-03 06:30:00', 200, 'High', 'DNS server failure', 'Ongoing', true),
    ('Southeast', 'Full Outage', 11, 41000, '2024-03-02 01:00:00', 420, 'Critical', 'Transformer explosion at data center', 'Restored', true),
    ('Midwest', 'Partial Degradation', 4, 11000, '2024-03-01 13:00:00', 40, 'Low', 'Firmware bug on new equipment', 'Restored', false)
  `);
  console.log('✅ Network Outages data seeded (15 records)');

  // Seed Customer Sentiment (15 records)
  await pool.query(`
    INSERT INTO customer_sentiment (customer_name, channel, feedback_text, interaction_type, agent_name, resolution_provided, wait_time_minutes, call_duration_seconds, language) VALUES
    ('Angela Murray', 'Phone', 'I have been waiting for 30 minutes and nobody can fix my internet. This is the worst service I have ever experienced. I am switching to a competitor.', 'Complaint', 'Agent Smith', false, 32, 480, 'English'),
    ('Ben Harper', 'Chat', 'Quick question answered perfectly. Love the new app update, makes managing my account so easy!', 'Inquiry', 'Agent Lee', true, 2, 180, 'English'),
    ('Cynthia Rowe', 'Email', 'Third time this month my bill has been wrong. I was charged for roaming I never used. Very frustrating to deal with your billing department.', 'Complaint', 'Agent Johnson', false, 0, 0, 'English'),
    ('Derek Simmons', 'Phone', 'The technician who came to fix my connection was professional and thorough. Issue resolved in under an hour. Great service!', 'Feedback', 'Agent Williams', true, 5, 300, 'English'),
    ('Elena Vasquez', 'Social Media', 'Your network has been down 3 times this week in my area. How am I supposed to work from home? Fix your infrastructure!', 'Complaint', 'Agent Garcia', false, 0, 0, 'Spanish'),
    ('Fernando Costa', 'Phone', 'Called to upgrade my plan. Agent was helpful and found me a better deal. Saving $20/month now. Thank you!', 'Upgrade', 'Agent Brown', true, 8, 420, 'English'),
    ('Gloria Chen', 'Chat', 'My new phone is not connecting to 5G even though I am in a covered area. Very disappointed with the service.', 'Technical Support', 'Agent Kim', false, 15, 600, 'English'),
    ('Hassan Ali', 'Phone', 'I appreciate the proactive call about the outage in my area. Good to know you are aware and working on it.', 'Proactive Outreach', 'Agent Patel', true, 0, 240, 'English'),
    ('Ingrid Bergman', 'Email', 'Cancelling my service. After 5 years, the constant price increases without any improvement in service quality is unacceptable.', 'Cancellation', 'Agent Taylor', false, 0, 0, 'English'),
    ('Jorge Mendez', 'Phone', 'The family plan you recommended is perfect. All 4 lines working great and we are saving money. Very satisfied customer here.', 'Feedback', 'Agent Martinez', true, 3, 360, 'Spanish'),
    ('Karen Wu', 'Chat', 'Why does my data run out so fast? I barely use my phone and somehow I have used 10GB in a week. Something is wrong.', 'Technical Support', 'Agent Chen', false, 12, 540, 'English'),
    ('Leon Baptiste', 'Social Media', 'Shoutout to your support team for resolving my issue in record time. This is why I stay with your service!', 'Feedback', 'Agent Robinson', true, 0, 0, 'English'),
    ('Maria Gonzalez', 'Phone', 'I was promised a credit 3 weeks ago and it still has not appeared on my bill. I have called 4 times about this.', 'Complaint', 'Agent Lopez', false, 25, 720, 'Spanish'),
    ('Nathan Brooks', 'Chat', 'International roaming setup was seamless. Used my phone in Europe without any issues. Impressed with the coverage.', 'Feedback', 'Agent Davis', true, 1, 120, 'English'),
    ('Olga Petrov', 'Phone', 'Your automated system is impossible to navigate. It took me 20 minutes just to reach a human. Please fix your phone menu system.', 'Complaint', 'Agent Wilson', true, 22, 900, 'English')
  `);
  console.log('✅ Customer Sentiment data seeded (15 records)');

  // Seed Billing Disputes (15 records)
  await pool.query(`
    INSERT INTO billing_disputes (customer_name, account_number, dispute_type, disputed_amount, billing_period, plan_type, overage_charges, roaming_charges, disputed_services, previous_disputes) VALUES
    ('Rachel Green', 'ACC-10001', 'Overcharge', 45.99, 'Feb 2024', 'Premium', 25.99, 20.00, 'Data Overage', 0),
    ('Ross Geller', 'ACC-10002', 'Unauthorized Charge', 129.99, 'Mar 2024', 'Standard', 0.00, 129.99, 'International Roaming', 1),
    ('Monica Bing', 'ACC-10003', 'Double Billing', 79.99, 'Feb 2024', 'Premium', 0.00, 0.00, 'Monthly Plan', 0),
    ('Joey Tribbiani', 'ACC-10004', 'Wrong Plan Rate', 30.00, 'Jan 2024', 'Basic', 30.00, 0.00, 'Data Overage', 2),
    ('Phoebe Buffay', 'ACC-10005', 'Service Not Received', 49.99, 'Mar 2024', 'Standard', 0.00, 0.00, 'Premium Add-on', 0),
    ('Chandler Bing', 'ACC-10006', 'Overcharge', 85.50, 'Feb 2024', 'Unlimited', 0.00, 85.50, 'International Calls', 1),
    ('Janice Litman', 'ACC-10007', 'Cancellation Fee', 250.00, 'Mar 2024', 'Annual', 0.00, 0.00, 'Early Termination', 0),
    ('Gunther Central', 'ACC-10008', 'Unauthorized Charge', 15.99, 'Jan 2024', 'Basic', 0.00, 0.00, 'Premium Content', 3),
    ('Emily Waltham', 'ACC-10009', 'Wrong Plan Rate', 20.00, 'Feb 2024', 'Standard', 20.00, 0.00, 'SMS Overage', 0),
    ('Richard Burke', 'ACC-10010', 'Overcharge', 199.99, 'Mar 2024', 'Family', 49.99, 150.00, 'Roaming + Data', 1),
    ('Mike Hannigan', 'ACC-10011', 'Service Not Received', 39.99, 'Jan 2024', 'Standard', 0.00, 0.00, 'WiFi Hotspot', 0),
    ('David Scientist', 'ACC-10012', 'Double Billing', 149.98, 'Feb 2024', 'Unlimited', 0.00, 0.00, 'Monthly Plan x2', 0),
    ('Carol Willick', 'ACC-10013', 'Overcharge', 67.50, 'Mar 2024', 'Premium', 42.50, 25.00, 'Data + Calls', 2),
    ('Susan Bunch', 'ACC-10014', 'Unauthorized Charge', 9.99, 'Jan 2024', 'Basic', 0.00, 0.00, 'Insurance Add-on', 1),
    ('Tag Jones', 'ACC-10015', 'Cancellation Fee', 175.00, 'Feb 2024', 'Annual', 0.00, 0.00, 'Early Termination', 0)
  `);
  console.log('✅ Billing Disputes data seeded (15 records)');

  // Seed SLA Compliance (15 records)
  await pool.query(`
    INSERT INTO sla_compliance (service_name, sla_target_pct, actual_uptime_pct, measurement_period, region, downtime_minutes, incidents_count, mttr_minutes, customer_tier, penalty_clause, compliance_status) VALUES
    ('Voice Service', 99.99, 99.97, 'Q1 2024', 'Northeast', 13, 2, 6, 'Enterprise', '0.5% credit per 0.01% below SLA', 'At Risk'),
    ('4G Data', 99.95, 99.98, 'Q1 2024', 'West Coast', 9, 1, 9, 'Enterprise', '1% credit per 0.01% below SLA', 'Compliant'),
    ('5G Data', 99.90, 99.85, 'Q1 2024', 'Southeast', 66, 5, 13, 'Premium', '0.25% credit per 0.01% below SLA', 'Breached'),
    ('SMS Service', 99.99, 99.99, 'Q1 2024', 'Midwest', 4, 1, 4, 'Standard', 'No penalty', 'Compliant'),
    ('VoLTE', 99.95, 99.92, 'Q1 2024', 'Southwest', 35, 3, 12, 'Enterprise', '0.5% credit per 0.01% below SLA', 'Breached'),
    ('International Roaming', 99.50, 99.62, 'Q1 2024', 'Global', 200, 8, 25, 'Premium', '0.1% credit per 0.01% below SLA', 'Compliant'),
    ('Mobile App', 99.90, 99.88, 'Q1 2024', 'All Regions', 53, 4, 13, 'Standard', 'No penalty', 'At Risk'),
    ('WiFi Calling', 99.50, 99.45, 'Q1 2024', 'Northeast', 263, 12, 22, 'Premium', '0.25% credit per 0.01% below SLA', 'Breached'),
    ('Billing System', 99.99, 100.00, 'Q1 2024', 'All Regions', 0, 0, 0, 'Enterprise', '2% credit per 0.01% below SLA', 'Compliant'),
    ('Voice Service', 99.99, 99.95, 'Q1 2024', 'West Coast', 22, 3, 7, 'Enterprise', '0.5% credit per 0.01% below SLA', 'Breached'),
    ('4G Data', 99.95, 99.96, 'Q1 2024', 'Southeast', 18, 2, 9, 'Premium', '0.25% credit per 0.01% below SLA', 'Compliant'),
    ('5G Data', 99.90, 99.91, 'Q1 2024', 'Midwest', 40, 3, 13, 'Enterprise', '1% credit per 0.01% below SLA', 'Compliant'),
    ('SMS Service', 99.99, 99.98, 'Q1 2024', 'Southwest', 9, 2, 5, 'Standard', 'No penalty', 'At Risk'),
    ('Emergency Services', 99.999, 99.998, 'Q1 2024', 'All Regions', 1, 1, 1, 'Critical', '5% credit per incident', 'At Risk'),
    ('VoLTE', 99.95, 99.97, 'Q1 2024', 'Northeast', 13, 1, 13, 'Premium', '0.25% credit per 0.01% below SLA', 'Compliant')
  `);
  console.log('✅ SLA Compliance data seeded (15 records)');

  // Seed Tower Performance (15 records)
  await pool.query(`
    INSERT INTO tower_performance (tower_id, tower_name, location, tower_type, max_capacity, current_load_pct, avg_signal_strength, uptime_pct, maintenance_due, last_maintenance_date, health_score) VALUES
    ('TWR-NE-001', 'Manhattan Central', 'New York, NY', 'Macro', 5000, 87.5, -65, 99.98, false, '2024-02-15', 8),
    ('TWR-WC-002', 'Hollywood Hills', 'Los Angeles, CA', 'Macro', 4500, 92.3, -72, 99.85, true, '2023-11-20', 5),
    ('TWR-SE-003', 'Midtown Atlanta', 'Atlanta, GA', 'Macro', 3800, 45.2, -68, 99.97, false, '2024-01-10', 9),
    ('TWR-MW-004', 'Loop District', 'Chicago, IL', 'Small Cell', 800, 78.9, -58, 99.99, false, '2024-03-01', 7),
    ('TWR-SW-005', 'Desert Ridge', 'Phoenix, AZ', 'Macro', 4200, 34.1, -75, 99.90, false, '2024-02-28', 8),
    ('TWR-NE-006', 'Back Bay', 'Boston, MA', 'Small Cell', 1200, 95.8, -62, 99.70, true, '2023-09-15', 3),
    ('TWR-WC-007', 'Silicon Valley Hub', 'San Jose, CA', 'Macro', 6000, 88.4, -60, 99.95, false, '2024-01-25', 7),
    ('TWR-SE-008', 'Brickell Financial', 'Miami, FL', 'Small Cell', 1500, 67.2, -70, 99.92, false, '2024-02-10', 7),
    ('TWR-MW-009', 'Motor City', 'Detroit, MI', 'Macro', 3500, 28.5, -80, 99.88, true, '2023-10-05', 6),
    ('TWR-NW-010', 'Pioneer Square', 'Seattle, WA', 'Small Cell', 1000, 82.1, -63, 99.96, false, '2024-03-05', 8),
    ('TWR-SC-011', 'River Walk', 'San Antonio, TX', 'Macro', 4000, 55.7, -71, 99.93, false, '2024-01-20', 8),
    ('TWR-NE-012', 'Capitol Hill', 'Washington, DC', 'Macro', 5500, 91.2, -64, 99.80, true, '2023-12-01', 4),
    ('TWR-WC-013', 'Golden Gate', 'San Francisco, CA', 'Small Cell', 1800, 73.6, -66, 99.94, false, '2024-02-20', 7),
    ('TWR-SE-014', 'Music Row', 'Nashville, TN', 'Macro', 3200, 41.3, -69, 99.99, false, '2024-03-10', 9),
    ('TWR-MW-015', 'Mall of America', 'Minneapolis, MN', 'DAS', 8000, 96.7, -55, 99.75, true, '2023-08-20', 4)
  `);
  console.log('✅ Tower Performance data seeded (15 records)');

  // Seed Customer Profiles (15 records)
  await pool.query(`
    INSERT INTO customer_profiles (customer_name, email, phone_number, address, city, state, zip_code, plan_type, account_status, join_date, monthly_bill, preferred_contact) VALUES
    ('James Wilson', 'james.wilson@email.com', '+1-555-0101', '123 Main St', 'New York', 'NY', '10001', 'Premium', 'Active', '2022-03-15', 89.99, 'Email'),
    ('Maria Garcia', 'maria.garcia@email.com', '+1-555-0102', '456 Oak Ave', 'Los Angeles', 'CA', '90001', 'Unlimited', 'Active', '2021-07-22', 75.00, 'Phone'),
    ('Robert Smith', 'robert.smith@email.com', '+1-555-0103', '789 Pine Rd', 'Chicago', 'IL', '60601', 'Standard', 'Active', '2023-01-10', 55.00, 'SMS'),
    ('Jennifer Lee', 'jennifer.lee@email.com', '+1-555-0104', '321 Elm Dr', 'Houston', 'TX', '77001', 'Basic', 'Suspended', '2020-11-05', 35.00, 'Email'),
    ('David Brown', 'david.brown@email.com', '+1-555-0105', '654 Maple Ln', 'Phoenix', 'AZ', '85001', 'Family', 'Active', '2022-09-18', 120.00, 'Phone'),
    ('Lisa Anderson', 'lisa.anderson@email.com', '+1-555-0106', '987 Cedar Ct', 'Philadelphia', 'PA', '19101', 'Premium', 'Active', '2021-04-30', 89.99, 'Email'),
    ('Michael Taylor', 'michael.taylor@email.com', '+1-555-0107', '147 Birch Way', 'San Antonio', 'TX', '78201', 'Unlimited', 'Active', '2023-06-12', 75.00, 'SMS'),
    ('Sarah Martinez', 'sarah.martinez@email.com', '+1-555-0108', '258 Walnut Pl', 'San Diego', 'CA', '92101', 'Standard', 'Cancelled', '2019-08-25', 55.00, 'Phone'),
    ('Christopher Davis', 'chris.davis@email.com', '+1-555-0109', '369 Spruce Ave', 'Dallas', 'TX', '75201', 'Premium', 'Active', '2022-12-01', 89.99, 'Email'),
    ('Amanda White', 'amanda.white@email.com', '+1-555-0110', '741 Ash Blvd', 'San Jose', 'CA', '95101', 'Family', 'Active', '2021-02-14', 120.00, 'Phone'),
    ('Daniel Harris', 'daniel.harris@email.com', '+1-555-0111', '852 Willow St', 'Austin', 'TX', '73301', 'Basic', 'Active', '2023-08-20', 35.00, 'SMS'),
    ('Michelle Clark', 'michelle.clark@email.com', '+1-555-0112', '963 Poplar Dr', 'Jacksonville', 'FL', '32099', 'Unlimited', 'Active', '2022-05-07', 75.00, 'Email'),
    ('Kevin Lewis', 'kevin.lewis@email.com', '+1-555-0113', '159 Hickory Ln', 'Fort Worth', 'TX', '76101', 'Standard', 'Pending', '2024-01-15', 55.00, 'Phone'),
    ('Stephanie Robinson', 'stephanie.r@email.com', '+1-555-0114', '267 Chestnut Rd', 'Columbus', 'OH', '43085', 'Premium', 'Active', '2021-10-30', 89.99, 'Email'),
    ('Brian Walker', 'brian.walker@email.com', '+1-555-0115', '378 Sycamore Ct', 'Charlotte', 'NC', '28201', 'Unlimited', 'Active', '2022-07-19', 75.00, 'SMS')
  `);
  console.log('✅ Customer Profiles data seeded (15 records)');

  // Seed Support Tickets (15 records)
  await pool.query(`
    INSERT INTO support_tickets (ticket_number, customer_name, subject, description, category, priority, status, assigned_agent, channel, resolution_notes) VALUES
    ('TKT-001', 'James Wilson', 'Cannot make calls', 'Customer reports inability to make outgoing calls since yesterday', 'Technical', 'High', 'In Progress', 'Sarah Johnson', 'Phone', NULL),
    ('TKT-002', 'Maria Garcia', 'Billing overcharge', 'Customer charged $45 extra for data that should be included in plan', 'Billing', 'Medium', 'Open', 'Mike Chen', 'Email', NULL),
    ('TKT-003', 'Robert Smith', 'Slow data speeds', 'Data speeds significantly slower than advertised 5G speeds', 'Network', 'High', 'In Progress', 'Sarah Johnson', 'Chat', NULL),
    ('TKT-004', 'Jennifer Lee', 'Account reactivation', 'Customer wants to reactivate suspended account and pay outstanding balance', 'Account', 'Medium', 'Waiting on Customer', 'Mike Chen', 'Phone', NULL),
    ('TKT-005', 'David Brown', 'Add family member', 'Customer wants to add a 4th line to their Family plan', 'Plan Change', 'Low', 'Resolved', 'Sarah Johnson', 'In-Store', 'Added new line, $25/mo additional'),
    ('TKT-006', 'Lisa Anderson', 'International roaming', 'Questions about international roaming charges for trip to Europe', 'General Inquiry', 'Low', 'Closed', 'Mike Chen', 'Email', 'Explained roaming packages and enrolled in travel pass'),
    ('TKT-007', 'Michael Taylor', 'Dropped calls', 'Experiencing frequent dropped calls at home address', 'Technical', 'High', 'In Progress', 'Sarah Johnson', 'Phone', NULL),
    ('TKT-008', 'Sarah Martinez', 'Final bill dispute', 'Cancelled customer disputes charges on final bill', 'Billing', 'Urgent', 'Open', 'Mike Chen', 'Email', NULL),
    ('TKT-009', 'Christopher Davis', 'Upgrade to 5G', 'Customer wants to upgrade device and plan for 5G access', 'Plan Change', 'Medium', 'Resolved', 'Sarah Johnson', 'In-Store', 'Upgraded to Premium 5G plan with new device'),
    ('TKT-010', 'Amanda White', 'WiFi calling setup', 'Need help configuring WiFi calling on new device', 'Technical', 'Low', 'Closed', 'Mike Chen', 'Chat', 'Walked through WiFi calling setup steps'),
    ('TKT-011', 'Daniel Harris', 'Coverage complaint', 'Poor signal coverage in customer residential area', 'Network', 'Medium', 'In Progress', 'Sarah Johnson', 'Phone', NULL),
    ('TKT-012', 'Michelle Clark', 'Payment failed', 'Auto-pay payment failed due to expired credit card', 'Billing', 'High', 'Waiting on Customer', 'Mike Chen', 'Email', NULL),
    ('TKT-013', 'Kevin Lewis', 'New account setup', 'Setting up account after signing up online', 'Account', 'Medium', 'In Progress', 'Sarah Johnson', 'Phone', NULL),
    ('TKT-014', 'Stephanie Robinson', 'Data throttling', 'Customer believes data is being throttled despite unlimited plan', 'Technical', 'Urgent', 'Open', 'Mike Chen', 'Social Media', NULL),
    ('TKT-015', 'Brian Walker', 'Voicemail not working', 'Voicemail stopped working after plan change', 'Technical', 'Medium', 'Resolved', 'Sarah Johnson', 'Chat', 'Reset voicemail settings and reconfigured')
  `);
  console.log('✅ Support Tickets data seeded (15 records)');

  // Seed Payment History (15 records)
  await pool.query(`
    INSERT INTO payment_history (customer_name, account_number, payment_date, amount, payment_method, transaction_id, billing_period, plan_type, payment_status, late_fee, notes) VALUES
    ('James Wilson', 'ACC-10001', '2024-03-01', 89.99, 'Auto-Pay', 'TXN-A1001', 'Mar 2024', 'Premium', 'Completed', 0, NULL),
    ('Maria Garcia', 'ACC-10002', '2024-03-02', 75.00, 'Credit Card', 'TXN-A1002', 'Mar 2024', 'Unlimited', 'Completed', 0, NULL),
    ('Robert Smith', 'ACC-10003', '2024-03-05', 55.00, 'Bank Transfer', 'TXN-A1003', 'Mar 2024', 'Standard', 'Completed', 0, NULL),
    ('Jennifer Lee', 'ACC-10004', '2024-02-15', 35.00, 'Credit Card', 'TXN-A1004', 'Feb 2024', 'Basic', 'Failed', 0, 'Card declined - expired'),
    ('David Brown', 'ACC-10005', '2024-03-01', 120.00, 'Auto-Pay', 'TXN-A1005', 'Mar 2024', 'Family', 'Completed', 0, NULL),
    ('Lisa Anderson', 'ACC-10006', '2024-03-10', 89.99, 'Debit Card', 'TXN-A1006', 'Mar 2024', 'Premium', 'Completed', 5.00, 'Late payment'),
    ('Michael Taylor', 'ACC-10007', '2024-03-01', 75.00, 'Auto-Pay', 'TXN-A1007', 'Mar 2024', 'Unlimited', 'Completed', 0, NULL),
    ('Sarah Martinez', 'ACC-10008', '2024-02-28', 82.50, 'Credit Card', 'TXN-A1008', 'Feb 2024', 'Standard', 'Refunded', 0, 'Account cancelled - prorated refund'),
    ('Christopher Davis', 'ACC-10009', '2024-03-01', 89.99, 'Auto-Pay', 'TXN-A1009', 'Mar 2024', 'Premium', 'Completed', 0, NULL),
    ('Amanda White', 'ACC-10010', '2024-03-03', 120.00, 'Bank Transfer', 'TXN-A1010', 'Mar 2024', 'Family', 'Completed', 0, NULL),
    ('Daniel Harris', 'ACC-10011', '2024-03-15', 35.00, 'Cash', 'TXN-A1011', 'Mar 2024', 'Basic', 'Pending', 0, 'In-store payment processing'),
    ('Michelle Clark', 'ACC-10012', '2024-03-01', 75.00, 'Auto-Pay', 'TXN-A1012', 'Mar 2024', 'Unlimited', 'Completed', 0, NULL),
    ('Kevin Lewis', 'ACC-10013', '2024-03-01', 55.00, 'Credit Card', 'TXN-A1013', 'Mar 2024', 'Standard', 'Completed', 0, 'First payment on new account'),
    ('Stephanie Robinson', 'ACC-10014', '2024-03-01', 89.99, 'Auto-Pay', 'TXN-A1014', 'Mar 2024', 'Premium', 'Completed', 0, NULL),
    ('Brian Walker', 'ACC-10015', '2024-03-04', 75.00, 'Check', 'TXN-A1015', 'Mar 2024', 'Unlimited', 'Completed', 0, NULL)
  `);
  console.log('✅ Payment History data seeded (15 records)');

  // Seed Appointments (15 records)
  await pool.query(`
    INSERT INTO appointments (customer_name, appointment_date, appointment_time, appointment_type, technician_name, location, status, contact_phone, notes, estimated_duration_min) VALUES
    ('James Wilson', '2024-03-20', '09:00', 'Installation', 'Tech Dave', '123 Main St, New York, NY', 'Scheduled', '+1-555-0101', '5G home router installation', 60),
    ('Maria Garcia', '2024-03-18', '14:00', 'Repair', 'Tech Alex', '456 Oak Ave, Los Angeles, CA', 'Completed', '+1-555-0102', 'Signal booster replacement', 45),
    ('Robert Smith', '2024-03-19', '10:30', 'Upgrade', 'Tech Dave', '789 Pine Rd, Chicago, IL', 'In Progress', '+1-555-0103', 'Fiber optic upgrade', 120),
    ('David Brown', '2024-03-21', '11:00', 'Installation', 'Tech Maria', '654 Maple Ln, Phoenix, AZ', 'Scheduled', '+1-555-0105', 'New family plan devices setup', 90),
    ('Lisa Anderson', '2024-03-17', '15:30', 'Maintenance', 'Tech Alex', '987 Cedar Ct, Philadelphia, PA', 'Completed', '+1-555-0106', 'Routine equipment check', 30),
    ('Michael Taylor', '2024-03-22', '08:00', 'Repair', 'Tech Dave', '147 Birch Way, San Antonio, TX', 'Scheduled', '+1-555-0107', 'Dropped call investigation - antenna check', 60),
    ('Amanda White', '2024-03-16', '13:00', 'Inspection', 'Tech Maria', '741 Ash Blvd, San Jose, CA', 'Completed', '+1-555-0110', 'Annual equipment inspection', 45),
    ('Daniel Harris', '2024-03-23', '09:30', 'Installation', 'Tech Alex', '852 Willow St, Austin, TX', 'Scheduled', '+1-555-0111', 'Basic plan device activation', 30),
    ('Michelle Clark', '2024-03-19', '16:00', 'Consultation', 'Tech Dave', '963 Poplar Dr, Jacksonville, FL', 'Cancelled', '+1-555-0112', 'Customer cancelled - rescheduling', 60),
    ('Kevin Lewis', '2024-03-20', '10:00', 'Installation', 'Tech Maria', '159 Hickory Ln, Fort Worth, TX', 'Scheduled', '+1-555-0113', 'New account device setup and activation', 60),
    ('Stephanie Robinson', '2024-03-18', '11:30', 'Repair', 'Tech Alex', '267 Chestnut Rd, Columbus, OH', 'Completed', '+1-555-0114', 'WiFi calling not working - router reset', 45),
    ('Brian Walker', '2024-03-24', '14:00', 'Upgrade', 'Tech Dave', '378 Sycamore Ct, Charlotte, NC', 'Scheduled', '+1-555-0115', '4G to 5G equipment swap', 90),
    ('Jennifer Lee', '2024-03-25', '09:00', 'Consultation', 'Tech Maria', '321 Elm Dr, Houston, TX', 'Scheduled', '+1-555-0104', 'Account reactivation and plan review', 30),
    ('Christopher Davis', '2024-03-15', '12:00', 'Maintenance', 'Tech Alex', '369 Spruce Ave, Dallas, TX', 'Completed', '+1-555-0109', 'Equipment firmware update', 30),
    ('Sarah Martinez', '2024-03-19', '10:00', 'Inspection', 'Tech Dave', '258 Walnut Pl, San Diego, CA', 'Rescheduled', '+1-555-0108', 'Final equipment collection - account closed', 30)
  `);
  console.log('✅ Appointments data seeded (15 records)');

  // Seed Usage Tracking (15 records)
  await pool.query(`
    INSERT INTO usage_tracking (customer_name, usage_date, data_used_gb, data_limit_gb, call_minutes_used, call_minutes_limit, sms_sent, sms_limit, roaming_data_mb, hotspot_usage_gb, plan_type) VALUES
    ('James Wilson', '2024-03-15', 45.2, 100, 320, 999, 85, 999, 0, 5.3, 'Premium'),
    ('Maria Garcia', '2024-03-15', 82.1, 999, 450, 999, 120, 999, 250, 12.4, 'Unlimited'),
    ('Robert Smith', '2024-03-15', 18.5, 30, 180, 500, 45, 500, 0, 2.1, 'Standard'),
    ('Jennifer Lee', '2024-03-15', 4.8, 10, 95, 300, 22, 300, 0, 0, 'Basic'),
    ('David Brown', '2024-03-15', 65.3, 150, 890, 999, 340, 999, 0, 8.7, 'Family'),
    ('Lisa Anderson', '2024-03-15', 52.7, 100, 210, 999, 65, 999, 120, 6.2, 'Premium'),
    ('Michael Taylor', '2024-03-15', 95.4, 999, 560, 999, 200, 999, 0, 15.8, 'Unlimited'),
    ('Sarah Martinez', '2024-03-15', 22.1, 30, 240, 500, 78, 500, 0, 3.5, 'Standard'),
    ('Christopher Davis', '2024-03-15', 38.9, 100, 155, 999, 42, 999, 85, 4.1, 'Premium'),
    ('Amanda White', '2024-03-15', 78.6, 150, 720, 999, 280, 999, 0, 10.2, 'Family'),
    ('Daniel Harris', '2024-03-15', 8.2, 10, 145, 300, 55, 300, 0, 0, 'Basic'),
    ('Michelle Clark', '2024-03-15', 67.3, 999, 380, 999, 150, 999, 500, 9.8, 'Unlimited'),
    ('Kevin Lewis', '2024-03-15', 15.4, 30, 200, 500, 60, 500, 0, 1.8, 'Standard'),
    ('Stephanie Robinson', '2024-03-15', 48.1, 100, 290, 999, 95, 999, 45, 5.5, 'Premium'),
    ('Brian Walker', '2024-03-15', 88.9, 999, 410, 999, 175, 999, 180, 14.2, 'Unlimited')
  `);
  console.log('✅ Usage Tracking data seeded (15 records)');

  console.log('\n🎉 Database seeded successfully!');
  console.log('📧 Login credentials:');
  console.log('   Email: admin@telecom.com');
  console.log('   Password: admin123');

  await pool.end();
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
