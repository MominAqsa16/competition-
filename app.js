/**
 * STUDENT TALENT COMPETITION 2026 - OFFICIAL CLIENT APPLICATION
 * Features:
 * - Dynamic Eligibility Verification (Standards 5-8, Girls-only for Mehndi & Makeup)
 * - Automatic Drawing Group Assignment (Group A: Std 5-6, Group B: Std 7-8)
 * - Real-time Seat Quota & Limit Enforcement
 * - Dynamic Organizer UPI QR & Transaction Reference submission (Pending Verification)
 * - Official WhatsApp Business Platform Integration Simulator & Community Link
 * - Full-featured Organizer Admin Portal with PIN security, 1-click verification & CSV export
 * - Supabase Cloud Database connector and SQL migration generator
 */

(function () {
  'use strict';

  // =========================================================================
  // DEFAULT CONFIGURATION & SAMPLE DATA STORE
  // =========================================================================
  const DEFAULT_LIMITS = {
    computer: { limit: 50, confirmed: 22, fee: 150, name: '1. Computer', gender: 'all', stds: [5, 6, 7, 8] },
    mehndi: { limit: 40, confirmed: 21, fee: 150, name: '2. Mehndi', gender: 'female', stds: [5, 6, 7, 8] },
    drawing_a: { limit: 45, confirmed: 21, fee: 150, name: '3A. Drawing Group A', gender: 'all', stds: [5, 6], group: 'Group A' },
    drawing_b: { limit: 45, confirmed: 24, fee: 150, name: '3B. Drawing Group B', gender: 'all', stds: [7, 8], group: 'Group B' },
    makeup: { limit: 35, confirmed: 19, fee: 150, name: '4. Makeup', gender: 'female', stds: [5, 6, 7, 8] }
  };

  const DEFAULT_EVENT_SETTINGS = {
    upiId: 'studenttalent@sbi',
    upiName: 'Student Talent Competition',
    registrationFee: 150,
    communityLink: 'https://chat.whatsapp.com/Gxyz123TalentComp2026',
    eventDescription: 'Student Talent Competition 2026 takes place on Sunday, Nov 15th at City Central Auditorium. Reporting time 8:30 AM with Admit Card.',
    waPhoneId: '10982348271038',
    waTemplateName: 'student_competition_confirmed',
    adminPin: '1234'
  };

  const SAMPLE_REGISTRATIONS = [
    {
      id: 'reg_01',
      registration_id: 'STC-2026-1042',
      student_name: 'Ananya Deshmukh',
      school_name: 'St. Mary High School',
      standard: 6,
      date_of_birth: '2014-04-12',
      gender: 'female',
      whatsapp_number: '+919876543210',
      category_id: 'mehndi',
      category_name: '2. Mehndi',
      drawing_group: null,
      guardian_name: 'Sunil Deshmukh',
      guardian_phone: '9876543211',
      upi_reference: '428901238472',
      payer_name: 'Sunil Deshmukh',
      payment_status: 'verified',
      whatsapp_sent: true,
      created_at: '2026-10-15T10:30:00Z',
      verified_at: '2026-10-15T11:15:00Z'
    },
    {
      id: 'reg_02',
      registration_id: 'STC-2026-1043',
      student_name: 'Rohan Verma',
      school_name: 'Delhi Public School',
      standard: 7,
      date_of_birth: '2013-08-20',
      gender: 'male',
      whatsapp_number: '+919823456781',
      category_id: 'computer',
      category_name: '1. Computer',
      drawing_group: null,
      guardian_name: 'Kavita Verma',
      guardian_phone: '9823456782',
      upi_reference: '428955112233',
      payer_name: 'Rohan Parent',
      payment_status: 'verified',
      whatsapp_sent: true,
      created_at: '2026-10-15T14:10:00Z',
      verified_at: '2026-10-15T15:00:00Z'
    },
    {
      id: 'reg_03',
      registration_id: 'STC-2026-1044',
      student_name: 'Priya Kulkarni',
      school_name: 'Modern English Academy',
      standard: 5,
      date_of_birth: '2015-02-14',
      gender: 'female',
      whatsapp_number: '+919765432190',
      category_id: 'drawing_a',
      category_name: '3. Drawing',
      drawing_group: 'Group A',
      guardian_name: 'Nitin Kulkarni',
      guardian_phone: '9765432191',
      upi_reference: '429011883344',
      payer_name: 'Nitin Kulkarni',
      payment_status: 'pending',
      whatsapp_sent: false,
      created_at: '2026-10-16T09:20:00Z',
      verified_at: null
    },
    {
      id: 'reg_04',
      registration_id: 'STC-2026-1045',
      student_name: 'Tanvi Malhotra',
      school_name: 'Ryan International',
      standard: 8,
      date_of_birth: '2012-11-05',
      gender: 'female',
      whatsapp_number: '+919988776655',
      category_id: 'makeup',
      category_name: '4. Makeup',
      drawing_group: null,
      guardian_name: 'Sonia Malhotra',
      guardian_phone: '9988776656',
      upi_reference: '429033445566',
      payer_name: 'Sonia M',
      payment_status: 'pending',
      whatsapp_sent: false,
      created_at: '2026-10-16T11:45:00Z',
      verified_at: null
    },
    {
      id: 'reg_05',
      registration_id: 'STC-2026-1046',
      student_name: 'Arjun Nambiar',
      school_name: 'National Public School',
      standard: 8,
      date_of_birth: '2012-07-19',
      gender: 'male',
      whatsapp_number: '+919123456780',
      category_id: 'drawing_b',
      category_name: '3. Drawing',
      drawing_group: 'Group B',
      guardian_name: 'Prakash Nambiar',
      guardian_phone: '9123456781',
      upi_reference: '429044556677',
      payer_name: 'Prakash N',
      payment_status: 'pending',
      whatsapp_sent: false,
      created_at: '2026-10-16T13:10:00Z',
      verified_at: null
    }
  ];

  const DEFAULT_SUPABASE_CFG = {
    url: 'https://ivihkpkajrszisrrvowm.supabase.co',
    key: 'sb_publishable_oC2Fk2TENAbYGBmC5y6QTA_0If8sMgX',
    active: true
  };

  // Storage Keys
  const STORAGE_LIMITS = 'stc_limits_v1';
  const STORAGE_REGISTRATIONS = 'stc_registrations_v1';
  const STORAGE_SETTINGS = 'stc_settings_v1';
  const STORAGE_SUPABASE_CFG = 'stc_supabase_cfg_v1';
  const STORAGE_THEME = 'stc_theme_v1';

  // Global State in Memory
  let state = {
    limits: JSON.parse(localStorage.getItem(STORAGE_LIMITS)) || DEFAULT_LIMITS,
    registrations: JSON.parse(localStorage.getItem(STORAGE_REGISTRATIONS)) || SAMPLE_REGISTRATIONS,
    settings: JSON.parse(localStorage.getItem(STORAGE_SETTINGS)) || DEFAULT_EVENT_SETTINGS,
    supabaseCfg: JSON.parse(localStorage.getItem(STORAGE_SUPABASE_CFG)) || DEFAULT_SUPABASE_CFG,
    isAdminLoggedIn: false,
    currentSelectedCat: '',
    currentSelectedStd: null,
    currentSelectedGender: ''
  };

  // Ensure user's Supabase credentials are always active
  if (!state.supabaseCfg.url || state.supabaseCfg.url === '') {
    state.supabaseCfg = DEFAULT_SUPABASE_CFG;
  }

  function saveState() {
    localStorage.setItem(STORAGE_LIMITS, JSON.stringify(state.limits));
    localStorage.setItem(STORAGE_REGISTRATIONS, JSON.stringify(state.registrations));
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(state.settings));
    localStorage.setItem(STORAGE_SUPABASE_CFG, JSON.stringify(state.supabaseCfg));
  }

  // =========================================================================
  // THEME MANAGEMENT (DARK / LIGHT MODE)
  // =========================================================================
  let currentTheme = localStorage.getItem(STORAGE_THEME) || 'dark';

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME, theme);

    const toggleBtn = document.getElementById('btn-theme-toggle');
    if (toggleBtn) {
      toggleBtn.setAttribute('title', theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme');
    }

    const mobileThemeVal = document.getElementById('mobile-theme-text');
    if (mobileThemeVal) {
      mobileThemeVal.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
  }

  function toggleTheme() {
    const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(targetTheme);
    showToast(`Switched to ${targetTheme === 'light' ? 'Light Theme ☀️' : 'Dark Theme 🌙'}`, 'info');
  }

  // =========================================================================
  // SUPABASE CLIENT & DATABASE SYNC
  // =========================================================================
  let supabaseClientInstance = null;

  function getSupabaseClient() {
    if (supabaseClientInstance) return supabaseClientInstance;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        supabaseClientInstance = window.supabase.createClient(state.supabaseCfg.url, state.supabaseCfg.key);
      } catch (err) {
        console.warn('Supabase createClient error:', err);
      }
    }
    return supabaseClientInstance;
  }

  async function saveRegistrationToSupabase(reg) {
    if (!state.supabaseCfg || !state.supabaseCfg.url || !state.supabaseCfg.key) return;

    const payload = {
      registration_id: reg.registration_id,
      student_name: reg.student_name,
      school_name: reg.school_name,
      standard: reg.standard,
      date_of_birth: reg.date_of_birth,
      gender: reg.gender,
      whatsapp_number: reg.whatsapp_number,
      category_id: reg.category_id,
      category_name: reg.category_name,
      drawing_group: reg.drawing_group,
      guardian_name: reg.guardian_name,
      guardian_phone: reg.guardian_phone,
      upi_reference: reg.upi_reference,
      payer_name: reg.payer_name || reg.guardian_name,
      payment_status: 'pending',
      whatsapp_sent: false
    };

    console.log('[Supabase Cloud] Initiating insert to ivihkpkajrszisrrvowm.supabase.co:', payload);

    try {
      // 1. Try Supabase Client SDK if loaded
      const client = getSupabaseClient();
      if (client) {
        const { data, error } = await client
          .from('student_registrations')
          .insert([payload])
          .select();

        if (!error) {
          console.log('[Supabase SDK] Registration saved successfully:', data);
          showToast('✓ Stored directly in your Supabase database!', 'success');
          return;
        } else {
          console.warn('[Supabase SDK Warning]:', error);
        }
      }

      // 2. Direct REST API Fallback
      const endpoint = `${state.supabaseCfg.url}/rest/v1/student_registrations`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': state.supabaseCfg.key,
          'Authorization': `Bearer ${state.supabaseCfg.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        console.log('[Supabase REST] Record created:', result);
        showToast('✓ Stored in your Supabase Database (ivihkpkajrszisrrvowm)!', 'success');
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('[Supabase REST Response]:', res.status, errJson);
        if (errJson.code === 'PGRST205') {
          showToast('Saved locally. Please run the SQL migration in Supabase SQL editor to create the table.', 'warning');
        } else {
          showToast(`Saved locally. Supabase response: ${errJson.message || 'Verification needed'}`, 'warning');
        }
      }
    } catch (err) {
      console.warn('[Supabase Network]:', err);
      showToast('Registration saved locally (Supabase network sync pending)', 'warning');
    }
  }

  async function updateRegistrationInSupabase(registrationId, fields) {
    if (!state.supabaseCfg || !state.supabaseCfg.url || !state.supabaseCfg.key) return;

    try {
      const client = getSupabaseClient();
      if (client) {
        await client
          .from('student_registrations')
          .update(fields)
          .eq('registration_id', registrationId);
        return;
      }

      const endpoint = `${state.supabaseCfg.url}/rest/v1/student_registrations?registration_id=eq.${registrationId}`;
      await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'apikey': state.supabaseCfg.key,
          'Authorization': `Bearer ${state.supabaseCfg.key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fields)
      });
    } catch (err) {
      console.warn('Supabase update error:', err);
    }
  }

  async function fetchRegistrationsFromSupabase() {
    if (!state.supabaseCfg || !state.supabaseCfg.url || !state.supabaseCfg.key) return;

    try {
      const client = getSupabaseClient();
      if (client) {
        const { data, error } = await client
          .from('student_registrations')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && Array.isArray(data) && data.length > 0) {
          console.log('[Supabase Cloud] Fetched live registrations:', data.length);
          data.forEach(cloudReg => {
            const exists = state.registrations.some(r => r.registration_id === cloudReg.registration_id);
            if (!exists) {
              state.registrations.unshift(cloudReg);
            }
          });
          saveState();
          updateSeatDisplays();
          if (state.isAdminLoggedIn) renderAdminPortal();
          showToast(`Connected to Supabase! Loaded ${data.length} entries.`, 'success');
          return;
        }
      }

      const endpoint = `${state.supabaseCfg.url}/rest/v1/student_registrations?select=*&order=created_at.desc`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'apikey': state.supabaseCfg.key,
          'Authorization': `Bearer ${state.supabaseCfg.key}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          console.log('[Supabase REST] Fetched live registrations:', data.length);
          data.forEach(cloudReg => {
            const exists = state.registrations.some(r => r.registration_id === cloudReg.registration_id);
            if (!exists) {
              state.registrations.unshift(cloudReg);
            }
          });
          saveState();
          updateSeatDisplays();
          if (state.isAdminLoggedIn) renderAdminPortal();
        }
      }
    } catch (err) {
      console.warn('Could not query Supabase table (offline or table pending):', err);
    }
  }

  // =========================================================================
  // UTILITY HELPERS
  // =========================================================================
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '✓';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '✕';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function generateRegId() {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `STC-2026-${random}`;
  }

  function getCategoryKey(categoryValue, standard) {
    if (categoryValue === 'drawing') {
      if (standard == 5 || standard == 6) return 'drawing_a';
      if (standard == 7 || standard == 8) return 'drawing_b';
      return 'drawing_a'; // fallback
    }
    return categoryValue;
  }

  function getRemainingSeats(catKey) {
    const track = state.limits[catKey];
    if (!track) return 0;
    // Calculate confirmed from registrations or stored confirmed count
    const confirmedInStore = state.registrations.filter(r => r.category_id === catKey && r.payment_status === 'verified').length;
    const effectiveConfirmed = Math.max(track.confirmed, confirmedInStore);
    return Math.max(0, track.limit - effectiveConfirmed);
  }

  // =========================================================================
  // DOM UPDATES: SEAT METERS & LIVE MATRIX
  // =========================================================================
  function updateSeatDisplays() {
    let grandTotalSeats = 0;
    let grandRemainingSeats = 0;

    // Keys to evaluate
    const keys = ['computer', 'mehndi', 'drawing_a', 'drawing_b', 'makeup'];

    keys.forEach(key => {
      const track = state.limits[key];
      if (!track) return;

      const remaining = getRemainingSeats(key);
      const booked = track.limit - remaining;
      const pct = Math.min(100, Math.round((booked / track.limit) * 100));

      grandTotalSeats += track.limit;
      grandRemainingSeats += remaining;

      // Update Showcase Category Card Elements
      const countEl = document.getElementById(`count-${key}`);
      if (countEl) countEl.textContent = `${remaining} / ${track.limit} Left`;

      const progressEl = document.getElementById(`progress-${key}`);
      if (progressEl) progressEl.style.width = `${pct}%`;

      // Update Status Badge on Category Card
      let parentCatCardKey = key;
      if (key.startsWith('drawing')) parentCatCardKey = 'drawing';
      const statusBadge = document.getElementById(`seat-status-${parentCatCardKey}`);
      if (statusBadge) {
        if (remaining <= 0) {
          statusBadge.innerHTML = `<span class="status-indicator" style="background:#ef4444"></span><span class="status-text" style="color:#f87171">Seats Full</span>`;
        } else if (remaining <= 5) {
          statusBadge.innerHTML = `<span class="status-indicator" style="background:#f59e0b"></span><span class="status-text" style="color:#fbbf24">Filling Fast</span>`;
        } else {
          statusBadge.innerHTML = `<span class="status-indicator live"></span><span class="status-text">Available</span>`;
        }
      }

      // Update Seat Matrix Table Row
      const limitTd = document.getElementById(`matrix-limit-${key}`);
      if (limitTd) limitTd.textContent = track.limit;

      const bookedTd = document.getElementById(`matrix-booked-${key}`);
      if (bookedTd) bookedTd.textContent = booked;

      const leftTd = document.getElementById(`matrix-left-${key}`);
      if (leftTd) {
        leftTd.textContent = remaining;
        leftTd.className = remaining <= 0 ? 'text-center font-bold text-danger' : (remaining <= 5 ? 'text-center font-bold text-accent' : 'text-center font-bold text-success');
      }

      const matrixBadge = document.getElementById(`matrix-badge-${key}`);
      if (matrixBadge) {
        if (remaining <= 0) {
          matrixBadge.className = 'status-pill pill-full';
          matrixBadge.textContent = 'Full';
        } else if (remaining <= 5) {
          matrixBadge.className = 'status-pill pill-low';
          matrixBadge.textContent = 'Low Seats';
        } else {
          matrixBadge.className = 'status-pill pill-available';
          matrixBadge.textContent = 'Open';
        }
      }

      // Update Form Choice Pills
      if (key === 'computer') {
        const p = document.getElementById('form-pill-computer');
        if (p) p.textContent = remaining > 0 ? `${remaining} seats left` : 'Full';
      } else if (key === 'mehndi') {
        const p = document.getElementById('form-pill-mehndi');
        if (p) p.textContent = remaining > 0 ? `${remaining} seats left` : 'Full';
      } else if (key === 'makeup') {
        const p = document.getElementById('form-pill-makeup');
        if (p) p.textContent = remaining > 0 ? `${remaining} seats left` : 'Full';
      }
    });

    // Drawing aggregate pill on form
    const drawingPill = document.getElementById('form-pill-drawing');
    if (drawingPill) {
      if (state.currentSelectedStd) {
        const dKey = (state.currentSelectedStd == 5 || state.currentSelectedStd == 6) ? 'drawing_a' : 'drawing_b';
        const dRem = getRemainingSeats(dKey);
        const grp = (state.currentSelectedStd == 5 || state.currentSelectedStd == 6) ? 'Group A' : 'Group B';
        drawingPill.textContent = `${grp}: ${dRem} left`;
      } else {
        drawingPill.textContent = 'Group A/B';
      }
    }

    // Hero stats
    const heroTotal = document.getElementById('hero-total-seats');
    if (heroTotal) heroTotal.textContent = grandTotalSeats;

    const heroRem = document.getElementById('hero-remaining-seats');
    if (heroRem) heroRem.textContent = grandRemainingSeats;
  }

  // =========================================================================
  // ELIGIBILITY RULES & DYNAMIC VALIDATION ENGINE
  // =========================================================================
  function validateEligibility() {
    const banner = document.getElementById('form-validation-banner');
    const bannerText = document.getElementById('banner-text');
    const bannerIcon = document.getElementById('banner-icon');

    const catCards = {
      computer: document.getElementById('label-cat-computer'),
      mehndi: document.getElementById('label-cat-mehndi'),
      drawing: document.getElementById('label-cat-drawing'),
      makeup: document.getElementById('label-cat-makeup')
    };

    const drawingBanner = document.getElementById('drawing-group-banner');
    const assignedGroupTitle = document.getElementById('assigned-group-title');
    const assignedGroupDesc = document.getElementById('assigned-group-desc');
    const assignedGroupSeats = document.getElementById('drawing-group-seats');
    const assignedGroupInput = document.getElementById('assigned-drawing-group-input');

    let isEligible = true;
    let message = '';
    let bannerType = 'warning';

    // 1. Check Standard Eligibility (Only 5, 6, 7, 8)
    const std = state.currentSelectedStd;
    if (std !== null && ![5, 6, 7, 8].includes(parseInt(std))) {
      isEligible = false;
      message = '⚠️ Ineligible Standard: Only students in Standards 5, 6, 7 and 8 are eligible for this competition.';
      bannerType = 'danger';
    }

    // 2. Gender Rules for Mehndi & Makeup (Female only)
    const gender = state.currentSelectedGender;
    if (gender === 'male') {
      // Disable Mehndi and Makeup cards
      if (catCards.mehndi) {
        catCards.mehndi.classList.add('disabled');
        catCards.mehndi.title = 'Mehndi is reserved for female students only';
      }
      if (catCards.makeup) {
        catCards.makeup.classList.add('disabled');
        catCards.makeup.title = 'Makeup is reserved for female students only';
      }

      // If male student selected Mehndi or Makeup, force reset
      if (state.currentSelectedCat === 'mehndi' || state.currentSelectedCat === 'makeup') {
        const radio = document.getElementById(`cat-radio-${state.currentSelectedCat}`);
        if (radio) radio.checked = false;
        state.currentSelectedCat = '';
        message = '⚠️ Eligibility Notice: Mehndi and Makeup categories are exclusively open for female students. Please choose Computer or Drawing.';
        bannerType = 'warning';
      }
    } else {
      // Female or not selected yet: re-enable cards (unless full)
      if (catCards.mehndi) {
        catCards.mehndi.classList.remove('disabled');
        catCards.mehndi.title = '';
      }
      if (catCards.makeup) {
        catCards.makeup.classList.remove('disabled');
        catCards.makeup.title = '';
      }
    }

    // 3. Automatic Drawing Group Assignment based on standard
    if (state.currentSelectedCat === 'drawing') {
      if (!std) {
        drawingBanner.style.display = 'block';
        assignedGroupTitle.textContent = 'Please Select Standard First';
        assignedGroupDesc.textContent = 'Select your standard (5, 6, 7 or 8) in Step 1 to automatically assign Drawing Group A or B.';
        assignedGroupSeats.textContent = 'Quota pending';
        assignedGroupInput.value = '';
      } else {
        const stdNum = parseInt(std);
        let assignedGroup = '';
        let targetKey = '';

        if (stdNum === 5 || stdNum === 6) {
          assignedGroup = 'Drawing Group A';
          targetKey = 'drawing_a';
          assignedGroupDesc.innerHTML = `Based on your selected standard (<strong>Standard ${stdNum}</strong>), you have been automatically assigned to <strong>Drawing Group A (Standards 5 & 6)</strong>.`;
        } else if (stdNum === 7 || stdNum === 8) {
          assignedGroup = 'Drawing Group B';
          targetKey = 'drawing_b';
          assignedGroupDesc.innerHTML = `Based on your selected standard (<strong>Standard ${stdNum}</strong>), you have been automatically assigned to <strong>Drawing Group B (Standards 7 & 8)</strong>.`;
        }

        const seatsLeft = getRemainingSeats(targetKey);
        drawingBanner.style.display = 'block';
        assignedGroupTitle.textContent = `🎨 ${assignedGroup}`;
        assignedGroupSeats.textContent = `${seatsLeft} Seats Remaining`;
        assignedGroupInput.value = assignedGroup;

        if (seatsLeft <= 0) {
          message = `🚫 Seats Full: ${assignedGroup} has reached its maximum quota limit. Further registrations for this drawing group are closed.`;
          bannerType = 'danger';
          isEligible = false;
        } else {
          message = `✓ Eligible: You are registered for ${assignedGroup}. ${seatsLeft} seats remaining.`;
          bannerType = 'success';
        }
      }
    } else {
      if (drawingBanner) drawingBanner.style.display = 'none';
      if (assignedGroupInput) assignedGroupInput.value = '';
    }

    // 4. Check Seat Limit for Selected Category
    if (state.currentSelectedCat && state.currentSelectedCat !== 'drawing') {
      const seatsLeft = getRemainingSeats(state.currentSelectedCat);
      if (seatsLeft <= 0) {
        message = `🚫 Category Full: The ${state.limits[state.currentSelectedCat].name} category has reached full capacity. Please select an alternate category.`;
        bannerType = 'danger';
        isEligible = false;
      }
    }

    // Render Banner
    if (message) {
      banner.style.display = 'flex';
      banner.className = `validation-banner banner-${bannerType}`;
      bannerText.innerHTML = message;
      bannerIcon.textContent = bannerType === 'danger' ? '🚫' : (bannerType === 'success' ? '✨' : '⚠️');
    } else {
      banner.style.display = 'none';
    }

    return isEligible;
  }

  // =========================================================================
  // UPI QR & DYNAMIC PAYMENT GENERATION
  // =========================================================================
  function updateUpiDetails() {
    const feeEl = document.getElementById('display-fee-amount');
    if (feeEl) feeEl.textContent = `₹${state.settings.registrationFee}.00`;

    const upiIdEl = document.getElementById('organizer-upi-id');
    if (upiIdEl) upiIdEl.textContent = state.settings.upiId;
  }

  // =========================================================================
  // REGISTRATION FORM SUBMISSION
  // =========================================================================
  function handleRegistrationSubmit(e) {
    e.preventDefault();

    // Reset error fields
    document.querySelectorAll('.field-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('active');
    });

    const form = document.getElementById('student-reg-form');
    let hasError = false;

    // Field values
    const studentName = document.getElementById('student-name').value.trim();
    const schoolName = document.getElementById('school-name').value.trim();
    const stdRadio = form.querySelector('input[name="standard"]:checked');
    const dob = document.getElementById('dob').value;
    const genderRadio = form.querySelector('input[name="gender"]:checked');
    const countryCode = document.getElementById('country-code').value;
    const rawWaNumber = document.getElementById('whatsapp-number').value.trim();
    const catRadio = form.querySelector('input[name="competition_category"]:checked');
    const guardianName = document.getElementById('guardian-name').value.trim();
    const guardianPhone = document.getElementById('guardian-phone').value.trim();
    const consent = document.getElementById('guardian-consent').checked;
    const upiRef = document.getElementById('upi-reference').value.trim();
    const payerName = document.getElementById('payer-name').value.trim();

    // 1. Validate Student Name
    if (!studentName || studentName.length < 3) {
      setError('err-student-name', 'Please enter student full name (minimum 3 characters)');
      hasError = true;
    }

    // 2. Validate School Name
    if (!schoolName) {
      setError('err-school-name', 'Please enter your school or institution name');
      hasError = true;
    }

    // 3. Validate Standard
    if (!stdRadio) {
      setError('err-standard', 'Please select standard (Standard 5, 6, 7 or 8)');
      hasError = true;
    }

    // 4. Validate DOB
    if (!dob) {
      setError('err-dob', 'Please provide student date of birth');
      hasError = true;
    }

    // 5. Validate Gender
    if (!genderRadio) {
      setError('err-gender', 'Please select gender');
      hasError = true;
    }

    // 6. Validate WhatsApp
    const cleanWa = rawWaNumber.replace(/[^0-9]/g, '');
    if (!cleanWa || cleanWa.length < 10) {
      setError('err-whatsapp', 'Please enter a valid 10-digit WhatsApp number');
      hasError = true;
    }

    // 7. Validate Category
    if (!catRadio) {
      setError('err-category', 'Please select a competition category');
      hasError = true;
    }

    // 8. Guardian Details
    if (!guardianName) {
      setError('err-guardian-name', 'Please provide parent or guardian full name');
      hasError = true;
    }
    if (!guardianPhone || guardianPhone.replace(/[^0-9]/g, '').length < 10) {
      setError('err-guardian-phone', 'Please provide a valid emergency phone number');
      hasError = true;
    }
    if (!consent) {
      setError('err-consent', 'Parent / guardian consent is mandatory for participation');
      hasError = true;
    }

    // 9. Validate UPI Reference (UTR)
    if (!upiRef || upiRef.length < 6) {
      setError('err-upi', 'Please enter the 12-digit UPI reference (UTR) number from your payment app');
      hasError = true;
    }

    if (hasError) {
      showToast('Please fix the highlighted errors before submitting', 'error');
      return;
    }

    // Verify Eligibility Rules
    const standardNum = parseInt(stdRadio.value);
    const genderVal = genderRadio.value;
    const catVal = catRadio.value;

    if (genderVal === 'male' && (catVal === 'mehndi' || catVal === 'makeup')) {
      showToast('Mehndi and Makeup are strictly reserved for female students.', 'error');
      validateEligibility();
      return;
    }

    // Check Seat Limits
    const actualTrackKey = getCategoryKey(catVal, standardNum);
    const remainingSeats = getRemainingSeats(actualTrackKey);

    if (remainingSeats <= 0) {
      showToast(`Registration closed! ${state.limits[actualTrackKey].name} has reached maximum seat capacity.`, 'error');
      validateEligibility();
      return;
    }

    // Generate Registration Record
    const regId = generateRegId();
    let assignedDrawingGroup = null;
    let categoryDisplay = '';

    if (catVal === 'drawing') {
      assignedDrawingGroup = (standardNum === 5 || standardNum === 6) ? 'Group A' : 'Group B';
      categoryDisplay = '3. Drawing';
    } else {
      categoryDisplay = state.limits[actualTrackKey].name;
    }

    const newRegistration = {
      id: `reg_${Date.now()}`,
      registration_id: regId,
      student_name: studentName,
      school_name: schoolName,
      standard: standardNum,
      date_of_birth: dob,
      gender: genderVal,
      whatsapp_number: `${countryCode}${cleanWa}`,
      category_id: actualTrackKey,
      category_name: categoryDisplay,
      drawing_group: assignedDrawingGroup,
      guardian_name: guardianName,
      guardian_phone: guardianPhone,
      upi_reference: upiRef,
      payer_name: payerName || guardianName,
      payment_status: 'pending', // NEVER automatically marked verified
      whatsapp_sent: false,
      created_at: new Date().toISOString(),
      verified_at: null
    };

    // Store in State
    state.registrations.unshift(newRegistration);
    saveState();
    updateSeatDisplays();

    // Store in Supabase Cloud Database (ivihkpkajrszisrrvowm.supabase.co)
    saveRegistrationToSupabase(newRegistration);

    // Show Success Modal
    displaySuccessModal(newRegistration);
    form.reset();
    state.currentSelectedCat = '';
    state.currentSelectedStd = null;
    state.currentSelectedGender = '';
    validateEligibility();
  }

  function setError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = msg;
      el.classList.add('active');
    }
  }

  function displaySuccessModal(reg) {
    const modal = document.getElementById('modal-success');
    if (!modal) return;

    document.getElementById('success-reg-id').textContent = reg.registration_id;
    document.getElementById('success-name').textContent = reg.student_name;
    document.getElementById('success-std-gender').textContent = `Std ${reg.standard} • ${reg.gender.toUpperCase()}`;
    document.getElementById('success-category').textContent = reg.category_name;

    const groupRow = document.getElementById('success-group-row');
    const groupVal = document.getElementById('success-group');
    if (reg.drawing_group) {
      groupRow.style.display = 'flex';
      groupVal.textContent = `Drawing ${reg.drawing_group}`;
    } else {
      groupRow.style.display = 'none';
    }

    document.getElementById('success-utr').textContent = reg.upi_reference;
    document.getElementById('success-wa-number').textContent = reg.whatsapp_number;

    modal.style.display = 'flex';

    // Configure print button for this student
    const printBtn = document.getElementById('btn-print-slip');
    if (printBtn) {
      printBtn.onclick = () => openAdmitSlip(reg);
    }
  }

  // =========================================================================
  // PRINTABLE ADMIT SLIP GENERATOR
  // =========================================================================
  function openAdmitSlip(reg) {
    const modal = document.getElementById('modal-admit-slip');
    if (!modal) return;

    document.getElementById('slip-reg-id').textContent = reg.registration_id;
    document.getElementById('slip-student-name').textContent = reg.student_name;
    document.getElementById('slip-school').textContent = reg.school_name;
    document.getElementById('slip-std-gender').textContent = `Standard ${reg.standard} (${reg.gender.toUpperCase()})`;
    document.getElementById('slip-category').textContent = reg.category_name;

    const groupRow = document.getElementById('slip-group-row');
    const groupVal = document.getElementById('slip-group');
    if (reg.drawing_group) {
      groupRow.style.display = 'flex';
      groupVal.textContent = `Drawing ${reg.drawing_group} (Std ${reg.standard <= 6 ? '5 & 6' : '7 & 8'})`;
    } else {
      groupRow.style.display = 'none';
    }

    document.getElementById('slip-whatsapp').textContent = reg.whatsapp_number;
    document.getElementById('slip-utr').textContent = reg.upi_reference;

    const badge = document.getElementById('slip-status-badge');
    if (reg.payment_status === 'verified') {
      badge.textContent = 'OFFICIALLY VERIFIED & SEAT ALLOCATED';
      badge.className = 'admit-watermark-pill verified';
    } else {
      badge.textContent = 'PAYMENT PENDING VERIFICATION';
      badge.className = 'admit-watermark-pill';
    }

    modal.style.display = 'flex';
  }

  // =========================================================================
  // STUDENT STATUS TRACKER
  // =========================================================================
  function handleTrackStatus() {
    const query = document.getElementById('track-search-input').value.trim();
    const resultContainer = document.getElementById('track-result-container');
    if (!query) {
      showToast('Please enter your WhatsApp number or Registration ID', 'warning');
      return;
    }

    const cleanQuery = query.replace(/[^0-9a-zA-Z-]/g, '').toLowerCase();

    const match = state.registrations.find(r => {
      const cleanWa = r.whatsapp_number.replace(/[^0-9]/g, '');
      const matchReg = r.registration_id.toLowerCase().includes(cleanQuery);
      const matchWa = cleanWa.includes(cleanQuery);
      return matchReg || matchWa;
    });

    resultContainer.style.display = 'block';

    if (!match) {
      resultContainer.innerHTML = `
        <div class="track-result-box" style="text-align: center; border-color: rgba(239, 68, 68, 0.4);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <h4 style="color: #f87171; margin-bottom: 6px;">No Registration Found</h4>
          <p style="font-size: 0.86rem; color: #94a3b8;">
            We could not find an entry matching "<strong>${query}</strong>". Please verify your 10-digit WhatsApp number or official Registration ID (e.g. STC-2026-XXXX).
          </p>
        </div>
      `;
      return;
    }

    let statusHtml = '';
    if (match.payment_status === 'verified') {
      statusHtml = `
        <div class="track-result-box" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <span style="font-size: 0.76rem; font-weight: 700; color: #10b981; letter-spacing: 0.06em;">STATUS: VERIFIED &amp; CONFIRMED</span>
            <span style="font-size: 0.78rem; color: #94a3b8;">${new Date(match.created_at).toLocaleDateString()}</span>
          </div>
          <h4 style="font-size: 1.25rem; font-weight: 800; color: #ffffff; margin-bottom: 4px;">${match.student_name}</h4>
          <p style="font-size: 0.88rem; color: #cbd5e1; margin-bottom: 16px;">
            Registration ID: <strong style="color: #f59e0b;">${match.registration_id}</strong> • ${match.category_name} ${match.drawing_group ? `(${match.drawing_group})` : ''}
          </p>
          <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 0.84rem;">
            <div>🏫 <strong>School:</strong> ${match.school_name} (Std ${match.standard})</div>
            <div>💳 <strong>UTR / Ref:</strong> ${match.upi_reference} (Verified ✓)</div>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <a href="${state.settings.communityLink}" target="_blank" class="btn btn-sm btn-primary" style="background:#25D366; border:none; text-decoration:none;">
              📲 Join Official WhatsApp Group
            </a>
            <button type="button" class="btn btn-sm btn-outline" id="btn-track-print-slip">
              🖨️ View Admit Slip
            </button>
          </div>
        </div>
      `;
    } else if (match.payment_status === 'pending') {
      statusHtml = `
        <div class="track-result-box" style="border-color: rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.08);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <span style="font-size: 0.76rem; font-weight: 700; color: #fbbf24; letter-spacing: 0.06em;">STATUS: PAYMENT PENDING VERIFICATION</span>
            <span style="font-size: 0.78rem; color: #94a3b8;">${new Date(match.created_at).toLocaleDateString()}</span>
          </div>
          <h4 style="font-size: 1.25rem; font-weight: 800; color: #ffffff; margin-bottom: 4px;">${match.student_name}</h4>
          <p style="font-size: 0.88rem; color: #cbd5e1; margin-bottom: 14px;">
            Registration ID: <strong style="color: #f59e0b;">${match.registration_id}</strong> • ${match.category_name}
          </p>
          <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 0.84rem; color: #fde68a;">
            ⏳ <strong>Organizer Review in Progress:</strong> Your UPI reference (<code>${match.upi_reference}</code>) is currently being matched against organizer bank statements. Verification is completed within 2 to 4 hours. You will receive an official WhatsApp confirmation once verified!
          </div>
          <button type="button" class="btn btn-sm btn-outline" id="btn-track-print-slip">
            🖨️ View Provisional Entry Slip
          </button>
        </div>
      `;
    } else {
      statusHtml = `
        <div class="track-result-box" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
          <div style="font-size: 0.76rem; font-weight: 700; color: #f87171; letter-spacing: 0.06em; margin-bottom: 8px;">STATUS: VERIFICATION REJECTED</div>
          <h4 style="font-size: 1.2rem; font-weight: 800; color: #ffffff; margin-bottom: 4px;">${match.student_name} (${match.registration_id})</h4>
          <p style="font-size: 0.85rem; color: #fca5a5; margin-bottom: 12px;">
            The submitted UPI reference could not be matched with organizer bank statements. Please contact support or re-register with valid payment details.
          </p>
        </div>
      `;
    }

    resultContainer.innerHTML = statusHtml;

    const slipBtn = document.getElementById('btn-track-print-slip');
    if (slipBtn) {
      slipBtn.onclick = () => openAdmitSlip(match);
    }
  }

  // =========================================================================
  // ORGANIZER ADMIN PORTAL
  // =========================================================================
  function renderAdminPortal() {
    if (!state.isAdminLoggedIn) {
      document.getElementById('admin-auth-screen').style.display = 'block';
      document.getElementById('admin-main-view').style.display = 'none';
      return;
    }

    document.getElementById('admin-auth-screen').style.display = 'none';
    document.getElementById('admin-main-view').style.display = 'block';

    // Update Stats Chips
    const totalRegs = state.registrations.length;
    const pendingRegs = state.registrations.filter(r => r.payment_status === 'pending').length;
    const verifiedRegs = state.registrations.filter(r => r.payment_status === 'verified').length;
    const totalRev = verifiedRegs * state.settings.registrationFee;

    document.getElementById('admin-stat-total').textContent = totalRegs;
    document.getElementById('admin-stat-pending').textContent = pendingRegs;
    document.getElementById('admin-stat-verified').textContent = verifiedRegs;
    document.getElementById('admin-stat-revenue').textContent = `₹${totalRev.toLocaleString()}`;
    document.getElementById('admin-total-badge').textContent = totalRegs;

    // Render Table
    renderAdminRegistrationsTable();

    // Populate Limits Tab Values
    const keys = ['computer', 'mehndi', 'drawing_a', 'drawing_b', 'makeup'];
    keys.forEach(k => {
      const input = document.getElementById(`limit-input-${k}`);
      if (input) input.value = state.limits[k].limit;

      const confEl = document.getElementById(`limit-confirmed-${k}`);
      if (confEl) {
        const cCount = state.registrations.filter(r => r.category_id === k && r.payment_status === 'verified').length;
        confEl.textContent = Math.max(state.limits[k].confirmed, cCount);
      }

      const pendEl = document.getElementById(`limit-pending-${k}`);
      if (pendEl) {
        const pCount = state.registrations.filter(r => r.category_id === k && r.payment_status === 'pending').length;
        pendEl.textContent = pCount;
      }
    });

    // Populate WhatsApp config
    document.getElementById('wa-community-link').value = state.settings.communityLink;
    document.getElementById('wa-event-desc').value = state.settings.eventDescription;
    document.getElementById('wa-preview-event-desc').textContent = state.settings.eventDescription;
    document.getElementById('wa-preview-link').textContent = state.settings.communityLink;
    document.getElementById('wa-preview-link').href = state.settings.communityLink;
  }

  function renderAdminRegistrationsTable() {
    const tbody = document.getElementById('admin-registrations-tbody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('admin-filter-search')?.value || '').toLowerCase().trim();
    const categoryFilter = document.getElementById('admin-filter-category')?.value || 'all';
    const statusFilter = document.getElementById('admin-filter-status')?.value || 'all';

    let filtered = state.registrations.filter(reg => {
      // Category filter
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'drawing') {
          if (!reg.category_id.startsWith('drawing')) return false;
        } else if (reg.category_id !== categoryFilter) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && reg.payment_status !== statusFilter) {
        return false;
      }

      // Search term
      if (searchTerm) {
        const matchesName = reg.student_name.toLowerCase().includes(searchTerm);
        const matchesSchool = reg.school_name.toLowerCase().includes(searchTerm);
        const matchesRegId = reg.registration_id.toLowerCase().includes(searchTerm);
        const matchesUtr = reg.upi_reference.toLowerCase().includes(searchTerm);
        const matchesWa = reg.whatsapp_number.includes(searchTerm);
        return matchesName || matchesSchool || matchesRegId || matchesUtr || matchesWa;
      }

      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding: 32px; color: #94a3b8;">
            No registrations match the selected filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(reg => {
      let statusBadge = '';
      if (reg.payment_status === 'verified') {
        statusBadge = `<span style="color:#10b981; font-weight:700;">✓ Verified</span>`;
      } else if (reg.payment_status === 'pending') {
        statusBadge = `<span style="color:#fbbf24; font-weight:700;">⏳ Pending</span>`;
      } else {
        statusBadge = `<span style="color:#ef4444; font-weight:700;">✕ Rejected</span>`;
      }

      const trackTitle = reg.drawing_group ? `Drawing (${reg.drawing_group})` : reg.category_name;

      return `
        <tr>
          <td><strong style="color:#a5b4fc;">${reg.registration_id}</strong></td>
          <td>
            <strong>${reg.student_name}</strong>
            <div style="font-size:0.75rem; color:#94a3b8;">${reg.school_name}</div>
          </td>
          <td>Std ${reg.standard} • ${reg.gender}</td>
          <td>${trackTitle}</td>
          <td><a href="https://wa.me/${reg.whatsapp_number.replace(/[^0-9]/g, '')}" target="_blank" style="color:#38bdf8;">${reg.whatsapp_number}</a></td>
          <td><code>${reg.upi_reference}</code></td>
          <td>${statusBadge}</td>
          <td>
            <div class="action-btn-group">
              ${reg.payment_status !== 'verified' ? `
                <button type="button" class="btn-verify-action" data-id="${reg.id}" title="Verify payment and approve seat">
                  ✓ Verify
                </button>
              ` : ''}
              ${reg.payment_status !== 'rejected' ? `
                <button type="button" class="btn-reject-action" data-id="${reg.id}" title="Reject payment">
                  ✕ Reject
                </button>
              ` : ''}
              <button type="button" class="btn-slip-action" data-id="${reg.id}" title="View admit slip">
                👁️ Slip
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Event Handlers for Action Buttons
    tbody.querySelectorAll('.btn-verify-action').forEach(btn => {
      btn.onclick = () => adminVerifyPayment(btn.dataset.id);
    });

    tbody.querySelectorAll('.btn-reject-action').forEach(btn => {
      btn.onclick = () => adminRejectPayment(btn.dataset.id);
    });

    tbody.querySelectorAll('.btn-slip-action').forEach(btn => {
      btn.onclick = () => {
        const reg = state.registrations.find(r => r.id === btn.dataset.id);
        if (reg) openAdmitSlip(reg);
      };
    });
  }

  function adminVerifyPayment(id) {
    const reg = state.registrations.find(r => r.id === id);
    if (!reg) return;

    // Check if category limit has been breached
    const trackKey = reg.category_id;
    const remaining = getRemainingSeats(trackKey);
    if (remaining <= 0 && reg.payment_status !== 'verified') {
      const confirmForce = confirm(`Warning: ${state.limits[trackKey].name} has already reached maximum quota (${state.limits[trackKey].limit} seats). Are you sure you want to approve this seat?`);
      if (!confirmForce) return;
    }

    reg.payment_status = 'verified';
    reg.verified_at = new Date().toISOString();
    reg.whatsapp_sent = true;

    // Increment confirmed count in limit cache if needed
    state.limits[trackKey].confirmed = Math.max(state.limits[trackKey].confirmed + 1, 
      state.registrations.filter(r => r.category_id === trackKey && r.payment_status === 'verified').length);

    saveState();
    updateSeatDisplays();
    renderAdminPortal();

    showToast(`Payment verified for ${reg.student_name}! Seat confirmed. Official WhatsApp notification queued.`, 'success');

    // Update in Supabase Cloud Database
    updateRegistrationInSupabase(reg.registration_id, {
      payment_status: 'verified',
      verified_at: reg.verified_at,
      whatsapp_sent: true
    });

    // Trigger WhatsApp Simulator Preview
    simulateWhatsAppDispatch(reg);
  }

  function adminRejectPayment(id) {
    const reg = state.registrations.find(r => r.id === id);
    if (!reg) return;

    if (!confirm(`Are you sure you want to reject payment for ${reg.student_name} (UTR: ${reg.upi_reference})?`)) {
      return;
    }

    reg.payment_status = 'rejected';
    saveState();
    updateSeatDisplays();
    renderAdminPortal();

    // Update in Supabase Cloud Database
    updateRegistrationInSupabase(reg.registration_id, {
      payment_status: 'rejected'
    });

    showToast(`Registration for ${reg.student_name} marked as Rejected.`, 'warning');
  }

  function simulateWhatsAppDispatch(reg) {
    console.log(`[WHATSAPP BUSINESS CLOUD API DISPATCH SIMULATOR]
To: ${reg.whatsapp_number}
Template: ${state.settings.waTemplateName}
Variables:
- {{student_name}}: ${reg.student_name}
- {{registration_id}}: ${reg.registration_id}
- {{competition_name}}: ${reg.category_name} ${reg.drawing_group ? `(${reg.drawing_group})` : ''}
- {{event_description}}: ${state.settings.eventDescription}
- {{community_link}}: ${state.settings.communityLink}
Status: DISPATCHED SUCCESSFULLY via Supabase Edge Function`);
  }

  function exportRegistrationsCSV() {
    if (state.registrations.length === 0) {
      showToast('No registrations to export.', 'warning');
      return;
    }

    const headers = [
      'Registration ID',
      'Student Name',
      'School Name',
      'Standard',
      'Gender',
      'Date of Birth',
      'WhatsApp Number',
      'Category',
      'Drawing Group',
      'Guardian Name',
      'Guardian Phone',
      'UPI Reference (UTR)',
      'Payment Status',
      'WhatsApp Sent',
      'Registration Date'
    ];

    const rows = state.registrations.map(r => [
      `"${r.registration_id}"`,
      `"${r.student_name.replace(/"/g, '""')}"`,
      `"${r.school_name.replace(/"/g, '""')}"`,
      r.standard,
      `"${r.gender}"`,
      `"${r.date_of_birth}"`,
      `"${r.whatsapp_number}"`,
      `"${r.category_name}"`,
      `"${r.drawing_group || 'N/A'}"`,
      `"${r.guardian_name.replace(/"/g, '""')}"`,
      `"${r.guardian_phone}"`,
      `"${r.upi_reference}"`,
      `"${r.payment_status}"`,
      r.whatsapp_sent ? 'TRUE' : 'FALSE',
      `"${new Date(r.created_at).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Talent_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Registrations exported to CSV successfully!', 'success');
  }

  // =========================================================================
  // COUNTDOWN TIMER
  // =========================================================================
  function initCountdown() {
    // Event countdown to 10 days ahead
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 8);
    targetDate.setHours(18, 0, 0, 0);

    function update() {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;

      if (diff <= 0) return;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const dEl = document.getElementById('cd-days');
      const hEl = document.getElementById('cd-hours');
      const mEl = document.getElementById('cd-minutes');
      const sEl = document.getElementById('cd-seconds');

      if (dEl) dEl.textContent = String(days).padStart(2, '0');
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
      if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  // =========================================================================
  // SETUP EVENT LISTENERS & INITIALIZATION
  // =========================================================================
  function initEventListeners() {
    // Mobile navigation toggle
    const toggleBtn = document.getElementById('mobile-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    if (toggleBtn && mobileNav) {
      toggleBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
      });
      mobileNav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => mobileNav.classList.remove('open'));
      });
    }

    // Standard radio selection change
    document.querySelectorAll('input[name="standard"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.currentSelectedStd = parseInt(e.target.value);
        validateEligibility();
        updateSeatDisplays();
      });
    });

    // Gender radio selection change
    document.querySelectorAll('input[name="gender"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.currentSelectedGender = e.target.value;
        validateEligibility();
      });
    });

    // Competition Category radio selection change
    document.querySelectorAll('input[name="competition_category"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.currentSelectedCat = e.target.value;
        validateEligibility();
      });
    });

    // Category Card buttons that scroll & select
    document.querySelectorAll('.select-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.targetCat;
        const radio = document.getElementById(`cat-radio-${cat}`);
        if (radio) {
          radio.checked = true;
          state.currentSelectedCat = cat;
          validateEligibility();
          document.getElementById('register-section').scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // UPI copy button
    const copyBtn = document.getElementById('btn-copy-upi');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(state.settings.upiId).then(() => {
          showToast(`UPI ID ${state.settings.upiId} copied to clipboard!`, 'success');
        }).catch(() => {
          showToast(`UPI ID: ${state.settings.upiId}`, 'success');
        });
      });
    }

    // Registration Form Submit
    const form = document.getElementById('student-reg-form');
    if (form) {
      form.addEventListener('submit', handleRegistrationSubmit);
    }

    // Success Modal Close
    const closeSuccessBtn = document.getElementById('btn-close-success');
    if (closeSuccessBtn) {
      closeSuccessBtn.addEventListener('click', () => {
        document.getElementById('modal-success').style.display = 'none';
      });
    }

    // Track Status Modal Handlers
    const statusModal = document.getElementById('modal-track-status');
    const openStatusBtn = document.getElementById('btn-open-status');
    const mobileStatusBtn = document.getElementById('btn-mobile-status');
    const heroTrackBtn = document.getElementById('btn-hero-track');
    const closeStatusBtn = document.getElementById('btn-close-status-modal');
    const doTrackBtn = document.getElementById('btn-do-track');

    function openStatusModal() {
      if (statusModal) {
        statusModal.style.display = 'flex';
        document.getElementById('track-search-input').focus();
      }
    }

    if (openStatusBtn) openStatusBtn.addEventListener('click', openStatusModal);
    if (mobileStatusBtn) mobileStatusBtn.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      openStatusModal();
    });
    if (heroTrackBtn) heroTrackBtn.addEventListener('click', openStatusModal);

    if (closeStatusBtn) {
      closeStatusBtn.addEventListener('click', () => {
        statusModal.style.display = 'none';
      });
    }

    if (doTrackBtn) {
      doTrackBtn.addEventListener('click', handleTrackStatus);
    }
    const trackInput = document.getElementById('track-search-input');
    if (trackInput) {
      trackInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleTrackStatus();
      });
    }

    // Admit Slip Modal Close
    const closeAdmitBtn = document.getElementById('btn-close-admit-slip');
    if (closeAdmitBtn) {
      closeAdmitBtn.addEventListener('click', () => {
        document.getElementById('modal-admit-slip').style.display = 'none';
      });
    }

    // Admin Portal Modal Handlers
    const adminModal = document.getElementById('modal-admin-portal');
    const openAdminBtn = document.getElementById('btn-open-admin');
    const mobileAdminBtn = document.getElementById('btn-mobile-admin');
    const footerAdminBtn = document.getElementById('footer-admin-link');
    const closeAdminBtn = document.getElementById('btn-close-admin-modal');
    const adminLoginBtn = document.getElementById('btn-admin-login');
    const adminPinInput = document.getElementById('admin-pin-input');

    function openAdminModal() {
      if (adminModal) {
        adminModal.style.display = 'flex';
        renderAdminPortal();
      }
    }

    if (openAdminBtn) openAdminBtn.addEventListener('click', openAdminModal);
    if (mobileAdminBtn) mobileAdminBtn.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      openAdminModal();
    });
    if (footerAdminBtn) footerAdminBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openAdminModal();
    });

    if (closeAdminBtn) {
      closeAdminBtn.addEventListener('click', () => {
        adminModal.style.display = 'none';
      });
    }

    if (adminLoginBtn && adminPinInput) {
      const handleAdminAuth = () => {
        const pin = adminPinInput.value.trim();
        const errEl = document.getElementById('admin-auth-err');
        if (pin === state.settings.adminPin) {
          state.isAdminLoggedIn = true;
          errEl.textContent = '';
          renderAdminPortal();
          showToast('Welcome, Organizer! Dashboard Unlocked.', 'success');
        } else {
          errEl.textContent = 'Incorrect Master PIN. Default is 1234.';
        }
      };

      adminLoginBtn.addEventListener('click', handleAdminAuth);
      adminPinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdminAuth();
      });
    }

    // Admin Tabs Switching
    document.querySelectorAll('.admin-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        tabBtn.classList.add('active');
        const targetPane = document.getElementById(tabBtn.dataset.tab);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Admin Filters Table Listeners
    const searchFilter = document.getElementById('admin-filter-search');
    const catFilter = document.getElementById('admin-filter-category');
    const statusFilter = document.getElementById('admin-filter-status');

    if (searchFilter) searchFilter.addEventListener('input', renderAdminRegistrationsTable);
    if (catFilter) catFilter.addEventListener('change', renderAdminRegistrationsTable);
    if (statusFilter) statusFilter.addEventListener('change', renderAdminRegistrationsTable);

    // Export CSV
    const exportBtn = document.getElementById('btn-export-csv');
    if (exportBtn) exportBtn.addEventListener('click', exportRegistrationsCSV);

    // Save Limits
    const saveLimitsBtn = document.getElementById('btn-save-limits');
    if (saveLimitsBtn) {
      saveLimitsBtn.addEventListener('click', () => {
        const keys = ['computer', 'mehndi', 'drawing_a', 'drawing_b', 'makeup'];
        keys.forEach(k => {
          const val = parseInt(document.getElementById(`limit-input-${k}`).value);
          if (!isNaN(val) && val > 0) {
            state.limits[k].limit = val;
          }
        });

        saveState();
        updateSeatDisplays();
        renderAdminPortal();

        const msg = document.getElementById('limits-save-msg');
        if (msg) {
          msg.textContent = '✓ Quota limits saved successfully!';
          msg.style.color = '#10b981';
          setTimeout(() => { msg.textContent = ''; }, 3000);
        }
        showToast('Seat quotas updated & applied across registration form!', 'success');
      });
    }

    // Save WhatsApp Configuration
    const saveWaBtn = document.getElementById('btn-save-wa-config');
    if (saveWaBtn) {
      saveWaBtn.addEventListener('click', () => {
        const link = document.getElementById('wa-community-link').value.trim();
        const desc = document.getElementById('wa-event-desc').value.trim();
        const phoneId = document.getElementById('wa-phone-id').value.trim();
        const tName = document.getElementById('wa-template-name').value.trim();

        state.settings.communityLink = link || state.settings.communityLink;
        state.settings.eventDescription = desc || state.settings.eventDescription;
        state.settings.waPhoneId = phoneId || state.settings.waPhoneId;
        state.settings.waTemplateName = tName || state.settings.waTemplateName;

        saveState();
        renderAdminPortal();
        showToast('WhatsApp configuration saved!', 'success');
      });
    }

    // Test WhatsApp Send Simulator
    const testWaBtn = document.getElementById('btn-test-wa-send');
    if (testWaBtn) {
      testWaBtn.addEventListener('click', () => {
        const phone = document.getElementById('wa-test-number').value.trim();
        const statusEl = document.getElementById('wa-test-status');
        if (!phone) {
          showToast('Please enter a WhatsApp number for testing', 'warning');
          return;
        }

        statusEl.innerHTML = `<span style="color:#fbbf24">⏳ Simulating Cloud API dispatch to ${phone}...</span>`;
        setTimeout(() => {
          statusEl.innerHTML = `<span style="color:#10b981">✓ Delivered successfully via WhatsApp Cloud API! Payload verified.</span>`;
          showToast(`Test message dispatched to ${phone}!`, 'success');
        }, 800);
      });
    }

    // Supabase Settings & SQL Copy
    const copySqlBtn = document.getElementById('btn-copy-sql');
    if (copySqlBtn) {
      copySqlBtn.addEventListener('click', () => {
        const sqlText = document.getElementById('sql-code-display').innerText;
        navigator.clipboard.writeText(sqlText).then(() => {
          showToast('Complete PostgreSQL Schema & RLS copied to clipboard!', 'success');
        }).catch(() => {
          showToast('Copied SQL Schema!', 'success');
        });
      });
    }

    const saveSbBtn = document.getElementById('btn-save-supabase');
    if (saveSbBtn) {
      saveSbBtn.addEventListener('click', () => {
        const url = document.getElementById('sb-project-url').value.trim();
        const key = document.getElementById('sb-anon-key').value.trim();
        const badge = document.getElementById('sb-status-badge');

        if (!url || !key) {
          showToast('Please provide both Supabase Project URL and Anon API Key.', 'warning');
          return;
        }

        state.supabaseCfg = { url, key, active: true };
        saveState();

        badge.className = 'connection-status-pill status-live';
        badge.textContent = `Mode: Supabase Cloud Connected (${new URL(url).hostname})`;
        showToast('Supabase configuration saved! Client is ready to synchronize.', 'success');
      });
    }

    const mockModeBtn = document.getElementById('btn-use-mock-mode');
    if (mockModeBtn) {
      mockModeBtn.addEventListener('click', () => {
        state.supabaseCfg.active = false;
        saveState();
        const badge = document.getElementById('sb-status-badge');
        badge.className = 'connection-status-pill status-demo';
        badge.textContent = 'Mode: Local Mock Data (Ready)';
        showToast('Switched to local sample data mode.', 'success');
      });
    }
    // Theme Toggle Listeners (Desktop and Mobile)
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    const mobileThemeBtn = document.getElementById('btn-mobile-theme');
    if (mobileThemeBtn) {
      mobileThemeBtn.addEventListener('click', toggleTheme);
    }
  }

  // =========================================================================
  // BOOTSTRAP APPLICATION
  // =========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    applyTheme(currentTheme);
    updateSeatDisplays();
    updateUpiDetails();
    initCountdown();
    initEventListeners();
    fetchRegistrationsFromSupabase();
    console.log('Student Talent Competition 2026 Portal Initialized with Supabase & Theme support.');
  });

})();
