import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config/app_config.dart';
import '../../models/patient_models.dart';
import '../../services/patient_service.dart';
import '../../widgets/common_widgets.dart';
import '../notifications/notifications_screen.dart';
import '../home/tab_controller.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late LiveList<Admission> _admissions;
  late LiveList<HospitalNotification> _notifications;
  late LiveList<DailyVital> _vitals;
  late LiveList<MedicationReminder> _reminders;
  late Future<PatientProfile?> _profileFuture;
  late Future<Appointment?> _nextAppointmentFuture;
  late Future<double> _pendingBillsFuture;
  late Future<LabOrder?> _latestLabFuture;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _admissions = PatientService.watchAdmissions();
    _notifications = PatientService.watchNotifications();
    _vitals = PatientService.watchDailyVitals();
    _reminders = PatientService.watchMedicationReminders();
    _profileFuture = PatientService.fetchProfile();
    _nextAppointmentFuture = PatientService.fetchNextAppointment();
    _pendingBillsFuture = PatientService.fetchPendingBillsTotal();
    _latestLabFuture = PatientService.fetchLatestLabOrder();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _admissions.dispose();
    _notifications.dispose();
    _vitals.dispose();
    _reminders.dispose();
    super.dispose();
  }

  void _reload() {
    setState(() {
      _profileFuture = PatientService.fetchProfile();
      _nextAppointmentFuture = PatientService.fetchNextAppointment();
      _pendingBillsFuture = PatientService.fetchPendingBillsTotal();
      _latestLabFuture = PatientService.fetchLatestLabOrder();
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        children: [
          _buildHeader(),
          const SizedBox(height: 4),
          _buildTabBar(),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildTodayTab(),
                _buildMedicationsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return FutureBuilder<PatientProfile?>(
      future: _profileFuture,
      builder: (context, snapshot) {
        final profile = snapshot.data;
        final name = profile?.fullName ?? 'Patient';
        final greeting = _greetingFor(DateTime.now());
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
          child: Row(
            children: [
              GestureDetector(
                onTap: () => Scaffold.of(context).openDrawer(),
                child: Container(
                  height: 44,
                  width: 44,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: const Icon(Icons.menu_rounded, color: Color(0xFF1E293B), size: 22),
                ),
              ),
              const SizedBox(width: 12),
              InitialsAvatar(name, size: 48),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$greeting,',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      name,
                      style: GoogleFonts.inter(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                  ],
                ),
              ),
              _buildNotificationBell(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildNotificationBell() {
    return StreamBuilder<List<HospitalNotification>>(
      stream: _notifications.stream,
      builder: (context, snapshot) {
        final unread = (snapshot.data ?? const [])
            .where((n) => !n.isRead)
            .length;
        return GestureDetector(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const NotificationsScreen()),
          ),
          child: Container(
            height: 44,
            width: 44,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                const Icon(Icons.notifications_outlined, color: Color(0xFF1E293B), size: 22),
                if (unread > 0)
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Color(0xFFEF4444),
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                      alignment: Alignment.center,
                      child: Text(
                        unread > 9 ? '9+' : '$unread',
                        style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 8, 20, 0),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0).withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(14),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withValues(alpha: 0.08),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        dividerColor: Colors.transparent,
        indicatorSize: TabBarIndicatorSize.tab,
        labelColor: const Color(0xFF1E293B),
        unselectedLabelColor: const Color(0xFF64748B),
        labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700),
        unselectedLabelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
        tabs: const [
          Tab(text: 'Today'),
          Tab(text: 'Medications'),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Today tab
  // ---------------------------------------------------------------------------

  Widget _buildTodayTab() {
    return RefreshIndicator(
      onRefresh: () async {
        _reload();
        await Future.wait([
          _profileFuture.then((_) {}),
          _nextAppointmentFuture.then((_) {}),
          _pendingBillsFuture.then((_) {}),
          _latestLabFuture.then((_) {}),
        ]);
      },
      color: const Color(0xFF2563EB),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          _buildAdmissionCard(),
          const SizedBox(height: 20),
          _buildVitalsCard(),
          const SizedBox(height: 20),
          _buildNextAppointmentCard(),
          const SizedBox(height: 24),
          _buildSummaryRow(),
          const SizedBox(height: 24),
          _buildRecentNotifications(),
        ],
      ),
    );
  }

  Widget _buildAdmissionCard() {
    return StreamBuilder<List<Admission>>(
      stream: _admissions.stream,
      builder: (context, snapshot) {
        final admissions = snapshot.data ?? const <Admission>[];
        final current = admissions.isNotEmpty ? admissions.first : null;
        final admitted = current != null && current.isAdmitted;

        return Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF13233C), Color(0xFF1D3A5F)],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF13233C).withValues(alpha: 0.2),
                blurRadius: 12,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    admitted ? Icons.verified_user_rounded : Icons.airline_seat_individual_suite,
                    color: admitted ? const Color(0xFF4ADE80) : const Color(0xFF94A3B8),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    admitted ? 'Currently Admitted' : 'Not Admitted',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: (admitted ? const Color(0xFF4ADE80) : const Color(0xFF64748B))
                          .withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      current?.status ?? '—',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: admitted ? const Color(0xFF4ADE80) : const Color(0xFFCBD5E1),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              if (!admitted)
                Text(
                  'You are currently an outpatient. Your admission status will appear here live as soon as the hospital admits you.',
                  style: GoogleFonts.inter(
                    color: const Color(0xFF94A3B8),
                    fontSize: 13,
                    height: 1.5,
                  ),
                )
              else ...[
                _admissionRow('Location', current.location.isNotEmpty ? current.location : 'To be assigned'),
                if (current.doctor != null)
                  _admissionRow('Doctor', current.doctor!.fullName),
                if (current.headNurseName != null && current.headNurseName!.isNotEmpty)
                  _admissionRow('Nurse', current.headNurseName!),
                if (current.reasonForAdmission != null && current.reasonForAdmission!.isNotEmpty)
                  _admissionRow('Reason', current.reasonForAdmission!),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _admissionRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 70,
            child: Text(
              label,
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNextAppointmentCard() {
    return FutureBuilder<Appointment?>(
      future: _nextAppointmentFuture,
      builder: (context, snapshot) {
        final apt = snapshot.data;
        if (apt == null) {
          return AppCard(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                const Icon(Icons.event_available_outlined, color: Color(0xFF94A3B8), size: 30),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'No Upcoming Appointment',
                        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Book a consultation with a specialist in seconds.',
                        style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => shellTab.value = shellTabOf('appointments'),
                  child: const Text('Book Now'),
                ),
              ],
            ),
          );
        }

        final doctor = apt.doctor;
        return AppCard(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                height: 52,
                width: 52,
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.calendar_month_rounded, color: Color(0xFF2563EB), size: 26),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Next Appointment',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B), fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      doctor?.fullName ?? 'Your Doctor',
                      style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${formatDate(apt.date)} · ${formatTime(apt.time)}',
                      style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF475569)),
                    ),
                  ],
                ),
              ),
              StatusChip(apt.status ?? 'Upcoming'),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSummaryRow() {
    return Row(
      children: [
        Expanded(
          child: FutureBuilder<double>(
            future: _pendingBillsFuture,
            builder: (context, snapshot) {
              final pending = snapshot.data ?? 0.0;
              return _summaryCard(
                icon: Icons.receipt_long_rounded,
                color: const Color(0xFFD97706),
                title: 'Pending Amount',
                value: money(pending),
                subtitle: 'Total outstanding',
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: FutureBuilder<LabOrder?>(
            future: _latestLabFuture,
            builder: (context, snapshot) {
              final lab = snapshot.data;
              return _summaryCard(
                icon: Icons.science_rounded,
                color: const Color(0xFF7C3AED),
                title: 'Latest Lab Test',
                value: lab?.testCategory ?? 'No tests yet',
                subtitle: lab != null ? 'Status: ${lab.status ?? 'Pending'}' : 'No lab orders',
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _summaryCard({
    required IconData icon,
    required Color color,
    required String title,
    required String value,
    required String subtitle,
  }) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 34,
            width: 34,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Daily Vitals card (BP / sugar)
  // ---------------------------------------------------------------------------

  Widget _buildVitalsCard() {
    return StreamBuilder<List<DailyVital>>(
      stream: _vitals.stream,
      builder: (context, snapshot) {
        final vitals = snapshot.data ?? const <DailyVital>[];
        final today = vitals.isEmpty || vitals.first.recordedOn == null
            ? null
            : _isToday(vitals.first.recordedOn!)
                ? vitals.first
                : null;

        return AppCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    height: 34,
                    width: 34,
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.monitor_heart_rounded, color: Color(0xFF059669), size: 18),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Daily Health',
                          style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                        ),
                        Text(
                          'BP & Sugar · ${formatDate(today?.recordedOn ?? DateTime.now())}',
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                        ),
                      ],
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () => _showAddVitalsSheet(today),
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFF059669),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    ),
                    icon: const Icon(Icons.edit_rounded, size: 16),
                    label: Text(
                      today == null ? 'Log' : 'Edit',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _vitalBox(
                      icon: Icons.favorite_rounded,
                      label: 'Blood Pressure',
                      value: today?.bpLabel ?? '—',
                      unit: 'mm Hg',
                      color: const Color(0xFFDC2626),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _vitalBox(
                      icon: Icons.water_drop_rounded,
                      label: (today?.sugarType?.isNotEmpty ?? false)
                          ? 'Sugar (${today?.sugarType})'
                          : 'Sugar',
                      value: today?.bloodSugar?.toString() ?? '—',
                      unit: 'mg/dL',
                      color: const Color(0xFF2563EB),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              if (today == null)
                Text(
                  'No reading logged today. Tap Log to record your daily BP and sugar — nurses and doctors can view it live.',
                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B), height: 1.5),
                )
              else if (vitals.length > 1)
                Text(
                  'Last logged: ${formatDate(vitals[1].recordedOn)} (${vitals[1].bpLabel ?? '—'} · ${vitals[1].bloodSugar ?? '—'})',
                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _vitalBox({
    required IconData icon,
    required String label,
    required String value,
    required String unit,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w800, color: const Color(0xFF1E293B)),
          ),
          Text(
            unit,
            style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF94A3B8)),
          ),
        ],
      ),
    );
  }

  Future<void> _showAddVitalsSheet(DailyVital? current) async {
    final textCtrl1 = TextEditingController(text: current?.bpSystolic?.toString() ?? '');
    final textCtrl2 = TextEditingController(text: current?.bpDiastolic?.toString() ?? '');
    final sugarCtrl = TextEditingController(text: current?.bloodSugar?.toString() ?? '');
    var sugarType = current?.sugarType ?? 'Fasting';
    String? error;
    var saving = false;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final padding = MediaQuery.of(context).viewInsets;
          return Container(
            padding: EdgeInsets.fromLTRB(24, 20, 24, 24 + padding.bottom),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Center(
                    child: Container(
                      height: 4,
                      width: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Log Today\'s Health',
                    style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: textCtrl1,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'BP Systolic (top)'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: textCtrl2,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'BP Diastolic (bottom)'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: sugarCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Blood Sugar (mg/dL)'),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: sugarType,
                    decoration: const InputDecoration(labelText: 'Sugar Type'),
                    items: const [
                      DropdownMenuItem(value: 'Fasting', child: Text('Fasting')),
                      DropdownMenuItem(value: 'Post Meal', child: Text('Post Meal')),
                      DropdownMenuItem(value: 'Random', child: Text('Random')),
                    ],
                    onChanged: (v) => setModalState(() => sugarType = v ?? 'Fasting'),
                  ),
                  if (error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      error!,
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFEF4444)),
                    ),
                  ],
                  const SizedBox(height: 20),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: saving
                          ? null
                          : () async {
                              int? parse(String s) => int.tryParse(s.trim());
                              final systolic = parse(textCtrl1.text);
                              final diastolic = parse(textCtrl2.text);
                              final sugar = parse(sugarCtrl.text);
                              if ((systolic ?? 0) <= 0 &&
                                  (diastolic ?? 0) <= 0 &&
                                  (sugar ?? 0) <= 0) {
                                setModalState(() => error = 'Enter at least one reading.');
                                return;
                              }
                              setModalState(() {
                                error = null;
                                saving = true;
                              });
                              final msg = await PatientService.saveDailyVital(
                                bpSystolic: systolic,
                                bpDiastolic: diastolic,
                                bloodSugar: sugar,
                                sugarType: sugarType,
                              );
                              if (!context.mounted) return;
                              Navigator.of(context).pop();
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(msg == null
                                      ? 'Health reading saved'
                                      : 'Could not save: $msg'),
                                ),
                              );
                            },
                      child: Text(saving ? 'Saving…' : 'Save Reading'),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Medications / reminders tab
  // ---------------------------------------------------------------------------

  Widget _buildMedicationsTab() {
    return StreamBuilder<List<MedicationReminder>>(
      stream: _reminders.stream,
      builder: (context, snapshot) {
        final reminders = (snapshot.data ?? const <MedicationReminder>[])
            .where((r) => r.isActive)
            .toList();

        return RefreshIndicator(
          onRefresh: _reminders.refresh,
          color: const Color(0xFF2563EB),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              Row(
                children: [
                  const Expanded(
                    child: SectionHeader('Current Medication Reminders'),
                  ),
                  TextButton.icon(
                    onPressed: _showAddReminderSheet,
                    icon: const Icon(Icons.add_rounded, size: 18),
                    label: const Text('Add'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (reminders.isEmpty)
                const EmptyState(
                  'No medication reminders',
                  icon: Icons.medication_rounded,
                  subtitle: 'Reminders added by your doctor or pharmacist will appear here, with dosage and timing.',
                )
              else
                Column(
                  children: reminders.map((r) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: AppCard(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              height: 40,
                              width: 40,
                              decoration: BoxDecoration(
                                color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.medication_rounded, color: Color(0xFF2563EB), size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    r.medicineName ?? 'Medication',
                                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                                  ),
                                  const SizedBox(height: 2),
                                  if (r.dosage != null && r.dosage!.isNotEmpty)
                                    Text(
                                      'Dosage: ${r.dosage}',
                                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569)),
                                    ),
                                  if (r.frequency != null && r.frequency!.isNotEmpty)
                                    Text(
                                      'Frequency: ${r.frequency}',
                                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569)),
                                    ),
                                  const SizedBox(height: 6),
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 6,
                                    children: r.reminderTimes.isEmpty
                                        ? [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFF1F5F9),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                'Take as directed',
                                                style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                                              ),
                                            ),
                                          ]
                                        : r.reminderTimes.map((t) {
                                            return Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF2563EB).withValues(alpha: 0.08),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                formatTime(t),
                                                style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF2563EB)),
                                              ),
                                            );
                                          }).toList(),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _showAddReminderSheet() async {
    final nameCtrl = TextEditingController();
    final dosageCtrl = TextEditingController();
    final freqCtrl = TextEditingController();
    final timesCtrl = TextEditingController();
    String? error;
    var saving = false;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final padding = MediaQuery.of(context).viewInsets;
          return Container(
            padding: EdgeInsets.fromLTRB(24, 20, 24, 24 + padding.bottom),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Center(
                    child: Container(
                      height: 4,
                      width: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Add Medication Reminder',
                    style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(labelText: 'Medicine Name'),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: dosageCtrl,
                    decoration: const InputDecoration(labelText: 'Dosage (e.g. 500 mg)'),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: freqCtrl,
                    decoration: const InputDecoration(labelText: 'Frequency (e.g. Twice daily)'),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: timesCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Reminder Times',
                      hintText: 'e.g. 08:00, 20:00 (comma-separated)',
                    ),
                  ),
                  if (error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      error!,
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFEF4444)),
                    ),
                  ],
                  const SizedBox(height: 20),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: saving
                          ? null
                          : () async {
                              final name = nameCtrl.text.trim();
                              if (name.isEmpty) {
                                setModalState(() => error = 'Medicine name is required.');
                                return;
                              }
                              final times = timesCtrl.text
                                  .split(',')
                                  .map((e) => e.trim())
                                  .where((e) => e.isNotEmpty)
                                  .toList();
                              setModalState(() {
                                error = null;
                                saving = true;
                              });
                              final msg = await PatientService.saveMedicationReminder(
                                medicineName: name,
                                dosage: dosageCtrl.text.trim().isEmpty ? null : dosageCtrl.text.trim(),
                                frequency: freqCtrl.text.trim().isEmpty ? null : freqCtrl.text.trim(),
                                reminderTimes: times,
                              );
                              if (!context.mounted) return;
                              Navigator.of(context).pop();
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(msg == null
                                      ? 'Reminder added'
                                      : 'Could not add: $msg'),
                                ),
                              );
                            },
                      child: Text(saving ? 'Adding…' : 'Add Reminder'),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Recent notifications
  // ---------------------------------------------------------------------------

  Widget _buildRecentNotifications() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(
          'Recent Updates',
          trailing: 'Hospital · ${AppConfig.hospitalName}',
        ),
        const SizedBox(height: 12),
        StreamBuilder<List<HospitalNotification>>(
          stream: _notifications.stream,
          builder: (context, snapshot) {
            final notifications = snapshot.data ?? const <HospitalNotification>[];
            if (notifications.isEmpty) {
              return const EmptyState(
                'No notifications yet',
                icon: Icons.notifications_none_rounded,
                subtitle: 'Updates from the hospital will appear here.',
              );
            }
            return Column(
              children: notifications.take(3).map((n) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: AppCard(
                    padding: const EdgeInsets.all(14),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          height: 36,
                          width: 36,
                          decoration: BoxDecoration(
                            color: (n.isRead ? const Color(0xFF94A3B8) : const Color(0xFF2563EB))
                                .withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            n.isRead ? Icons.notifications_none_rounded : Icons.notifications_active_rounded,
                            color: n.isRead ? const Color(0xFF94A3B8) : const Color(0xFF2563EB),
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                n.title ?? 'Update',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF1E293B),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                n.message ?? '',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                formatDateTime(n.createdAt),
                                style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }

  String _greetingFor(DateTime now) {
    final hour = now.hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  bool _isToday(DateTime d) {
    final now = DateTime.now();
    return d.year == now.year && d.month == now.month && d.day == now.day;
  }
}